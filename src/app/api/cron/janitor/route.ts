import { openai } from '@/lib/ai';
import { supabase } from '@/lib/supabaseClient';
import { embed } from 'ai';

export const maxDuration = 60;

export async function GET(req: Request) {
    // 1. Fetch contacts to check (simplified: just checking the latest ones)
    const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (!contacts) return Response.json({ message: 'No contacts found' });

    const results = [];

    for (const contact of contacts) {
        const text = `${contact.first_name} ${contact.last_name} ${contact.email || ''} ${contact.role || ''}`;

        // 2. Generate Embedding
        const { embedding } = await embed({
            model: openai.embedding('text-embedding-3-small'),
            value: text,
        });

        // 3. Search for Duplicates
        const { data: matches } = await supabase.rpc('match_embeddings', {
            query_embedding: embedding,
            match_threshold: 0.95, // High threshold for auto-merge
            match_count: 5,
        });

        // Filter out self
        const duplicates = matches?.filter((m: any) => m.source_id !== contact.id && m.source_table === 'contacts') || [];

        if (duplicates.length > 0) {
            // 4. Auto-Merge Logic (Simplified: just flagging for now)
            // In a real app, we would update the old record and delete the new one, or flag for review.
            results.push({
                contact: contact.id,
                potential_duplicates: duplicates.map((d: any) => d.source_id),
                action: 'flagged',
            });

            // Example merge:
            // await supabase.from('contacts').delete().eq('id', contact.id);
        }
    }

    return Response.json({ success: true, results });
}
