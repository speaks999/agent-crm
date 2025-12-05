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
            // Create a mock request object that matches the old pattern
            // so existing handlers can work
            const mockRequest = {
                params: {
                    name: request.params.name,
                    arguments: request.params.arguments || {},
                },
            };
            
            // Import all schemas needed for tool handlers
            const {
                CreateAccountSchema,
                UpdateAccountSchema,
                CreateContactSchema,
                UpdateContactSchema,
                CreateDealSchema,
                UpdateDealSchema,
                CreatePipelineSchema,
                UpdatePipelineSchema,
                CreateInteractionSchema,
                UpdateInteractionSchema,
            } = await import('./types.js');
            
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
                    let query = supabase.from('contacts').select('*');
                    if (args.account_id) query = query.eq('account_id', args.account_id);
                    const { data, error } = await query;
                    if (error) throw error;
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
                
                // Deal tools
                if (toolName === 'create_deal') {
                    const parsed = CreateDealSchema.parse(args);
                    const { data, error } = await supabase
                        .from('deals')
                        .insert({
                            name: parsed.name,
                            account_id: parsed.account_id || null,
                            pipeline_id: parsed.pipeline_id || null,
                            amount: parsed.amount || null,
                            stage: parsed.stage,
                            close_date: parsed.close_date || null,
                            status: parsed.status || 'open',
                        })
                        .select()
                        .single();
                    if (error) throw error;
                    return {
                        content: [{ type: 'text' as const, text: `Deal "${data.name}" created successfully` }],
                        structuredContent: { deals: [data] },
                    };
                }
                
                if (toolName === 'get_deal') {
                    const { data, error } = await supabase
                        .from('deals')
                        .select('*')
                        .eq('id', args.id)
                        .single();
                    if (error) throw error;
                    return {
                        content: [{ type: 'text' as const, text: `Retrieved deal: ${data.name}` }],
                        structuredContent: { deals: [data] },
                    };
                }
                
                if (toolName === 'list_deals') {
                    let query = supabase.from('deals').select('*');
                    if (args.account_id) query = query.eq('account_id', args.account_id);
                    if (args.pipeline_id) query = query.eq('pipeline_id', args.pipeline_id);
                    if (args.status) query = query.eq('status', args.status);
                    if (args.stage) query = query.eq('stage', args.stage);
                    const { data, error } = await query;
                    if (error) throw error;
                    return {
                        content: [{ type: 'text' as const, text: `Found ${data?.length || 0} deal(s)` }],
                        structuredContent: { deals: data || [] },
                    };
                }
                
                if (toolName === 'update_deal') {
                    const parsed = UpdateDealSchema.parse(args);
                    const { id, ...updates } = parsed;
                    const { data, error } = await supabase
                        .from('deals')
                        .update({ ...updates, updated_at: new Date().toISOString() })
                        .eq('id', id)
                        .select()
                        .single();
                    if (error) throw error;
                    return {
                        content: [{ type: 'text' as const, text: `Deal "${data.name}" updated successfully` }],
                        structuredContent: { deals: [data] },
                    };
                }
                
                if (toolName === 'move_deal_stage') {
                    const { data, error } = await supabase
                        .from('deals')
                        .update({ stage: args.stage, updated_at: new Date().toISOString() })
                        .eq('id', args.id)
                        .select()
                        .single();
                    if (error) throw error;
                    return {
                        content: [{ type: 'text' as const, text: `Deal "${data.name}" moved to stage "${data.stage}"` }],
                        structuredContent: { deals: [data] },
                    };
                }
                
                if (toolName === 'close_deal') {
                    if (args.status !== 'won' && args.status !== 'lost') {
                        throw new Error('Status must be "won" or "lost"');
                    }
                    const { data, error } = await supabase
                        .from('deals')
                        .update({ status: args.status, updated_at: new Date().toISOString() })
                        .eq('id', args.id)
                        .select()
                        .single();
                    if (error) throw error;
                    return {
                        content: [{ type: 'text' as const, text: `Deal "${data.name}" closed as ${data.status}` }],
                        structuredContent: { deals: [data] },
                    };
                }
                
                if (toolName === 'delete_deal') {
                    const { error } = await supabase.from('deals').delete().eq('id', args.id);
                    if (error) throw error;
                    return {
                        content: [{ type: 'text' as const, text: `Deal deleted successfully` }],
                        structuredContent: {},
                    };
                }
                
                // Pipeline tools
                if (toolName === 'create_pipeline') {
                    const parsed = CreatePipelineSchema.parse(args);
                    const { data, error } = await supabase
                        .from('pipelines')
                        .insert({
                            name: parsed.name,
                            stages: parsed.stages,
                        })
                        .select()
                        .single();
                    if (error) throw error;
                    return {
                        content: [{ type: 'text' as const, text: `Pipeline "${data.name}" created successfully` }],
                        structuredContent: { pipelines: [data] },
                    };
                }
                
                if (toolName === 'get_pipeline') {
                    const { data, error } = await supabase
                        .from('pipelines')
                        .select('*')
                        .eq('id', args.id)
                        .single();
                    if (error) throw error;
                    return {
                        content: [{ type: 'text' as const, text: `Retrieved pipeline: ${data.name}` }],
                        structuredContent: { pipelines: [data] },
                    };
                }
                
                if (toolName === 'list_pipelines') {
                    const { data, error } = await supabase.from('pipelines').select('*');
                    if (error) throw error;
                    return {
                        content: [{ type: 'text' as const, text: `Found ${data?.length || 0} pipeline(s)` }],
                        structuredContent: { pipelines: data || [] },
                    };
                }
                
                if (toolName === 'update_pipeline') {
                    const parsed = UpdatePipelineSchema.parse(args);
                    const { id, ...updates } = parsed;
                    const { data, error } = await supabase
                        .from('pipelines')
                        .update(updates)
                        .eq('id', id)
                        .select()
                        .single();
                    if (error) throw error;
                    return {
                        content: [{ type: 'text' as const, text: `Pipeline "${data.name}" updated successfully` }],
                        structuredContent: { pipelines: [data] },
                    };
                }
                
                if (toolName === 'delete_pipeline') {
                    const { error } = await supabase.from('pipelines').delete().eq('id', args.id);
                    if (error) throw error;
                    return {
                        content: [{ type: 'text' as const, text: `Pipeline deleted successfully` }],
                        structuredContent: {},
                    };
                }
                
                // Interaction tools
                if (toolName === 'create_interaction') {
                    const parsed = CreateInteractionSchema.parse(args);
                    const { data, error } = await supabase
                        .from('interactions')
                        .insert({
                            type: parsed.type,
                            contact_id: parsed.contact_id || null,
                            deal_id: parsed.deal_id || null,
                            summary: parsed.summary || null,
                            transcript: parsed.transcript || null,
                            audio_url: parsed.audio_url || null,
                            sentiment: parsed.sentiment || null,
                        })
                        .select()
                        .single();
                    if (error) throw error;
                    return {
                        content: [{ type: 'text' as const, text: `Interaction created successfully` }],
                        structuredContent: { interactions: [data] },
                    };
                }
                
                if (toolName === 'get_interaction') {
                    const { data, error } = await supabase
                        .from('interactions')
                        .select('*')
                        .eq('id', args.id)
                        .single();
                    if (error) throw error;
                    return {
                        content: [{ type: 'text' as const, text: `Retrieved interaction` }],
                        structuredContent: { interactions: [data] },
                    };
                }
                
                if (toolName === 'list_interactions') {
                    let query = supabase.from('interactions').select('*');
                    if (args.contact_id) query = query.eq('contact_id', args.contact_id);
                    if (args.deal_id) query = query.eq('deal_id', args.deal_id);
                    if (args.type) query = query.eq('type', args.type);
                    const { data, error } = await query.order('created_at', { ascending: false });
                    if (error) throw error;
                    return {
                        content: [{ type: 'text' as const, text: `Found ${data?.length || 0} interaction(s)` }],
                        structuredContent: { interactions: data || [] },
                    };
                }
                
                if (toolName === 'update_interaction') {
                    const parsed = UpdateInteractionSchema.parse(args);
                    const { id, ...updates } = parsed;
                    const { data, error } = await supabase
                        .from('interactions')
                        .update(updates)
                        .eq('id', id)
                        .select()
                        .single();
                    if (error) throw error;
                    return {
                        content: [{ type: 'text' as const, text: `Interaction updated successfully` }],
                        structuredContent: { interactions: [data] },
                    };
                }
                
                if (toolName === 'delete_interaction') {
                    const { error } = await supabase.from('interactions').delete().eq('id', args.id);
                    if (error) throw error;
                    return {
                        content: [{ type: 'text' as const, text: `Interaction deleted successfully` }],
                        structuredContent: {},
                    };
                }
                
                // Search tools
                if (toolName === 'search_crm') {
                    const searchTerm = `%${args.query}%`;
                    const [accountsResult, contactsResult, dealsResult] = await Promise.all([
                        supabase.from('accounts').select('*').or(`name.ilike.${searchTerm},industry.ilike.${searchTerm}`),
                        supabase.from('contacts').select('*').or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`),
                        supabase.from('deals').select('*').ilike('name', searchTerm),
                    ]);
                    const results = {
                        accounts: accountsResult.data || [],
                        contacts: contactsResult.data || [],
                        deals: dealsResult.data || [],
                        total: (accountsResult.data?.length || 0) + (contactsResult.data?.length || 0) + (dealsResult.data?.length || 0),
                    };
                    return {
                        content: [{ type: 'text' as const, text: `Found ${results.total} result(s) for "${args.query}"` }],
                        structuredContent: results,
                    };
                }
                
                if (toolName === 'get_account_summary') {
                    const [accountResult, contactsResult, dealsResult] = await Promise.all([
                        supabase.from('accounts').select('*').eq('id', args.id).single(),
                        supabase.from('contacts').select('*').eq('account_id', args.id),
                        supabase.from('deals').select('*').eq('account_id', args.id),
                    ]);
                    if (accountResult.error) throw accountResult.error;
                    const contactIds = contactsResult.data?.map(c => c.id) || [];
                    const dealIds = dealsResult.data?.map(d => d.id) || [];
                    let interactions: any[] = [];
                    if (contactIds.length > 0 || dealIds.length > 0) {
                        const filters = [];
                        if (contactIds.length > 0) filters.push(`contact_id.in.(${contactIds.join(',')})`);
                        if (dealIds.length > 0) filters.push(`deal_id.in.(${dealIds.join(',')})`);
                        const result = await supabase.from('interactions').select('*').or(filters.join(',')).order('created_at', { ascending: false });
                        interactions = result.data || [];
                    }
                    const summary = {
                        account: accountResult.data,
                        contacts: contactsResult.data || [],
                        deals: dealsResult.data || [],
                        interactions: interactions || [],
                        stats: {
                            totalContacts: contactsResult.data?.length || 0,
                            totalDeals: dealsResult.data?.length || 0,
                            openDeals: dealsResult.data?.filter(d => d.status === 'open').length || 0,
                            wonDeals: dealsResult.data?.filter(d => d.status === 'won').length || 0,
                            totalInteractions: interactions?.length || 0,
                        },
                    };
                    return {
                        content: [{ type: 'text' as const, text: `Account summary for "${accountResult.data.name}"` }],
                        structuredContent: summary,
                    };
                }
                
                if (toolName === 'get_deal_pipeline_view') {
                    let query = supabase.from('deals').select('*');
                    if (args.pipeline_id) query = query.eq('pipeline_id', args.pipeline_id);
                    const dealsResult = await query;
                    if (dealsResult.error) throw dealsResult.error;
                    const dealsByStage: Record<string, any[]> = {};
                    dealsResult.data?.forEach(deal => {
                        if (!dealsByStage[deal.stage]) dealsByStage[deal.stage] = [];
                        dealsByStage[deal.stage].push(deal);
                    });
                    const stageStats = Object.entries(dealsByStage).map(([stage, deals]) => ({
                        stage,
                        count: deals.length,
                        totalValue: deals.reduce((sum, deal) => sum + (deal.amount || 0), 0),
                        deals,
                    }));
                    return {
                        content: [{ type: 'text' as const, text: `Pipeline view with ${dealsResult.data?.length || 0} deal(s)` }],
                        structuredContent: { stageStats, totalDeals: dealsResult.data?.length || 0 },
                    };
                }
                
                // Unknown tool
                return {
                    content: [{ type: 'text' as const, text: `Unknown tool: ${toolName}` }],
                    structuredContent: {},
                };
            } catch (error: any) {
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

    // Handle direct POST to /mcp (OpenAI Apps connector sends here)
    if (req.method === "POST" && url.pathname === ssePath) {
        console.log("\n=== POST /mcp REQUEST ===");
        console.log("Headers:", JSON.stringify(req.headers, null, 2));
        
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
        req.on("end", () => {
            console.log("Body:", body);
            let parsedBody: any = null;
            try {
                parsedBody = JSON.parse(body);
                console.log("Parsed:", JSON.stringify(parsedBody, null, 2));
            } catch (e) {
                console.log("Parse error:", e);
            }
            
            // Return 200 OK as requested
            res.writeHead(200, {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            });
            res.end(JSON.stringify({
                ok: true,
                echo: parsedBody || body,
                message: "Debug MCP endpoint reached.",
            }));
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
