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

        // 2. Upsert Contact (with deduplication)
        let contactId = null;
        if (data.contact) {
            // Check for duplicates first
            const { checkDuplicateContact } = await import('@/lib/deduplication');
            const duplicateCheck = await checkDuplicateContact(supabase, {
                first_name: data.contact.firstName,
                last_name: data.contact.lastName,
                email: data.contact.email || null,
                phone: null, // Not extracted in scribe
                account_id: accountId || null,
            });

            // If strong duplicate found, use existing contact
            if (duplicateCheck.isDuplicate && duplicateCheck.duplicateMatches.length > 0) {
                const existingContact = duplicateCheck.duplicateMatches[0].data;
                contactId = existingContact.id;
                
                // Update existing contact with any new information
                const updateData: any = {};
                if (data.contact.email && !existingContact.email) updateData.email = data.contact.email;
                if (data.contact.role && !existingContact.role) updateData.role = data.contact.role;
                if (accountId && !existingContact.account_id) updateData.account_id = accountId;
                
                if (Object.keys(updateData).length > 0) {
                    await supabase
                        .from('contacts')
                        .update(updateData)
                        .eq('id', contactId);
                }
            } else {
                // No duplicate, create new contact
                const { data: contact, error } = await supabase
                    .from('contacts')
                    .insert({
                        account_id: accountId || null,
                        first_name: data.contact.firstName,
                        last_name: data.contact.lastName,
                        email: data.contact.email || null,
                        role: data.contact.role || null,
                    })
                    .select()
                    .single();

                if (contact) contactId = contact.id;
            }
        }

        // 3. Upsert Deal/Opportunity (with deduplication)
        let dealId = null;
        if (data.opportunity) {
            // Check for duplicates first
            const { checkDuplicateDeal } = await import('@/lib/deduplication');
            const duplicateCheck = await checkDuplicateDeal(supabase, {
                name: data.opportunity.name,
                account_id: accountId || null,
                stage: data.opportunity.stage || 'Lead',
            });

            // If strong duplicate found, use existing deal
            if (duplicateCheck.isDuplicate && duplicateCheck.duplicateMatches.length > 0) {
                const existingDeal = duplicateCheck.duplicateMatches[0].data;
                dealId = existingDeal.id;
                
                // Update existing deal with any new information
                const updateData: any = {};
                if (data.opportunity.amount && !existingDeal.amount) updateData.amount = data.opportunity.amount;
                if (data.opportunity.stage && existingDeal.stage !== data.opportunity.stage) {
                    updateData.stage = data.opportunity.stage;
                }
                if (accountId && !existingDeal.account_id) updateData.account_id = accountId;
                
                if (Object.keys(updateData).length > 0) {
                    await supabase
                        .from('deals')
                        .update(updateData)
                        .eq('id', dealId);
                }
            } else {
                // No duplicate, create new deal
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
