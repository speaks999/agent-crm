'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User, Loader2, ArrowLeft, Mail, Phone, Building2, Briefcase, Calendar, Trash2, Pencil, X, Save, Tag, Plus, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { fetchMCPData, getAuthHeaders } from '@/lib/fetchMCPData';

interface Contact {
    id: string;
    account_id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    role?: string;
    tags?: string[];
    assigned_to?: string;
    created_at?: string;
    updated_at?: string;
}

interface Account {
    id: string;
    name: string;
}

interface TeamMember {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
}

function EditContactModal({
    contact,
    accounts,
    teamMembers,
    onClose,
    onSave,
}: {
    contact: Contact;
    accounts: Account[];
    teamMembers: TeamMember[];
    onClose: () => void;
    onSave: (updated: Contact) => void;
}) {
    const [formData, setFormData] = useState({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        role: contact.role || '',
        account_id: contact.account_id || '',
        tags: contact.tags?.join(', ') || '',
        assigned_to: contact.assigned_to || '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        // Validate contact ID exists
        if (!contact.id || typeof contact.id !== 'string') {
            setError('Invalid contact ID');
            setIsSaving(false);
            return;
        }

        try {
            // Build arguments object, only including non-empty values
            const args: Record<string, unknown> = {
                id: contact.id,
            };
            
            if (formData.first_name) args.first_name = formData.first_name;
            if (formData.last_name) args.last_name = formData.last_name;
            if (formData.email) args.email = formData.email;
            if (formData.phone) args.phone = formData.phone;
            if (formData.role) args.role = formData.role;
            if (formData.account_id) args.account_id = formData.account_id;
            if (formData.tags) {
                const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
                if (tagsArray.length > 0) args.tags = tagsArray;
            }
            // Handle assigned_to - allow null to unassign
            if (formData.assigned_to) {
                args.assigned_to = formData.assigned_to;
            } else if (contact.assigned_to && !formData.assigned_to) {
                args.assigned_to = null; // Explicitly unassign
            }

            await fetchMCPData('update_contact', args);

            onSave({
                ...contact,
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email || undefined,
                phone: formData.phone || undefined,
                role: formData.role || undefined,
                account_id: formData.account_id || undefined,
                tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
                assigned_to: formData.assigned_to || undefined,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-card border border-border rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <Pencil size={20} className="text-primary" />
                        <h2 className="font-semibold text-foreground">Edit Contact</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <X size={20} className="text-muted-foreground" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[65vh]">
                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    {/* First Name */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">First Name *</label>
                        <input
                            type="text"
                            value={formData.first_name}
                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            required
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    {/* Last Name */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Last Name *</label>
                        <input
                            type="text"
                            value={formData.last_name}
                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            required
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="email@example.com"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+1 (555) 123-4567"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Role / Title</label>
                        <input
                            type="text"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            placeholder="e.g. CEO, Manager, etc."
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    {/* Account */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Account</label>
                        <select
                            value={formData.account_id}
                            onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="">No account linked</option>
                            {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Assigned To */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Assigned To</label>
                        <select
                            value={formData.assigned_to}
                            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="">Unassigned</option>
                            {teamMembers.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.first_name} {member.last_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Tags</label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            placeholder="tag1, tag2, tag3 (comma-separated)"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Separate multiple tags with commas</p>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-4 border-t border-border flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ContactDetailPage() {
    const params = useParams();
    const router = useRouter();
    const contactId = params.id as string;

    const [contact, setContact] = useState<Contact | null>(null);
    const [account, setAccount] = useState<Account | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [assignedMember, setAssignedMember] = useState<TeamMember | null>(null);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        fetchContact();
        fetchAccounts();
        fetchAvailableTags();
        fetchTeamMembers();
    }, [contactId]);

    async function fetchAvailableTags() {
        try {
            const data = await fetchMCPData('list_tags', {});
            const tags = data.tags || [];
            setAvailableTags(tags.map((t: { tag_name: string }) => t.tag_name).sort());
        } catch (err) {
            console.error('Failed to fetch available tags:', err);
        }
    }

    async function addTag(tagName: string) {
        if (!contact || !tagName.trim()) return;
        
        const trimmedTag = tagName.trim();
        const currentTags = contact.tags || [];
        
        if (currentTags.includes(trimmedTag)) {
            setShowTagDropdown(false);
            return;
        }

        setIsAddingTag(true);
        const updatedTags = [...currentTags, trimmedTag];

        try {
            await fetchMCPData('update_contact', {
                id: contact.id,
                tags: updatedTags,
            });
            setContact({ ...contact, tags: updatedTags });
            setShowTagDropdown(false);
        } catch (err) {
            console.error('Failed to add tag:', err);
        } finally {
            setIsAddingTag(false);
        }
    }

    async function removeTag(tagToRemove: string) {
        if (!contact) return;
        
        const currentTags = contact.tags || [];
        const updatedTags = currentTags.filter(t => t !== tagToRemove);

        // Optimistic update
        setContact({ ...contact, tags: updatedTags });

        try {
            await fetchMCPData('update_contact', {
                id: contact.id,
                tags: updatedTags,
            });
        } catch (err) {
            console.error('Failed to remove tag:', err);
            // Revert on error
            setContact({ ...contact, tags: currentTags });
        }
    }

    async function fetchAccounts() {
        try {
            const data = await fetchMCPData('list_accounts', {});
            setAccounts(data.accounts || []);
        } catch (err) {
            console.error('Failed to fetch accounts:', err);
        }
    }

    async function fetchTeamMembers() {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch('/api/team', { headers, credentials: 'include' });
            const data = await response.json();
            const members = Array.isArray(data) ? data : [];
            setTeamMembers(members);
        } catch (err) {
            console.error('Failed to fetch team members:', err);
        }
    }

    async function assignContact(memberId: string | null) {
        if (!contact) return;
        setIsAssigning(true);

        try {
            await fetchMCPData('update_contact', {
                id: contact.id,
                assigned_to: memberId,
            });
            setContact({ ...contact, assigned_to: memberId || undefined });
            if (memberId) {
                const member = teamMembers.find(m => m.id === memberId);
                setAssignedMember(member || null);
            } else {
                setAssignedMember(null);
            }
        } catch (err) {
            console.error('Failed to assign contact:', err);
        } finally {
            setIsAssigning(false);
        }
    }

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
                // Fetch assigned team member if exists
                if (contactData.assigned_to) {
                    try {
                        const headers = await getAuthHeaders();
                        const response = await fetch('/api/team', { headers, credentials: 'include' });
                        const members = await response.json();
                        if (Array.isArray(members)) {
                            const member = members.find((m: TeamMember) => m.id === contactData.assigned_to);
                            setAssignedMember(member || null);
                        }
                    } catch (err) {
                        console.error('Failed to fetch assigned member:', err);
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
        <div className="flex-1 overflow-y-auto p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <Link href="/contacts" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft size={20} />
                    Back to Contacts
                </Link>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Pencil size={16} />
                        Edit
                    </button>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                    >
                        <Trash2 size={16} />
                        Delete
                    </button>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && contact && (
                <EditContactModal
                    contact={contact}
                    accounts={accounts}
                    teamMembers={teamMembers}
                    onClose={() => setShowEditModal(false)}
                    onSave={(updated) => {
                        setContact(updated);
                        setShowEditModal(false);
                        // Update the associated account display if changed
                        if (updated.account_id) {
                            const newAccount = accounts.find(a => a.id === updated.account_id);
                            setAccount(newAccount || null);
                        } else {
                            setAccount(null);
                        }
                        // Update the assigned member display if changed
                        if (updated.assigned_to) {
                            const newMember = teamMembers.find(m => m.id === updated.assigned_to);
                            setAssignedMember(newMember || null);
                        } else {
                            setAssignedMember(null);
                        }
                    }}
                />
            )}

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
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

                    {/* Company */}
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Building2 size={20} className="text-muted-foreground" />
                            Company
                        </h3>
                        <div className="bg-muted p-4 rounded-lg min-h-[150px]">
                            {account ? (
                                <Link
                                    href={`/organizations/${account.id}`}
                                    className="flex items-center gap-4 p-3 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-primary-muted flex items-center justify-center text-primary shrink-0">
                                        <Building2 size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-foreground">{account.name}</p>
                                        <p className="text-sm text-muted-foreground">View company details →</p>
                                    </div>
                                </Link>
                            ) : (
                                <div className="text-center py-4">
                                    <Building2 size={32} className="mx-auto text-muted-foreground mb-2" />
                                    <p className="text-muted-foreground italic">Not linked to a company</p>
                                    <button 
                                        onClick={() => setShowEditModal(true)}
                                        className="text-sm text-primary hover:underline mt-2"
                                    >
                                        Link to company →
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Assigned To */}
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <UserCircle size={20} className="text-muted-foreground" />
                            Assigned To
                        </h3>
                        <div className="bg-muted p-4 rounded-lg">
                            {assignedMember ? (
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center text-primary font-semibold border border-primary/20">
                                        {assignedMember.first_name[0]}{assignedMember.last_name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground truncate">
                                            {assignedMember.first_name} {assignedMember.last_name}
                                        </p>
                                        <p className="text-sm text-muted-foreground truncate">{assignedMember.email}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm mb-4">Not assigned to anyone</p>
                            )}
                            
                            <select
                                value={contact?.assigned_to || ''}
                                onChange={(e) => assignContact(e.target.value || null)}
                                disabled={isAssigning}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm disabled:opacity-50"
                            >
                                <option value="">Unassigned</option>
                                {teamMembers.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.first_name} {member.last_name}
                                    </option>
                                ))}
                            </select>
                            {isAssigning && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                    <Loader2 size={14} className="animate-spin" />
                                    Updating...
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Tag size={20} className="text-muted-foreground" />
                            Tags
                        </h3>
                        <div className="bg-muted p-4 rounded-lg min-h-[150px]">
                            {/* Quick Add Tag Dropdown */}
                            <div className="relative mb-4">
                                <button
                                    onClick={() => setShowTagDropdown(!showTagDropdown)}
                                    disabled={isAddingTag}
                                    className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors w-full justify-between"
                                >
                                    <span className="flex items-center gap-2">
                                        {isAddingTag ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Plus size={14} />
                                        )}
                                        Add a tag...
                                    </span>
                                    <svg className={`w-4 h-4 transition-transform ${showTagDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                
                                {showTagDropdown && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-10" 
                                            onClick={() => setShowTagDropdown(false)}
                                        />
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                                            {(() => {
                                                const currentTags = contact.tags || [];
                                                const unusedTags = availableTags.filter(t => !currentTags.includes(t));
                                                
                                                if (unusedTags.length === 0) {
                                                    return (
                                                        <div className="p-3 text-sm text-muted-foreground text-center">
                                                            {availableTags.length === 0 
                                                                ? 'No tags exist yet. Create one in the Data Hub.'
                                                                : 'All available tags are already added.'}
                                                        </div>
                                                    );
                                                }
                                                
                                                return unusedTags.map((tag) => (
                                                    <button
                                                        key={tag}
                                                        onClick={() => addTag(tag)}
                                                        className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                                                    >
                                                        <span className="w-2 h-2 rounded-full bg-primary" />
                                                        {tag}
                                                    </button>
                                                ));
                                            })()}
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            {/* Tags List */}
                            {contact.tags && contact.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {contact.tags.map((tag, idx) => (
                                        <span 
                                            key={idx} 
                                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-muted text-primary text-sm rounded-full group"
                                        >
                                            {tag}
                                            <button
                                                onClick={() => removeTag(tag)}
                                                className="p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                                                title="Remove tag"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground italic text-sm">No tags yet. Select one above!</p>
                            )}
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="md:col-span-2 lg:col-span-3">
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
