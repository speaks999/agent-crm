'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User, Loader2, ArrowLeft, Mail, Phone, Building2, Briefcase, Calendar, Trash2, Edit2 } from 'lucide-react';
import Link from 'next/link';

interface Contact {
    id: string;
    account_id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    role?: string;
    tags?: string[];
    created_at?: string;
    updated_at?: string;
}

interface Account {
    id: string;
    name: string;
}

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

export default function ContactDetailPage() {
    const params = useParams();
    const router = useRouter();
    const contactId = params.id as string;

    const [contact, setContact] = useState<Contact | null>(null);
    const [account, setAccount] = useState<Account | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        fetchContact();
    }, [contactId]);

    async function fetchContact() {
        try {
            setError(null);
            const data = await fetchMCPData('get_contact', { id: contactId });
            const contactData = data.contacts?.[0] || data.contact;
            if (contactData) {
                setContact(contactData);
                // Fetch associated account if exists
                if (contactData.account_id) {
                    try {
                        const accountData = await fetchMCPData('get_account', { id: contactData.account_id });
                        const accountInfo = accountData.accounts?.[0] || accountData.account;
                        if (accountInfo) {
                            setAccount(accountInfo);
                        }
                    } catch (err) {
                        console.error('Failed to fetch account:', err);
                    }
                }
            } else {
                setError('Contact not found');
            }
        } catch (err: any) {
            console.error('Error fetching contact:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    async function deleteContact() {
        if (!contact) return;
        setIsDeleting(true);
        try {
            await fetchMCPData('delete_contact', { id: contact.id });
            router.push('/contacts');
        } catch (err: any) {
            console.error('Error deleting contact:', err);
            alert('Failed to delete contact: ' + err.message);
            setIsDeleting(false);
        }
    }

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    if (error || !contact) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <User className="text-muted-foreground mb-4" size={64} />
                <p className="text-muted-foreground text-lg">{error || 'Contact not found'}</p>
                <Link href="/contacts" className="mt-4 text-primary hover:underline">
                    Back to Contacts
                </Link>
            </div>
        );
    }

    const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown Contact';
    const initials = [contact.first_name?.[0], contact.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?';

    return (
        <div className="flex-1 overflow-auto p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <Link href="/contacts" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft size={20} />
                    Back to Contacts
                </Link>
                <div className="flex gap-2">
                    <a
                        href="/chat"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors"
                    >
                        <Edit2 size={16} />
                        Edit in Chat
                    </a>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                    >
                        <Trash2 size={16} />
                        Delete
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-foreground mb-2">Delete Contact?</h3>
                        <p className="text-muted-foreground mb-4">
                            Are you sure you want to delete "{fullName}"? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteContact}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-8 border-b border-border">
                    <div className="flex items-start gap-6">
                        <div className="w-24 h-24 rounded-full bg-primary-muted flex items-center justify-center text-primary text-2xl font-bold shrink-0">
                            {initials}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-foreground">{fullName}</h1>
                            {contact.role && (
                                <div className="flex items-center gap-2 text-lg text-muted-foreground mt-1">
                                    <Briefcase size={18} />
                                    {contact.role}
                                </div>
                            )}
                            {account && (
                                <Link 
                                    href={`/organizations/${account.id}`} 
                                    className="inline-flex items-center gap-2 mt-2 text-primary hover:underline"
                                >
                                    <Building2 size={16} />
                                    {account.name}
                                </Link>
                            )}

                            <div className="flex flex-wrap gap-6 mt-6">
                                {contact.email && (
                                    <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-primary hover:underline">
                                        <Mail size={18} />
                                        {contact.email}
                                    </a>
                                )}
                                {contact.phone && (
                                    <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-foreground hover:text-primary">
                                        <Phone size={18} />
                                        {contact.phone}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                    {/* Contact Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <User size={20} className="text-muted-foreground" />
                            Contact Details
                        </h3>
                        <div className="bg-muted p-4 rounded-lg space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">First Name</span>
                                <span className="text-foreground font-medium">{contact.first_name || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Last Name</span>
                                <span className="text-foreground font-medium">{contact.last_name || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Role</span>
                                <span className="text-foreground font-medium">{contact.role || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Email</span>
                                <span className="text-foreground font-medium">{contact.email || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Phone</span>
                                <span className="text-foreground font-medium">{contact.phone || '—'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4">Tags</h3>
                        <div className="bg-muted p-4 rounded-lg min-h-[150px]">
                            {contact.tags && contact.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {contact.tags.map((tag, idx) => (
                                        <span 
                                            key={idx} 
                                            className="px-3 py-1 bg-primary-muted text-primary text-sm rounded-full"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground italic">No tags</p>
                            )}
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-muted-foreground" />
                            Record Info
                        </h3>
                        <div className="bg-muted p-4 rounded-lg flex flex-wrap gap-8">
                            <div>
                                <span className="text-muted-foreground text-sm">Contact ID</span>
                                <p className="text-foreground font-mono text-xs">{contact.id}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground text-sm">Created</span>
                                <p className="text-foreground font-medium">{formatDateTime(contact.created_at) || '—'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground text-sm">Last Updated</span>
                                <p className="text-foreground font-medium">{formatDateTime(contact.updated_at) || '—'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
