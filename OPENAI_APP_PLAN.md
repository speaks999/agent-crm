# Plan: Extend Agent CRM MCP Server to OpenAI App

## Overview
Convert the existing Agent CRM MCP server into an OpenAI App that can be used in ChatGPT. This will enable users to interact with their CRM data through ChatGPT with rich UI components.

## Current State Analysis

### Existing MCP Server
- ✅ HTTP server using Express (`server-http.ts`)
- ✅ 6 tool modules: Accounts, Contacts, Deals, Pipelines, Interactions, Search
- ✅ Supabase integration for data persistence
- ✅ JSON-RPC 2.0 protocol implementation
- ❌ No UI widgets/components
- ❌ No OpenAI-specific metadata on tools
- ❌ No resource registration for UI components
- ❌ Not using StreamableHTTPServerTransport (required for OpenAI Apps SDK)

### What Needs to Change

1. **Server Transport**: Migrate from Express JSON-RPC to `StreamableHTTPServerTransport`
2. **UI Components**: Create web components for CRM widgets
3. **Tool Metadata**: Add OpenAI-specific `_meta` fields to tools
4. **Structured Responses**: Return `structuredContent` in tool responses
5. **Resource Registration**: Register UI widgets as MCP resources

---

## Implementation Plan

### Phase 1: Update MCP Server Infrastructure

#### 1.1 Replace Express with StreamableHTTPServerTransport
**File**: `mcp-server/server-http.ts`

**Changes**:
- Remove Express dependency
- Use Node.js `createServer` from `node:http`
- Implement `StreamableHTTPServerTransport` from `@modelcontextprotocol/sdk/server/streamableHttp.js`
- Handle CORS properly (OPTIONS, GET, POST, DELETE)
- Support stateless mode (no session ID generator)
- Enable JSON response mode

**Key Requirements**:
- Endpoint: `/mcp` (as per OpenAI Apps SDK spec)
- Health check: `GET /`
- CORS headers for all origins during development
- Proper error handling and cleanup

#### 1.2 Update Server Creation Pattern
**File**: `mcp-server/server-http.ts`

**Changes**:
- Use `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js` instead of `Server`
- Create server instance per request (stateless mode)
- Properly handle request/response lifecycle
- Clean up transport and server on connection close

---

### Phase 2: Create UI Widgets

#### 2.1 Contacts Widget
**File**: `mcp-server/public/contacts-widget.html`

**Features**:
- Display list of contacts
- Add new contact form
- Edit/delete contact actions
- Filter by account
- Search functionality
- Use OpenAI Apps SDK JavaScript API for tool calls
- Handle `openai:set_globals` events
- Support `structuredContent` updates

#### 2.2 Deals Widget
**File**: `mcp-server/public/deals-widget.html`

**Features**:
- Display deals in pipeline view (kanban-style)
- Create new deal
- Move deals between stages
- Update deal amount and close date
- Filter by account, pipeline, status
- Visual indicators for deal value and stage

#### 2.3 Accounts Widget
**File**: `mcp-server/public/accounts-widget.html`

**Features**:
- List all accounts
- Create/edit account
- View account details
- Filter by industry
- Link to contacts and deals

#### 2.4 Dashboard Widget
**File**: `mcp-server/public/dashboard-widget.html`

**Features**:
- Overview statistics (total accounts, contacts, deals)
- Recent activity feed
- Pipeline summary
- Quick actions

**Design Guidelines**:
- Follow OpenAI UX principles (clean, minimal, focused)
- Use modern CSS (no external dependencies)
- Responsive design
- Accessible (ARIA labels, keyboard navigation)
- Use OpenAI brand colors where appropriate

---

### Phase 3: Update Tool Definitions

#### 3.1 Add OpenAI Metadata to Tools
**Files**: All tool definition files in `mcp-server/tools/`

**Changes for each tool**:
- Add `_meta` field with:
  - `openai/outputTemplate`: URI to widget HTML (e.g., `ui://widget/contacts.html`)
  - `openai/toolInvocation/invoking`: Message shown while tool is executing
  - `openai/toolInvocation/invoked`: Message shown after tool completes
- Update tool descriptions to be more conversational
- Ensure input schemas are clear and well-documented

**Example**:
```typescript
{
  name: 'create_contact',
  description: 'Creates a new contact in the CRM',
  inputSchema: { ... },
  _meta: {
    'openai/outputTemplate': 'ui://widget/contacts.html',
    'openai/toolInvocation/invoking': 'Creating contact...',
    'openai/toolInvocation/invoked': 'Contact created successfully'
  }
}
```

#### 3.2 Update Tool Responses
**Files**: All tool handler files in `mcp-server/tools/`

**Changes**:
- Return `structuredContent` in addition to text content
- Include relevant data structure that matches widget expectations
- Format data for easy consumption by UI components

**Example Response**:
```typescript
return {
  content: [{ type: 'text', text: `Contact "${data.first_name} ${data.last_name}" created` }],
  structuredContent: {
    contacts: [data], // Array of contacts for widget
    accounts: [...],  // Related accounts if needed
  }
};
```

---

### Phase 4: Register Resources

#### 4.1 Register UI Widgets as Resources
**File**: `mcp-server/server-http.ts`

**Changes**:
- Read HTML files from `public/` directory
- Register each widget as a resource with URI pattern `ui://widget/{name}.html`
- Set MIME type to `text/html+skybridge`
- Add metadata: `openai/widgetPrefersBorder: true` (for better UI)

**Example**:
```typescript
const contactsHtml = readFileSync('public/contacts-widget.html', 'utf8');

server.registerResource(
  'contacts-widget',
  'ui://widget/contacts.html',
  {},
  async () => ({
    contents: [{
      uri: 'ui://widget/contacts.html',
      mimeType: 'text/html+skybridge',
      text: contactsHtml,
      _meta: { 'openai/widgetPrefersBorder': true }
    }]
  })
);
```

---

### Phase 5: Update Package Dependencies

#### 5.1 Check MCP SDK Version
**File**: `mcp-server/package.json`

**Requirements**:
- Ensure `@modelcontextprotocol/sdk` version supports:
  - `StreamableHTTPServerTransport`
  - `McpServer` class
  - Resource registration
- Minimum version: `^1.20.2` (as per quickstart)

#### 5.2 Remove Express (if not needed elsewhere)
- Express is currently used but can be replaced with native Node.js HTTP
- Keep if needed for other endpoints

---

### Phase 6: Testing & Validation

#### 6.1 Local Testing
- Use MCP Inspector: `npx @modelcontextprotocol/inspector@latest http://localhost:8787/mcp`
- Test each tool invocation
- Verify UI widgets render correctly
- Test structured content updates

#### 6.2 Expose for ChatGPT Testing
- Use ngrok: `ngrok http 8787`
- Add connector in ChatGPT settings
- Test end-to-end user flows
- Verify tool invocations work from ChatGPT

---

## File Structure After Implementation

```
mcp-server/
├── index.ts                    # Stdio server (keep for compatibility)
├── server-http.ts              # NEW: OpenAI Apps SDK compatible server
├── public/                     # NEW: UI widgets directory
│   ├── contacts-widget.html
│   ├── deals-widget.html
│   ├── accounts-widget.html
│   └── dashboard-widget.html
├── tools/
│   ├── accounts.ts             # UPDATED: Add _meta fields
│   ├── contacts.ts             # UPDATED: Add _meta + structuredContent
│   ├── deals.ts                # UPDATED: Add _meta + structuredContent
│   ├── pipelines.ts            # UPDATED: Add _meta fields
│   ├── interactions.ts         # UPDATED: Add _meta fields
│   └── search.ts               # UPDATED: Add _meta fields
├── types.ts                    # Keep as-is
└── package.json                # UPDATED: Verify SDK version
```

---

## Implementation Order

1. ✅ **Phase 1**: Update server infrastructure (critical path)
2. ✅ **Phase 2**: Create at least one widget (contacts) to validate approach
3. ✅ **Phase 3**: Update tool definitions with metadata
4. ✅ **Phase 4**: Register resources
5. ✅ **Phase 5**: Create remaining widgets
6. ✅ **Phase 6**: Test and iterate

---

## Key Considerations

### Security
- Validate all inputs using Zod schemas (already in place)
- Sanitize HTML widget content
- Consider authentication for production (OAuth flow)

### Performance
- Widgets should be lightweight (no heavy frameworks)
- Minimize external dependencies
- Optimize for fast rendering

### User Experience
- Tools should have clear, conversational descriptions
- Widgets should provide immediate feedback
- Error states should be user-friendly
- Loading states should be clear

### Compatibility
- Maintain backward compatibility with existing stdio server
- Keep HTTP server as separate entry point
- Don't break existing tool handlers

---

## Success Criteria

- [ ] Server responds correctly to MCP requests via `/mcp` endpoint
- [ ] All tools have OpenAI metadata
- [ ] At least 3 UI widgets created and functional
- [ ] Tools return structuredContent in responses
- [ ] Resources registered and accessible
- [ ] Can connect from ChatGPT connector settings
- [ ] Tools can be invoked from ChatGPT
- [ ] UI widgets render correctly in ChatGPT interface
- [ ] Data flows correctly between ChatGPT and CRM

---

## Next Steps After Implementation

1. **Authentication**: Add OAuth flow for user authentication
2. **State Management**: Implement proper state persistence
3. **Advanced Widgets**: Add charts, graphs, and visualizations
4. **Real-time Updates**: Consider WebSocket support for live updates
5. **Error Handling**: Enhanced error messages and recovery
6. **Documentation**: User guide for ChatGPT app users

---

## References

- [OpenAI Apps SDK Quickstart](https://developers.openai.com/apps-sdk/quickstart)
- [MCP SDK Documentation](https://modelcontextprotocol.io)
- OpenAI App Developer Guidelines (to be reviewed)

