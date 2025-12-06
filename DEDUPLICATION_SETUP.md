# Deduplication System Setup Guide

## Step 1: Apply Database Migration

The migration file `supabase/migrations/20250125000000_deduplication.sql` needs to be applied to your Supabase database.

### Option A: Via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/20250125000000_deduplication.sql`
4. Click **Run** to execute the migration

### Option B: Via Supabase CLI (if installed)
```bash
supabase db push
```

### Option C: Manual Application
The migration creates:
- Unique indexes on email (contacts), name+account (deals), and name (accounts)
- Indexes for fast duplicate detection
- SQL functions for finding duplicates

## Step 2: Rebuild MCP Server ✅

The MCP server has been rebuilt with deduplication support:
```bash
cd mcp-server && bun x tsc
```

**Status**: ✅ Complete - MCP server compiled successfully

## Step 3: Restart MCP Server

If your MCP server is running, restart it to load the new deduplication logic:

```bash
# Stop existing server (if running)
# Then restart with:
cd mcp-server
SUPABASE_URL="your_url" SUPABASE_ANON_KEY="your_key" PORT=3001 bun dist/server-http.js
```

## Step 4: Test Deduplication

### Test 1: Duplicate Contact (Email Match)

**Via MCP Test Page** (`/admin/test`):
1. Run "Create contact - Basic" test
2. Note the contact ID from the result
3. Run the same test again with the same email
4. You should see: `⚠️ Strong duplicate detected: Exact email match`

**Via Chat/API**:
```json
{
  "tool": "create_contact",
  "arguments": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  }
}
```

Then try again with the same email - should be blocked.

### Test 2: Duplicate Deal (Name + Account)

**Via MCP Test Page**:
1. Create a test account first (note the account_id)
2. Create a deal: `{ "name": "Enterprise License", "account_id": "<account_id>", "stage": "Discovery" }`
3. Try creating the same deal again
4. You should see: `⚠️ Strong duplicate detected: Exact name and account match`

### Test 3: Moderate Duplicate (Name Only)

**Via MCP Test Page**:
1. Create a deal: `{ "name": "Test Deal", "stage": "Lead" }` (no account_id)
2. Create another deal: `{ "name": "Test Deal", "stage": "Proposal" }` (no account_id)
3. You should see: `⚠️ Possible duplicate detected: Exact name match`

### Test 4: Scribe API Auto-Deduplication

**Via Scribe API**:
1. Send an interaction with a contact that already exists:
```json
POST /api/agent/scribe
{
  "text": "Had a call with John Doe (john@example.com), discussed Enterprise License deal",
  "accountId": "<existing_account_id>"
}
```

2. The system should:
   - Detect existing contact by email
   - Use existing contact ID
   - Update contact with any new information
   - Not create a duplicate

## Expected Behaviors

### Strong Duplicates (Similarity ≥ 0.9)
- **Action**: Block creation, return error
- **Message**: "Strong duplicate detected"
- **Suggestion**: Use `update_contact` or `update_deal` with existing ID

### Moderate Duplicates (Similarity ≥ 0.8)
- **Action**: Warn but allow creation
- **Message**: "Possible duplicate detected"
- **Result**: Contact/deal created with warning

### Weak Duplicates (Similarity < 0.8)
- **Action**: Allow creation
- **Message**: "Potential duplicate detected" (if any)
- **Result**: Contact/deal created normally

## Verification Checklist

- [ ] Migration applied to database
- [ ] MCP server rebuilt and restarted
- [ ] Can create contacts without duplicates
- [ ] Duplicate contact creation is blocked/warned
- [ ] Can create deals without duplicates
- [ ] Duplicate deal creation is blocked/warned
- [ ] Scribe API uses existing contacts/deals when found

## Troubleshooting

### "Unique constraint violation" errors
- This means the database constraints are working
- The MCP tools should catch these and return user-friendly messages
- If you see raw database errors, check that deduplication logic is running

### Duplicates still being created
- Verify migration was applied: Check Supabase dashboard → Database → Indexes
- Verify MCP server was restarted with new code
- Check browser console for any JavaScript errors

### No duplicate detection happening
- Verify `mcp-server/utils/deduplication.ts` exists
- Verify imports in `mcp-server/tools/contacts.ts` and `deals.ts`
- Check MCP server logs for errors

## Next Steps After Setup

1. **Monitor**: Watch for duplicate warnings in production
2. **Tune**: Adjust similarity thresholds if needed (in deduplication.ts)
3. **Merge**: Use `mergeContacts()` and `mergeDeals()` functions to clean up existing duplicates
4. **UI**: Consider adding duplicate detection UI to contact/deal forms

