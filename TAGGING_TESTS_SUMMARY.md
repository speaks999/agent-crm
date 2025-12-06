# Tagging System Tests - Summary

## Test Files Created

### 1. MCP Integration Tests
**File**: `src/lib/mcp-tests.ts`

Added 8 new test cases:
- 2 search tests with tag filtering
- 6 tag integration tests for create/update operations with tags

**Category**: "Tags" added to test suite

### 2. Unit Tests

#### Hook Tests
**File**: `src/__tests__/hooks/useTags.test.ts`
- Tests for `fetchTags`, `getOrCreateTag`, `updateTag`, `deleteTag`, `mergeTags`, `getTagSuggestions`
- Uses Vitest and React Testing Library

#### Component Tests
**File**: `src/__tests__/components/TagBadge.test.tsx`
- Tests for TagBadge rendering, colors, remove functionality, sizes

**File**: `src/__tests__/components/TagInput.test.tsx`
- Tests for TagInput dropdown, tag selection, creation, removal

### 3. Documentation
**File**: `TAGGING_TESTS.md`
- Comprehensive testing guide
- Manual testing checklist
- Integration test scenarios
- Performance and accessibility tests

## MCP Server Updates

Updated MCP server to support tags:

1. **Schema Updates** (`mcp-server/types.ts`):
   - Added `tags: z.array(z.string()).optional()` to:
     - `CreateAccountSchema`
     - `UpdateAccountSchema`
     - `CreateContactSchema`
     - `UpdateContactSchema`
     - `CreateDealSchema`
     - `UpdateDealSchema`

2. **Handler Updates**:
   - `accounts.ts`: Supports tags in create/update
   - `contacts.ts`: Supports tags in create/update/list (with tag filtering)
   - `deals.ts`: Supports tags in create/update
   - `search.ts`: Supports `tags_filter` parameter

## Test Coverage

### MCP Tests (8 tests)
- ✅ Search with tag filter
- ✅ Search with query + tag filter
- ✅ Create account with tags
- ✅ Create contact with tags
- ✅ Create deal with tags
- ✅ Update account with tags
- ✅ Update contact with tags
- ✅ List contacts filtered by tags

### Unit Tests
- ✅ Hook: fetchTags
- ✅ Hook: getOrCreateTag (existing and new)
- ✅ Hook: updateTag
- ✅ Hook: deleteTag
- ✅ Hook: mergeTags
- ✅ Hook: getTagSuggestions
- ✅ Component: TagBadge rendering
- ✅ Component: TagBadge colors
- ✅ Component: TagBadge remove
- ✅ Component: TagInput dropdown
- ✅ Component: TagInput selection
- ✅ Component: TagInput creation

## Running Tests

### Setup Testing Framework

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

### Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- useTags.test.ts

# Run MCP tests (via UI)
# Navigate to /admin/test and select "Tags" category
```

## Next Steps

1. **Set up testing framework** (if not already done)
2. **Run migration** to add tags columns to database
3. **Run MCP tests** via the test UI at `/admin/test`
4. **Run unit tests** once testing framework is configured
5. **Manual testing** using the checklist in `TAGGING_TESTS.md`

## Notes

- MCP server has been updated to support tags in all entity operations
- Tests are ready but require the database migration to be run first
- Unit tests use Vitest - adjust if using a different framework
- All tag operations are case-sensitive
- Tags are stored as string arrays, not foreign keys

