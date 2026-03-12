#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { insightlyContactToolDefinitions, handleInsightlyContactTool } from './tools/insightly-contacts.js';
import { InsightlyClient } from './utils/insightly-client.js';

const apiKey = process.env.INSIGHTLY_API_KEY;
const pod = process.env.INSIGHTLY_POD || 'na1';

if (!apiKey) {
    console.error('Error: Missing required environment variable INSIGHTLY_API_KEY');
    process.exit(1);
}

const insightlyClient = new InsightlyClient({
    apiKey,
    pod,
    userAgent: 'insightly-contacts-mcp-server',
});

const server = new Server(
    {
        name: 'insightly-contacts-mcp-server',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: insightlyContactToolDefinitions,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const result = await handleInsightlyContactTool(request, insightlyClient);
    if (result) {
        return result;
    }

    return {
        content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }],
        isError: true,
    };
});

process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Insightly Contacts MCP Server running on stdio');
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
