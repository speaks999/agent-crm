'use client';

import { useState, useEffect } from 'react';
import { User, Loader2, ArrowLeft, Mail, Phone, Building2, Briefcase, Calendar, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Contact {
    id: string;
    account_id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    role?: string;
    notes?: string;
    tags?: string[];
    created_at?: string;
    updated_at?: string;
    accounts?: {
        id: string;
        name: string;
    };
}

export default function ContactDetailPage() {
    const params = useParams();
    const [contact, setContact] = useState<Contact | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchContact(params.id as string);
        }
    }, [params.id]);

    async function fetchContact(id: string) {
        try {
            const response = await fetch(`/api/contacts/${id}`);
            const data = await response.json();
            setContact(data);
        } catch (error) {
            console.error('Failed to fetch contact:', error);
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    if (!contact) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-muted-foreground text-lg">Contact not found</p>
                <Link href="/contacts" className="mt-4 text-primary hover:underline">
                    Back to Contacts
                </Link>
            </div>
        );
    }

    const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown Contact';
    const initials = [contact.first_name?.[0], contact.last_name?.[0]].filter(Boolean).join('').toUpperCase() || 'U';

    return (
        <div className="flex-1 overflow-auto p-8">
            <Link href="/contacts" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft size={20} />
                Back to Contacts
            </Link>

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
                                <p className="text-lg text-muted-foreground mt-1">{contact.role}</p>
                            )}
                            {contact.accounts?.name && (
                                <Link 
                                    href={`/accounts`} 
                                    className="inline-flex items-center gap-2 mt-2 text-primary hover:underline"
                                >
                                    <Building2 size={16} />
                                    {contact.accounts.name}
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

                    {/* Notes */}
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <MessageSquare size={20} className="text-muted-foreground" />
                            Notes
                        </h3>
                        <div className="bg-muted p-4 rounded-lg text-foreground min-h-[150px]">
                            {contact.notes ? (
                                <p className="whitespace-pre-wrap">{contact.notes}</p>
                            ) : (
                                <p className="text-muted-foreground italic">No notes</p>
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    {contact.tags && contact.tags.length > 0 && (
                        <div className="md:col-span-2">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Tags</h3>
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
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-muted-foreground" />
                            Record Info
                        </h3>
                        <div className="bg-muted p-4 rounded-lg flex flex-wrap gap-8">
                            <div>
                                <span className="text-muted-foreground text-sm">Created</span>
                                <p className="text-foreground font-medium">
                                    {contact.created_at ? new Date(contact.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : '—'}
                                </p>
                            </div>
                            <div>
                                <span className="text-muted-foreground text-sm">Last Updated</span>
                                <p className="text-foreground font-medium">
                                    {contact.updated_at ? new Date(contact.updated_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : '—'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

