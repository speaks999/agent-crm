# Deduplication System Tests

## Overview

Comprehensive test suite for the deduplication and duplicate prevention system.

## Test Files

### 1. Unit Tests (`src/__tests__/lib/deduplication.test.ts`)

Tests for the core deduplication functions:

#### Contact Deduplication
- ✅ **Exact email match** - Detects duplicate by email (similarity: 1.0)
- ✅ **Phone number match** - Detects duplicate by normalized phone (similarity: 0.9)
- ✅ **Name + account match** - Detects duplicate by name and account (similarity: 0.7)
- ✅ **No duplicate found** - Returns false when no matches
- ✅ **Match prioritization** - Email match prioritized over name match
- ✅ **Phone normalization** - Handles different phone formats

#### Deal Deduplication
- ✅ **Name + account match** - Detects duplicate by name and account (similarity: 0.95)
- ✅ **Name + account + stage** - Detects duplicate with same stage (similarity: 1.0)
- ✅ **Name only match** - Detects duplicate by name alone (similarity: 0.8)
- ✅ **No duplicate found** - Returns false when no matches
- ✅ **Case-insensitive matching** - Handles different case variations

#### Merging Functions
- ✅ **Merge contacts** - Successfully merges two contacts
- ✅ **Merge deals** - Successfully merges two deals and sums amounts
- ✅ **Merge error handling** - Handles missing source/target records
- ✅ **Interaction updates** - Updates related interactions during merge

#### Edge Cases
- ✅ **Null email handling** - Gracefully handles null emails
- ✅ **Empty string email** - Handles empty string emails
- ✅ **Phone format variations** - Handles different phone formats
- ✅ **Short phone numbers** - Doesn't match phone numbers < 10 digits

### 2. Integration Tests (`src/__tests__/integration/deduplication-mcp.test.ts`)

Tests for MCP tool integration with deduplication:

#### Contact Tool Integration
- ✅ **Block strong duplicates** - Blocks creation when similarity ≥ 0.9
- ✅ **Warn moderate duplicates** - Warns but allows when similarity ≥ 0.8
- ✅ **Allow unique contacts** - Creates normally when no duplicates
- ✅ **Handle constraint violations** - Converts DB errors to duplicate messages

#### Deal Tool Integration
- ✅ **Block strong duplicates** - Blocks creation when similarity ≥ 0.9
- ✅ **Warn moderate duplicates** - Warns but allows when similarity ≥ 0.8
- ✅ **Allow unique deals** - Creates normally when no duplicates

### 3. MCP Test Suite (`src/lib/mcp-tests.ts`)

End-to-end tests via the MCP test page:

#### Deduplication Category (7 tests)
- ✅ **Duplicate Contact - Email Match** - Tests blocking duplicate email
- ✅ **Duplicate Contact - Phone Match** - Tests blocking duplicate phone
- ✅ **Duplicate Contact - Name + Account** - Tests warning for name+account match
- ✅ **Duplicate Deal - Name + Account** - Tests blocking duplicate deal with account
- ✅ **Duplicate Deal - Name Only** - Tests warning for name-only match
- ✅ **No Duplicate - Unique Contact** - Tests successful creation of unique contact
- ✅ **No Duplicate - Unique Deal** - Tests successful creation of unique deal

## Running Tests

### Unit Tests

```bash
# Run all deduplication unit tests
npm test -- deduplication.test.ts

# Run with coverage
npm test -- deduplication.test.ts --coverage

# Run in watch mode
npm test -- deduplication.test.ts --watch
```

### Integration Tests

```bash
# Run MCP integration tests
npm test -- deduplication-mcp.test.ts
```

### MCP Test Suite (UI)

1. Navigate to `/admin/test`
2. Select "Deduplication" from category filter
3. Click "Run All Tests" or run individual tests
4. Verify:
   - Duplicate tests show warnings/errors
   - Unique tests succeed
   - Setup functions create initial records
   - Cleanup functions remove test data

## Test Scenarios

### Scenario 1: Strong Duplicate Detection

**Setup:**
1. Create contact: `{ first_name: "John", last_name: "Doe", email: "john@example.com" }`

**Test:**
2. Attempt to create: `{ first_name: "John", last_name: "Smith", email: "john@example.com" }`

**Expected:**
- ❌ Creation blocked
- ⚠️ Error message: "Strong duplicate detected: Exact email match"
- 📋 Suggests using `update_contact` with existing ID

### Scenario 2: Moderate Duplicate Detection

**Setup:**
1. Create contact: `{ first_name: "John", last_name: "Doe", account_id: "account-1" }`

**Test:**
2. Attempt to create: `{ first_name: "John", last_name: "Doe", account_id: "account-1" }`

**Expected:**
- ⚠️ Warning shown
- ✅ Creation allowed
- 📝 Message: "Possible duplicate detected: Name and account match"

### Scenario 3: Unique Creation

**Test:**
1. Create contact: `{ first_name: "Unique", last_name: "Person", email: "unique@example.com" }`

**Expected:**
- ✅ Creation succeeds
- 📝 No duplicate warnings
- ✨ Contact created normally

### Scenario 4: Deal Deduplication

**Setup:**
1. Create deal: `{ name: "Enterprise License", account_id: "account-1", stage: "Discovery" }`

**Test:**
2. Attempt to create: `{ name: "Enterprise License", account_id: "account-1", stage: "Proposal" }`

**Expected:**
- ❌ Creation blocked (strong duplicate)
- ⚠️ Error message: "Strong duplicate detected: Exact name and account match"

## Test Coverage

### Functions Tested
- ✅ `checkDuplicateContact()` - 6 test cases
- ✅ `checkDuplicateDeal()` - 5 test cases
- ✅ `mergeContacts()` - 3 test cases
- ✅ `mergeDeals()` - 3 test cases
- ✅ Edge cases - 4 test cases

### Integration Points Tested
- ✅ MCP `create_contact` tool with deduplication
- ✅ MCP `create_deal` tool with deduplication
- ✅ Error handling and user messaging
- ✅ Database constraint violations

### Total Test Cases
- **Unit Tests**: 21 test cases
- **Integration Tests**: 7 test cases
- **MCP Test Suite**: 7 test cases
- **Total**: 35 test cases

## Manual Testing Checklist

### Contact Deduplication
- [ ] Create contact with unique email → Should succeed
- [ ] Create contact with duplicate email → Should be blocked
- [ ] Create contact with duplicate phone → Should be blocked
- [ ] Create contact with same name + account → Should warn
- [ ] Create contact with different account → Should succeed

### Deal Deduplication
- [ ] Create deal with unique name → Should succeed
- [ ] Create deal with duplicate name + account → Should be blocked
- [ ] Create deal with duplicate name only → Should warn
- [ ] Create deal with same name, different account → Should succeed

### Merging
- [ ] Merge two contacts → Should combine data
- [ ] Merge two deals → Should sum amounts
- [ ] Merge with missing source → Should error gracefully
- [ ] Merge updates interactions → Should point to target

### Edge Cases
- [ ] Null email handling → Should not crash
- [ ] Empty string email → Should not match
- [ ] Phone format variations → Should normalize correctly
- [ ] Short phone numbers → Should not match

## Troubleshooting

### Tests Failing

1. **Check database migration**: Ensure `20250125000000_deduplication.sql` is applied
2. **Verify MCP server**: Ensure deduplication utilities are compiled
3. **Check mocks**: Unit tests use mocks - verify they match actual behavior
4. **Database state**: Integration tests may require clean database

### Common Issues

- **"Duplicate not detected"**: Check similarity thresholds in deduplication.ts
- **"Merge fails"**: Verify foreign key constraints allow updates
- **"Test setup fails"**: Check MCP server is running and accessible

## Next Steps

1. ✅ Unit tests created
2. ✅ Integration tests created
3. ✅ MCP test suite updated
4. ⏳ Run tests to verify functionality
5. ⏳ Add performance tests for large datasets
6. ⏳ Add UI tests for duplicate warnings

