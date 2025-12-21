import React from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default async function ContactsPage() {

    const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*, accounts(name)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching contacts:', error);
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
                        {contacts && contacts.length > 0 ? (
                            contacts.map((contact: any) => (
                                <tr key={contact.id} className="hover:bg-muted cursor-pointer transition-colors">
                                    <td className="px-6 py-4 font-medium text-foreground">
                                        <Link href={`/contacts/${contact.id}`} className="hover:text-primary">
                                            {contact.first_name} {contact.last_name}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-foreground">{contact.email}</td>
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
