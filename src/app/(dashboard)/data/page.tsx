'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Building2,
  Target,
  CheckSquare,
  FolderKanban,
  ExternalLink,
  Loader2,
  ChevronDown,
  ChevronRight,
  Search,
} from 'lucide-react';

type Contact = { id: string; first_name?: string; last_name?: string; email?: string };
type Organization = { id: string; name?: string };
type Opportunity = { id: string; opportunity_name?: string; bid_amount?: number; bid_currency?: string };
type Task = { id: string; title?: string; completed?: boolean; due_date?: string };
type Project = { id: string; project_name?: string; completed?: boolean };

type Section<T> = {
  title: string;
  href: string;
  icon: React.ReactNode;
  data: T[];
  isLoading: boolean;
};

export default function DataHubPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState({
    contacts: true,
    organizations: true,
    opportunities: true,
    tasks: true,
    projects: true,
  });

  useEffect(() => {
    const fetchData = async <T,>(key: keyof typeof loading, endpoint: string, setter: (data: T[]) => void) => {
      try {
        const res = await fetch(endpoint);
        if (!res.ok) {
          throw new Error(`${endpoint} responded ${res.status}`);
        }
        const json = await res.json();
        setter(Array.isArray(json) ? json : []);
      } catch (err) {
        console.error(`Failed to fetch ${key}`, err);
        setter([]);
      } finally {
        setLoading(prev => ({ ...prev, [key]: false }));
      }
    };

    fetchData<Contact>('contacts', '/api/insightly/contacts', setContacts);
    fetchData<Organization>('organizations', '/api/insightly/organizations', setOrganizations);
    fetchData<Opportunity>('opportunities', '/api/insightly/opportunities', setOpportunities);
    fetchData<Task>('tasks', '/api/insightly/tasks', setTasks);
    fetchData<Project>('projects', '/api/insightly/projects', setProjects);
  }, []);

  type SearchExtractors = Record<string, (item: any) => Array<string | number | boolean | null | undefined>>;

  const searchExtractors: SearchExtractors = {
    Contacts: (item: Contact) => [item.first_name, item.last_name, item.email],
    Organizations: (item: Organization) => [item.name],
    Opportunities: (item: Opportunity) => [item.opportunity_name, item.bid_currency, item.bid_amount],
    Tasks: (item: Task) => [item.title, item.completed ? 'completed' : 'open', item.due_date],
    Projects: (item: Project) => [item.project_name, item.completed ? 'completed' : 'in progress'],
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
      title: 'Organizations',
      href: '/organizations',
      icon: <Building2 size={18} />,
      data: organizations,
      isLoading: loading.organizations,
    },
    {
      title: 'Opportunities',
      href: '/opportunities',
      icon: <Target size={18} />,
      data: opportunities,
      isLoading: loading.opportunities,
    },
    {
      title: 'Tasks',
      href: '/tasks',
      icon: <CheckSquare size={18} />,
      data: tasks,
      isLoading: loading.tasks,
    },
    {
      title: 'Projects',
      href: '/projects',
      icon: <FolderKanban size={18} />,
      data: projects,
      isLoading: loading.projects,
    },
  ];

  const renderItem = (sectionTitle: string, item: any) => {
    switch (sectionTitle) {
      case 'Contacts':
        return `${item.first_name || ''} ${item.last_name || ''}`.trim() || item.email || 'Unnamed contact';
      case 'Organizations':
        return item.name || 'Unnamed organization';
      case 'Opportunities':
        return item.opportunity_name || 'Unnamed opportunity';
      case 'Tasks':
        return item.title || 'Untitled task';
      case 'Projects':
        return item.project_name || 'Untitled project';
      default:
        return 'Item';
    }
  };

  const renderMeta = (sectionTitle: string, item: any) => {
    if (sectionTitle === 'Tasks' && item.due_date) {
      return new Date(item.due_date).toLocaleDateString();
    }
    if (sectionTitle === 'Opportunities' && item.bid_amount) {
      return `${item.bid_currency || 'USD'} ${item.bid_amount}`;
    }
    return null;
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
          <p className="text-sm text-muted-foreground">Contacts, organizations, opportunities, tasks, and projects in one place.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts, orgs, tasks..."
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
  defaultOpen?: boolean;
  isSearching: boolean;
  searchQuery: string;
};

function CollapsibleSection({ section, renderItem, renderMeta, defaultOpen = true, isSearching, searchQuery }: CollapsibleProps) {
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
        <div className="space-y-2">
          {section.data.slice(0, 5).map((item: any) => (
            <div
              key={item.id}
              className="p-3 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
            >
              <div className="text-sm font-medium text-foreground">{renderItem(section.title, item)}</div>
              {renderMeta(section.title, item) && (
                <div className="text-xs text-muted-foreground mt-1">{renderMeta(section.title, item)}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

