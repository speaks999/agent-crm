# Deduplication System Documentation

## Overview

The deduplication system prevents duplicate contacts and deals from being created in the CRM. It includes:

1. **Database-level constraints** - Unique indexes to prevent exact duplicates
2. **Application-level detection** - Smart duplicate detection before creation
3. **Automatic merging** - Functions to merge duplicate records
4. **User warnings** - Clear messages when duplicates are detected

## Components

### 1. Database Migration (`supabase/migrations/20250125000000_deduplication.sql`)

**Unique Constraints:**
- **Contacts**: Unique index on email (case-insensitive, allows nulls)
- **Deals**: Unique composite index on (name, account_id) when account exists
- **Accounts**: Unique index on name (case-insensitive)

**Indexes for Detection:**
- Contacts: phone, name+account composite
- Deals: name index

**Database Functions:**
- `find_duplicate_contacts()` - SQL function for duplicate detection
- `find_duplicate_deals()` - SQL function for duplicate detection

### 2. Deduplication Library (`src/lib/deduplication.ts`)

**Functions:**

#### `checkDuplicateContact(supabase, data)`
Checks for duplicate contacts based on:
- **Email** (similarity: 1.0) - Exact match
- **Phone** (similarity: 0.9) - Normalized phone number match
- **Name + Account** (similarity: 0.7) - Same name and account

Returns `DeduplicationResult` with:
- `isDuplicate`: boolean
- `duplicateMatches`: Array of matches with similarity scores
- `suggestedAction`: 'create' | 'merge' | 'update' | 'skip'
- `message`: Human-readable message

#### `checkDuplicateDeal(supabase, data)`
Checks for duplicate deals based on:
- **Name + Account** (similarity: 0.95) - Exact name and account match
- **Name + Account + Stage** (similarity: 1.0) - Same name, account, and stage
- **Name only** (similarity: 0.8) - Same name without account

#### `mergeContacts(supabase, sourceId, targetId)`
Merges two contacts:
- Keeps target contact ID
- Merges all fields (prefers non-null values, target for conflicts)
- Merges tags arrays
- Updates all related interactions to point to target
- Deletes source contact

#### `mergeDeals(supabase, sourceId, targetId)`
Merges two deals:
- Keeps target deal ID
- Sums amounts if both exist
- Merges all other fields
- Merges tags arrays
- Updates all related interactions to point to target
- Deletes source deal

### 3. MCP Server Integration (`mcp-server/tools/contacts.ts`, `mcp-server/tools/deals.ts`)

**Contact Creation:**
1. Checks for duplicates before insertion
2. If strong duplicate (similarity ≥ 0.9): Returns error with duplicate info
3. If moderate duplicate (similarity ≥ 0.8): Warns but allows creation
4. If weak duplicate (similarity < 0.8): Proceeds with warning
5. Handles unique constraint violations gracefully

**Deal Creation:**
1. Similar logic to contacts
2. Checks name + account combination
3. Considers stage in similarity calculation

### 4. Scribe API Integration (`src/app/api/agent/scribe/route.ts`)

**Automatic Deduplication:**
- When extracting contacts from interactions, checks for duplicates
- If duplicate found, uses existing contact and updates with new info
- When extracting deals, checks for duplicates
- If duplicate found, uses existing deal and updates with new info

## Usage Examples

### Creating a Contact (MCP Tool)

```typescript
// Strong duplicate detected
{
  "content": [{
    "type": "text",
    "text": "⚠️ Strong duplicate detected: Exact email match. Consider merging or updating existing contact.\n\nExisting contact: John Doe (ID: abc-123)\n\nTo proceed anyway, use the update_contact tool with the existing contact ID, or create with a different email/phone."
  }],
  "isError": true,
  "structuredContent": {
    "duplicateMatches": [...],
    "suggestedAction": "merge"
  }
}
```

### Creating a Deal (MCP Tool)

```typescript
// Moderate duplicate detected
{
  "content": [{
    "type": "text",
    "text": "⚠️ Possible duplicate detected: Exact name and account match. Please review before creating.\n\nDeal \"Enterprise License\" created successfully (potential duplicate exists: \"Enterprise License\")"
  }],
  "structuredContent": {
    "deals": [...]
  }
}
```

## Similarity Thresholds

### Contacts
- **1.0** - Exact email match (blocks creation)
- **0.9** - Exact phone match (blocks creation)
- **0.7** - Name + account match (warns but allows)

### Deals
- **1.0** - Name + account + stage match (blocks creation)
- **0.95** - Name + account match (blocks creation)
- **0.8** - Name only match (warns but allows)

## Database Constraints

### Contacts
- Unique email (case-insensitive, nulls allowed via partial index)
- Index on phone for fast lookups
- Composite index on (first_name, last_name, account_id)

### Deals
- Unique (name, account_id) when account exists (partial unique index)
- Index on name for fast lookups

### Accounts
- Unique name (case-insensitive)

## Error Handling

1. **Unique Constraint Violations**: Caught and converted to duplicate detection messages
2. **Database Errors**: Logged and returned as user-friendly errors
3. **Merge Failures**: Partial failures are logged but operation continues where possible

## Future Enhancements

1. **Fuzzy Matching**: Use embeddings for semantic similarity
2. **Bulk Deduplication**: Admin tool to find and merge all duplicates
3. **User Preferences**: Allow users to configure similarity thresholds
4. **Audit Log**: Track all merges and duplicate detections
5. **UI Components**: React components for duplicate detection and merging in forms

## Testing

To test the deduplication system:

1. **Create duplicate contact:**
   ```bash
   # First contact
   create_contact { "first_name": "John", "last_name": "Doe", "email": "john@example.com" }
   
   # Duplicate (should be blocked)
   create_contact { "first_name": "John", "last_name": "Doe", "email": "john@example.com" }
   ```

2. **Create duplicate deal:**
   ```bash
   # First deal
   create_deal { "name": "Enterprise License", "account_id": "abc-123", "stage": "Discovery" }
   
   # Duplicate (should be blocked)
   create_deal { "name": "Enterprise License", "account_id": "abc-123", "stage": "Discovery" }
   ```

3. **Test merging:**
   ```typescript
   const result = await mergeContacts(supabase, sourceId, targetId);
   // Result contains merged contact with combined data
   ```

## Migration

Run the migration to add constraints and indexes:

```bash
supabase migration up
```

Or apply manually:
```sql
\i supabase/migrations/20250125000000_deduplication.sql
```

