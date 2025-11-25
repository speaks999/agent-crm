# Agent CRM MCP Server

A Model Context Protocol (MCP) server that exposes all Agent CRM CRUD operations as tools for AI applications like OpenAI apps, Claude Desktop, and other MCP-compatible clients.

## Features

- **30 CRM Tools** across 6 categories
- **Complete CRUD Operations** for all CRM entities
- **Type-Safe** with TypeScript and Zod validation
- **Real-time Database** integration with Supabase
- **Advanced Search** and aggregation tools

## Available Tools

### Accounts (5 tools)
- `create_account` - Create a new company/account
- `get_account` - Retrieve account by ID
- `list_accounts` - List all accounts with optional filters
- `update_account` - Update account details
- `delete_account` - Delete an account

### Contacts (5 tools)
- `create_contact` - Create a new contact person
- `get_contact` - Retrieve contact by ID
- `list_contacts` - List contacts with optional account filter
- `update_contact` - Update contact details
- `delete_contact` - Delete a contact

### Deals (7 tools)
- `create_deal` - Create a new deal/opportunity
- `get_deal` - Retrieve deal by ID
- `list_deals` - List deals with filters (status, stage, account)
- `update_deal` - Update deal details
- `move_deal_stage` - Move deal to a different stage
- `close_deal` - Close deal as won or lost
- `delete_deal` - Delete a deal

### Pipelines (5 tools)
- `create_pipeline` - Create a new sales pipeline
- `get_pipeline` - Retrieve pipeline by ID
- `list_pipelines` - List all pipelines
- `update_pipeline` - Update pipeline stages
- `delete_pipeline` - Delete a pipeline

### Interactions (5 tools)
- `create_interaction` - Log a new interaction (call, meeting, email, note)
- `get_interaction` - Retrieve interaction by ID
- `list_interactions` - List interactions with filters
- `update_interaction` - Update interaction details
- `delete_interaction` - Delete an interaction

### Search & Analytics (3 tools)
- `search_crm` - Global search across all entities
- `get_account_summary` - Complete account overview with contacts, deals, and interactions
- `get_deal_pipeline_view` - View all deals organized by pipeline stage with statistics

## Installation

1. Navigate to the MCP server directory:
```bash
cd mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp env.example .env
```

4. Edit `.env` with your Supabase credentials:
```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

5. Build the server:
```bash
npm run build
```

## Usage

### Running Locally

```bash
npm start
```

The server runs on stdio and communicates via JSON-RPC 2.0.

### Testing the Server

Test that the server lists tools correctly:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

### Configuring with Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "agent-crm": {
      "command": "node",
      "args": ["/absolute/path/to/agent-crm/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "your-supabase-url",
        "SUPABASE_ANON_KEY": "your-supabase-anon-key"
      }
    }
  }
}
```

### Configuring with OpenAI Apps

When using the OpenAI SDK with MCP support, configure the server in your MCP client configuration:

```typescript
import { MCPClient } from '@modelcontextprotocol/sdk/client/index.js';

const client = new MCPClient({
  name: 'agent-crm',
  command: 'node',
  args: ['/path/to/agent-crm/mcp-server/dist/index.js'],
  env: {
    SUPABASE_URL: 'your-supabase-url',
    SUPABASE_ANON_KEY: 'your-supabase-anon-key',
  },
});
```

## Example Usage

Once configured, you can use natural language to interact with your CRM:

- "Create a new account for Acme Corp in the technology industry"
- "List all open deals for account X"
- "Add a contact named John Smith to Acme Corp"
- "Log a meeting interaction with sentiment analysis"
- "Search the CRM for anything related to 'enterprise'"
- "Show me a complete summary of account Y"

## Architecture

```
mcp-server/
├── index.ts              # Main server entry point
├── types.ts              # TypeScript types and Zod schemas
├── tools/
│   ├── accounts.ts       # Account CRUD operations
│   ├── contacts.ts       # Contact CRUD operations
│   ├── deals.ts          # Deal CRUD operations
│   ├── pipelines.ts      # Pipeline CRUD operations
│   ├── interactions.ts   # Interaction CRUD operations
│   └── search.ts         # Search and analytics tools
├── package.json
└── tsconfig.json
```

## Security Considerations

- The MCP server uses Supabase's Row Level Security (RLS) policies
- Uses the anonymous key for authentication
- All database operations respect Supabase access controls
- For production use, ensure proper RLS policies are configured in Supabase

## Development

Build and run in development mode:
```bash
npm run dev
```

Build only:
```bash
npm run build
```

## Troubleshooting

**Error: Missing environment variables**
- Ensure `.env` file exists with valid SUPABASE_URL and SUPABASE_ANON_KEY

**Tool execution errors**
- Check Supabase connection and credentials
- Verify database tables exist (run migrations first)
- Check MCP client logs for detailed error messages

**Server not appearing in Claude Desktop**
- Verify config file path and JSON syntax
- Restart Claude Desktop after config changes
- Check absolute paths in config are correct

## License

MIT
