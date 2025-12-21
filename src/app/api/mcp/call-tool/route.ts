import { callTool } from '@/lib/mcp-client';

export async function POST(req: Request) {
    try {
        const { name, arguments: args } = await req.json();
        
        if (!name) {
            return Response.json({ error: 'Tool name is required' }, { status: 400 });
        }

        const result = await callTool(name, args || {});
        
        return Response.json({ result });
    } catch (error: any) {
        console.error('MCP call-tool error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

