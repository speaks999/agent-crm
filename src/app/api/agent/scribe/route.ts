import { openai } from '@/lib/ai';
import { supabase } from '@/lib/supabaseClient';
import { generateObject, embed } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { text, accountId } = await req.json();

        if (!text) {
            return Response.json({ success: false, error: 'Missing text' }, { status: 400 });
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

        // 3. Upsert Deal/Opportunity
        let dealId = null;
        if (data.opportunity) {
            const { data: deal, error: dealError } = await supabase
                .from('deals')
                .insert({
                    account_id: accountId || null,
                    name: data.opportunity.name,
                    amount: data.opportunity.amount || null,
                    stage: data.opportunity.stage || 'Lead',
                    status: 'open',
                })
                .select()
                .single();

            if (dealError) {
                console.error('Error upserting deal:', dealError);
            } else if (deal) {
                dealId = deal.id;
            }
        }

        // 4. Log Interaction
        const { data: interaction, error: interactionError } = await supabase
            .from('interactions')
            .insert({
                contact_id: contactId,
                deal_id: dealId,
                type: 'meeting', // Defaulting for now
                summary: data.summary,
                transcript: text,
                sentiment: data.sentiment,
            })
            .select()
            .single();

        if (interactionError) {
            console.error('Error inserting interaction:', interactionError);
            throw new Error(`Failed to insert interaction: ${interactionError.message}`);
        }

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
    } catch (error: any) {
        console.error('Scribe API error:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            cause: error.cause,
        });
        return Response.json(
            { 
                success: false, 
                error: error.message || 'Failed to process interaction',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }, 
            { status: 500 }
        );
    }
}
