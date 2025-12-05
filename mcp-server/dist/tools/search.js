export async function handleSearchTool(request, supabase) {
    // Global Search
    if (request.params.name === 'search_crm') {
        const { query } = request.params.arguments;
        const searchTerm = `%${query}%`;
        try {
            // Search across accounts, contacts, and deals
            const [accountsResult, contactsResult, dealsResult] = await Promise.all([
                supabase
                    .from('accounts')
                    .select('*')
                    .or(`name.ilike.${searchTerm},industry.ilike.${searchTerm}`),
                supabase
                    .from('contacts')
                    .select('*')
                    .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`),
                supabase
                    .from('deals')
                    .select('*')
                    .ilike('name', searchTerm),
            ]);
            const results = {
                accounts: accountsResult.data || [],
                contacts: contactsResult.data || [],
                deals: dealsResult.data || [],
                total: (accountsResult.data?.length || 0) + (contactsResult.data?.length || 0) + (dealsResult.data?.length || 0),
            };
            return {
                content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
            };
        }
        catch (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
            };
        }
    }
    // Get Account Summary
    if (request.params.name === 'get_account_summary') {
        const { id } = request.params.arguments;
        try {
            // Fetch account with all related data
            const [accountResult, contactsResult, dealsResult] = await Promise.all([
                supabase.from('accounts').select('*').eq('id', id).single(),
                supabase.from('contacts').select('*').eq('account_id', id),
                supabase.from('deals').select('*').eq('account_id', id),
            ]);
            if (accountResult.error) {
                return {
                    content: [{ type: 'text', text: `Error: ${accountResult.error.message}` }],
                    isError: true,
                };
            }
            // Get interactions for all contacts and deals
            const contactIds = contactsResult.data?.map(c => c.id) || [];
            const dealIds = dealsResult.data?.map(d => d.id) || [];
            let interactions = [];
            if (contactIds.length > 0 || dealIds.length > 0) {
                const filters = [];
                if (contactIds.length > 0)
                    filters.push(`contact_id.in.(${contactIds.join(',')})`);
                if (dealIds.length > 0)
                    filters.push(`deal_id.in.(${dealIds.join(',')})`);
                const result = await supabase
                    .from('interactions')
                    .select('*')
                    .or(filters.join(','))
                    .order('created_at', { ascending: false });
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
                content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
            };
        }
        catch (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
            };
        }
    }
    // Get Deal Pipeline View
    if (request.params.name === 'get_deal_pipeline_view') {
        const { pipeline_id } = request.params.arguments || {};
        try {
            let query = supabase.from('deals').select('*');
            if (pipeline_id) {
                query = query.eq('pipeline_id', pipeline_id);
            }
            const dealsResult = await query;
            if (dealsResult.error) {
                return {
                    content: [{ type: 'text', text: `Error: ${dealsResult.error.message}` }],
                    isError: true,
                };
            }
            // Group deals by stage
            const dealsByStage = {};
            dealsResult.data?.forEach(deal => {
                if (!dealsByStage[deal.stage]) {
                    dealsByStage[deal.stage] = [];
                }
                dealsByStage[deal.stage].push(deal);
            });
            // Calculate totals per stage
            const stageStats = Object.entries(dealsByStage).map(([stage, deals]) => ({
                stage,
                count: deals.length,
                totalValue: deals.reduce((sum, deal) => sum + (deal.amount || 0), 0),
                deals,
            }));
            return {
                content: [{ type: 'text', text: JSON.stringify({ stageStats, totalDeals: dealsResult.data?.length || 0 }, null, 2) }],
            };
        }
        catch (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
            };
        }
    }
    return null;
}
export const searchToolDefinitions = [
    {
        name: 'search_crm',
        description: 'Search across all CRM entities (accounts, contacts, deals) using a query string',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Search query to match against names, emails, etc.' },
            },
            required: ['query'],
        },
    },
    {
        name: 'get_account_summary',
        description: 'Get a comprehensive overview of an account including all contacts, deals, and interactions',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Account UUID' },
            },
            required: ['id'],
        },
    },
    {
        name: 'get_deal_pipeline_view',
        description: 'View all deals organized by pipeline stage with statistics',
        inputSchema: {
            type: 'object',
            properties: {
                pipeline_id: { type: 'string', description: 'Optional pipeline UUID to filter by' },
            },
        },
    },
];
//# sourceMappingURL=search.js.map