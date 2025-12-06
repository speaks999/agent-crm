# Tagging System Tests

This document describes the comprehensive test suite for the tagging system.

## Test Structure

### 1. MCP Integration Tests

Location: `src/lib/mcp-tests.ts`

These tests verify that tags work correctly with MCP server tools:

#### Search Tests with Tags
- **Search CRM - With tag filter**: Tests searching entities filtered by tags
- **Search CRM - Query and tags**: Tests combining text search with tag filtering

#### Tag Integration Tests
- **Create account - With tags**: Verifies accounts can be created with tags
- **Create contact - With tags**: Verifies contacts can be created with tags
- **Create deal - With tags**: Verifies deals can be created with tags
- **Update account - Add tags**: Tests adding tags to existing accounts
- **Update contact - Modify tags**: Tests updating contact tags
- **List contacts - Filter by tag**: Tests filtering contacts by tags

### 2. Unit Tests

#### Hook Tests: `src/__tests__/hooks/useTags.test.ts`

Tests for the `useTags` hook:

- **fetchTags**: Verifies tags are fetched and sorted by usage
- **getOrCreateTag**: Tests tag creation and usage count increment
- **updateTag**: Tests tag name and color updates
- **deleteTag**: Tests tag deletion
- **mergeTags**: Tests merging tags and combining usage counts
- **getTagSuggestions**: Tests autocomplete filtering

#### Component Tests

**TagBadge**: `src/__tests__/components/TagBadge.test.tsx`
- Renders tag name
- Applies custom colors
- Shows/hides remove button
- Handles remove clicks
- Size variants

**TagInput**: `src/__tests__/components/TagInput.test.tsx`
- Renders with label
- Displays selected tags
- Opens dropdown
- Filters suggestions
- Removes tags
- Creates new tags

## Running Tests

### Prerequisites

Install testing dependencies:

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react
```

### Setup Vitest

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Create `src/__tests__/setup.ts`:

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
}));
```

### Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- useTags.test.ts

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

## Manual Testing Checklist

### Tag Creation
- [ ] Create tag with custom color via TagInput
- [ ] Create tag via TagManager
- [ ] Verify tag appears in tag list
- [ ] Verify usage_count increments when tag is used

### Tag Selection
- [ ] Select existing tag from dropdown
- [ ] Verify tag appears in selected tags
- [ ] Verify usage_count increments
- [ ] Select multiple tags

### Tag Removal
- [ ] Remove tag from entity (TagInput)
- [ ] Remove tag from filter (TagFilter)
- [ ] Verify tag is removed from entity
- [ ] Verify tag still exists in tags table

### Tag Management
- [ ] Edit tag name in TagManager
- [ ] Edit tag color in TagManager
- [ ] Merge two tags
- [ ] Delete tag
- [ ] Verify deleted tag is removed from tags table
- [ ] Verify deleted tag remains on entities (string array)

### Tag Filtering
- [ ] Filter contacts by tag
- [ ] Filter accounts by tag
- [ ] Filter deals by tag
- [ ] Filter with multiple tags
- [ ] Clear tag filters

### Search with Tags
- [ ] Search with tag filter only
- [ ] Search with query + tag filter
- [ ] Verify results are filtered correctly

### Real-time Updates
- [ ] Create tag in one browser tab
- [ ] Verify tag appears in other tabs
- [ ] Update tag in one tab
- [ ] Verify update reflects in other tabs

### Edge Cases
- [ ] Create tag with same name (case-sensitive)
- [ ] Create tag with special characters
- [ ] Add 100+ tags to entity
- [ ] Filter with non-existent tag
- [ ] Merge tag into non-existent target

## Integration Test Scenarios

### Scenario 1: Complete Tag Workflow

1. Create account "Acme Corp" with tags ["VIP", "Enterprise"]
2. Verify tags are stored in database
3. Search for accounts with tag "VIP"
4. Verify "Acme Corp" appears in results
5. Update account to add tag "Priority"
6. Verify account now has 3 tags
7. Remove "Enterprise" tag
8. Verify account has 2 tags remaining

### Scenario 2: Tag Management

1. Create tag "Important" via TagManager
2. Use tag on 5 contacts
3. Verify usage_count is 5
4. Create tag "Critical"
5. Merge "Important" into "Critical"
6. Verify "Critical" usage_count is 5
7. Verify "Important" tag is deleted
8. Verify contacts still have "Important" in tags array (string, not FK)

### Scenario 3: Multi-Entity Tagging

1. Create tag "Hot Lead"
2. Add to 3 accounts
3. Add to 5 contacts
4. Add to 2 deals
5. Search CRM with tag filter "Hot Lead"
6. Verify all 10 entities appear in results

## Performance Tests

- [ ] Load 1000 tags in TagInput dropdown
- [ ] Filter 1000 tags by search query
- [ ] Display entity with 50 tags
- [ ] Filter table with 1000 entities by tag

## Browser Compatibility

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

## Accessibility Tests

- [ ] TagBadge is keyboard accessible
- [ ] TagInput dropdown is keyboard navigable
- [ ] Screen reader announces tag names
- [ ] Color contrast meets WCAG standards
- [ ] Focus indicators visible

