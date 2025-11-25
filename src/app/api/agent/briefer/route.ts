import { openai } from '@/lib/ai';
import { supabase } from '@/lib/supabaseClient';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

export async function POST(req: Request) {
    const { entityId, type } = await req.json(); // type: 'contact' | 'account'

    // 1. Fetch Context
    const { data: interactions } = await supabase
        .from('interactions')
        .select('summary, sentiment, created_at, type')
        .eq(type === 'contact' ? 'contact_id' : 'deal_id', entityId) // Simplified: assuming deal_id for account for now or join
        .order('created_at', { ascending: false })
        .limit(5);

    const { data: opportunities } = await supabase
        .from('opportunities')
        .select('opportunity_name, stage_id, opportunity_value, forecast_close_date')
        .eq('responsible_user_id', entityId) // Note: This logic might need adjustment based on actual relationship
        .eq('opportunity_state', 'OPEN');

    const context = JSON.stringify({ interactions, opportunities });

    // 2. Generate Briefing
    const { object: briefing } = await generateObject({
        model: openai('gpt-4o'),
        schema: z.object({
            summary: z.string().describe('Executive summary of the relationship status'),
            lastInteraction: z.string().describe('One sentence summary of the last touchpoint'),
            redFlags: z.array(z.string()).describe('Any risks or negative sentiment issues'),
            openItems: z.array(z.string()).describe('Pending actions or blockers'),
            suggestedAction: z.string().describe('Recommended next step'),
        }),
        prompt: `Generate a pre-meeting briefing based on this CRM data: \n\n${context}`,
    });

    return Response.json({ briefing });
}
