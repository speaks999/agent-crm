import { openai } from '@/lib/ai';
import { supabase } from '@/lib/supabaseClient';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

export async function POST(req: Request) {
    const { interactionId, text } = await req.json();

    let transcript = text;

    // 1. Fetch Transcript if ID provided
    if (interactionId && !transcript) {
        const { data } = await supabase
            .from('interactions')
            .select('transcript')
            .eq('id', interactionId)
            .single();

        if (data) transcript = data.transcript;
    }

    if (!transcript) {
        return Response.json({ error: 'No transcript found' }, { status: 400 });
    }

    // 2. Generate Draft
    const { object: draft } = await generateObject({
        model: openai('gpt-4o'),
        schema: z.object({
            subject: z.string().describe('Email subject line'),
            body: z.string().describe('Email body in HTML format'),
            actionItems: z.array(z.string()).describe('List of action items extracted'),
        }),
        prompt: `Draft a professional follow-up email based on this transcript. \n\nTranscript: "${transcript}"`,
    });

    return Response.json({ draft });
}
