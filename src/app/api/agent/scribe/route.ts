import { openai } from '@/lib/ai';
import { supabase } from '@/lib/supabaseClient';
import { generateObject, embed } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

export async function POST(req: Request) {
    const { text, accountId } = await req.json();

    if (!text) {
        return new Response('Missing text', { status: 400 });
    }

    // 1. Extract Entities
    const { object: data } = await generateObject({
        model: openai('gpt-4o'),
        schema: z.object({
            summary: z.string().describe('A brief summary of the interaction'),
            sentiment: z.enum(['positive', 'neutral', 'negative']),
            contact: z.object({
                firstName: z.string(),
                lastName: z.string(),
                email: z.string().optional(),
                role: z.string().optional(),
            }).optional().describe('The primary contact involved'),
            opportunity: z.object({
                name: z.string(),
                amount: z.number().optional(),
                stage: z.string(),
            }).optional().describe('Any deal or opportunity discussed'),
            nextSteps: z.array(z.string()).describe('Action items or next steps'),
        }),
        prompt: `Analyze this sales interaction and extract the key CRM data: \n\n"${text}"`,
    });

    // 2. Upsert Contact
    let contactId = null;
    if (data.contact) {
        const { data: contact, error } = await supabase
            .from('contacts')
            .upsert({
                account_id: accountId, // Optional, if known
                first_name: data.contact.firstName,
                last_name: data.contact.lastName,
                email: data.contact.email,
                role: data.contact.role,
            }, { onConflict: 'email' }) // Simplified dedup for now
            .select()
            .single();

        if (contact) contactId = contact.id;
    }

    // 3. Upsert Opportunity
    let opportunityId = null;
    if (data.opportunity) {
        const { data: opportunity } = await supabase
            .from('opportunities')
            .upsert({
                // account_id: accountId, // Opportunities table doesn't have account_id in current schema, might need to link via other means or add it
                opportunity_name: data.opportunity.name,
                opportunity_value: data.opportunity.amount,
                // stage: data.opportunity.stage, // Stage needs to be mapped to ID, skipping for now or needs lookup
            })
            .select()
            .single();

        if (opportunity) opportunityId = opportunity.id;
    }

    // 4. Log Interaction
    const { data: interaction } = await supabase
        .from('interactions')
        .insert({
            contact_id: contactId,
            opportunity_id: opportunityId,
            type: 'meeting', // Defaulting for now
            summary: data.summary,
            transcript: text,
            sentiment: data.sentiment,
        })
        .select()
        .single();

    // 5. Generate & Store Embedding
    if (interaction) {
        const { embedding } = await embed({
            model: openai.embedding('text-embedding-3-small'),
            value: text,
        });

        await supabase.from('embeddings').insert({
            content: text,
            embedding,
            source_table: 'interactions',
            source_id: interaction.id,
        });
    }

    return Response.json({ success: true, data });
}
