'use client';

import { Badge } from '@openai/apps-sdk-ui/components/Badge';

interface Contact {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    role?: string;
}

export function ContactList({ contacts }: { contacts: Contact[] }) {
    if (contacts.length === 0) {
        return (
            <div className="text-center py-8 text-secondary">
                No contacts found
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-subtle">
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary">Phone</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary">Role</th>
                    </tr>
                </thead>
                <tbody>
                    {contacts.map(contact => (
                        <tr
                            key={contact.id}
                            className="border-b border-subtle hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                        >
                            <td className="py-3 px-4">
                                <div className="font-medium">
                                    {contact.first_name} {contact.last_name}
                                </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-secondary">
                                {contact.email || '—'}
                            </td>
                            <td className="py-3 px-4 text-sm text-secondary">
                                {contact.phone || '—'}
                            </td>
                            <td className="py-3 px-4">
                                {contact.role && <Badge color="secondary">{contact.role}</Badge>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
