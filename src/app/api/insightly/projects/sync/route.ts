import { supabase } from '@/lib/supabaseClient';
import { getProjects } from '@/lib/insightly';

export async function POST() {
    try {
        // Fetch projects from Insightly
        const insightlyProjects = await getProjects();

        if (!insightlyProjects || insightlyProjects.length === 0) {
            return Response.json({ success: true, synced: 0 });
        }

        // Transform and insert into Supabase
        const projectsToInsert = insightlyProjects.map((proj: any) => ({
            insightly_id: proj.PROJECT_ID,
            name: proj.PROJECT_NAME,
            description: proj.DESCRIPTION,
            status: proj.STATUS,
            start_date: proj.START_DATE,
            end_date: proj.END_DATE,
            owner_user_id: proj.OWNER_USER_ID,
            date_created_utc: proj.DATE_CREATED_UTC,
            date_updated_utc: proj.DATE_UPDATED_UTC,
            visible_to: proj.VISIBLE_TO,
            visible_team_id: proj.VISIBLE_TEAM_ID,
            visible_user_ids: proj.VISIBLE_USER_IDS,
            customfields: proj.CUSTOMFIELDS,
        }));

        // Upsert projects (insert or update if exists)
        const { error } = await supabase
            .from('projects')
            .upsert(projectsToInsert, {
                onConflict: 'insightly_id',
                ignoreDuplicates: false,
            });

        if (error) throw error;

        // Update sync status
        await supabase
            .from('sync_status')
            .upsert(
                {
                    entity_type: 'projects',
                    last_sync_at: new Date().toISOString(),
                    sync_status: 'success',
                    records_synced: projectsToInsert.length,
                },
                { onConflict: 'entity_type' }
            );

        return Response.json({ success: true, synced: projectsToInsert.length });
    } catch (error: any) {
        console.error('Error syncing projects:', error);
        // Update sync status with error
        await supabase
            .from('sync_status')
            .upsert(
                {
                    entity_type: 'projects',
                    last_sync_at: new Date().toISOString(),
                    sync_status: 'error',
                    error_message: error.message,
                },
                { onConflict: 'entity_type' }
            );
        return Response.json({ error: error.message }, { status: 500 });
    }
}
