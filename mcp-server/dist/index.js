#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createClient } from '@supabase/supabase-js';
import { ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
// Import tool registration functions
import { registerAccountTools, accountToolDefinitions } from './tools/accounts.js';
import { registerContactTools, contactToolDefinitions } from './tools/contacts.js';
import { registerDealTools, dealToolDefinitions } from './tools/deals.js';
import { registerPipelineTools, pipelineToolDefinitions } from './tools/pipelines.js';
import { registerInteractionTools, interactionToolDefinitions } from './tools/interactions.js';
import { registerSearchTools, searchToolDefinitions } from './tools/search.js';
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
// Register all tool handlers
registerAccountTools(server, supabase);
registerContactTools(server, supabase);
registerDealTools(server, supabase);
registerPipelineTools(server, supabase);
registerInteractionTools(server, supabase);
registerSearchTools(server, supabase);
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