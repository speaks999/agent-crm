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
} from 'lucide-react';

type Contact = {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: string;
};

type Account = {
  id: string;
  name?: string;
  industry?: string;
  website?: string;
};

type Deal = {
  id: string;
  name?: string;
  amount?: number;
  stage?: string;
  status?: string;
};

type Task = {
  id: string;
  title?: string;
  due_date?: string;
  completed?: boolean;
  priority?: number;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState({
    contacts: true,
    accounts: true,
    deals: true,
    tasks: true,
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

      // Fetch tasks
      try {
        const response = await fetch('/api/insightly/tasks');
        const data = await response.json();
        // Sort by due date (earliest first)
        const sorted = [...(data || [])].sort((a: Task, b: Task) => {
          const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          return dateA - dateB;
        });
        setTasks(sorted);
      } catch (err) {
        console.error('Failed to fetch tasks', err);
        setTasks([]);
      } finally {
        setLoading(prev => ({ ...prev, tasks: false }));
      }
    };

    fetchAll();
  }, []);

  type SearchExtractors = Record<string, (item: any) => Array<string | number | boolean | null | undefined>>;

  const searchExtractors: SearchExtractors = {
    Contacts: (item: Contact) => [item.first_name, item.last_name, item.email, item.role],
    Accounts: (item: Account) => [item.name, item.industry, item.website],
    Deals: (item: Deal) => [item.name, item.stage, item.status, item.amount],
    Tasks: (item: Task) => [item.title, item.due_date],
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
        return item.title || 'Untitled task';
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
      if (item.completed) return '✓ Completed';
      if (item.due_date) {
        const date = new Date(item.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(date);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate.getTime() === today.getTime()) return 'Due Today';
        if (dueDate < today) return 'Overdue';
        return `Due ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      }
      return null;
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
    <div className="flex-1 overflow-auto p-8">
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
            <ExternalLink size={16} />
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
