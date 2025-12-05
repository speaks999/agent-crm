#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createClient } from '@supabase/supabase-js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
// Import tool registration functions
import { handleAccountTool, accountToolDefinitions } from './tools/accounts.js';
import { handleContactTool, contactToolDefinitions } from './tools/contacts.js';
import { handleDealTool, dealToolDefinitions } from './tools/deals.js';
import { handlePipelineTool, pipelineToolDefinitions } from './tools/pipelines.js';
import { handleInteractionTool, interactionToolDefinitions } from './tools/interactions.js';
import { handleSearchTool, searchToolDefinitions } from './tools/search.js';
// Environment variable validation
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing required environment variables SUPABASE_URL or SUPABASE_ANON_KEY');
    process.exit(1);
}
// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);
// Create MCP server
const server = new Server({
    name: 'agent-crm-mcp-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Combine all tool definitions
const allToolDefinitions = [
    ...accountToolDefinitions,
    ...contactToolDefinitions,
    ...dealToolDefinitions,
    ...pipelineToolDefinitions,
    ...interactionToolDefinitions,
    ...searchToolDefinitions,
];
// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: allToolDefinitions,
    };
});
// Single dispatcher for all tools
const toolHandlers = [
    handleAccountTool,
    handleContactTool,
    handleDealTool,
    handlePipelineTool,
    handleInteractionTool,
    handleSearchTool,
];
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    for (const handler of toolHandlers) {
        const result = await handler(request, supabase);
        if (result)
            return result;
    }
    return {
        content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }],
        isError: true,
    };
});
// Error handling
process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
});
// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Agent CRM MCP Server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map