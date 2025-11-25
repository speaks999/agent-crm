import { supabase } from '@/lib/supabaseClient';
import { getTasks } from '@/lib/insightly';

export async function POST() {
    try {
        // Fetch tasks from Insightly
        const insightlyTasks = await getTasks();

        if (!insightlyTasks || insightlyTasks.length === 0) {
            return Response.json({ success: true, synced: 0 });
        }

        // Transform and insert into Supabase
        const tasksToInsert = insightlyTasks.map((task: any) => ({
            insightly_id: task.TASK_ID,
            title: task.TASK_NAME,
            description: task.DESCRIPTION,
            status: task.STATUS,
            priority: task.PRIORITY,
            due_date: task.DATE_DUE,
            owner_user_id: task.OWNER_USER_ID,
            date_created_utc: task.DATE_CREATED_UTC,
            date_updated_utc: task.DATE_UPDATED_UTC,
            visible_to: task.VISIBLE_TO,
            visible_team_id: task.VISIBLE_TEAM_ID,
            visible_user_ids: task.VISIBLE_USER_IDS,
            customfields: task.CUSTOMFIELDS,
        }));

        // Upsert tasks (insert or update if exists)
        const { error } = await supabase
            .from('tasks')
            .upsert(tasksToInsert, {
                onConflict: 'insightly_id',
                ignoreDuplicates: false,
            });

        if (error) throw error;

        // Update sync status
        await supabase
            .from('sync_status')
            .upsert(
                {
                    entity_type: 'tasks',
                    last_sync_at: new Date().toISOString(),
                    sync_status: 'success',
                    records_synced: tasksToInsert.length,
                },
                { onConflict: 'entity_type' }
            );

        return Response.json({ success: true, synced: tasksToInsert.length });
    } catch (error: any) {
        console.error('Error syncing tasks:', error);
        // Update sync status with error
        await supabase
            .from('sync_status')
            .upsert(
                {
                    entity_type: 'tasks',
                    last_sync_at: new Date().toISOString(),
                    sync_status: 'error',
                    error_message: error.message,
                },
                { onConflict: 'entity_type' }
            );
        return Response.json({ error: error.message }, { status: 500 });
    }
}
