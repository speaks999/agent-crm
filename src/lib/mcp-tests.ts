/**
 * Exhaustive Test Suite for MCP Server
 * 
 * This file contains comprehensive test cases for all 30 MCP tools,
 * including typical salesperson queries and edge cases.
 */

export interface MCPTest {
    id: string;
    category: string;
    tool: string;
    name: string;
    description: string;
    query: string; // Natural language query a salesperson might use
    args: Record<string, any>;
    expectedResult?: {
        hasContent: boolean;
        hasStructuredContent?: boolean;
        containsText?: string[];
        errorExpected?: boolean;
    };
    setup?: (mcpUrl: string) => Promise<string | null>; // Setup function to run before test
    cleanup?: {
        tool: string;
        getIdFromResult: (result: any) => string | null;
    };
}

// Helper to generate stable test IDs
let testCounter: Record<string, number> = {};
function generateTestId(prefix: string): string {
    testCounter[prefix] = (testCounter[prefix] || 0) + 1;
    return `${prefix}-${testCounter[prefix]}`;
}

export const MCP_TESTS: MCPTest[] = [
    // ========================================
    // ACCOUNT TESTS (5 tools)
    // ========================================
    
    {
        id: generateTestId('account'),
        category: 'Accounts',
        tool: 'create_account',
        name: 'Create account - Basic',
        description: 'Create a new company account with just name',
        query: 'Create a new account for Acme Corporation',
        args: { name: 'Acme Corporation' },
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['created successfully'] },
        cleanup: { tool: 'delete_account', getIdFromResult: (r) => r.structuredContent?.accounts?.[0]?.id || null }
    },
    {
        id: generateTestId('account'),
        category: 'Accounts',
        tool: 'create_account',
        name: 'Create account - With industry',
        description: 'Create account with industry specified',
        query: 'Add TechCorp to our CRM in the technology industry',
        args: { name: 'TechCorp', industry: 'Technology' },
        expectedResult: { hasContent: true, hasStructuredContent: true },
        cleanup: { tool: 'delete_account', getIdFromResult: (r) => r.structuredContent?.accounts?.[0]?.id || null }
    },
    {
        id: generateTestId('account'),
        category: 'Accounts',
        tool: 'create_account',
        name: 'Create account - Full details',
        description: 'Create account with all fields',
        query: 'Create account for Enterprise Solutions, they are in software industry and website is enterprise-solutions.com',
        args: { 
            name: 'Enterprise Solutions',
            industry: 'Software',
            website: 'https://enterprise-solutions.com'
        },
        expectedResult: { hasContent: true, hasStructuredContent: true },
        cleanup: { tool: 'delete_account', getIdFromResult: (r) => r.structuredContent?.accounts?.[0]?.id || null }
    },
    {
        id: generateTestId('account'),
        category: 'Accounts',
        tool: 'list_accounts',
        name: 'List all accounts',
        description: 'Get all accounts in the CRM',
        query: 'Show me all the accounts we have',
        args: {},
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['Found'] }
    },
    {
        id: generateTestId('account'),
        category: 'Accounts',
        tool: 'list_accounts',
        name: 'List accounts - Filter by industry',
        description: 'Filter accounts by industry type',
        query: 'Show me all technology companies',
        args: { industry: 'Technology' },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('account'),
        category: 'Accounts',
        tool: 'get_account',
        name: 'Get account by ID',
        description: 'Retrieve a specific account',
        query: 'Get me the details for account with ID {account_id}',
        args: { id: '{account_id}' }, // Placeholder - will be replaced at runtime
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('account'),
        category: 'Accounts',
        tool: 'update_account',
        name: 'Update account - Change name',
        description: 'Update account name',
        query: 'Update account {account_id} to have the name "Updated Company Name"',
        args: { id: '{account_id}', name: 'Updated Company Name' },
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['updated successfully'] }
    },
    {
        id: generateTestId('account'),
        category: 'Accounts',
        tool: 'update_account',
        name: 'Update account - Change industry',
        description: 'Update account industry',
        query: 'Change the industry for account {account_id} to Healthcare',
        args: { id: '{account_id}', industry: 'Healthcare' },
        expectedResult: { hasContent: true }
    },
    {
        id: generateTestId('account'),
        category: 'Accounts',
        tool: 'update_account',
        name: 'Update account - Add website',
        description: 'Add website to existing account',
        query: 'Add website https://example.com to account {account_id}',
        args: { id: '{account_id}', website: 'https://example.com' },
        expectedResult: { hasContent: true }
    },
    {
        id: generateTestId('account'),
        category: 'Accounts',
        tool: 'delete_account',
        name: 'Delete account',
        description: 'Remove an account from CRM',
        query: 'Delete account {account_id}',
        args: { id: '{account_id}' },
        expectedResult: { hasContent: true, containsText: ['deleted successfully'] }
    },

    // ========================================
    // CONTACT TESTS (5 tools)
    // ========================================

    {
        id: generateTestId('contact'),
        category: 'Contacts',
        tool: 'create_contact',
        name: 'Create contact - Basic',
        description: 'Create a new contact with name only',
        query: 'Add a new contact named John Doe',
        args: { first_name: 'John', last_name: 'Doe' },
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['created successfully'] },
        cleanup: { tool: 'delete_contact', getIdFromResult: (r) => r.structuredContent?.contacts?.[0]?.id || null }
    },
    {
        id: generateTestId('contact'),
        category: 'Contacts',
        tool: 'create_contact',
        name: 'Create contact - With email',
        description: 'Create contact with email address',
        query: 'Create contact Jane Smith with email jane@example.com',
        args: { first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' },
        expectedResult: { hasContent: true, hasStructuredContent: true },
        cleanup: { tool: 'delete_contact', getIdFromResult: (r) => r.structuredContent?.contacts?.[0]?.id || null }
    },
    {
        id: generateTestId('contact'),
        category: 'Contacts',
        tool: 'create_contact',
        name: 'Create contact - Full details',
        description: 'Create contact with all information',
        query: 'Add Bob Johnson as a contact, he is VP of Sales at {account_id}, email is bob@company.com, phone 555-1234',
        args: {
            first_name: 'Bob',
            last_name: 'Johnson',
            account_id: '{account_id}',
            email: 'bob@company.com',
            phone: '555-1234',
            role: 'VP of Sales'
        },
        expectedResult: { hasContent: true, hasStructuredContent: true },
        cleanup: { tool: 'delete_contact', getIdFromResult: (r) => r.structuredContent?.contacts?.[0]?.id || null }
    },
    {
        id: generateTestId('contact'),
        category: 'Contacts',
        tool: 'list_contacts',
        name: 'List all contacts',
        description: 'Get all contacts',
        query: 'Show me all contacts',
        args: {},
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['Found'] }
    },
    {
        id: generateTestId('contact'),
        category: 'Contacts',
        tool: 'list_contacts',
        name: 'List contacts - By account',
        description: 'Get contacts for a specific account',
        query: 'Show me all contacts for account {account_id}',
        args: { account_id: '{account_id}' },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('contact'),
        category: 'Contacts',
        tool: 'get_contact',
        name: 'Get contact by ID',
        description: 'Retrieve specific contact details',
        query: 'Get contact {contact_id}',
        args: { id: '{contact_id}' },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('contact'),
        category: 'Contacts',
        tool: 'update_contact',
        name: 'Update contact - Email',
        description: 'Update contact email address',
        query: 'Update contact {contact_id} email to newemail@example.com',
        args: { id: '{contact_id}', email: 'newemail@example.com' },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('contact'),
        category: 'Contacts',
        tool: 'update_contact',
        name: 'Update contact - Role',
        description: 'Update contact job title',
        query: 'Change contact {contact_id} role to Chief Executive Officer',
        args: { id: '{contact_id}', role: 'Chief Executive Officer' },
        expectedResult: { hasContent: true }
    },
    {
        id: generateTestId('contact'),
        category: 'Contacts',
        tool: 'update_contact',
        name: 'Update contact - Phone',
        description: 'Update contact phone number',
        query: 'Update phone number for contact {contact_id} to 555-9999',
        args: { id: '{contact_id}', phone: '555-9999' },
        expectedResult: { hasContent: true }
    },
    {
        id: generateTestId('contact'),
        category: 'Contacts',
        tool: 'delete_contact',
        name: 'Delete contact',
        description: 'Remove a contact',
        query: 'Delete contact {contact_id}',
        args: { id: '{contact_id}' },
        expectedResult: { hasContent: true, containsText: ['deleted successfully'] }
    },

    // ========================================
    // DEAL TESTS (7 tools)
    // ========================================

    {
        id: generateTestId('deal'),
        category: 'Deals',
        tool: 'create_deal',
        name: 'Create deal - Basic',
        description: 'Create a new deal with name and stage',
        query: 'Create a new deal called "Enterprise License Deal" in the Discovery stage',
        args: { name: 'Enterprise License Deal', stage: 'Discovery' },
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['created successfully'] },
        cleanup: { tool: 'delete_deal', getIdFromResult: (r) => r.structuredContent?.deals?.[0]?.id || null }
    },
    {
        id: generateTestId('deal'),
        category: 'Deals',
        tool: 'create_deal',
        name: 'Create deal - With amount',
        description: 'Create deal with monetary value',
        query: 'Add a new deal for $50000 called "Annual Contract"',
        args: { name: 'Annual Contract', stage: 'Proposal', amount: 50000 },
        expectedResult: { hasContent: true, hasStructuredContent: true },
        cleanup: { tool: 'delete_deal', getIdFromResult: (r) => r.structuredContent?.deals?.[0]?.id || null }
    },
    {
        id: generateTestId('deal'),
        category: 'Deals',
        tool: 'create_deal',
        name: 'Create deal - Full details',
        description: 'Create deal with all fields',
        query: 'Create a deal named "Q1 Enterprise Deal" for account {account_id}, value $250000, stage Proposal, closing date 2025-03-31',
        args: {
            name: 'Q1 Enterprise Deal',
            account_id: '{account_id}',
            stage: 'Proposal',
            amount: 250000,
            close_date: '2025-03-31',
            status: 'open'
        },
        expectedResult: { hasContent: true, hasStructuredContent: true },
        cleanup: { tool: 'delete_deal', getIdFromResult: (r) => r.structuredContent?.deals?.[0]?.id || null }
    },
    {
        id: generateTestId('deal'),
        category: 'Deals',
        tool: 'list_deals',
        name: 'List all deals',
        description: 'Get all deals',
        query: 'Show me all the deals',
        args: {},
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['Found'] }
    },
    {
        id: generateTestId('deal'),
        category: 'Deals',
        tool: 'list_deals',
        name: 'List deals - Open only',
        description: 'Filter deals by status',
        query: 'Show me all open deals',
        args: { status: 'open' },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('deal'),
        category: 'Deals',
        tool: 'list_deals',
        name: 'List deals - By account',
        description: 'Get deals for specific account',
        query: 'Show me deals for account {account_id}',
        args: { account_id: '{account_id}' },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('deal'),
        category: 'Deals',
        tool: 'list_deals',
        name: 'List deals - By stage',
        description: 'Filter deals by pipeline stage',
        query: 'Show me all deals in the Proposal stage',
        args: { stage: 'Proposal' },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('deal'),
        category: 'Deals',
        tool: 'list_deals',
        name: 'List deals - Won',
        description: 'Get all won deals',
        query: 'Show me all deals we won',
        args: { status: 'won' },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('deal'),
        category: 'Deals',
        tool: 'get_deal',
        name: 'Get deal by ID',
        description: 'Retrieve specific deal',
        query: 'Get deal {deal_id}',
        args: { id: '{deal_id}' },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('deal'),
        category: 'Deals',
        tool: 'update_deal',
        name: 'Update deal - Amount',
        description: 'Update deal value',
        query: 'Update deal {deal_id} amount to $75000',
        args: { id: '{deal_id}', amount: 75000 },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('deal'),
        category: 'Deals',
        tool: 'update_deal',
        name: 'Update deal - Close date',
        description: 'Change expected close date',
        query: 'Change close date for deal {deal_id} to 2025-06-30',
        args: { id: '{deal_id}', close_date: '2025-06-30' },
        expectedResult: { hasContent: true }
    },
    {
        id: generateTestId('deal'),
        category: 'Deals',
        tool: 'move_deal_stage',
        name: 'Move deal to new stage',
        description: 'Advance deal to next pipeline stage',
        query: 'Move deal {deal_id} to the Closed stage',
        args: { id: '{deal_id}', stage: 'Closed' },
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['moved to stage'] }
    },
    {
        id: generateTestId('deal'),
        category: 'Deals',
        tool: 'close_deal',
        name: 'Close deal - Won',
        description: 'Mark deal as won',
        query: 'Mark deal {deal_id} as won',
        args: { id: '{deal_id}', status: 'won' },
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['closed as won'] }
    },
    {
        id: generateTestId('deal'),
        category: 'Deals',
        tool: 'close_deal',
        name: 'Close deal - Lost',
        description: 'Mark deal as lost',
        query: 'Close deal {deal_id} as lost',
        args: { id: '{deal_id}', status: 'lost' },
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['closed as lost'] }
    },
    {
        id: generateTestId('deal'),
        category: 'Deals',
        tool: 'delete_deal',
        name: 'Delete deal',
        description: 'Remove a deal',
        query: 'Delete deal {deal_id}',
        args: { id: '{deal_id}' },
        expectedResult: { hasContent: true, containsText: ['deleted successfully'] }
    },

    // ========================================
    // PIPELINE TESTS (5 tools)
    // ========================================

    {
        id: generateTestId('pipeline'),
        category: 'Pipelines',
        tool: 'create_pipeline',
        name: 'Create pipeline - Basic',
        description: 'Create a new sales pipeline',
        query: 'Create a new pipeline called "Enterprise Sales"',
        args: {
            name: 'Enterprise Sales',
            stages: ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed']
        },
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['created successfully'] },
        cleanup: { tool: 'delete_pipeline', getIdFromResult: (r) => r.structuredContent?.pipelines?.[0]?.id || null }
    },
    {
        id: generateTestId('pipeline'),
        category: 'Pipelines',
        tool: 'create_pipeline',
        name: 'Create pipeline - Custom stages',
        description: 'Create pipeline with custom stage names',
        query: 'Create a pipeline named "SMB Pipeline" with stages Lead, Demo, Quote, Close',
        args: {
            name: 'SMB Pipeline',
            stages: ['Lead', 'Demo', 'Quote', 'Close']
        },
        expectedResult: { hasContent: true, hasStructuredContent: true },
        cleanup: { tool: 'delete_pipeline', getIdFromResult: (r) => r.structuredContent?.pipelines?.[0]?.id || null }
    },
    {
        id: generateTestId('pipeline'),
        category: 'Pipelines',
        tool: 'list_pipelines',
        name: 'List all pipelines',
        description: 'Get all pipelines',
        query: 'Show me all pipelines',
        args: {},
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['Found'] }
    },
    {
        id: generateTestId('pipeline'),
        category: 'Pipelines',
        tool: 'get_pipeline',
        name: 'Get pipeline by ID',
        description: 'Retrieve specific pipeline',
        query: 'Get pipeline {pipeline_id}',
        args: { id: '{pipeline_id}' },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('pipeline'),
        category: 'Pipelines',
        tool: 'update_pipeline',
        name: 'Update pipeline - Add stage',
        description: 'Add a new stage to pipeline',
        query: 'Add a stage called "Contract Review" to pipeline {pipeline_id}',
        args: {
            id: '{pipeline_id}',
            stages: ['Lead', 'Qualified', 'Proposal', 'Contract Review', 'Negotiation', 'Closed']
        },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('pipeline'),
        category: 'Pipelines',
        tool: 'update_pipeline',
        name: 'Update pipeline - Rename',
        description: 'Change pipeline name',
        query: 'Rename pipeline {pipeline_id} to "Updated Pipeline Name"',
        args: { id: '{pipeline_id}', name: 'Updated Pipeline Name' },
        expectedResult: { hasContent: true }
    },
    {
        id: generateTestId('pipeline'),
        category: 'Pipelines',
        tool: 'delete_pipeline',
        name: 'Delete pipeline',
        description: 'Remove a pipeline',
        query: 'Delete pipeline {pipeline_id}',
        args: { id: '{pipeline_id}' },
        expectedResult: { hasContent: true, containsText: ['deleted successfully'] }
    },

    // ========================================
    // INTERACTION TESTS (5 tools)
    // ========================================

    {
        id: generateTestId('interaction'),
        category: 'Interactions',
        tool: 'create_interaction',
        name: 'Create interaction - Call',
        description: 'Log a phone call',
        query: 'Log a call with contact {contact_id}, summary was "Discussed pricing and timeline"',
        args: {
            type: 'call',
            contact_id: '{contact_id}',
            summary: 'Discussed pricing and timeline'
        },
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['created successfully'] },
        cleanup: { tool: 'delete_interaction', getIdFromResult: (r) => r.structuredContent?.interactions?.[0]?.id || null }
    },
    {
        id: generateTestId('interaction'),
        category: 'Interactions',
        tool: 'create_interaction',
        name: 'Create interaction - Meeting',
        description: 'Log a meeting',
        query: 'Log a meeting with contact {contact_id} about deal {deal_id}, discussed product demo',
        args: {
            type: 'meeting',
            contact_id: '{contact_id}',
            deal_id: '{deal_id}',
            summary: 'Product demo discussion'
        },
        expectedResult: { hasContent: true, hasStructuredContent: true },
        cleanup: { tool: 'delete_interaction', getIdFromResult: (r) => r.structuredContent?.interactions?.[0]?.id || null }
    },
    {
        id: generateTestId('interaction'),
        category: 'Interactions',
        tool: 'create_interaction',
        name: 'Create interaction - Email',
        description: 'Log an email',
        query: 'Log an email to contact {contact_id} with summary "Sent proposal document"',
        args: {
            type: 'email',
            contact_id: '{contact_id}',
            summary: 'Sent proposal document'
        },
        expectedResult: { hasContent: true, hasStructuredContent: true },
        cleanup: { tool: 'delete_interaction', getIdFromResult: (r) => r.structuredContent?.interactions?.[0]?.id || null }
    },
    {
        id: generateTestId('interaction'),
        category: 'Interactions',
        tool: 'create_interaction',
        name: 'Create interaction - Note',
        description: 'Add a note',
        query: 'Add a note for deal {deal_id}: "Customer requested custom integration"',
        args: {
            type: 'note',
            deal_id: '{deal_id}',
            summary: 'Customer requested custom integration'
        },
        expectedResult: { hasContent: true, hasStructuredContent: true },
        cleanup: { tool: 'delete_interaction', getIdFromResult: (r) => r.structuredContent?.interactions?.[0]?.id || null }
    },
    {
        id: generateTestId('interaction'),
        category: 'Interactions',
        tool: 'create_interaction',
        name: 'Create interaction - With sentiment',
        description: 'Log interaction with sentiment analysis',
        query: 'Log a call with contact {contact_id}, sentiment was positive, discussed renewal',
        args: {
            type: 'call',
            contact_id: '{contact_id}',
            summary: 'Discussed renewal',
            sentiment: 'positive'
        },
        expectedResult: { hasContent: true, hasStructuredContent: true },
        cleanup: { tool: 'delete_interaction', getIdFromResult: (r) => r.structuredContent?.interactions?.[0]?.id || null }
    },
    {
        id: generateTestId('interaction'),
        category: 'Interactions',
        tool: 'list_interactions',
        name: 'List all interactions',
        description: 'Get all interactions',
        query: 'Show me all interactions',
        args: {},
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['Found'] }
    },
    {
        id: generateTestId('interaction'),
        category: 'Interactions',
        tool: 'list_interactions',
        name: 'List interactions - By contact',
        description: 'Get interactions for a contact',
        query: 'Show me all interactions with contact {contact_id}',
        args: { contact_id: '{contact_id}' },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('interaction'),
        category: 'Interactions',
        tool: 'list_interactions',
        name: 'List interactions - By deal',
        description: 'Get interactions for a deal',
        query: 'Show me all interactions for deal {deal_id}',
        args: { deal_id: '{deal_id}' },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('interaction'),
        category: 'Interactions',
        tool: 'list_interactions',
        name: 'List interactions - By type',
        description: 'Filter interactions by type',
        query: 'Show me all calls',
        args: { type: 'call' },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('interaction'),
        category: 'Interactions',
        tool: 'get_interaction',
        name: 'Get interaction by ID',
        description: 'Retrieve specific interaction',
        query: 'Get interaction {interaction_id}',
        args: { id: '{interaction_id}' },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('interaction'),
        category: 'Interactions',
        tool: 'update_interaction',
        name: 'Update interaction - Summary',
        description: 'Update interaction summary',
        query: 'Update interaction {interaction_id} summary to "Updated discussion notes"',
        args: { id: '{interaction_id}', summary: 'Updated discussion notes' },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('interaction'),
        category: 'Interactions',
        tool: 'update_interaction',
        name: 'Update interaction - Sentiment',
        description: 'Update sentiment analysis',
        query: 'Update interaction {interaction_id} sentiment to negative',
        args: { id: '{interaction_id}', sentiment: 'negative' },
        expectedResult: { hasContent: true }
    },
    {
        id: generateTestId('interaction'),
        category: 'Interactions',
        tool: 'delete_interaction',
        name: 'Delete interaction',
        description: 'Remove an interaction',
        query: 'Delete interaction {interaction_id}',
        args: { id: '{interaction_id}' },
        expectedResult: { hasContent: true, containsText: ['deleted successfully'] }
    },

    // ========================================
    // SEARCH TESTS (3 tools)
    // ========================================

    {
        id: generateTestId('search'),
        category: 'Search',
        tool: 'search_crm',
        name: 'Search CRM - Company name',
        description: 'Search for a company',
        query: 'Search for anything related to "Acme"',
        args: { query: 'Acme' },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('search'),
        category: 'Search',
        tool: 'search_crm',
        name: 'Search CRM - Contact name',
        description: 'Search for a person',
        query: 'Find everything about "John Doe"',
        args: { query: 'John Doe' },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('search'),
        category: 'Search',
        tool: 'search_crm',
        name: 'Search CRM - Email',
        description: 'Search by email address',
        query: 'Search for "john@example.com"',
        args: { query: 'john@example.com' },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('search'),
        category: 'Search',
        tool: 'search_crm',
        name: 'Search CRM - Industry',
        description: 'Search by industry keyword',
        query: 'Find all technology companies',
        args: { query: 'technology' },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('search'),
        category: 'Search',
        tool: 'get_account_summary',
        name: 'Get account summary',
        description: 'Get comprehensive account overview',
        query: 'Show me everything about account {account_id}',
        args: { id: '{account_id}' },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('search'),
        category: 'Search',
        tool: 'get_deal_pipeline_view',
        name: 'Get pipeline view - All',
        description: 'View all deals by stage',
        query: 'Show me the pipeline view',
        args: {},
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('search'),
        category: 'Search',
        tool: 'get_deal_pipeline_view',
        name: 'Get pipeline view - By pipeline',
        description: 'View deals for specific pipeline',
        query: 'Show me pipeline view for pipeline {pipeline_id}',
        args: { pipeline_id: '{pipeline_id}' },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('search'),
        category: 'Search',
        tool: 'search_crm',
        name: 'Search CRM - With tag filter',
        description: 'Search entities filtered by tags',
        query: 'Find all contacts with tag VIP',
        args: { query: '', tags_filter: ['VIP'] },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('search'),
        category: 'Search',
        tool: 'search_crm',
        name: 'Search CRM - Query and tags',
        description: 'Search with both query and tag filter',
        query: 'Find Acme companies tagged Enterprise',
        args: { query: 'Acme', tags_filter: ['Enterprise'] },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },

    // ========================================
    // TAG TESTS (Integration with entities)
    // ========================================
    
    {
        id: generateTestId('tag'),
        category: 'Tags',
        tool: 'create_account',
        name: 'Create account - With tags',
        description: 'Create account and verify tags are stored',
        query: 'Create account "Tagged Corp" with tags VIP and Enterprise',
        args: { 
            name: 'Tagged Corp',
            tags: ['VIP', 'Enterprise']
        },
        expectedResult: { hasContent: true, hasStructuredContent: true },
        cleanup: { tool: 'delete_account', getIdFromResult: (r) => r.structuredContent?.accounts?.[0]?.id || null }
    },
    {
        id: generateTestId('tag'),
        category: 'Tags',
        tool: 'create_contact',
        name: 'Create contact - With tags',
        description: 'Create contact with tags',
        query: 'Add contact John Tagged with tags Important and Follow-up',
        args: { 
            first_name: 'John',
            last_name: 'Tagged',
            tags: ['Important', 'Follow-up']
        },
        expectedResult: { hasContent: true, hasStructuredContent: true },
        cleanup: { tool: 'delete_contact', getIdFromResult: (r) => r.structuredContent?.contacts?.[0]?.id || null }
    },
    {
        id: generateTestId('tag'),
        category: 'Tags',
        tool: 'create_deal',
        name: 'Create deal - With tags',
        description: 'Create deal with tags',
        query: 'Create deal "Tagged Deal" with tags Priority and Hot',
        args: { 
            name: 'Tagged Deal',
            stage: 'Discovery',
            tags: ['Priority', 'Hot']
        },
        expectedResult: { hasContent: true, hasStructuredContent: true },
        cleanup: { tool: 'delete_deal', getIdFromResult: (r) => r.structuredContent?.deals?.[0]?.id || null }
    },
    {
        id: generateTestId('tag'),
        category: 'Tags',
        tool: 'update_account',
        name: 'Update account - Add tags',
        description: 'Add tags to existing account',
        query: 'Add tags VIP and Enterprise to account {account_id}',
        args: { 
            id: '{account_id}',
            tags: ['VIP', 'Enterprise']
        },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('tag'),
        category: 'Tags',
        tool: 'update_contact',
        name: 'Update contact - Modify tags',
        description: 'Update contact tags',
        query: 'Update contact {contact_id} tags to Important and Follow-up',
        args: { 
            id: '{contact_id}',
            tags: ['Important', 'Follow-up']
        },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('tag'),
        category: 'Tags',
        tool: 'list_contacts',
        name: 'List contacts - Filter by tag',
        description: 'List contacts that have specific tags',
        query: 'Show me all contacts with tag VIP',
        args: { tags: ['VIP'] },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },

    // ========================================
    // CHART TESTS (Analyst API)
    // ========================================
    
    {
        id: generateTestId('chart'),
        category: 'Charts',
        tool: 'analyst_api',
        name: 'Chart - Bar chart (Deals by stage)',
        description: 'Generate bar chart for deals grouped by stage',
        query: 'Show me deals by stage',
        args: { query: 'Show me deals by stage' },
        expectedResult: { hasContent: true, hasStructuredContent: false, containsText: ['chart'] }
    },
    {
        id: generateTestId('chart'),
        category: 'Charts',
        tool: 'analyst_api',
        name: 'Chart - Revenue by stage',
        description: 'Generate bar chart showing revenue grouped by stage',
        query: 'Show me revenue by stage',
        args: { query: 'Show me revenue by stage' },
        expectedResult: { hasContent: true, hasStructuredContent: false }
    },
    {
        id: generateTestId('chart'),
        category: 'Charts',
        tool: 'analyst_api',
        name: 'Chart - Line chart (Revenue over time)',
        description: 'Generate line chart for revenue trends',
        query: 'Chart revenue over time',
        args: { query: 'Chart revenue over time' },
        expectedResult: { hasContent: true, hasStructuredContent: false }
    },
    {
        id: generateTestId('chart'),
        category: 'Charts',
        tool: 'analyst_api',
        name: 'Chart - Pie chart (Deal status)',
        description: 'Generate pie chart for deal status distribution',
        query: 'Show deal status distribution',
        args: { query: 'Show deal status distribution' },
        expectedResult: { hasContent: true, hasStructuredContent: false }
    },
    {
        id: generateTestId('chart'),
        category: 'Charts',
        tool: 'analyst_api',
        name: 'Chart - Count contacts by account',
        description: 'Generate bar chart counting contacts per account',
        query: 'How many contacts per account?',
        args: { query: 'How many contacts per account?' },
        expectedResult: { hasContent: true, hasStructuredContent: false }
    },
    {
        id: generateTestId('chart'),
        category: 'Charts',
        tool: 'analyst_api',
        name: 'Chart - Total revenue',
        description: 'Generate number/table showing total revenue',
        query: 'What is the total revenue?',
        args: { query: 'What is the total revenue?' },
        expectedResult: { hasContent: true, hasStructuredContent: false }
    },
    {
        id: generateTestId('chart'),
        category: 'Charts',
        tool: 'analyst_api',
        name: 'Chart - Top deals',
        description: 'Generate table showing top deals',
        query: 'Show me the top 10 deals',
        args: { query: 'Show me the top 10 deals' },
        expectedResult: { hasContent: true, hasStructuredContent: false }
    },
    {
        id: generateTestId('chart'),
        category: 'Charts',
        tool: 'analyst_api',
        name: 'Chart - Average deal value',
        description: 'Calculate and display average deal value',
        query: 'What is the average deal value?',
        args: { query: 'What is the average deal value?' },
        expectedResult: { hasContent: true, hasStructuredContent: false }
    },
    {
        id: generateTestId('chart'),
        category: 'Charts',
        tool: 'analyst_api',
        name: 'Chart - Deals this month',
        description: 'Generate chart for deals created this month',
        query: 'Show me deals created this month',
        args: { query: 'Show me deals created this month' },
        expectedResult: { hasContent: true, hasStructuredContent: false }
    },
    {
        id: generateTestId('chart'),
        category: 'Charts',
        tool: 'analyst_api',
        name: 'Chart - Contacts by industry',
        description: 'Generate chart showing contacts grouped by account industry',
        query: 'Show me contacts by industry',
        args: { query: 'Show me contacts by industry' },
        expectedResult: { hasContent: true, hasStructuredContent: false }
    },

    // ========================================
    // DEDUPLICATION TESTS
    // ========================================
    
    {
        id: generateTestId('dedup'),
        category: 'Deduplication',
        tool: 'create_contact',
        name: 'Duplicate Contact - Email Match',
        description: 'Attempt to create contact with duplicate email (should be blocked)',
        query: 'Create contact John Doe with email john@example.com',
        args: { 
            first_name: 'John', 
            last_name: 'Doe', 
            email: 'john@example.com' 
        },
        expectedResult: { hasContent: true, containsText: ['duplicate', 'Duplicate'] },
        // Note: This test expects the first contact to be created, then the duplicate to be blocked
        setup: async (mcpUrl: string) => {
            // Create initial contact first
            const { callTool } = await import('@/lib/mcp-client');
            const result = await callTool('create_contact', {
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com'
            }, mcpUrl);
            return result?.structuredContent?.contacts?.[0]?.id || null;
        },
        cleanup: { tool: 'delete_contact', getIdFromResult: (r) => r.structuredContent?.contacts?.[0]?.id || null }
    },
    {
        id: generateTestId('dedup'),
        category: 'Deduplication',
        tool: 'create_contact',
        name: 'Duplicate Contact - Phone Match',
        description: 'Attempt to create contact with duplicate phone (should be blocked)',
        query: 'Create contact Jane Smith with phone (555) 123-4567',
        args: { 
            first_name: 'Jane', 
            last_name: 'Smith', 
            phone: '(555) 123-4567' 
        },
        expectedResult: { hasContent: true, containsText: ['duplicate', 'Duplicate'] },
        setup: async (mcpUrl: string) => {
            const { callTool } = await import('@/lib/mcp-client');
            const result = await callTool('create_contact', {
                first_name: 'Jane',
                last_name: 'Smith',
                phone: '(555) 123-4567'
            }, mcpUrl);
            return result?.structuredContent?.contacts?.[0]?.id || null;
        },
        cleanup: { tool: 'delete_contact', getIdFromResult: (r) => r.structuredContent?.contacts?.[0]?.id || null }
    },
    {
        id: generateTestId('dedup'),
        category: 'Deduplication',
        tool: 'create_contact',
        name: 'Duplicate Contact - Name + Account',
        description: 'Attempt to create contact with same name and account (should warn)',
        query: 'Create contact Bob Johnson for account {account_id}',
        args: { 
            first_name: 'Bob', 
            last_name: 'Johnson', 
            account_id: '{account_id}' 
        },
        expectedResult: { hasContent: true },
        cleanup: { tool: 'delete_contact', getIdFromResult: (r) => r.structuredContent?.contacts?.[0]?.id || null }
    },
    {
        id: generateTestId('dedup'),
        category: 'Deduplication',
        tool: 'create_deal',
        name: 'Duplicate Deal - Name + Account',
        description: 'Attempt to create deal with duplicate name and account (should be blocked)',
        query: 'Create deal "Enterprise License" for account {account_id}',
        args: { 
            name: 'Enterprise License',
            account_id: '{account_id}',
            stage: 'Discovery'
        },
        expectedResult: { hasContent: true, containsText: ['duplicate', 'Duplicate'] },
        setup: async (mcpUrl: string) => {
            const { callTool } = await import('@/lib/mcp-client');
            // First ensure we have an account
            const accountResult = await callTool('create_account', { name: 'Test Account for Dedup - ' + Date.now() }, mcpUrl);
            const accountId = accountResult?.structuredContent?.accounts?.[0]?.id;
            if (!accountId) return null;
            
            // Create initial deal with the same name and account (this is the duplicate)
            const dealResult = await callTool('create_deal', {
                name: 'Enterprise License',
                account_id: accountId,
                stage: 'Discovery'
            }, mcpUrl);
            
            // Return accountId as a special marker so test runner knows to store it as account_id
            // Format: "account_id:<actual_id>" so test runner can parse it
            return `account_id:${accountId}`;
        },
        cleanup: { tool: 'delete_deal', getIdFromResult: (r) => r.structuredContent?.deals?.[0]?.id || null }
    },
    {
        id: generateTestId('dedup'),
        category: 'Deduplication',
        tool: 'create_deal',
        name: 'Duplicate Deal - Name Only',
        description: 'Attempt to create deal with duplicate name (should warn)',
        query: 'Create deal "Test Deal"',
        args: { 
            name: 'Test Deal',
            stage: 'Lead'
        },
        expectedResult: { hasContent: true },
        cleanup: { tool: 'delete_deal', getIdFromResult: (r) => r.structuredContent?.deals?.[0]?.id || null }
    },
    {
        id: generateTestId('dedup'),
        category: 'Deduplication',
        tool: 'create_contact',
        name: 'No Duplicate - Unique Contact',
        description: 'Create contact with unique email (should succeed)',
        query: 'Create contact Unique Person with email unique-{timestamp}@example.com',
        args: { 
            first_name: 'Unique', 
            last_name: 'Person', 
            email: 'unique-{timestamp}@example.com' 
        },
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['created successfully'] },
        cleanup: { tool: 'delete_contact', getIdFromResult: (r) => r.structuredContent?.contacts?.[0]?.id || null }
    },
    {
        id: generateTestId('dedup'),
        category: 'Deduplication',
        tool: 'create_deal',
        name: 'No Duplicate - Unique Deal',
        description: 'Create deal with unique name (should succeed)',
        query: 'Create deal "Unique Deal Name {timestamp}"',
        args: { 
            name: 'Unique Deal Name {timestamp}',
            stage: 'Discovery'
        },
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['created successfully'] },
        cleanup: { tool: 'delete_deal', getIdFromResult: (r) => r.structuredContent?.deals?.[0]?.id || null }
    },

    // ========================================
    // TEAM ASSIGNMENT TESTS (Phases 2-3)
    // ========================================

    // Deal Assignment Tests
    {
        id: generateTestId('team'),
        category: 'Team Assignment',
        tool: 'create_deal',
        name: 'Create deal with assigned_to',
        description: 'Create a deal assigned to a team member',
        query: 'Create deal "Assigned Deal {timestamp}" and assign it to {team_member_id}',
        args: { 
            name: 'Assigned Deal {timestamp}',
            stage: 'Discovery',
            assigned_to: '{team_member_id}'
        },
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['created successfully'] },
        cleanup: { tool: 'delete_deal', getIdFromResult: (r) => r.structuredContent?.deals?.[0]?.id || null }
    },
    {
        id: generateTestId('team'),
        category: 'Team Assignment',
        tool: 'update_deal',
        name: 'Update deal assigned_to',
        description: 'Change deal assignment to different team member',
        query: 'Reassign deal {deal_id} to {team_member_id}',
        args: { 
            id: '{deal_id}',
            assigned_to: '{team_member_id}'
        },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('team'),
        category: 'Team Assignment',
        tool: 'list_deals',
        name: 'List deals by assigned_to',
        description: 'Filter deals by team member assignment',
        query: 'Show me all deals assigned to {team_member_id}',
        args: { 
            assigned_to: '{team_member_id}'
        },
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['Found'] }
    },

    // Contact Assignment Tests
    {
        id: generateTestId('team'),
        category: 'Team Assignment',
        tool: 'create_contact',
        name: 'Create contact with assigned_to',
        description: 'Create a contact assigned to a team member',
        query: 'Create contact "Assigned {timestamp}" and assign to {team_member_id}',
        args: { 
            first_name: 'Assigned',
            last_name: '{timestamp}',
            assigned_to: '{team_member_id}'
        },
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['created successfully'] },
        cleanup: { tool: 'delete_contact', getIdFromResult: (r) => r.structuredContent?.contacts?.[0]?.id || null }
    },
    {
        id: generateTestId('team'),
        category: 'Team Assignment',
        tool: 'update_contact',
        name: 'Update contact assigned_to',
        description: 'Change contact assignment to different team member',
        query: 'Reassign contact {contact_id} to {team_member_id}',
        args: { 
            id: '{contact_id}',
            assigned_to: '{team_member_id}'
        },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('team'),
        category: 'Team Assignment',
        tool: 'list_contacts',
        name: 'List contacts by assigned_to',
        description: 'Filter contacts by team member assignment',
        query: 'Show me all contacts assigned to {team_member_id}',
        args: { 
            assigned_to: '{team_member_id}'
        },
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['Found'] }
    },

    // Account Assignment Tests
    {
        id: generateTestId('team'),
        category: 'Team Assignment',
        tool: 'create_account',
        name: 'Create account with assigned_to',
        description: 'Create an account assigned to a team member',
        query: 'Create account "Assigned Corp {timestamp}" and assign to {team_member_id}',
        args: { 
            name: 'Assigned Corp {timestamp}',
            assigned_to: '{team_member_id}'
        },
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['created successfully'] },
        cleanup: { tool: 'delete_account', getIdFromResult: (r) => r.structuredContent?.accounts?.[0]?.id || null }
    },
    {
        id: generateTestId('team'),
        category: 'Team Assignment',
        tool: 'update_account',
        name: 'Update account assigned_to',
        description: 'Change account assignment to different team member',
        query: 'Reassign account {account_id} to {team_member_id}',
        args: { 
            id: '{account_id}',
            assigned_to: '{team_member_id}'
        },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('team'),
        category: 'Team Assignment',
        tool: 'list_accounts',
        name: 'List accounts by assigned_to',
        description: 'Filter accounts by team member assignment',
        query: 'Show me all accounts assigned to {team_member_id}',
        args: { 
            assigned_to: '{team_member_id}'
        },
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['Found'] }
    },

    // Interaction/Task Assignment Tests
    {
        id: generateTestId('team'),
        category: 'Team Assignment',
        tool: 'create_interaction',
        name: 'Create interaction with assigned_to',
        description: 'Create an interaction/task assigned to a team member',
        query: 'Create a call task assigned to {team_member_id}',
        args: { 
            type: 'call',
            summary: 'Assigned task {timestamp}',
            assigned_to: '{team_member_id}'
        },
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['created successfully'] },
        cleanup: { tool: 'delete_interaction', getIdFromResult: (r) => r.structuredContent?.interactions?.[0]?.id || null }
    },
    {
        id: generateTestId('team'),
        category: 'Team Assignment',
        tool: 'update_interaction',
        name: 'Update interaction assigned_to',
        description: 'Change task assignment to different team member',
        query: 'Reassign task {interaction_id} to {team_member_id}',
        args: { 
            id: '{interaction_id}',
            assigned_to: '{team_member_id}'
        },
        expectedResult: { hasContent: true, hasStructuredContent: true }
    },
    {
        id: generateTestId('team'),
        category: 'Team Assignment',
        tool: 'list_interactions',
        name: 'List interactions by assigned_to',
        description: 'Filter tasks/interactions by team member assignment',
        query: 'Show me all tasks assigned to {team_member_id}',
        args: { 
            assigned_to: '{team_member_id}'
        },
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['Found'] }
    },

    // Unassigned/All Items Tests
    {
        id: generateTestId('team'),
        category: 'Team Assignment',
        tool: 'list_deals',
        name: 'List all deals (no filter)',
        description: 'List all deals without assignment filter',
        query: 'Show me all deals',
        args: {},
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['Found'] }
    },
    {
        id: generateTestId('team'),
        category: 'Team Assignment',
        tool: 'list_contacts',
        name: 'List all contacts (no filter)',
        description: 'List all contacts without assignment filter',
        query: 'Show me all contacts',
        args: {},
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['Found'] }
    },
    {
        id: generateTestId('team'),
        category: 'Team Assignment',
        tool: 'list_accounts',
        name: 'List all accounts (no filter)',
        description: 'List all accounts without assignment filter',
        query: 'Show me all accounts',
        args: {},
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['Found'] }
    },
    {
        id: generateTestId('team'),
        category: 'Team Assignment',
        tool: 'list_interactions',
        name: 'List all tasks (no filter)',
        description: 'List all tasks without assignment filter',
        query: 'Show me all tasks',
        args: {},
        expectedResult: { hasContent: true, hasStructuredContent: true, containsText: ['Found'] }
    },
];

// Group tests by category
export const TESTS_BY_CATEGORY: Record<string, MCPTest[]> = {
    'Accounts': MCP_TESTS.filter(t => t.category === 'Accounts'),
    'Contacts': MCP_TESTS.filter(t => t.category === 'Contacts'),
    'Deals': MCP_TESTS.filter(t => t.category === 'Deals'),
    'Pipelines': MCP_TESTS.filter(t => t.category === 'Pipelines'),
    'Interactions': MCP_TESTS.filter(t => t.category === 'Interactions'),
    'Search': MCP_TESTS.filter(t => t.category === 'Search'),
    'Tags': MCP_TESTS.filter(t => t.category === 'Tags'),
    'Charts': MCP_TESTS.filter(t => t.category === 'Charts'),
    'Deduplication': MCP_TESTS.filter(t => t.category === 'Deduplication'),
    'Team Assignment': MCP_TESTS.filter(t => t.category === 'Team Assignment'),
};

// Get all unique tool names
export const ALL_TOOLS = Array.from(new Set(MCP_TESTS.map(t => t.tool)));

// Get all unique categories
export const ALL_CATEGORIES = Array.from(new Set(MCP_TESTS.map(t => t.category)));



