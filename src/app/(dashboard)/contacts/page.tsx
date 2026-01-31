'use client';

import React, { useState, useEffect } from 'react';
import { Users, Loader2, RefreshCw, Mail, Phone, Briefcase, Plus, Search, ArrowLeft, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { fetchMCPData, getAuthHeaders } from '@/lib/fetchMCPData';

interface Contact {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    role?: string;
    account_id?: string;
    assigned_to?: string;
    created_at?: string;
}

interface TeamMember {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [allContacts, setAllContacts] = useState<Contact[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [selectedAssignee, setSelectedAssignee] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTeamMembers();
        fetchContacts();
    }, []);

    useEffect(() => {
        // Filter contacts when selectedAssignee changes
        if (selectedAssignee === '') {
            setContacts(allContacts);
        } else if (selectedAssignee === 'unassigned') {
            setContacts(allContacts.filter(c => !c.assigned_to));
        } else {
            setContacts(allContacts.filter(c => c.assigned_to === selectedAssignee));
        }
    }, [selectedAssignee, allContacts]);

    async function fetchTeamMembers() {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch('/api/team', { headers, credentials: 'include' });
            const data = await response.json();
            setTeamMembers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch team members:', error);
        }
    }

    async function fetchContacts() {
        try {
            setError(null);
            const data = await fetchMCPData('list_contacts');
            const contactsList = data.contacts || [];
            // Sort by newest first
            const sorted = [...contactsList].sort((a: Contact, b: Contact) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateB - dateA;
            });
            setAllContacts(sorted);
            setContacts(sorted);
        } catch (err: any) {
            console.error('Error fetching contacts:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    async function refreshContacts() {
        setIsRefreshing(true);
        await fetchContacts();
        setIsRefreshing(false);
    }

    function getAssigneeName(assigneeId?: string) {
        if (!assigneeId) return null;
        const member = teamMembers.find(m => m.id === assigneeId);
        return member ? `${member.first_name} ${member.last_name}` : null;
    }

    const filteredContacts = contacts.filter(contact => {
        const query = searchQuery.toLowerCase();
        const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
        return (
            fullName.includes(query) ||
            contact.email?.toLowerCase().includes(query) ||
            contact.role?.toLowerCase().includes(query)
        );
    });

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-destructive mb-2">Error loading contacts</p>
                    <p className="text-muted-foreground text-sm">{error}</p>
                    <button
                        onClick={fetchContacts}
                        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-8">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <Link 
                        href="/data" 
                        className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Contacts</h2>
                        <p className="text-muted-foreground mt-1">{filteredContacts.length} {selectedAssignee ? 'filtered ' : ''}contacts</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {/* Assignee Filter */}
                    <div className="relative">
                        <select
                            value={selectedAssignee}
                            onChange={(e) => setSelectedAssignee(e.target.value)}
                            className="appearance-none pl-10 pr-8 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                        >
                            <option value="">All Team Members</option>
                            <option value="unassigned">Unassigned</option>
                            {teamMembers.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.first_name} {member.last_name}
                                </option>
                            ))}
                        </select>
                        <UserCircle size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                    <button
                        onClick={refreshContacts}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <a
                        href="/chat"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors"
                    >
                        <Plus size={18} />
                        Add Contact
                    </a>
                </div>
            </div>

            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search contacts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContacts.map((contact) => (
                    <Link
                        key={contact.id}
                        href={`/contacts/${contact.id}`}
                        className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all hover:border-primary cursor-pointer block"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary-muted flex items-center justify-center text-primary text-lg font-semibold">
                                {(contact.first_name?.[0] || '') + (contact.last_name?.[0] || '') || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground truncate">
                                    {contact.first_name || ''} {contact.last_name || ''}
                                    {!contact.first_name && !contact.last_name && 'Unnamed Contact'}
                                </h3>
                                
                                {contact.role && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                        <Briefcase size={14} />
                                        <span className="truncate">{contact.role}</span>
                                    </div>
                                )}
                                
                                {contact.email && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                        <Mail size={14} />
                                        <span className="truncate">{contact.email}</span>
                                    </div>
                                )}
                                
                                {contact.phone && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                        <Phone size={14} />
                                        <span>{contact.phone}</span>
                                    </div>
                                )}
                                {contact.assigned_to && getAssigneeName(contact.assigned_to) && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                                        <UserCircle size={14} />
                                        <span>{getAssigneeName(contact.assigned_to)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {filteredContacts.length === 0 && (
                <div className="text-center py-12">
                    <Users className="mx-auto text-muted-foreground" size={64} />
                    <p className="text-muted-foreground mt-4">
                        {searchQuery ? `No contacts found matching "${searchQuery}"` : 'No contacts found'}
                    </p>
                    <a
                        href="/chat"
                        className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors"
                    >
                        Create your first contact
                    </a>
                </div>
            )}
        </div>
    );
}
