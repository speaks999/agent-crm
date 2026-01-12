'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Building2,
  Target,
  CheckSquare,
  ExternalLink,
  Loader2,
  ChevronDown,
  ChevronRight,
  Search,
  Tag,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
} from 'lucide-react';

type Contact = {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  created_at?: string;
};

type Account = {
  id: string;
  name?: string;
  industry?: string;
  website?: string;
  created_at?: string;
};

type Deal = {
  id: string;
  name?: string;
  amount?: number;
  stage?: string;
  status?: string;
  created_at?: string;
};

type Task = {
  id: string;
  type?: string;
  summary?: string;
  transcript?: string;
  contact_id?: string;
  deal_id?: string;
  created_at?: string;
};

type TagItem = {
  id: string;
  tag_name: string;
  color: string;
  entity_type?: string;
  usage_count?: number;
  created_at?: string;
};

type Section<T> = {
  title: string;
  href: string;
  icon: React.ReactNode;
  data: T[];
  isLoading: boolean;
};

async function fetchMCPData(toolName: string, args: Record<string, unknown> = {}) {
  const response = await fetch('/api/mcp/call-tool', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: toolName, arguments: args }),
  });
  
  if (!response.ok) {
    throw new Error(`MCP request failed: ${response.status}`);
  }
  
  const json = await response.json();
  return json.result?.structuredContent || {};
}

export default function DataHubPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState({
    contacts: true,
    accounts: true,
    deals: true,
    tasks: true,
    tags: true,
  });

  useEffect(() => {
    const fetchAll = async () => {
      // Helper to sort by created_at descending (newest first)
      const sortByNewest = <T extends { created_at?: string }>(items: T[]): T[] => {
        return [...items].sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
      };

      // Fetch contacts
      try {
        const data = await fetchMCPData('list_contacts');
        setContacts(sortByNewest(data.contacts || []));
      } catch (err) {
        console.error('Failed to fetch contacts', err);
        setContacts([]);
      } finally {
        setLoading(prev => ({ ...prev, contacts: false }));
      }

      // Fetch accounts
      try {
        const data = await fetchMCPData('list_accounts');
        setAccounts(sortByNewest(data.accounts || []));
      } catch (err) {
        console.error('Failed to fetch accounts', err);
        setAccounts([]);
      } finally {
        setLoading(prev => ({ ...prev, accounts: false }));
      }

      // Fetch deals
      try {
        const data = await fetchMCPData('list_deals');
        setDeals(sortByNewest(data.deals || []));
      } catch (err) {
        console.error('Failed to fetch deals', err);
        setDeals([]);
      } finally {
        setLoading(prev => ({ ...prev, deals: false }));
      }

      // Fetch tasks (interactions)
      try {
        const data = await fetchMCPData('list_interactions');
        setTasks(sortByNewest(data.interactions || []));
      } catch (err) {
        console.error('Failed to fetch tasks', err);
        setTasks([]);
      } finally {
        setLoading(prev => ({ ...prev, tasks: false }));
      }

      // Fetch tags
      try {
        const data = await fetchMCPData('list_tags');
        setTags(data.tags || []);
      } catch (err) {
        console.error('Failed to fetch tags', err);
        setTags([]);
      } finally {
        setLoading(prev => ({ ...prev, tags: false }));
      }
    };

    fetchAll();
  }, []);

  const refreshTags = async () => {
    setLoading(prev => ({ ...prev, tags: true }));
    try {
      const data = await fetchMCPData('list_tags');
      setTags(data.tags || []);
    } catch (err) {
      console.error('Failed to fetch tags', err);
    } finally {
      setLoading(prev => ({ ...prev, tags: false }));
    }
  };

  type SearchExtractors = Record<string, (item: any) => Array<string | number | boolean | null | undefined>>;

  const searchExtractors: SearchExtractors = {
    Contacts: (item: Contact) => [item.first_name, item.last_name, item.email, item.role],
    Accounts: (item: Account) => [item.name, item.industry, item.website],
    Deals: (item: Deal) => [item.name, item.stage, item.status, item.amount],
    Tasks: (item: Task) => [item.summary, item.transcript, item.type],
    Tags: (item: TagItem) => [item.tag_name, item.entity_type],
  };

  const sections: Section<any>[] = [
    {
      title: 'Contacts',
      href: '/contacts',
      icon: <Users size={18} />,
      data: contacts,
      isLoading: loading.contacts,
    },
    {
      title: 'Accounts',
      href: '/organizations',
      icon: <Building2 size={18} />,
      data: accounts,
      isLoading: loading.accounts,
    },
    {
      title: 'Deals',
      href: '/opportunities',
      icon: <Target size={18} />,
      data: deals,
      isLoading: loading.deals,
    },
    {
      title: 'Tasks',
      href: '/tasks',
      icon: <CheckSquare size={18} />,
      data: tasks,
      isLoading: loading.tasks,
    },
  ];

  const renderItem = (sectionTitle: string, item: any) => {
    switch (sectionTitle) {
      case 'Contacts':
        return `${item.first_name || ''} ${item.last_name || ''}`.trim() || item.email || 'Unnamed contact';
      case 'Accounts':
        return item.name || 'Unnamed account';
      case 'Deals':
        return item.name || 'Unnamed deal';
      case 'Tasks':
        return item.summary || item.transcript || `${item.type?.charAt(0).toUpperCase()}${item.type?.slice(1) || 'Note'}`;
      default:
        return 'Item';
    }
  };

  const renderMeta = (sectionTitle: string, item: any) => {
    if (sectionTitle === 'Contacts' && item.role) {
      return item.role;
    }
    if (sectionTitle === 'Accounts' && item.industry) {
      return item.industry;
    }
    if (sectionTitle === 'Deals') {
      const parts = [];
      if (item.stage) parts.push(item.stage);
      if (item.amount) parts.push(`$${item.amount.toLocaleString()}`);
      return parts.join(' • ') || null;
    }
    if (sectionTitle === 'Tasks') {
      const parts = [];
      if (item.type) parts.push(item.type.charAt(0).toUpperCase() + item.type.slice(1));
      if (item.created_at) {
        const date = new Date(item.created_at);
        parts.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      }
      return parts.join(' • ') || null;
    }
    return null;
  };

  const getItemHref = (sectionTitle: string, item: any): string | null => {
    switch (sectionTitle) {
      case 'Contacts':
        return `/contacts/${item.id}`;
      case 'Accounts':
        return `/organizations/${item.id}`;
      case 'Deals':
        return `/opportunities/${item.id}`;
      case 'Tasks':
        return `/tasks/${item.id}`;
      default:
        return null;
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isSearching = Boolean(normalizedQuery);

  const sectionsToRender = sections.map((section) => {
    const extractor = searchExtractors[section.title] || ((item: any) => [item.id]);

    const filteredData = !normalizedQuery
      ? section.data
      : section.data.filter((item) => {
          const values = extractor(item)
            .concat(item.id ? [item.id] : [])
            .map((value) => (value === null || value === undefined ? '' : String(value).toLowerCase()));
          return values.some((value) => value.includes(normalizedQuery));
        });

    return { ...section, data: filteredData };
  });

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Data Hub</h1>
          <p className="text-sm text-muted-foreground">Contacts, accounts, deals, and interactions from your CRM.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts, accounts, deals..."
              aria-label="Search data"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-glow transition-colors text-sm whitespace-nowrap"
          >
            Go to Chat
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sectionsToRender.map((section) => (
          <CollapsibleSection
            key={section.title}
            section={section}
            renderItem={renderItem}
            renderMeta={renderMeta}
            getItemHref={getItemHref}
            isSearching={isSearching}
            searchQuery={searchQuery.trim()}
            defaultOpen
          />
        ))}
      </div>

      {/* Tags Section */}
      <div className="mt-6">
        <TagsSection 
          tags={tags} 
          isLoading={loading.tags} 
          onRefresh={refreshTags}
          searchQuery={normalizedQuery}
        />
      </div>
    </div>
  );
}

type CollapsibleProps = {
  section: Section<any>;
  renderItem: (sectionTitle: string, item: any) => string;
  renderMeta: (sectionTitle: string, item: any) => string | null;
  getItemHref: (sectionTitle: string, item: any) => string | null;
  defaultOpen?: boolean;
  isSearching: boolean;
  searchQuery: string;
};

function CollapsibleSection({ section, renderItem, renderMeta, getItemHref, defaultOpen = true, isSearching, searchQuery }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-left"
        >
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          {section.icon}
          <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
          <span className="text-sm text-muted-foreground ml-2">({section.data.length})</span>
        </button>
        <Link
          href={section.href}
          className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary-glow transition-colors"
        >
          View all
          <ExternalLink size={14} />
        </Link>
      </div>

      {!open ? null : section.isLoading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground text-sm gap-2">
          <Loader2 className="animate-spin" size={18} />
          Loading...
        </div>
      ) : section.data.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4">
          {isSearching ? (searchQuery ? `No matches for "${searchQuery}".` : 'No matches found.') : 'No records found.'}
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {section.data.slice(0, 10).map((item: any) => {
            const itemHref = getItemHref(section.title, item);
            const content = (
              <>
                <div className="text-sm font-medium text-foreground">{renderItem(section.title, item)}</div>
                {renderMeta(section.title, item) && (
                  <div className="text-xs text-muted-foreground mt-1">{renderMeta(section.title, item)}</div>
                )}
              </>
            );

            return itemHref ? (
              <Link
                key={item.id}
                href={itemHref}
                className="block p-3 rounded-lg border border-border bg-background hover:bg-muted hover:border-primary transition-colors cursor-pointer"
              >
                {content}
              </Link>
            ) : (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-border bg-background"
              >
                {content}
              </div>
            );
          })}
          {section.data.length > 10 && (
            <Link
              href={section.href}
              className="block text-xs text-primary text-center py-2 hover:text-primary-glow transition-colors"
            >
              +{section.data.length - 10} more items →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// Tag Modal for Create/Edit
function TagModal({
  tag,
  onClose,
  onSave,
}: {
  tag: TagItem | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [tagName, setTagName] = useState(tag?.tag_name || '');
  const [color, setColor] = useState(tag?.color || '#3B82F6');
  const [entityType, setEntityType] = useState(tag?.entity_type || 'all');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(tag);

  const presetColors = [
    '#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B',
    '#F97316', '#EF4444', '#EC4899', '#6366F1', '#14B8A6',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) {
      setError('Tag name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isEditing && tag) {
        // For editing, we need to delete and recreate since there's no update_tag
        await fetchMCPData('delete_tag', { id: tag.id });
        await fetchMCPData('create_tag', {
          tag_name: tagName.trim(),
          color,
          entity_type: entityType,
        });
      } else {
        await fetchMCPData('create_tag', {
          tag_name: tagName.trim(),
          color,
          entity_type: entityType,
        });
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tag');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Tag size={18} className="text-primary" />
            {isEditing ? 'Edit Tag' : 'Create Tag'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Tag Name *</label>
            <input
              type="text"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="e.g., Priority, VIP, Hot Lead"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Color</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {presetColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Entity Type</label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">All (Universal)</option>
              <option value="account">Account</option>
              <option value="contact">Contact</option>
              <option value="deal">Deal</option>
              <option value="pipeline">Pipeline</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">Controls where this tag can be used</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEditing ? 'Update Tag' : 'Create Tag'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Tags Section Component
function TagsSection({
  tags,
  isLoading,
  onRefresh,
  searchQuery,
}: {
  tags: TagItem[];
  isLoading: boolean;
  onRefresh: () => void;
  searchQuery: string;
}) {
  const [open, setOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredTags = searchQuery
    ? tags.filter(tag => 
        tag.tag_name.toLowerCase().includes(searchQuery) ||
        (tag.entity_type && tag.entity_type.toLowerCase().includes(searchQuery))
      )
    : tags;

  const handleDelete = async (tag: TagItem) => {
    if (!confirm(`Delete tag "${tag.tag_name}"? This cannot be undone.`)) return;
    
    setDeletingId(tag.id);
    try {
      await fetchMCPData('delete_tag', { id: tag.id });
      onRefresh();
    } catch (err) {
      console.error('Failed to delete tag:', err);
      alert('Failed to delete tag');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = () => {
    setShowModal(false);
    setEditingTag(null);
    onRefresh();
  };

  const handleEdit = (tag: TagItem) => {
    setEditingTag(tag);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingTag(null);
    setShowModal(true);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-left"
        >
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Tag size={18} />
          <h2 className="text-lg font-semibold text-foreground">Tags</h2>
          <span className="text-sm text-muted-foreground ml-2">({filteredTags.length})</span>
        </button>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} />
          New Tag
        </button>
      </div>

      {!open ? null : isLoading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground text-sm gap-2">
          <Loader2 className="animate-spin" size={18} />
          Loading...
        </div>
      ) : filteredTags.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4">
          {searchQuery ? `No tags matching "${searchQuery}".` : 'No tags found. Create one to get started!'}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {filteredTags.map((tag) => (
            <div
              key={tag.id}
              className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: tag.color }}
              />
              <span className="text-sm font-medium text-foreground">{tag.tag_name}</span>
              {tag.entity_type && tag.entity_type !== 'all' && (
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {tag.entity_type}
                </span>
              )}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(tag)}
                  className="p-1 hover:bg-primary/10 rounded text-muted-foreground hover:text-primary transition-colors"
                  title="Edit tag"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => handleDelete(tag)}
                  disabled={deletingId === tag.id}
                  className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  title="Delete tag"
                >
                  {deletingId === tag.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <TagModal
          tag={editingTag}
          onClose={() => {
            setShowModal(false);
            setEditingTag(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
