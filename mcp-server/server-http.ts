import { config } from 'dotenv';
import { resolve } from 'node:path';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
    CallToolRequestSchema,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    ReadResourceRequestSchema,
    type CallToolRequest,
    type ListResourcesRequest,
    type ListToolsRequest,
    type ReadResourceRequest,
} from '@modelcontextprotocol/sdk/types.js';

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

// Import tool handlers
import { registerAccountTools } from './tools/accounts.js';
import { registerContactTools } from './tools/contacts.js';
import { registerDealTools } from './tools/deals.js';
import { registerPipelineTools } from './tools/pipelines.js';
import { registerInteractionTools } from './tools/interactions.js';
import { registerSearchTools } from './tools/search.js';

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
function readWidgetHtml(filename: string): string {
    try {
        // When running from dist/, look in source directory (go up one level from dist/)
        const sourceDir = join(__dirname, '..');
        const widgetPath = join(sourceDir, 'public', filename);
        return readFileSync(widgetPath, 'utf8');
    } catch (error) {
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
    const server = new Server(
        {
            name: 'agent-crm-app',
            version: '1.0.0',
        },
        {
            capabilities: {
                resources: {},
                tools: {},
            },
        }
    );

    // Register resources handler
    const resources: Array<{
        uri: string;
        name: string;
        description: string;
        mimeType: string;
        _meta: Record<string, any>;
    }> = [];
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

    server.setRequestHandler(
        ListResourcesRequestSchema,
        async (_request: ListResourcesRequest) => ({
            resources,
        })
    );

    server.setRequestHandler(
        ReadResourceRequestSchema,
        async (request: ReadResourceRequest) => {
            let html = '';
            if (request.params.uri === 'ui://widget/contacts.html') html = contactsHtml;
            else if (request.params.uri === 'ui://widget/deals.html') html = dealsHtml;
            else if (request.params.uri === 'ui://widget/accounts.html') html = accountsHtml;
            else if (request.params.uri === 'ui://widget/dashboard.html') html = dashboardHtml;
            else throw new Error(`Unknown resource: ${request.params.uri}`);

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
        }
    );

    // Register tools handler
    server.setRequestHandler(
        ListToolsRequestSchema,
        async (_request: ListToolsRequest) => ({
            tools: allToolDefinitions,
        })
    );

    // Create a unified tool call handler
    // The existing tool handlers use 'tools/call' string pattern which doesn't work with the new Server
    // We need to use CallToolRequestSchema and route internally
    server.setRequestHandler(
        CallToolRequestSchema,
        async (request: CallToolRequest) => {
            // Log incoming request for debugging
            console.log('=== MCP Tool Call Request ===');
            console.log('Tool name:', request.params.name);
            console.log('Arguments:', JSON.stringify(request.params.arguments, null, 2));
            console.log('Full request:', JSON.stringify(request, null, 2));
            
            // Import schemas and implement tool handlers directly
            const {
                CreateAccountSchema,
                UpdateAccountSchema,
                CreateContactSchema,
                UpdateContactSchema,
            } = await import('./types.js');
            
            const toolName = request.params.name;
            // Ensure args is always an object, even if null/undefined
            const args = request.params.arguments ?? {};
            
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
                    if (error) throw error;
                    const { data: allAccounts } = await supabase.from('accounts').select('*');
                    return {
                        content: [{ type: 'text' as const, text: `Account "${data.name}" created successfully` }],
                        structuredContent: { accounts: allAccounts || [] },
                    };
                }
                
                if (toolName === 'get_account') {
                    const { data, error } = await supabase
                        .from('accounts')
                        .select('*')
                        .eq('id', args.id)
                        .single();
                    if (error) throw error;
                    return {
                        content: [{ type: 'text' as const, text: `Retrieved account: ${data.name}` }],
                        structuredContent: { accounts: [data] },
                    };
                }
                
                if (toolName === 'list_accounts') {
                    let query = supabase.from('accounts').select('*');
                    if (args.industry) query = query.eq('industry', args.industry);
                    const { data, error } = await query;
                    if (error) throw error;
                    return {
                        content: [{ type: 'text' as const, text: `Found ${data?.length || 0} account(s)` }],
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
                    if (error) throw error;
                    const { data: allAccounts } = await supabase.from('accounts').select('*');
                    return {
                        content: [{ type: 'text' as const, text: `Account "${data.name}" updated successfully` }],
                        structuredContent: { accounts: allAccounts || [] },
                    };
                }
                
                if (toolName === 'delete_account') {
                    const { error } = await supabase.from('accounts').delete().eq('id', args.id);
                    if (error) throw error;
                    const { data: allAccounts } = await supabase.from('accounts').select('*');
                    return {
                        content: [{ type: 'text' as const, text: `Account deleted successfully` }],
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
                    if (error) throw error;
                    const { data: allContacts } = await supabase.from('contacts').select('*');
                    return {
                        content: [{ type: 'text' as const, text: `Contact "${data.first_name} ${data.last_name}" created successfully` }],
                        structuredContent: { contacts: allContacts || [] },
                    };
                }
                
                if (toolName === 'get_contact') {
                    const { data, error } = await supabase
                        .from('contacts')
                        .select('*')
                        .eq('id', args.id)
                        .single();
                    if (error) throw error;
                    return {
                        content: [{ type: 'text' as const, text: `Retrieved contact: ${data.first_name} ${data.last_name}` }],
                        structuredContent: { contacts: [data] },
                    };
                }
                
                if (toolName === 'list_contacts') {
                    // Handle empty arguments - list_contacts doesn't require any args
                    // Ensure args is an object (could be null/undefined from MCP client)
                    const safeArgs = (args && typeof args === 'object') ? args : {};
                    let query = supabase.from('contacts').select('*');
                    if (safeArgs.account_id) {
                        query = query.eq('account_id', safeArgs.account_id);
                    }
                    const { data, error } = await query;
                    if (error) {
                        console.error('list_contacts error:', error);
                        throw error;
                    }
                    return {
                        content: [{ type: 'text' as const, text: `Found ${data?.length || 0} contact(s)` }],
                        structuredContent: { contacts: data || [] },
                    };
                }
                
                if (toolName === 'update_contact') {
                    const parsed = UpdateContactSchema.parse(args);
                    const { id, ...updates } = parsed;
                    const { data, error } = await supabase
                        .from('contacts')
                        .update({ ...updates, updated_at: new Date().toISOString() })
                        .eq('id', id)
                        .select()
                        .single();
                    if (error) throw error;
                    const { data: allContacts } = await supabase.from('contacts').select('*');
                    return {
                        content: [{ type: 'text' as const, text: `Contact "${data.first_name} ${data.last_name}" updated successfully` }],
                        structuredContent: { contacts: allContacts || [] },
                    };
                }
                
                if (toolName === 'delete_contact') {
                    const { error } = await supabase.from('contacts').delete().eq('id', args.id);
                    if (error) throw error;
                    const { data: allContacts } = await supabase.from('contacts').select('*');
                    return {
                        content: [{ type: 'text' as const, text: `Contact deleted successfully` }],
                        structuredContent: { contacts: allContacts || [] },
                    };
                }
                
                // TODO: Implement remaining tools (deals, pipelines, interactions, search)
                return {
                    content: [{ type: 'text' as const, text: `Tool ${toolName} is not yet fully implemented in the unified handler` }],
                    structuredContent: {},
                };
            } catch (error: any) {
                console.error(`Tool ${toolName} error:`, error);
                console.error('Request params:', { name: request.params.name, arguments: request.params.arguments });
                return {
                    content: [{ type: 'text' as const, text: `Error: ${error.message || String(error)}` }],
                    isError: true,
                };
            }
        }
    );

    return server;
}

// Session management (following pizzaz example pattern)
type SessionRecord = {
    server: Server;
    transport: SSEServerTransport;
};

const sessions = new Map<string, SessionRecord>();

const ssePath = '/mcp';
const postPath = '/mcp/messages';

async function handleSseRequest(res: ServerResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const server = createCrmServer();
    const transport = new SSEServerTransport(postPath, res);
    const sessionId = transport.sessionId;

    sessions.set(sessionId, { server, transport });

    // Fix infinite recursion - don't call server.close() in onclose
    transport.onclose = async () => {
        console.log('SSE transport closing for session:', sessionId);
        sessions.delete(sessionId);
        // Don't call server.close() - it causes infinite recursion
        // The transport will handle cleanup
    };

    transport.onerror = (error) => {
        console.error('SSE transport error', error);
    };

    try {
        await server.connect(transport);
    } catch (error) {
        sessions.delete(sessionId);
        console.error('Failed to start SSE session', error);
        if (!res.headersSent) {
            res.writeHead(500).end('Failed to establish SSE connection');
        }
    }
}

async function handlePostMessage(
    req: IncomingMessage,
    res: ServerResponse,
    url: URL
) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    const sessionId = url.searchParams.get('sessionId');

    console.log('=== POST Message Request ===');
    console.log('Session ID:', sessionId);
    console.log('URL:', url.toString());

    if (!sessionId) {
        console.error('Missing sessionId query parameter');
        res.writeHead(400).end('Missing sessionId query parameter');
        return;
    }

    const session = sessions.get(sessionId);

    if (!session) {
        console.error('Unknown session:', sessionId);
        console.log('Active sessions:', Array.from(sessions.keys()));
        res.writeHead(404).end('Unknown session');
        return;
    }

    try {
        await session.transport.handlePostMessage(req, res);
    } catch (error) {
        console.error('Failed to process message', error);
        if (!res.headersSent) {
            res.writeHead(500).end('Failed to process message');
        }
    }
}

// Create HTTP server following pizzaz example pattern
// Reference: https://github.com/openai/openai-apps-sdk-examples/tree/main/pizzaz_server_node
const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url) {
        res.writeHead(400).end('Missing URL');
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

    // Log all incoming requests for debugging
    console.log(`\n=== Incoming Request ===`);
    console.log(`Method: ${req.method}`);
    console.log(`Path: ${url.pathname}`);
    console.log(`Query: ${url.search}`);
    console.log(`Headers:`, JSON.stringify(req.headers, null, 2));

    // Health check endpoint
    if (req.method === 'GET' && url.pathname === '/') {
        res.writeHead(200, { 'content-type': 'text/plain' }).end('Agent CRM MCP Server');
        return;
    }

    // Handle CORS preflight
    if (
        req.method === 'OPTIONS' &&
        (url.pathname === ssePath || url.pathname === postPath)
    ) {
        console.log('Handling CORS preflight');
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'content-type',
        });
        res.end();
        return;
    }

    // Handle direct POST to /mcp (temporary - accept anything and log it)
    if (req.method === 'POST' && url.pathname === ssePath) {
        console.log('⚠️  Direct POST to /mcp detected');
        console.log('This is not the SSE pattern, but accepting it temporarily for debugging');
        
        // Read body
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            console.log('\n=== POST to /mcp - Full Request ===');
            console.log('Raw body:', body);
            console.log('Body length:', body.length);
            
            let parsedBody: any = null;
            try {
                parsedBody = JSON.parse(body);
                console.log('Parsed JSON body:', JSON.stringify(parsedBody, null, 2));
            } catch (e) {
                console.log('Could not parse body as JSON:', e);
            }
            
            // TEMPORARY: Always return 200 OK to stop seeing 400s
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            });
            res.end(JSON.stringify({
                ok: true,
                message: 'Temporary handler - accepting POST to /mcp',
                echo: parsedBody || body,
                received: {
                    method: req.method,
                    path: url.pathname,
                    query: url.search,
                    bodyLength: body.length,
                }
            }));
        });
        return;
    }

    // Handle SSE connection
    if (req.method === 'GET' && url.pathname === ssePath) {
        console.log('Handling SSE connection request');
        await handleSseRequest(res);
        return;
    }

    // Handle POST messages
    if (req.method === 'POST' && url.pathname === postPath) {
        console.log('Handling POST message request');
        await handlePostMessage(req, res, url);
        return;
    }

    console.log('404 - Not Found:', url.pathname);
    res.writeHead(404).end('Not Found');
});

httpServer.on('clientError', (err: Error, socket) => {
    console.error('HTTP client error', err);
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

httpServer.listen(PORT, () => {
    console.log(`Agent CRM MCP Server listening on http://localhost:${PORT}`);
    console.log(`  SSE stream: GET http://localhost:${PORT}${ssePath}`);
    console.log(`  Message post endpoint: POST http://localhost:${PORT}${postPath}?sessionId=...`);
    console.log(`Available tools: ${allToolDefinitions.length}`);
});
