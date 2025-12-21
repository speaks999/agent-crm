'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

interface Contact {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    role?: string;
    accounts?: { name: string };
}

export default function ContactsPage() {
    const router = useRouter();
    const supabase = useMemo(() => createBrowserClient(), []);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchContacts() {
            const { data, error } = await supabase
                .from('contacts')
                .select('*, accounts(name)')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching contacts:', error);
            } else {
                setContacts(data || []);
            }
            setIsLoading(false);
        }
        fetchContacts();
    }, [supabase]);

    const handleRowClick = (contactId: string) => {
        router.push(`/contacts/${contactId}`);
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Contacts</h2>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors">
                    Add Contact
                </button>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-foreground">
                    <thead className="bg-muted border-b border-border">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-foreground">Name</th>
                            <th className="px-6 py-4 font-semibold text-foreground">Email</th>
                            <th className="px-6 py-4 font-semibold text-foreground">Role</th>
                            <th className="px-6 py-4 font-semibold text-foreground">Company</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {contacts.length > 0 ? (
                            contacts.map((contact) => (
                                <tr 
                                    key={contact.id} 
                                    className="hover:bg-muted cursor-pointer transition-colors"
                                    onClick={() => handleRowClick(contact.id)}
                                >
                                    <td className="px-6 py-4 font-medium text-foreground">
                                        {contact.first_name} {contact.last_name}
                                    </td>
                                    <td className="px-6 py-4 text-foreground">{contact.email || '-'}</td>
                                    <td className="px-6 py-4 text-foreground">{contact.role || '-'}</td>
                                    <td className="px-6 py-4 text-foreground">{contact.accounts?.name || '-'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                    No contacts found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
