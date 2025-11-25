import React from 'react';
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
                <h2 className="text-2xl font-bold text-slate-800">Contacts</h2>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Add Contact
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-900">Name</th>
                            <th className="px-6 py-4 font-semibold text-slate-900">Email</th>
                            <th className="px-6 py-4 font-semibold text-slate-900">Role</th>
                            <th className="px-6 py-4 font-semibold text-slate-900">Company</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {contacts && contacts.length > 0 ? (
                            contacts.map((contact: any) => (
                                <tr key={contact.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {contact.first_name} {contact.last_name}
                                    </td>
                                    <td className="px-6 py-4">{contact.email}</td>
                                    <td className="px-6 py-4">{contact.role || '-'}</td>
                                    <td className="px-6 py-4">{contact.accounts?.name || '-'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
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
