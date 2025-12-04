# OpenAI App Setup Guide

## Overview
The Agent CRM MCP server has been extended to work as an OpenAI App using the OpenAI Apps SDK. The server now includes:

- ✅ StreamableHTTPServerTransport for OpenAI Apps SDK compatibility
- ✅ 4 UI widgets (Contacts, Deals, Accounts, Dashboard)
- ✅ OpenAI metadata on all tools
- ✅ Structured content responses for widgets
- ✅ Resource registration for UI components

## Installation

1. **Install/Update Dependencies**
   ```bash
   cd mcp-server
   npm install
   ```

2. **Set Environment Variables**
   Create a `.env` file or set environment variables:
   ```bash
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   PORT=8787  # Optional, defaults to 8787
   ```

3. **Build the Server**
   ```bash
   npm run build
   ```

4. **Start the Server**
   ```bash
   npm run start:http
   # or for development
   npm run dev:http
   ```

The server will start on `http://localhost:8787/mcp`

## Testing Locally

### Using MCP Inspector
```bash
npx @modelcontextprotocol/inspector@latest http://localhost:8787/mcp
```

This will open a browser window where you can test your server and see tool responses.

### Expose for ChatGPT Testing

1. **Install ngrok** (if not already installed)
   ```bash
   npm install -g ngrok
   # or
   brew install ngrok
   ```

2. **Start ngrok tunnel**
   ```bash
   ngrok http 8787
   ```

3. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.app`)

## Adding to ChatGPT

1. **Enable Developer Mode**
   - Go to **Settings → Apps & Connectors → Advanced settings**
   - Enable developer mode

2. **Add Connector**
   - Go to **Settings → Connectors**
   - Click **Create**
   - Paste your ngrok URL with `/mcp` path: `https://abc123.ngrok.app/mcp`
   - Name: "Agent CRM"
   - Description: "CRM system for managing accounts, contacts, and deals"
   - Click **Create**

3. **Use in ChatGPT**
   - Open a new chat
   - Click the **+** button, then **More**
   - Select your "Agent CRM" connector
   - Start using it! Try:
     - "Create a new contact named John Doe"
     - "Show me all deals"
     - "List all accounts"

## Available Tools

### Contacts
- `create_contact` - Create a new contact
- `get_contact` - Get contact by ID
- `list_contacts` - List all contacts
- `update_contact` - Update a contact
- `delete_contact` - Delete a contact

### Deals
- `create_deal` - Create a new deal
- `get_deal` - Get deal by ID
- `list_deals` - List all deals
- `update_deal` - Update a deal
- `move_deal_stage` - Move deal to different stage
- `close_deal` - Close deal as won/lost
- `delete_deal` - Delete a deal

### Accounts
- `create_account` - Create a new account
- `get_account` - Get account by ID
- `list_accounts` - List all accounts
- `update_account` - Update an account
- `delete_account` - Delete an account

### Pipelines
- `create_pipeline` - Create a pipeline
- `get_pipeline` - Get pipeline by ID
- `list_pipelines` - List all pipelines
- `update_pipeline` - Update a pipeline
- `delete_pipeline` - Delete a pipeline

### Interactions
- `create_interaction` - Log an interaction
- `get_interaction` - Get interaction by ID
- `list_interactions` - List interactions
- `update_interaction` - Update an interaction
- `delete_interaction` - Delete an interaction

### Search
- `search_crm` - Search across all entities
- `get_account_summary` - Get account overview
- `get_deal_pipeline_view` - View deals by pipeline stage

## UI Widgets

The app includes 4 interactive UI widgets:

1. **Contacts Widget** (`ui://widget/contacts.html`)
   - Display and manage contacts
   - Search functionality
   - Add/edit/delete contacts

2. **Deals Widget** (`ui://widget/deals.html`)
   - Pipeline/kanban view
   - Create and manage deals
   - Visual deal status indicators

3. **Accounts Widget** (`ui://widget/accounts.html`)
   - List and manage accounts
   - Create/edit/delete accounts

4. **Dashboard Widget** (`ui://widget/dashboard.html`)
   - Overview statistics
   - Recent activity feed

## Troubleshooting

### Server won't start
- Check that environment variables are set
- Verify Supabase credentials are correct
- Check port 8787 is not in use

### Widgets not loading
- Ensure HTML files exist in `mcp-server/public/`
- Check server logs for file read errors
- Verify resource registration in server-http.ts

### Tools not working in ChatGPT
- Refresh the connector in ChatGPT settings
- Check ngrok tunnel is active
- Verify `/mcp` endpoint is accessible
- Check server logs for errors

### MCP Inspector shows errors
- Ensure server is running
- Check CORS headers are set correctly
- Verify MCP SDK version is ^1.20.2

## Next Steps

- Add authentication (OAuth flow)
- Implement state persistence
- Add more advanced widgets
- Enhance error handling
- Add real-time updates

## Files Modified/Created

### Modified
- `mcp-server/server-http.ts` - Complete rewrite for OpenAI Apps SDK
- `mcp-server/package.json` - Updated MCP SDK version
- `mcp-server/tools/*.ts` - Added _meta fields and structuredContent

### Created
- `mcp-server/public/contacts-widget.html`
- `mcp-server/public/deals-widget.html`
- `mcp-server/public/accounts-widget.html`
- `mcp-server/public/dashboard-widget.html`
- `OPENAI_APP_PLAN.md` - Implementation plan
- `mcp-server/OPENAI_APP_SETUP.md` - This file

