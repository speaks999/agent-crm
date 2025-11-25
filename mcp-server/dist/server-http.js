import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
// Import tool handlers and definitions
import { registerAccountTools, accountToolDefinitions } from './tools/accounts.js';
import { registerContactTools, contactToolDefinitions } from './tools/contacts.js';
import { registerDealTools, dealToolDefinitions } from './tools/deals.js';
import { registerPipelineTools, pipelineToolDefinitions } from './tools/pipelines.js';
import { registerInteractionTools, interactionToolDefinitions } from './tools/interactions.js';
import { registerSearchTools, searchToolDefinitions } from './tools/search.js';
// Environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const PORT = process.env.PORT || 3001;
if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    process.exit(1);
}
// Initialize Supabase
const supabase = createClient(supabaseUrl, supabaseKey);
// Create Express app
const app = express();
// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
}));
app.use(express.json());
// Combine all tool definitions
const allTools = [
    ...accountToolDefinitions,
    ...contactToolDefinitions,
    ...dealToolDefinitions,
    ...pipelineToolDefinitions,
    ...interactionToolDefinitions,
    ...searchToolDefinitions,
];
// Simple mock server object to work with existing tool handlers
const mockServer = {
    handlers: new Map(),
    setRequestHandler: function (schema, handler) {
        this.handlers.set('tools/call', handler);
    }
};
// Register all tools with mock server
registerAccountTools(mockServer, supabase);
registerContactTools(mockServer, supabase);
registerDealTools(mockServer, supabase);
registerPipelineTools(mockServer, supabase);
registerInteractionTools(mockServer, supabase);
registerSearchTools(mockServer, supabase);
// Get the unified tool call handler
const toolCallHandler = mockServer.handlers.get('tools/call');
// POST /mcp - Handle MCP JSON-RPC requests
app.post('/mcp', async (req, res) => {
    try {
        const { jsonrpc, id, method, params } = req.body;
        // Validate JSON-RPC format
        if (jsonrpc !== '2.0') {
            return res.status(400).json({
                jsonrpc: '2.0',
                id: id || null,
                error: { code: -32600, message: 'Invalid Request' }
            });
        }
        // Handle tools/list
        if (method === 'tools/list') {
            return res.json({
                jsonrpc: '2.0',
                id,
                result: { tools: allTools }
            });
        }
        // Handle tools/call
        if (method === 'tools/call') {
            if (!toolCallHandler) {
                return res.status(500).json({
                    jsonrpc: '2.0',
                    id,
                    error: { code: -32603, message: 'Internal error: No tool handler' }
                });
            }
            const result = await toolCallHandler({ params });
            return res.json({
                jsonrpc: '2.0',
                id,
                result
            });
        }
        // Method not found
        return res.status(404).json({
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: 'Method not found' }
        });
    }
    catch (error) {
        console.error('MCP request error:', error);
        return res.status(500).json({
            jsonrpc: '2.0',
            id: req.body.id || null,
            error: { code: -32603, message: error.message }
        });
    }
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', tools: allTools.length });
});
// Start server
app.listen(PORT, () => {
    console.log(`MCP HTTP Server running on http://localhost:${PORT}`);
    console.log(`Available tools: ${allTools.length}`);
    console.log(`POST to http://localhost:${PORT}/mcp for MCP requests`);
});
//# sourceMappingURL=server-http.js.map