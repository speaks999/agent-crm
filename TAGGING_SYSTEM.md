# Tagging System Documentation

This document describes the comprehensive tagging system implemented in the Agent CRM application.

## Overview

The tagging system allows users to:
- Create and manage tags with custom colors
- Tag entities (accounts, contacts, deals, interactions, etc.)
- Filter entities by tags
- Search and autocomplete tags
- Merge and delete tags
- Track tag usage statistics

## Database Schema

### Tags Table

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY,
  tag_name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#A2B758',
  entity_type TEXT NOT NULL DEFAULT 'all',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Entity Tables

All entity tables have a `tags TEXT[]` column that stores an array of tag names:
- `accounts.tags`
- `contacts.tags`
- `deals.tags`
- `interactions.tags`
- `organizations.tags` (if exists)
- `projects.tags` (if exists)
- `tasks.tags` (if exists)

## Components

### TagBadge

Display component for showing a tag with optional remove button.

```tsx
import { TagBadge } from '@/components/ui/TagBadge';

<TagBadge
  tag="VIP"
  color="#A2B758"
  onRemove={() => handleRemove('VIP')}
  size="sm"
/>
```

### TagInput

Multi-select dropdown with autocomplete and tag creation.

```tsx
import { TagInput } from '@/components/ui/TagInput';

<TagInput
  value={formData.tags || []}
  onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
  entityType="contact"
  label="Tags"
  placeholder="Add tags..."
/>
```

### TagFilter

Popover-based filter for data tables.

```tsx
import { TagFilter } from '@/components/data/TagFilter';

<TagFilter
  selectedTags={filterTags}
  onTagsChange={setFilterTags}
  entityType="contact"
/>
```

### TagManager

Modal for administrative tag management.

```tsx
import { TagManager } from '@/components/data/TagManager';

const [tagManagerOpen, setTagManagerOpen] = useState(false);

<TagManager
  open={tagManagerOpen}
  onOpenChange={setTagManagerOpen}
/>
```

## Hook: useTags

The `useTags` hook provides all tag-related functionality:

```tsx
import { useTags } from '@/hooks/useTags';

const {
  tags,              // All tags array
  loading,           // Loading state
  error,             // Error state
  fetchTags,         // Manually refresh tags
  getOrCreateTag,    // Get or create a tag
  updateTag,         // Update tag name/color
  deleteTag,         // Delete a tag
  mergeTags,         // Merge two tags
  getTagSuggestions, // Get autocomplete suggestions
  DEFAULT_COLORS,    // Default color palette
} = useTags();
```

## Form Integration

### Example: Contact Form

```tsx
'use client';

import { useState } from 'react';
import { TagInput } from '@/components/ui/TagInput';
import { supabase } from '@/lib/supabaseClient';

export function ContactForm() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    tags: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        ...formData,
        tags: formData.tags, // Array of tag names
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating contact:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Other form fields */}
      
      <TagInput
        value={formData.tags}
        onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
        entityType="contact"
        label="Tags"
      />
      
      <button type="submit">Create Contact</button>
    </form>
  );
}
```

## Table Integration

### Example: Contacts Table

```tsx
'use client';

import { TagBadge } from '@/components/ui/TagBadge';
import { useTags } from '@/hooks/useTags';

export function ContactsTable({ contacts }: { contacts: Contact[] }) {
  const { tags } = useTags();

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Tags</th>
        </tr>
      </thead>
      <tbody>
        {contacts.map((contact) => (
          <tr key={contact.id}>
            <td>{contact.first_name} {contact.last_name}</td>
            <td>{contact.email}</td>
            <td>
              <div className="flex flex-wrap gap-1">
                {contact.tags?.slice(0, 3).map((tagName) => {
                  const tagData = tags.find(t => t.tag_name === tagName);
                  return (
                    <TagBadge
                      key={tagName}
                      tag={tagName}
                      color={tagData?.color}
                      size="sm"
                    />
                  );
                })}
                {contact.tags?.length > 3 && (
                  <span className="text-xs text-slate-500">
                    +{contact.tags.length - 3}
                  </span>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Filtering by Tags

### In Supabase Queries

```tsx
// Filter contacts by tags
const { data } = await supabase
  .from('contacts')
  .select('*')
  .overlaps('tags', ['VIP', 'Enterprise']); // Returns contacts with ANY of these tags
```

### Using TagFilter Component

```tsx
const [filterTags, setFilterTags] = useState<string[]>([]);

// Apply filter to query
const { data } = await supabase
  .from('contacts')
  .select('*')
  .overlaps('tags', filterTags.length > 0 ? filterTags : undefined);
```

## MCP Server Integration

The search tool supports tag filtering:

```typescript
// In MCP server
const result = await callTool('search_crm', {
  query: 'Acme',
  tags_filter: ['VIP', 'Enterprise']
});
```

## Chat/NLP Integration

Parse tag filters from natural language:

```typescript
// Extract tag from query
const tagMatch = text.match(
  /(?:with\s+(?:the\s+)?tag(?:ged)?|tagged)\s+["']?([A-Za-z0-9_\-\s]+?)["']?/i
);

if (tagMatch) {
  const tagFilter = tagMatch[1].trim();
  // Apply tag filter to query
}
```

Example queries:
- "Show me contacts with tag VIP"
- "Find opportunities tagged Priority"
- "List tasks with the Important tag"

## Color Palette

### Default Colors (8)
- `#A2B758` - primary lime
- `#0A2C19` - secondary forest
- `#22c55e` - success green
- `#f59e0b` - warning amber
- `#3b82f6` - info blue
- `#ef4444` - destructive red
- `#8b5cf6` - purple
- `#ec4899` - pink

### Extended Colors (28)
The TagManager component includes 20 additional colors for more variety.

## Key Design Decisions

1. **Case-Sensitive**: Tag names are case-sensitive ("VIP" ≠ "vip")
2. **Universal Tags**: `entity_type = 'all'` means tags work across all entity types
3. **String Array Storage**: Entities store `TEXT[]` of tag names (not foreign keys) for flexibility
4. **Usage Tracking**: `usage_count` enables smart autocomplete ordering
5. **No Limits**: Users can create unlimited tags, add unlimited tags to entities
6. **Real-time Updates**: Changes to tags are reflected immediately via Supabase real-time subscriptions

## Migration

Run the migration to set up the tagging system:

```bash
# Apply migration
psql -h your-db-host -U postgres -d your-db -f supabase/migrations/20250124000000_tags_system.sql
```

Or use Supabase CLI:

```bash
supabase db push
```

## Testing Checklist

- [ ] Create tag with custom color
- [ ] Select existing tag (usage count increments)
- [ ] Create tag inline from TagInput
- [ ] Remove tag from entity
- [ ] Edit tag name/color in TagManager
- [ ] Merge two tags (usage counts combine)
- [ ] Delete tag
- [ ] Filter table by tag
- [ ] Chat query: "Show contacts with tag X"
- [ ] Real-time: Tag changes reflect immediately

