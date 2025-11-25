import { openai } from '@/lib/ai';
import { supabase } from '@/lib/supabaseClient';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

export async function GET(req: Request) {
    // 1. Find Stalled Opportunities (No updates in 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data: stalledOpportunities } = await supabase
        .from('opportunities')
        .select('id, opportunity_name, stage_id, opportunity_value, updated_at')
        .eq('opportunity_state', 'OPEN')
        .lt('updated_at', fourteenDaysAgo.toISOString())
        .limit(5);

    if (!stalledOpportunities || stalledOpportunities.length === 0) {
        return Response.json({ message: 'No stalled opportunities found' });
    }

    const nudges = [];

    for (const opportunity of stalledOpportunities) {
        // 2. Generate Nudge
        const { object: strategy } = await generateObject({
            model: openai('gpt-4o'),
            schema: z.object({
                nudge: z.string().describe('A short, punchy notification text'),
                suggestedAction: z.string().describe('Specific recommended action'),
                emailTemplate: z.string().optional().describe('A quick check-in email draft'),
            }),
            prompt: `This opportunity "${opportunity.opportunity_name}" ($${opportunity.opportunity_value}) has been stuck in stage "${opportunity.stage_id}" since ${new Date(opportunity.updated_at).toLocaleDateString()}. Suggest a strategy to unblock it.`,
        });

        nudges.push({
            opportunityId: opportunity.id,
            opportunityName: opportunity.opportunity_name,
            ...strategy,
        });
    }

    return Response.json({ nudges });
}
