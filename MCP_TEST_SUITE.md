# MCP Server Test Suite

## Overview

A comprehensive test suite for all 30 MCP server tools with typical salesperson queries. This test suite ensures every entity and operation is thoroughly tested.

## Test Coverage

### Total Tests: 69 comprehensive test cases

#### Accounts (10 tests)
- Create account (basic, with industry, full details)
- List accounts (all, filtered by industry)
- Get account by ID
- Update account (name, industry, website)
- Delete account

#### Contacts (10 tests)
- Create contact (basic, with email, full details)
- List contacts (all, by account)
- Get contact by ID
- Update contact (email, role, phone)
- Delete contact

#### Deals (15 tests)
- Create deal (basic, with amount, full details)
- List deals (all, open only, by account, by stage, won)
- Get deal by ID
- Update deal (amount, close date)
- Move deal to new stage
- Close deal (won, lost)
- Delete deal

#### Pipelines (7 tests)
- Create pipeline (basic, custom stages)
- List all pipelines
- Get pipeline by ID
- Update pipeline (add stage, rename)
- Delete pipeline

#### Interactions (13 tests)
- Create interaction (call, meeting, email, note, with sentiment)
- List interactions (all, by contact, by deal, by type)
- Get interaction by ID
- Update interaction (summary, sentiment)
- Delete interaction

#### Search (7 tests)
- Search CRM (company name, contact name, email, industry)
- Get account summary
- Get pipeline view (all, by pipeline)

## Features

### Test Page UI
- **Location**: `/admin/test`
- **Access**: Available in sidebar navigation under "MCP Tests"
- **Features**:
  - Run all tests or filter by category/tool
  - Real-time test execution with status indicators
  - Detailed results showing query, arguments, response, and duration
  - Error handling and validation
  - Statistics dashboard showing passed/failed/running/pending counts

### Test Execution
- Tests run sequentially to avoid conflicts
- Automatic ID resolution for dependent tests (using placeholders like `{account_id}`)
- Cleanup operations for created entities (optional)
- Expected result validation
- Duration tracking

### Natural Language Queries
Every test includes a natural language query that represents how a salesperson would actually ask for the operation:
- "Create a new account for Acme Corporation"
- "Show me all open deals"
- "Log a call with contact X"
- "Search for anything related to 'Acme'"

## Usage

1. **Start the MCP server** (if running locally):
   ```bash
   cd mcp-server
   npm run start:http
   ```

2. **Navigate to the test page**:
   - Go to http://localhost:3000/admin/test
   - Or click "MCP Tests" in the sidebar

3. **Run tests**:
   - Click "Run All Tests" to test everything
   - Filter by category (Accounts, Contacts, Deals, etc.)
   - Filter by specific tool
   - Run individual tests
   - Run all tests in a category

4. **View results**:
   - Green checkmark = Passed
   - Red X = Failed
   - Blue spinner = Running
   - Gray circle = Pending

## Test Structure

Each test includes:
- **ID**: Unique identifier
- **Category**: Entity type (Accounts, Contacts, etc.)
- **Tool**: MCP tool name
- **Name**: Descriptive test name
- **Description**: What the test does
- **Query**: Natural language salesperson query
- **Args**: Tool arguments (may include placeholders)
- **Expected Result**: Validation criteria
- **Cleanup** (optional): How to delete created entities

## Example Test

```typescript
{
    id: 'account-1',
    category: 'Accounts',
    tool: 'create_account',
    name: 'Create account - Basic',
    description: 'Create a new company account with just name',
    query: 'Create a new account for Acme Corporation',
    args: { name: 'Acme Corporation' },
    expectedResult: { 
        hasContent: true, 
        hasStructuredContent: true, 
        containsText: ['created successfully'] 
    },
    cleanup: { 
        tool: 'delete_account', 
        getIdFromResult: (r) => r.structuredContent?.accounts?.[0]?.id || null 
    }
}
```

## Files

- **Test Definitions**: `src/lib/mcp-tests.ts` - All 69 test cases
- **Test UI**: `src/app/admin/test/page.tsx` - Test execution interface
- **Navigation**: Updated `src/components/Sidebar.tsx` to include test page

## MCP Server Configuration

The test page uses the MCP client which connects to:
- Default: `http://localhost:3001/mcp`
- Configurable via: `NEXT_PUBLIC_MCP_SERVER_URL` environment variable

Make sure your MCP server is running and accessible before running tests.

## Typical Salesperson Queries Covered

The test suite includes realistic queries like:
- "Show me all the accounts we have"
- "Add TechCorp to our CRM in the technology industry"
- "Create a new deal called 'Enterprise License Deal' in the Discovery stage"
- "Show me all open deals"
- "Log a call with contact X, summary was 'Discussed pricing and timeline'"
- "Show me all deals we won"
- "Search for anything related to 'Acme'"
- "Show me everything about account X"

These queries represent how salespeople actually interact with CRM systems through natural language.



