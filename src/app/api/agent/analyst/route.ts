import { analyzeAndFetchData } from '@/lib/analyst';

export const maxDuration = 60;

export async function POST(req: Request) {
    const { query } = await req.json();

    try {
        const result = await analyzeAndFetchData(query);
        return Response.json(result);
    } catch (error: any) {
        console.error('Analyst error:', error);
        return Response.json({ error: error.message || 'Failed to process query' }, { status: 500 });
    }
}
