'use client';

import React, { useState, useEffect } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetProps } from './types';
import { 
    User, 
    Briefcase, 
    Building2, 
    CheckSquare, 
    Loader2, 
    ChevronRight,
    Calendar,
    DollarSign,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { fetchTeamMembers, fetchMCPData } from '@/lib/fetchMCPData';

interface TeamMember {
    id: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    email: string;
    role?: string;
    avatar_url?: string;
}

interface Deal {
    id: string;
    name: string;
    amount?: number;
    status?: string;
    close_date?: string;
    assigned_to?: string;
}

interface Contact {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    assigned_to?: string;
}

interface Account {
    id: string;
    name: string;
    industry?: string;
    assigned_to?: string;
}

interface Task {
    id: string;
    type: string;
    title?: string;
    summary?: string;
    due_date?: string;
    assigned_to?: string;
}

type TabType = 'deals' | 'tasks' | 'contacts' | 'accounts';

const TAB_CONFIG: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'deals', label: 'Deals', icon: <DollarSign size={14} /> },
    { key: 'tasks', label: 'Tasks', icon: <CheckSquare size={14} /> },
    { key: 'contacts', label: 'Contacts', icon: <User size={14} /> },
    { key: 'accounts', label: 'Accounts', icon: <Building2 size={14} /> },
];

export function MyWorkWidget({ config, onRemove, onResize, onSettings, onDragStart, isDragging }: WidgetProps) {
    const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('deals');

    useEffect(() => {
        async function fetchData() {
            try {
                // First, get the current user (first team member for now, or could be from session)
                const teamMembers = await fetchTeamMembers();
                
                if (teamMembers.length === 0) {
                    setIsLoading(false);
                    return;
                }

                // Use first team member as "current user" (in production, this would come from auth session)
                // Build a user object with the name combined from first_name and last_name
                const member = teamMembers[0];
                const user = {
                    ...member,
                    name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email,
                };
                setCurrentUser(user);

                // Fetch all entities assigned to this user in parallel
                const [dealsData, tasksData, contactsData, accountsData] = await Promise.all([
                    fetchMCPData('list_deals', { assigned_to: user.id }),
                    fetchMCPData('list_interactions', { assigned_to: user.id }),
                    fetchMCPData('list_contacts', { assigned_to: user.id }),
                    fetchMCPData('list_accounts', { assigned_to: user.id }),
                ]);

                setDeals(dealsData.deals || []);
                setTasks(tasksData.interactions || []);
                setContacts(contactsData.contacts || []);
                setAccounts(accountsData.accounts || []);
            } catch (error) {
                console.error('Failed to fetch my work data:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const getCounts = () => ({
        deals: deals.length,
        tasks: tasks.length,
        contacts: contacts.length,
        accounts: accounts.length,
    });

    const counts = getCounts();
    const totalItems = counts.deals + counts.tasks + counts.contacts + counts.accounts;

    const formatCurrency = (amount?: number) => {
        if (!amount) return '';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'Overdue';
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays < 7) return `In ${diffDays} days`;
        return date.toLocaleDateString();
    };

    const getUrgencyColor = (dueDate?: string) => {
        if (!dueDate) return 'text-muted-foreground';
        const date = new Date(dueDate);
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'text-destructive';
        if (diffDays === 0) return 'text-orange-500';
        if (diffDays <= 2) return 'text-yellow-500';
        return 'text-muted-foreground';
    };

    const renderDeals = () => (
        <div className="space-y-2">
            {deals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No deals assigned</p>
            ) : (
                deals.slice(0, 5).map((deal) => (
                    <Link
                        key={deal.id}
                        href={`/opportunities/${deal.id}`}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <Briefcase size={14} className="text-primary flex-shrink-0" />
                            <span className="text-sm text-foreground truncate">{deal.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {deal.amount && (
                                <span className="text-xs text-green-600 font-medium">
                                    {formatCurrency(deal.amount)}
                                </span>
                            )}
                            <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </Link>
                ))
            )}
            {deals.length > 5 && (
                <Link href="/opportunities" className="block text-center text-xs text-primary hover:underline py-1">
                    View all {deals.length} deals →
                </Link>
            )}
        </div>
    );

    const renderTasks = () => (
        <div className="space-y-2">
            {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No tasks assigned</p>
            ) : (
                tasks.slice(0, 5).map((task) => (
                    <Link
                        key={task.id}
                        href={`/tasks/${task.id}`}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <CheckSquare size={14} className="text-blue-500 flex-shrink-0" />
                            <span className="text-sm text-foreground truncate">
                                {task.title || task.summary || `${task.type} task`}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {task.due_date && (
                                <span className={`text-xs flex items-center gap-1 ${getUrgencyColor(task.due_date)}`}>
                                    <AlertCircle size={10} />
                                    {formatDate(task.due_date)}
                                </span>
                            )}
                            <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </Link>
                ))
            )}
            {tasks.length > 5 && (
                <Link href="/tasks" className="block text-center text-xs text-primary hover:underline py-1">
                    View all {tasks.length} tasks →
                </Link>
            )}
        </div>
    );

    const renderContacts = () => (
        <div className="space-y-2">
            {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No contacts assigned</p>
            ) : (
                contacts.slice(0, 5).map((contact) => (
                    <Link
                        key={contact.id}
                        href={`/contacts/${contact.id}`}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <User size={14} className="text-purple-500 flex-shrink-0" />
                            <span className="text-sm text-foreground truncate">
                                {contact.first_name} {contact.last_name}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {contact.email && (
                                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                                    {contact.email}
                                </span>
                            )}
                            <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </Link>
                ))
            )}
            {contacts.length > 5 && (
                <Link href="/contacts" className="block text-center text-xs text-primary hover:underline py-1">
                    View all {contacts.length} contacts →
                </Link>
            )}
        </div>
    );

    const renderAccounts = () => (
        <div className="space-y-2">
            {accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No accounts assigned</p>
            ) : (
                accounts.slice(0, 5).map((account) => (
                    <Link
                        key={account.id}
                        href={`/organizations/${account.id}`}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <Building2 size={14} className="text-orange-500 flex-shrink-0" />
                            <span className="text-sm text-foreground truncate">{account.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {account.industry && (
                                <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                                    {account.industry}
                                </span>
                            )}
                            <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </Link>
                ))
            )}
            {accounts.length > 5 && (
                <Link href="/organizations" className="block text-center text-xs text-primary hover:underline py-1">
                    View all {accounts.length} accounts →
                </Link>
            )}
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'deals': return renderDeals();
            case 'tasks': return renderTasks();
            case 'contacts': return renderContacts();
            case 'accounts': return renderAccounts();
        }
    };

    return (
        <WidgetWrapper config={config} onRemove={onRemove} onResize={onResize} onSettings={onSettings} onDragStart={onDragStart} isDragging={isDragging}>
            {isLoading ? (
                <div className="h-[200px] flex items-center justify-center">
                    <Loader2 className="animate-spin text-muted-foreground" size={24} />
                </div>
            ) : !currentUser ? (
                <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                    <User size={32} className="mb-2" />
                    <p className="text-sm">No team members found</p>
                    <Link href="/team" className="text-xs text-primary hover:underline mt-1">
                        Add team members →
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* User Header */}
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            {currentUser.avatar_url ? (
                                <img src={currentUser.avatar_url} alt={currentUser.name || currentUser.email} className="w-8 h-8 rounded-full" />
                            ) : (
                                <span className="text-sm font-medium text-primary">
                                    {currentUser.first_name?.charAt(0) || currentUser.name?.charAt(0) || 'U'}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{currentUser.name || `${currentUser.first_name} ${currentUser.last_name}`.trim() || currentUser.email}</p>
                            <p className="text-xs text-muted-foreground">{totalItems} items assigned</p>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
                        {TAB_CONFIG.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
                                    activeTab === tab.key
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {tab.icon}
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="text-[10px] opacity-70">({counts[tab.key]})</span>
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="min-h-[120px]">
                        {renderContent()}
                    </div>
                </div>
            )}
        </WidgetWrapper>
    );
}

