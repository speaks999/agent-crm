import { config } from 'dotenv';
import { resolve } from 'node:path';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
// Load environment variables from .env.local in project root
// When running from mcp-server/, go up one level to find .env.local
const envPath = resolve(process.cwd(), '..', '.env.local');
// Also try current directory in case we're running from project root
const envPathAlt = resolve(process.cwd(), '.env.local');
const result1 = config({ path: envPath });
const result2 = config({ path: envPathAlt, override: false });
// Import tool definitions for counting
import { accountToolDefinitions } from './tools/accounts.js';
import { contactToolDefinitions } from './tools/contacts.js';
import { dealToolDefinitions } from './tools/deals.js';
import { pipelineToolDefinitions } from './tools/pipelines.js';
import { interactionToolDefinitions } from './tools/interactions.js';
import { searchToolDefinitions } from './tools/search.js';
// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const PORT = Number(process.env.PORT || 8787);
const MCP_PATH = '/mcp';
if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_URL/SUPABASE_ANON_KEY');
    process.exit(1);
}
// Initialize Supabase
const supabase = createClient(supabaseUrl, supabaseKey);
// Define __dirname for use in functions
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Combine all tool definitions
const allToolDefinitions = [
    ...accountToolDefinitions,
    ...contactToolDefinitions,
    ...dealToolDefinitions,
    ...pipelineToolDefinitions,
    ...interactionToolDefinitions,
    ...searchToolDefinitions,
];
// Read UI widget HTML files
function readWidgetHtml(filename) {
    try {
        // When running from dist/, look in source directory (go up one level from dist/)
        const sourceDir = join(__dirname, '..');
        const widgetPath = join(sourceDir, 'public', filename);
        return readFileSync(widgetPath, 'utf8');
    }
    catch (error) {
        console.warn(`Warning: Could not read widget ${filename}:`, error);
        return '';
    }
}
const contactsHtml = readWidgetHtml('contacts-widget.html');
const dealsHtml = readWidgetHtml('deals-widget.html');
const accountsHtml = readWidgetHtml('accounts-widget.html');
const dashboardHtml = readWidgetHtml('dashboard-widget.html');
// Create MCP server instance
function createCrmServer() {
    const server = new Server({
        name: 'agent-crm-app',
        version: '1.0.0',
    }, {
        capabilities: {
            resources: {},
            tools: {},
        },
    });
    // Register resources handler
    const resources = [];
    if (contactsHtml) {
        resources.push({
            uri: 'ui://widget/contacts.html',
            name: 'Contacts Widget',
            description: 'Contacts widget markup',
            mimeType: 'text/html+skybridge',
            _meta: { 'openai/widgetPrefersBorder': true },
        });
    }
    if (dealsHtml) {
        resources.push({
            uri: 'ui://widget/deals.html',
            name: 'Deals Widget',
            description: 'Deals widget markup',
            mimeType: 'text/html+skybridge',
            _meta: { 'openai/widgetPrefersBorder': true },
        });
    }
    if (accountsHtml) {
        resources.push({
            uri: 'ui://widget/accounts.html',
            name: 'Accounts Widget',
            description: 'Accounts widget markup',
            mimeType: 'text/html+skybridge',
            _meta: { 'openai/widgetPrefersBorder': true },
        });
    }
    if (dashboardHtml) {
        resources.push({
            uri: 'ui://widget/dashboard.html',
            name: 'Dashboard Widget',
            description: 'Dashboard widget markup',
            mimeType: 'text/html+skybridge',
            _meta: { 'openai/widgetPrefersBorder': true },
        });
    }
    server.setRequestHandler(ListResourcesRequestSchema, async (_request) => ({
        resources,
    }));
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        let html = '';
        if (request.params.uri === 'ui://widget/contacts.html')
            html = contactsHtml;
        else if (request.params.uri === 'ui://widget/deals.html')
            html = dealsHtml;
        else if (request.params.uri === 'ui://widget/accounts.html')
            html = accountsHtml;
        else if (request.params.uri === 'ui://widget/dashboard.html')
            html = dashboardHtml;
        else
            throw new Error(`Unknown resource: ${request.params.uri}`);
        return {
            contents: [
                {
                    uri: request.params.uri,
                    mimeType: 'text/html+skybridge',
                    text: html,
                    _meta: { 'openai/widgetPrefersBorder': true },
                },
            ],
        };
    });
    // Register tools handler
    server.setRequestHandler(ListToolsRequestSchema, async (_request) => ({
        tools: allToolDefinitions,
    }));
    // Create a unified tool call handler
    // The existing tool handlers use 'tools/call' string pattern which doesn't work with the new Server
    // We need to use CallToolRequestSchema and route internally
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        // Create a mock request object that matches the old pattern
        // so existing handlers can work
        const mockRequest = {
            params: {
                name: request.params.name,
                arguments: request.params.arguments || {},
            },
        };
        // Import schemas and implement tool handlers directly
        const { CreateAccountSchema, UpdateAccountSchema, CreateContactSchema, UpdateContactSchema, } = await import('./types.js');
        const toolName = request.params.name;
        const args = request.params.arguments || {};
        try {
            // Account tools
            if (toolName === 'create_account') {
                const parsed = CreateAccountSchema.parse(args);
                const { data, error } = await supabase
                    .from('accounts')
                    .insert({
                    name: parsed.name,
                    industry: parsed.industry || null,
                    website: parsed.website || null,
                })
                    .select()
                    .single();
                if (error)
                    throw error;
                const { data: allAccounts } = await supabase.from('accounts').select('*');
                return {
                    content: [{ type: 'text', text: `Account "${data.name}" created successfully` }],
                    structuredContent: { accounts: allAccounts || [] },
                };
            }
            if (toolName === 'get_account') {
                const { data, error } = await supabase
                    .from('accounts')
                    .select('*')
                    .eq('id', args.id)
                    .single();
                if (error)
                    throw error;
                return {
                    content: [{ type: 'text', text: `Retrieved account: ${data.name}` }],
                    structuredContent: { accounts: [data] },
                };
            }
            if (toolName === 'list_accounts') {
                let query = supabase.from('accounts').select('*');
                if (args.industry)
                    query = query.eq('industry', args.industry);
                const { data, error } = await query;
                if (error)
                    throw error;
                return {
                    content: [{ type: 'text', text: `Found ${data?.length || 0} account(s)` }],
                    structuredContent: { accounts: data || [] },
                };
            }
            if (toolName === 'update_account') {
                const parsed = UpdateAccountSchema.parse(args);
                const { id, ...updates } = parsed;
                const { data, error } = await supabase
                    .from('accounts')
                    .update({ ...updates, updated_at: new Date().toISOString() })
                    .eq('id', id)
                    .select()
                    .single();
                if (error)
                    throw error;
                const { data: allAccounts } = await supabase.from('accounts').select('*');
                return {
                    content: [{ type: 'text', text: `Account "${data.name}" updated successfully` }],
                    structuredContent: { accounts: allAccounts || [] },
                };
            }
            if (toolName === 'delete_account') {
                const { error } = await supabase.from('accounts').delete().eq('id', args.id);
                if (error)
                    throw error;
                const { data: allAccounts } = await supabase.from('accounts').select('*');
                return {
                    content: [{ type: 'text', text: `Account deleted successfully` }],
                    structuredContent: { accounts: allAccounts || [] },
                };
            }
            // Contact tools
            if (toolName === 'create_contact') {
                const parsed = CreateContactSchema.parse(args);
                const { data, error } = await supabase
                    .from('contacts')
                    .insert({
                    first_name: parsed.first_name,
                    last_name: parsed.last_name,
                    account_id: parsed.account_id || null,
                    email: parsed.email || null,
                    phone: parsed.phone || null,
                    role: parsed.role || null,
                })
                    .select()
                    .single();
                if (error)
                    throw error;
                const { data: allContacts } = await supabase.from('contacts').select('*');
                return {
                    content: [{ type: 'text', text: `Contact "${data.first_name} ${data.last_name}" created successfully` }],
                    structuredContent: { contacts: allContacts || [] },
                };
            }
            // TODO: Implement remaining tools (get_contact, list_contacts, update_contact, delete_contact, and all deal/pipeline/interaction/search tools)
            return {
                content: [{ type: 'text', text: `Tool ${toolName} is not yet fully implemented in the unified handler` }],
                structuredContent: {},
            };
        }
        catch (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message || String(error)}` }],
                isError: true,
            };
        }
    });
    return server;
}
const sessions = new Map();
const ssePath = '/mcp';
const postPath = '/mcp/messages';
async function handleSseRequest(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const server = createCrmServer();
    const transport = new SSEServerTransport(postPath, res);
    const sessionId = transport.sessionId;
    sessions.set(sessionId, { server, transport });
    transport.onclose = async () => {
        sessions.delete(sessionId);
        await server.close();
    };
    transport.onerror = (error) => {
        console.error('SSE transport error', error);
    };
    try {
        await server.connect(transport);
    }
    catch (error) {
        sessions.delete(sessionId);
        console.error('Failed to start SSE session', error);
        if (!res.headersSent) {
            res.writeHead(500).end('Failed to establish SSE connection');
        }
    }
}
async function handlePostMessage(req, res, url) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    const sessionId = url.searchParams.get('sessionId');
    if (!sessionId) {
        res.writeHead(400).end('Missing sessionId query parameter');
        return;
    }
    const session = sessions.get(sessionId);
    if (!session) {
        res.writeHead(404).end('Unknown session');
        return;
    }
    try {
        await session.transport.handlePostMessage(req, res);
    }
    catch (error) {
        console.error('Failed to process message', error);
        if (!res.headersSent) {
            res.writeHead(500).end('Failed to process message');
        }
    }
}
// Create HTTP server following pizzaz example pattern
// Reference: https://github.com/openai/openai-apps-sdk-examples/tree/main/pizzaz_server_node
const httpServer = createServer(async (req, res) => {
    if (!req.url) {
        res.writeHead(400).end('Missing URL');
        return;
    }
    const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
    // Health check endpoint
    if (req.method === 'GET' && url.pathname === '/') {
        res.writeHead(200, { 'content-type': 'text/plain' }).end('Agent CRM MCP Server');
        return;
    }
    // Handle CORS preflight
    if (req.method === 'OPTIONS' &&
        (url.pathname === ssePath || url.pathname === postPath)) {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'content-type',
        });
        res.end();
        return;
    }
    // Handle SSE connection
    if (req.method === 'GET' && url.pathname === ssePath) {
        await handleSseRequest(res);
        return;
    }
    // Handle POST messages
    if (req.method === 'POST' && url.pathname === postPath) {
        await handlePostMessage(req, res, url);
        return;
    }
    res.writeHead(404).end('Not Found');
});
httpServer.on('clientError', (err, socket) => {
    console.error('HTTP client error', err);
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
httpServer.listen(PORT, () => {
    console.log(`Agent CRM MCP Server listening on http://localhost:${PORT}`);
    console.log(`  SSE stream: GET http://localhost:${PORT}${ssePath}`);
    console.log(`  Message post endpoint: POST http://localhost:${PORT}${postPath}?sessionId=...`);
    console.log(`Available tools: ${allToolDefinitions.length}`);
});
//# sourceMappingURL=server-http.js.map