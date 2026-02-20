'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Mail, Shield, User, Loader2, Pencil, Trash2, X, MoreVertical } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabaseClient';
import { getAuthHeaders } from '@/lib/fetchMCPData';

interface TeamMember {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: 'admin' | 'manager' | 'member';
    avatar_url?: string;
    active: boolean;
}

// Reusable modal for Add/Edit
function TeamMemberModal({
    member,
    onClose,
    onSave,
}: {
    member?: TeamMember | null;
    onClose: () => void;
    onSave: () => void;
}) {
    const isEditing = !!member;
    const [formData, setFormData] = useState({
        first_name: member?.first_name || '',
        last_name: member?.last_name || '',
        email: member?.email || '',
        role: member?.role || 'member',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            const headers = await getAuthHeaders();
            
            // If editing, use PUT to update existing member
            if (isEditing) {
                const response = await fetch('/api/team', {
                    method: 'PUT',
                    headers,
                    credentials: 'include',
                    body: JSON.stringify({ id: member.id, ...formData }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to update member');
                }
            } else {
                // If adding new member, send invite instead
                // First get current team ID
                const teamResponse = await fetch('/api/teams/current', {
                    headers,
                    credentials: 'include',
                });
                
                if (!teamResponse.ok) {
                    throw new Error('Failed to get current team');
                }
                
                const { team_id } = await teamResponse.json();
                
                if (!team_id) {
                    throw new Error('No team selected');
                }
                
                // Send team invite
                const response = await fetch('/api/teams/invites', {
                    method: 'POST',
                    headers,
                    credentials: 'include',
                    body: JSON.stringify({
                        team_id,
                        email: formData.email,
                        role: formData.role,
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to send invite');
                }
                
                const result = await response.json();
                alert(`Invitation sent to ${formData.email}! They will appear on your team once they accept.`);
            }

            onSave();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-card rounded-xl shadow-xl w-full max-w-md border border-border"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground">
                        {isEditing ? 'Edit Team Member' : 'Invite Team Member'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <X size={20} className="text-muted-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">
                                First Name *
                            </label>
                            <input
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                required
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">
                                Last Name *
                            </label>
                            <input
                                type="text"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                required
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                            Email *
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                            Role
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as TeamMember['role'] })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="member">Member</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    {isEditing ? 'Saving...' : 'Sending Invite...'}
                                </>
                            ) : isEditing ? (
                                'Save Changes'
                            ) : (
                                'Send Invite'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Delete confirmation modal
function DeleteConfirmModal({
    member,
    onClose,
    onConfirm,
}: {
    member: TeamMember;
    onClose: () => void;
    onConfirm: () => void;
}) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`/api/team?id=${member.id}`, {
                method: 'DELETE',
                headers,
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to delete');
            }

            onConfirm();
            onClose();
        } catch (err) {
            console.error('Failed to delete member:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-card rounded-xl shadow-xl w-full max-w-sm border border-border"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                        <Trash2 size={24} className="text-red-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground text-center mb-2">
                        Remove Team Member?
                    </h3>
                    <p className="text-muted-foreground text-center text-sm">
                        Are you sure you want to remove <strong>{member.first_name} {member.last_name}</strong> from the team? This action can be undone by an administrator.
                    </p>
                </div>
                <div className="flex gap-3 p-4 border-t border-border">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Removing...
                            </>
                        ) : (
                            'Remove'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Team member card with actions
function TeamMemberCard({
    member,
    onEdit,
    onDelete,
    onClick,
}: {
    member: TeamMember;
    onEdit: () => void;
    onDelete: () => void;
    onClick: () => void;
}) {
    const [showMenu, setShowMenu] = useState(false);

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'manager':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default:
                return 'bg-muted text-muted-foreground border-border';
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin':
                return <Shield size={14} />;
            default:
                return <User size={14} />;
        }
    };

    return (
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all group relative">
            {/* Actions menu button */}
            <div className="absolute top-4 right-4">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(!showMenu);
                    }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                    <MoreVertical size={16} className="text-muted-foreground" />
                </button>

                {/* Dropdown menu */}
                {showMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowMenu(false)}
                        />
                        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg py-1 z-20 min-w-[120px]">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(false);
                                    onEdit();
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                            >
                                <Pencil size={14} />
                                Edit
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(false);
                                    onDelete();
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                                <Trash2 size={14} />
                                Remove
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Clickable card content */}
            <div className="cursor-pointer" onClick={onClick}>
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-semibold text-lg border border-primary/20">
                        {member.first_name[0]}{member.last_name[0]}
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {member.first_name} {member.last_name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                            <Mail size={14} />
                            <span className="truncate">{member.email}</span>
                        </div>
                        <div className="mt-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleColor(member.role)}`}>
                                {getRoleIcon(member.role)}
                                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TeamPage() {
    const router = useRouter();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
    const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    async function fetchTeamMembers() {
        try {
            // Get auth token from Supabase session
            const supabase = createBrowserClient();
            const { data: { session } } = await supabase.auth.getSession();
            
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };
            
            // Add Bearer token if we have a session
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
                console.log('[Team Page] Fetching with Bearer token');
            } else {
                console.log('[Team Page] No session found, fetching without auth');
            }
            
            console.log('[Team Page] Fetching team members with headers:', headers);
            const response = await fetch('/api/team', { headers, credentials: 'include' });
            console.log('[Team Page] Response status:', response.status);
            const data = await response.json();
            console.log('[Team Page] Response data:', data);
            console.log('[Team Page] Is array?', Array.isArray(data));
            console.log('[Team Page] Data length:', Array.isArray(data) ? data.length : 'not array');
            setMembers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch team members:', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleAddClick = () => {
        setEditingMember(null);
        setShowModal(true);
    };

    const handleEditClick = (member: TeamMember) => {
        setEditingMember(member);
        setShowModal(true);
    };

    const handleDeleteClick = (member: TeamMember) => {
        setDeletingMember(member);
    };

    const handleCardClick = (member: TeamMember) => {
        router.push(`/team/${member.id}`);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    const safeMembers = Array.isArray(members) ? members : [];

    return (
        <div className="flex-1 overflow-auto p-8 bg-background">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Team</h2>
                    <p className="text-muted-foreground mt-1">{safeMembers.length} team member{safeMembers.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                    onClick={handleAddClick}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors"
                >
                    <Plus size={20} />
                    Invite Member
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {safeMembers.map((member) => (
                    <TeamMemberCard
                        key={member.id}
                        member={member}
                        onEdit={() => handleEditClick(member)}
                        onDelete={() => handleDeleteClick(member)}
                        onClick={() => handleCardClick(member)}
                    />
                ))}
            </div>

            {safeMembers.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <User className="text-muted-foreground" size={40} />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No team members yet</h3>
                    <p className="text-muted-foreground mb-4">Add your first team member to get started</p>
                    <button
                        onClick={handleAddClick}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors"
                    >
                        Invite Your First Member
                    </button>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <TeamMemberModal
                    member={editingMember}
                    onClose={() => {
                        setShowModal(false);
                        setEditingMember(null);
                    }}
                    onSave={fetchTeamMembers}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deletingMember && (
                <DeleteConfirmModal
                    member={deletingMember}
                    onClose={() => setDeletingMember(null)}
                    onConfirm={fetchTeamMembers}
                />
            )}
        </div>
    );
}
