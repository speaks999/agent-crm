'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Building2, Loader2, ArrowLeft, Globe, Briefcase, Calendar, Trash2, Pencil, X, Save, User, Mail, Phone, Users, Plus, Tag, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { fetchMCPData, getAuthHeaders } from '@/lib/fetchMCPData';

interface Account {
    id: string;
    name: string;
    industry?: string;
    website?: string;
    tags?: string[];
    assigned_to?: string;
    created_at?: string;
    updated_at?: string;
}

interface Contact {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    role?: string;
}

interface TeamMember {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
}

function EditAccountModal({
    account,
    teamMembers,
    onClose,
    onSave,
}: {
    account: Account;
    teamMembers: TeamMember[];
    onClose: () => void;
    onSave: (updated: Account) => void;
}) {
    const [formData, setFormData] = useState({
        name: account.name || '',
        industry: account.industry || '',
        website: account.website || '',
        tags: account.tags?.join(', ') || '',
        assigned_to: account.assigned_to || '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        if (!account.id || typeof account.id !== 'string') {
            setError('Invalid account ID');
            setIsSaving(false);
            return;
        }

        try {
            const args: Record<string, unknown> = {
                id: account.id,
            };
            
            if (formData.name) args.name = formData.name;
            if (formData.industry) args.industry = formData.industry;
            if (formData.website) args.website = formData.website;
            if (formData.tags) {
                const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
                if (tagsArray.length > 0) args.tags = tagsArray;
            }
            // Handle assigned_to - allow null to unassign
            if (formData.assigned_to) {
                args.assigned_to = formData.assigned_to;
            } else if (account.assigned_to && !formData.assigned_to) {
                args.assigned_to = null; // Explicitly unassign
            }

            await fetchMCPData('update_account', args);

            onSave({
                ...account,
                name: formData.name,
                industry: formData.industry || undefined,
                website: formData.website || undefined,
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
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <Pencil size={20} className="text-primary" />
                        <h2 className="font-semibold text-foreground">Edit Account</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <X size={20} className="text-muted-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[65vh]">
                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Company Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Industry</label>
                        <input
                            type="text"
                            value={formData.industry}
                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                            placeholder="e.g. Technology, Healthcare, Finance"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Website</label>
                        <input
                            type="url"
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            placeholder="https://example.com"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

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

                <div className="p-4 border-t border-border flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
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

export default function AccountDetailPage() {
    const params = useParams();
    const router = useRouter();
    const accountId = params.id as string;

    const [account, setAccount] = useState<Account | null>(null);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [assignedMember, setAssignedMember] = useState<TeamMember | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        fetchAccount();
        fetchLinkedContacts();
        fetchAvailableTags();
        fetchTeamMembers();
    }, [accountId]);

    async function fetchAvailableTags() {
        try {
            // Fetch tags from the dedicated tags table
            const data = await fetchMCPData('list_tags', {});
            const tags = data.tags || [];
            setAvailableTags(tags.map((t: { tag_name: string }) => t.tag_name).sort());
        } catch (err) {
            console.error('Failed to fetch available tags:', err);
            // Fallback: try to get tags from accounts
            try {
                const accountsData = await fetchMCPData('list_accounts', {});
                const allAccounts = accountsData.accounts || [];
                const tagsSet = new Set<string>();
                allAccounts.forEach((acc: Account) => {
                    if (acc.tags && Array.isArray(acc.tags)) {
                        acc.tags.forEach(tag => tagsSet.add(tag));
                    }
                });
                setAvailableTags(Array.from(tagsSet).sort());
            } catch (fallbackErr) {
                console.error('Fallback tag fetch also failed:', fallbackErr);
            }
        }
    }

    async function addTag(tagName: string) {
        if (!account || !tagName.trim()) return;
        
        const trimmedTag = tagName.trim();
        const currentTags = account.tags || [];
        
        // Don't add duplicate tags
        if (currentTags.includes(trimmedTag)) {
            setShowTagDropdown(false);
            return;
        }

        setIsAddingTag(true);
        const updatedTags = [...currentTags, trimmedTag];

        try {
            await fetchMCPData('update_account', {
                id: account.id,
                tags: updatedTags,
            });
            setAccount({ ...account, tags: updatedTags });
            setShowTagDropdown(false);
        } catch (err) {
            console.error('Failed to add tag:', err);
        } finally {
            setIsAddingTag(false);
        }
    }

    async function removeTag(tagToRemove: string) {
        if (!account) return;
        
        const currentTags = account.tags || [];
        const updatedTags = currentTags.filter(t => t !== tagToRemove);

        // Optimistic update
        setAccount({ ...account, tags: updatedTags });

        try {
            await fetchMCPData('update_account', {
                id: account.id,
                tags: updatedTags,
            });
        } catch (err) {
            console.error('Failed to remove tag:', err);
            // Revert on error
            setAccount({ ...account, tags: currentTags });
        }
    }

    async function fetchAccount() {
        try {
            setError(null);
            const data = await fetchMCPData('get_account', { id: accountId });
            const accountData = data.accounts?.[0] || data.account;
            if (accountData) {
                setAccount(accountData);
                // Fetch assigned team member if exists
                if (accountData.assigned_to) {
                    try {
                        const headers = await getAuthHeaders();
                        const response = await fetch('/api/team', { headers, credentials: 'include' });
                        const members = await response.json();
                        if (Array.isArray(members)) {
                            const member = members.find((m: TeamMember) => m.id === accountData.assigned_to);
                            setAssignedMember(member || null);
                        }
                    } catch (err) {
                        console.error('Failed to fetch assigned member:', err);
                    }
                }
            } else {
                setError('Account not found');
            }
        } catch (err: any) {
            console.error('Error fetching account:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    async function fetchLinkedContacts() {
        try {
            const data = await fetchMCPData('list_contacts', { account_id: accountId });
            setContacts(data.contacts || []);
        } catch (err) {
            console.error('Error fetching linked contacts:', err);
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

    async function assignAccount(memberId: string | null) {
        if (!account) return;
        setIsAssigning(true);

        try {
            await fetchMCPData('update_account', {
                id: account.id,
                assigned_to: memberId,
            });
            setAccount({ ...account, assigned_to: memberId || undefined });
            if (memberId) {
                const member = teamMembers.find(m => m.id === memberId);
                setAssignedMember(member || null);
            } else {
                setAssignedMember(null);
            }
        } catch (err) {
            console.error('Failed to assign account:', err);
        } finally {
            setIsAssigning(false);
        }
    }

    async function deleteAccount() {
        if (!account) return;
        setIsDeleting(true);
        try {
            await fetchMCPData('delete_account', { id: account.id });
            router.push('/organizations');
        } catch (err: any) {
            console.error('Error deleting account:', err);
            alert('Failed to delete account: ' + err.message);
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

    if (error || !account) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Building2 className="text-muted-foreground mb-4" size={64} />
                <p className="text-muted-foreground text-lg">{error || 'Account not found'}</p>
                <Link href="/organizations" className="mt-4 text-primary hover:underline">
                    Back to Accounts
                </Link>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <Link href="/organizations" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft size={20} />
                    Back to Accounts
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
            {showEditModal && account && (
                <EditAccountModal
                    account={account}
                    teamMembers={teamMembers}
                    onClose={() => setShowEditModal(false)}
                    onSave={(updated) => {
                        setAccount(updated);
                        setShowEditModal(false);
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
                        <h3 className="text-lg font-semibold text-foreground mb-2">Delete Account?</h3>
                        <p className="text-muted-foreground mb-4">
                            Are you sure you want to delete "{account.name}"? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteAccount}
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
                        <div className="w-24 h-24 rounded-xl bg-primary-muted flex items-center justify-center text-primary shrink-0">
                            <Building2 size={48} />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-foreground">{account.name || 'Unnamed Account'}</h1>
                            {account.industry && (
                                <div className="flex items-center gap-2 text-lg text-muted-foreground mt-1">
                                    <Briefcase size={18} />
                                    {account.industry}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-6 mt-6">
                                {account.website && (
                                    <a 
                                        href={account.website.startsWith('http') ? account.website : `https://${account.website}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex items-center gap-2 text-primary hover:underline"
                                    >
                                        <Globe size={18} />
                                        {account.website}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                    {/* Account Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Building2 size={20} className="text-muted-foreground" />
                            Account Details
                        </h3>
                        <div className="bg-muted p-4 rounded-lg space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Name</span>
                                <span className="text-foreground font-medium">{account.name || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Industry</span>
                                <span className="text-foreground font-medium">{account.industry || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Website</span>
                                <span className="text-foreground font-medium">{account.website || '—'}</span>
                            </div>
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
                                value={account?.assigned_to || ''}
                                onChange={(e) => assignAccount(e.target.value || null)}
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
                                        {/* Backdrop to close dropdown */}
                                        <div 
                                            className="fixed inset-0 z-10" 
                                            onClick={() => setShowTagDropdown(false)}
                                        />
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                                            {(() => {
                                                const currentTags = account.tags || [];
                                                const unusedTags = availableTags.filter(t => !currentTags.includes(t));
                                                
                                                if (unusedTags.length === 0) {
                                                    return (
                                                        <div className="p-3 text-sm text-muted-foreground text-center">
                                                            {availableTags.length === 0 
                                                                ? 'No tags exist yet. Create one in the Edit modal.'
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
                            {account.tags && account.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {account.tags.map((tag, idx) => (
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

                    {/* Linked Contacts */}
                    <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Users size={20} className="text-muted-foreground" />
                            Contacts at {account.name}
                            <span className="text-sm font-normal text-muted-foreground">
                                ({contacts.length})
                            </span>
                        </h3>
                        <div className="bg-muted p-4 rounded-lg">
                            {contacts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {contacts.map((contact) => {
                                        const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown';
                                        const initials = [contact.first_name?.[0], contact.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?';
                                        
                                        return (
                                            <Link
                                                key={contact.id}
                                                href={`/contacts/${contact.id}`}
                                                className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-primary-muted flex items-center justify-center text-primary text-sm font-bold shrink-0">
                                                    {initials}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-foreground truncate">{fullName}</p>
                                                    {contact.role && (
                                                        <p className="text-xs text-muted-foreground truncate">{contact.role}</p>
                                                    )}
                                                    <div className="flex items-center gap-3 mt-1">
                                                        {contact.email && (
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Mail size={10} />
                                                                <span className="truncate max-w-[120px]">{contact.email}</span>
                                                            </span>
                                                        )}
                                                        {contact.phone && (
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Phone size={10} />
                                                                {contact.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <User size={32} className="mx-auto text-muted-foreground mb-2" />
                                    <p className="text-muted-foreground">No contacts linked to this account</p>
                                    <Link 
                                        href="/contacts" 
                                        className="text-sm text-primary hover:underline mt-2 inline-block"
                                    >
                                        Add contacts →
                                    </Link>
                                </div>
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
                                <span className="text-muted-foreground text-sm">Account ID</span>
                                <p className="text-foreground font-mono text-xs">{account.id}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground text-sm">Created</span>
                                <p className="text-foreground font-medium">{formatDateTime(account.created_at) || '—'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground text-sm">Last Updated</span>
                                <p className="text-foreground font-medium">{formatDateTime(account.updated_at) || '—'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
