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

// Import tool definitions and handlers
import { accountToolDefinitions, handleAccountTool } from './tools/accounts.js';
import { contactToolDefinitions, handleContactTool } from './tools/contacts.js';
import { dealToolDefinitions, handleDealTool } from './tools/deals.js';
import { pipelineToolDefinitions, handlePipelineTool } from './tools/pipelines.js';
import { interactionToolDefinitions, handleInteractionTool } from './tools/interactions.js';
import { searchToolDefinitions, handleSearchTool } from './tools/search.js';
import { tagToolDefinitions, handleTagTool } from './tools/tags.js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const PORT = Number(process.env.PORT || 3001);
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
    ...tagToolDefinitions,
];

// Unified tool handler list (same as stdio server)
const toolHandlers = [
    handleAccountTool,
    handleContactTool,
    handleDealTool,
    handlePipelineTool,
    handleInteractionTool,
    handleSearchTool,
    handleTagTool,
];

async function dispatchToolCall(name: string, args: any) {
    const mockRequest = {
        params: {
            name,
            arguments: args || {},
        },
    };

    for (const handler of toolHandlers) {
        const result = await handler(mockRequest, supabase);
        if (result) return result;
    }

    throw new Error(`Unknown tool: ${name}`);
}

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
    // Unified tool call handler using shared handlers
    const toolHandlers = [
        handleAccountTool,
        handleContactTool,
        handleDealTool,
        handlePipelineTool,
        handleInteractionTool,
        handleSearchTool,
        handleTagTool,
    ];

    server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
        const mockRequest = {
            params: {
                name: request.params.name,
                arguments: request.params.arguments || {},
            },
        };

        for (const handler of toolHandlers) {
            const result = await handler(mockRequest, supabase);
            if (result) return result;
        }

        return {
            content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }],
            isError: true,
        };
    });

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
    res.setHeader("Access-Control-Allow-Origin", "*");
    const server = createCrmServer();
    const transport = new SSEServerTransport(postPath, res);
    const sessionId = transport.sessionId;

    sessions.set(sessionId, { server, transport });

    transport.onclose = async () => {
        sessions.delete(sessionId);
        // Don't call server.close() here - it causes infinite recursion
        // The server will be cleaned up when the transport closes
    };

    transport.onerror = (error) => {
        console.error("SSE transport error", error);
    };

    try {
        await server.connect(transport);
    } catch (error) {
        sessions.delete(sessionId);
        console.error("Failed to start SSE session", error);
        if (!res.headersSent) {
            res.writeHead(500).end("Failed to establish SSE connection");
        }
    }
}

async function handlePostMessage(
    req: IncomingMessage,
    res: ServerResponse,
    url: URL
) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
        res.writeHead(400).end("Missing sessionId query parameter");
        return;
    }

    const session = sessions.get(sessionId);

    if (!session) {
        res.writeHead(404).end("Unknown session");
        return;
    }

    try {
        await session.transport.handlePostMessage(req, res);
    } catch (error) {
        console.error("Failed to process message", error);
        if (!res.headersSent) {
            res.writeHead(500).end("Failed to process message");
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

    // Health check endpoint
    if (req.method === 'GET' && url.pathname === '/') {
        res.writeHead(200, { 'content-type': 'text/plain' }).end('Agent CRM MCP Server');
        return;
    }

    if (
        req.method === "OPTIONS" &&
        (url.pathname === ssePath || url.pathname === postPath)
    ) {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "content-type",
        });
        res.end();
        return;
    }

    // JSON-RPC over HTTP for MCP (tools/list, tools/call)
    if (req.method === "POST" && url.pathname === ssePath) {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
        req.on("end", async () => {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Content-Type", "application/json");

            let parsed: any;
            try {
                parsed = JSON.parse(body);
            } catch (e) {
                res.writeHead(400).end(JSON.stringify({ error: "Invalid JSON" }));
                return;
            }

            const { method, id, params } = parsed || {};

            try {
                if (method === 'tools/list') {
                    res.writeHead(200).end(JSON.stringify({
                        jsonrpc: '2.0',
                        id,
                        result: { tools: allToolDefinitions },
                    }));
                    return;
                }

                if (method === 'tools/call') {
                    const result = await dispatchToolCall(params?.name, params?.arguments);
                    res.writeHead(200).end(JSON.stringify({
                        jsonrpc: '2.0',
                        id,
                        result,
                    }));
                    return;
                }

                res.writeHead(404).end(JSON.stringify({ error: `Unknown method: ${method}` }));
            } catch (err: any) {
                res.writeHead(500).end(JSON.stringify({
                    jsonrpc: '2.0',
                    id,
                    error: { message: err.message || String(err) },
                }));
            }
        });
        return;
    }

    if (req.method === "GET" && url.pathname === ssePath) {
        await handleSseRequest(res);
        return;
    }

    if (req.method === "POST" && url.pathname === postPath) {
        await handlePostMessage(req, res, url);
        return;
    }

    res.writeHead(404).end("Not Found");
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
