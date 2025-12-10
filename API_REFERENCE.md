# API, Function, and Component Reference

This document catalogues every public HTTP endpoint, exported library, hook, and UI component in the Whitespace CRM workspace. Use it as the authoritative guide for wiring up clients, extending the backend, or composing UI from the provided building blocks.

---

## 1. HTTP APIs

### 1.1 Conversational & Agent Endpoints

#### `POST /api/chat`
- **Purpose:** Natural-language entry point that routes user requests either to an MCP tool call or to a conversational response (`src/app/api/chat/route.ts`).
- **Request body:**
  ```ts
  {
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  }
  ```
- **Behavior:**
  1. Fetches the live MCP tool list via `listTools()`.
  2. Uses `generateText` (`gpt-4o`) to decide whether the last message requires a tool call and, if so, which arguments to pass.
  3. Executes the requested MCP tool with `callTool()` and summarizes the result with another `generateText` call.
  4. Streams back plain text (no SSE framing) so clients should read `response.body`.
- **Response:** UTF-8 text stream containing either the MCP tool output or a conversational reply.
- **Example:**
  ```ts
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });
  const reader = res.body?.getReader();
  ```

#### `POST /api/agent/analyst`
- **Purpose:** Turns natural-language analytics questions into Supabase queries plus chart metadata via `analyzeAndFetchData()`.
- **Request:** `{ query: string }`.
- **Response:** `{ data: any[]; config: { type: 'bar'|'line'|'pie'|'number'|'table'; title: string; xAxis?: string; yAxis?: string } }`.
- **Usage:** Ideal for chat or dashboard workflows that need a ready-to-render dataset + chart config.

#### `POST /api/agent/scribe`
- **Purpose:** AI data-entry pipeline for meeting notes or call transcripts (`src/app/api/agent/scribe/route.ts`).
- **Request:** `{ text: string; accountId?: string }`.
- **Pipeline:**
  1. Extracts summary, sentiment, contact, opportunity, and next steps using `generateObject` (`gpt-4o`).
  2. Runs `checkDuplicateContact` / `checkDuplicateDeal` before inserting new records.
  3. Upserts contacts, deals, and a new interaction row; stores embeddings for semantic search.
- **Response:** `{ success: boolean; data?: { summary, sentiment, contact?, opportunity?, nextSteps[] }; error?: string }`.
- **Example:**
  ```ts
  const { data } = await fetch('/api/agent/scribe', {
    method: 'POST',
    body: JSON.stringify({ text: note, accountId }),
    headers: { 'Content-Type': 'application/json' }
  }).then(r => r.json());
  ```

#### `POST /api/agent/drafter`
- **Purpose:** Generates follow-up email drafts from an interaction transcript (`src/app/api/agent/drafter/route.ts`).
- **Request:** `{ interactionId?: string; text?: string }`. If `interactionId` is supplied, the transcript is fetched from Supabase.
- **Response:** `{ draft: { subject: string; body: string (HTML); actionItems: string[] } }`.

#### `POST /api/agent/briefer`
- **Purpose:** Produces pre-meeting briefings summarizing recent interactions and open deals (`src/app/api/agent/briefer/route.ts`).
- **Request:** `{ entityId: string; type: 'contact' | 'account' }`.
- **Response:** `{ briefing: { summary; lastInteraction; redFlags[]; openItems[]; suggestedAction } }`.

### 1.2 Background Job Hooks

#### `GET /api/cron/coach`
- **Purpose:** Finds stalled opportunities (no updates in 14 days) and returns AI-generated nudges plus suggested actions/email templates.
- **Response:** `{ nudges: Array<{ opportunityId; opportunityName; nudge; suggestedAction; emailTemplate? }> }` or `{ message: 'No stalled opportunities found' }`.

#### `GET /api/cron/janitor`
- **Purpose:** Embedding-based duplicate detector for contacts. Returns flagged IDs for manual review.
- **Response:** `{ success: true; results: Array<{ contact: string; potential_duplicates: string[]; action: 'flagged' }> }`.

### 1.3 Insightly Mirror & Sync APIs

All Insightly endpoints rely on Supabase tables populated via the Insightly bridge in `src/lib/insightly.ts`.

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/insightly/organizations` | GET | Lists all organizations ordered by `name`. |
| `/api/insightly/organizations/[id]` | GET | Fetches a single organization by UUID. |
| `/api/insightly/organizations/sync` | POST | Pulls the Insightly Organisations feed, flattens addresses/contact info, and upserts into Supabase. Updates `sync_status`. |
| `/api/insightly/projects` | GET | Lists projects ordered by `project_name`. |
| `/api/insightly/projects/sync` | POST | Upserts Insightly projects and logs sync status. |
| `/api/insightly/tasks` | GET | Lists tasks ordered by `title`. |
| `/api/insightly/tasks/sync` | POST | Upserts Insightly tasks and logs sync status. |
| `/api/insightly/events` | GET | Lists events ordered by start date. |
| `/api/insightly/opportunities` | GET | Lists opportunities ordered by `opportunity_name`. |

All sync endpoints return `{ success: boolean; synced?: number }` on success or `{ error: string }` plus HTTP 500 when Insightly or Supabase calls fail.

### 1.4 Team Directory API (`/api/team`)

`src/app/api/team/route.ts` exposes full CRUD with soft deletes:

- **GET** – Returns all active team members.
- **POST** – Body `{ first_name, last_name, email, role? }`. Inserts a new active member.
- **PUT** – Body `{ id, ...updates }`. Applies partial updates.
- **DELETE** – Query `?id=`; marks the member inactive instead of hard-deleting.

Errors respond with `{ error: string }` and HTTP 400/500 as appropriate.

---

## 2. Backend Libraries & Utilities

### 2.1 OpenAI Client (`src/lib/ai.ts`)
Exports a preconfigured client:
```ts
import { openai } from '@/lib/ai';
const completion = await openai('gpt-4o').responses.create({ ... });
```
Relies on `OPENAI_API_KEY`.

### 2.2 Analyst Engine (`src/lib/analyst.ts`)
- **`analyzeAndFetchData(query: string)`** – Core intelligence behind the analytics assistant. It:
  1. Calls `generateObject` with a strict schema to determine table, aggregation, filters, chart type, etc.
  2. Builds a Supabase query (joining `accounts` when grouping by account fields) and applies validated filters, date windows, sorting, and limits.
  3. Applies aggregations client-side when necessary and shapes `{ data, config }` for chart rendering.
- Includes guardrails around status filters, date parsing (`parseDateFilter`), and column normalization.
- **Usage:**
  ```ts
  const { data, config } = await analyzeAndFetchData('Show revenue by stage this month');
  ```

### 2.3 Deduplication Helpers (`src/lib/deduplication.ts`)
- **`checkDuplicateContact(supabase, data)`** – Returns `{ isDuplicate, duplicateMatches, suggestedAction, message }` by comparing normalized email, phone, and name+account.
- **`checkDuplicateDeal(supabase, data)`** – Similar logic for deals using name, account, and stage.
- **`mergeContacts(supabase, sourceId, targetId)`** – Merges two contacts, preferring non-null target fields, merging tags, re-pointing interactions, and deleting the source.
- **`mergeDeals(...)`** – Same for deals with summed amounts and interaction reassignment.
- **Usage tip:** Always inspect `duplicateMatches` to display context to the end-user before auto-merging.

### 2.4 Insightly REST Bridge (`src/lib/insightly.ts`)
- Provides authenticated fetch helpers (`getOrganizations`, `getProjects`, `getTasks`, `getEvents`, `getOpportunities`, `getContacts`, `getCustomFields`, `getUsers`, and single-record variants).
- All helpers share `insightlyRequest` (handles auth headers, query params, and detailed error strings) plus `fetchAllRecords` pagination.
- Requires `INSIGHTLY_API_KEY` and optional `INSIGHTLY_POD`.
- **Example:**
  ```ts
  import { getProjects } from '@/lib/insightly';
  const projects = await getProjects({ top: 200 });
  ```

### 2.5 MCP Client (`src/lib/mcp-client.ts`)
- **`listTools(baseUrl?)`** – JSON-RPC call to `tools/list`. Throws if the MCP server is unreachable or returns malformed data.
- **`callTool(name, args, baseUrl?)`** – Invokes `tools/call` and returns `{ content, isError? }`.
- **`formatToolResult(result)`** – Convenience string extractor (handles error payloads).
- **`parseToolResult(result)`** – Tries to JSON-parse the first text block; returns `null` on failure.
- All requests default to `NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:3001/mcp'`.

### 2.6 Supabase Client (`src/lib/supabaseClient.ts`)
- **`supabase`** – Server-side client that prefers `SUPABASE_SERVICE_ROLE_KEY`, falling back to anon/public keys.
- **`createBrowserClient()`** – Creates a browser-safe client using `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`, enabling auto-refresh and session persistence.

### 2.7 MCP Test Suite (`src/lib/mcp-tests.ts`)
- Defines `MCP_TESTS`, `TESTS_BY_CATEGORY`, `ALL_TOOLS`, and `ALL_CATEGORIES` to drive automated QA of all 30 MCP tools.
- Each test contains natural-language `query`, structured `args`, optional setup/cleanup hooks, and expected assertions.
- **Usage:**
  ```ts
  import { MCP_TESTS } from '@/lib/mcp-tests';
  MCP_TESTS.filter(test => test.tool === 'create_account');
  ```

---

## 3. Frontend Hooks & Context

### 3.1 `AuthProvider` / `useAuth` (`src/contexts/AuthContext.tsx`)
- Wraps the app to expose `{ user, session, loading, signUp, signIn, signOut, resetPassword, resendConfirmationEmail }`.
- Uses the browser Supabase client to subscribe to auth state changes and to handle redirects.
- **Usage:**
  ```tsx
  import { AuthProvider, useAuth } from '@/contexts/AuthContext';

  export default function AppShell({ children }) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  function UserMenu() {
    const { user, signOut } = useAuth();
    return user ? <button onClick={signOut}>Sign out</button> : null;
  }
  ```

### 3.2 `useTags` Hook (`src/hooks/useTags.tsx`)
Exposes a comprehensive tag-management toolkit backed by Supabase real-time updates:
- State: `{ tags, loading, error }`.
- Actions: `fetchTags`, `getOrCreateTag(name, color?)`, `updateTag(id, updates)`, `deleteTag(id)`, `mergeTags(sourceId, targetName)`.
- Helpers: `getTagSuggestions(input, limit)`, `DEFAULT_COLORS`.
- Automatically subscribes to Postgres changes via `supabase.channel('tags_changes')`.
- **Usage:**
  ```tsx
  const { tags, getOrCreateTag, getTagSuggestions } = useTags();
  const onAdd = async name => {
    const tag = await getOrCreateTag(name);
    console.log(tag.tag_name, tag.color);
  };
  ```

---

## 4. UI Components

### 4.1 Analytics Primitives (`src/components/analytics/Charts.tsx`)
All components share the same card styling and expect already-prepared datasets.

| Component | Props | Description |
| --- | --- | --- |
| `BarChartComponent` | `{ data, title, xAxisKey?, yAxisKey? }` | Responsive Recharts bar chart with tooltips and grid. |
| `LineChartComponent` | `{ data, title, xAxisKey?, yAxisKey? }` | Monotone line chart suited for trend queries. |
| `PieChartComponent` | `{ data, title, dataKey?, nameKey? }` | Donut-style pie chart with legend and color palette. |
| `TableComponent` | `{ data, title }` | Auto-generates column headers from the first row; falls back to JSON strings for nested objects. |

**Example:**
```tsx
<BarChartComponent
  data={[{ stage: 'Demo', amount: 120000 }]}
  title="Pipeline by Stage"
  xAxisKey="stage"
  yAxisKey="amount"
/>
```

### 4.2 Chat Experience

| Component | Path | Notes |
| --- | --- | --- |
| `ChatInterface` (MCP tools) | `src/components/chat/ChatInterface.tsx` | Local stateful chat UI that streams from `/api/chat`, renders `MessageBubble`s, and shows tool call cards. |
| `MessageBubble` | `src/components/chat/MessageBubble.tsx` | Presentation helper that formats user vs. assistant messages and timestamps. |
| `ToolResultCard` | `src/components/chat/ToolResultCard.tsx` | Collapsible card that reveals tool arguments/results for transparency. |
| `ChatInterface` (Whitespace assistant) | `src/components/ChatInterface.tsx` | Dashboard-level assistant that routes queries between `/api/agent/analyst` and `/api/agent/scribe`, and renders charts/tables inline. |
| `VoiceInput` | `src/components/VoiceInput.tsx` | Floating mic button (currently prompts for text) that posts to `/api/agent/scribe` and displays toast-style alerts. |

**Embedding the assistant chat:**
```tsx
import ChatInterface from '@/components/ChatInterface';

export default function ChatPage() {
  return (
    <div className="h-full">
      <ChatInterface />
    </div>
  );
}
```

### 4.3 CRM Displays

| Component | Props | Description |
| --- | --- | --- |
| `AccountCard` (`src/components/crm/AccountCard.tsx`) | `{ account: { id, name, industry?, website?, created_at } }` | Card with badge-styled industry, website link, and creation date. |
| `ContactList` (`src/components/crm/ContactList.tsx`) | `{ contacts: Contact[] }` | Striped table for contacts with optional badges for roles. |
| `StatCard` (`src/components/StatCard.tsx`) | `{ title: string; value: string; change: string }` | Simple KPI display showing current value and delta. |

**Example:**
```tsx
<AccountCard account={{ id: '1', name: 'Acme', industry: 'Tech', created_at: new Date().toISOString() }} />
```

### 4.4 Tag Management Suite

| Component | Path | Key Props |
| --- | --- | --- |
| `TagFilter` | `src/components/data/TagFilter.tsx` | `{ selectedTags: string[]; onTagsChange(tags); entityType? }` – Popover with search + multi-select chips for filtering lists. |
| `TagManager` | `src/components/data/TagManager.tsx` | `{ open: boolean; onOpenChange(open) }` – Full-screen modal for editing, merging, and deleting tags. Relies on `useTags`. |
| `TagBadge` | `src/components/ui/TagBadge.tsx` | `{ tag: string; color?; onRemove?; size? }` – Reusable chip with optional remove button. |
| `TagInput` | `src/components/ui/TagInput.tsx` | `{ value: string[]; onChange; entityType; label?; placeholder? }` – Autocomplete + creation component for assigning tags to entities. |

**Example:**
```tsx
const [tags, setTags] = useState<string[]>([]);
<TagInput value={tags} onChange={setTags} entityType="deal" label="Deal Tags" />
```

### 4.5 Layout & Access Helpers

| Component | Path | Description |
| --- | --- | --- |
| `Header` | `src/components/Header.tsx` | Uses `useAuth` and `usePathname` to show the current section and user info with a sign-out action. |
| `Sidebar` | `src/components/Sidebar.tsx` | Navigation list with active-route highlighting for all dashboard sections (Dashboard, Chat, Opportunities, etc.). |
| `ProtectedRoute` | `src/components/ProtectedRoute.tsx` | Guards children, redirecting to `/login` when no authenticated user exists. Shows a loading spinner while auth state resolves. |

**Usage:**
```tsx
<ProtectedRoute>
  <DashboardLayout />
</ProtectedRoute>
```

---

## 5. Usage Tips

1. **Environment variables:** Ensure Supabase, OpenAI, and Insightly credentials are present before calling any server utilities.
2. **Streaming responses:** `/api/chat` returns a readable stream; always read incrementally rather than awaiting `response.text()`.
3. **Tag consistency:** `useTags` increments `usage_count` whenever `getOrCreateTag` is called. Remove tags via `TagInput`’s `onChange` handler to keep counts accurate.
4. **Deduplication UX:** Surface `DeduplicationResult.message` to users when creating contacts/deals to explain why actions were blocked or merged.
5. **Testing MCP tools:** Import `MCP_TESTS` in your QA harness to cover every tool and regression-test deduplication + tagging flows automatically.
