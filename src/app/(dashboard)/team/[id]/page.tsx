'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Mail,
    Shield,
    User,
    Loader2,
    Pencil,
    Trash2,
    X,
    Calendar,
    Clock,
    UserCheck,
    UserX,
} from 'lucide-react';
import { getAuthHeaders } from '@/lib/fetchMCPData';

interface TeamMember {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: 'admin' | 'manager' | 'member';
    avatar_url?: string;
    active: boolean;
    timezone_id?: string;
    created_at?: string;
    updated_at?: string;
}

// Edit modal component
function EditMemberModal({
    member,
    onClose,
    onSave,
}: {
    member: TeamMember;
    onClose: () => void;
    onSave: (updated: TeamMember) => void;
}) {
    const [formData, setFormData] = useState({
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email,
        role: member.role,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            const headers = await getAuthHeaders();
            const response = await fetch('/api/team', {
                method: 'PUT',
                headers,
                credentials: 'include',
                body: JSON.stringify({ id: member.id, ...formData }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save');
            }

            const updated = await response.json();
            onSave(updated);
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
                    <div className="flex items-center gap-3">
                        <Pencil size={20} className="text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">Edit Team Member</h3>
                    </div>
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
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
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
                        Are you sure you want to remove <strong>{member.first_name} {member.last_name}</strong> from the team?
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

export default function TeamMemberDetailPage() {
    const params = useParams();
    const router = useRouter();
    const memberId = params.id as string;

    const [member, setMember] = useState<TeamMember | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isTogglingStatus, setIsTogglingStatus] = useState(false);

    useEffect(() => {
        fetchMember();
    }, [memberId]);

    async function fetchMember() {
        try {
            setError(null);
            const headers = await getAuthHeaders();
            // Fetch all members and find the one we need
            // (In production, you'd want a dedicated GET /api/team/:id endpoint)
            const response = await fetch('/api/team', { headers, credentials: 'include' });
            const data = await response.json();
            const foundMember = Array.isArray(data) 
                ? data.find((m: TeamMember) => m.id === memberId)
                : null;
            
            if (foundMember) {
                setMember(foundMember);
            } else {
                setError('Team member not found');
            }
        } catch (err) {
            console.error('Failed to fetch member:', err);
            setError('Failed to load team member');
        } finally {
            setIsLoading(false);
        }
    }

    async function toggleActiveStatus() {
        if (!member) return;
        setIsTogglingStatus(true);

        try {
            const headers = await getAuthHeaders();
            const response = await fetch('/api/team', {
                method: 'PUT',
                headers,
                credentials: 'include',
                body: JSON.stringify({ id: member.id, active: !member.active }),
            });

            if (response.ok) {
                const updated = await response.json();
                setMember(updated);
            }
        } catch (err) {
            console.error('Failed to toggle status:', err);
        } finally {
            setIsTogglingStatus(false);
        }
    }

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
                return <Shield size={16} />;
            default:
                return <User size={16} />;
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    if (error || !member) {
        return (
            <div className="flex-1 overflow-auto p-8 bg-background">
                <button
                    onClick={() => router.push('/team')}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Team
                </button>
                <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                        <User className="text-red-500" size={40} />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{error || 'Not Found'}</h3>
                    <p className="text-muted-foreground">The team member you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-8 bg-background">
            {/* Back button */}
            <button
                onClick={() => router.push('/team')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
                <ArrowLeft size={20} />
                Back to Team
            </button>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center text-primary font-bold text-3xl border-2 border-primary/30">
                        {member.first_name[0]}{member.last_name[0]}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-foreground">
                                {member.first_name} {member.last_name}
                            </h1>
                            {!member.active && (
                                <span className="px-2 py-1 bg-red-500/10 text-red-500 text-xs font-medium rounded-full">
                                    Inactive
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail size={16} />
                            <a href={`mailto:${member.email}`} className="hover:text-primary transition-colors">
                                {member.email}
                            </a>
                        </div>
                        <div className="mt-3">
                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getRoleColor(member.role)}`}>
                                {getRoleIcon(member.role)}
                                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Pencil size={16} />
                        Edit
                    </button>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                    >
                        <Trash2 size={16} />
                        Remove
                    </button>
                </div>
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Status card */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Status</h2>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {member.active ? (
                                    <>
                                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                            <UserCheck size={20} className="text-green-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">Active</p>
                                            <p className="text-sm text-muted-foreground">This team member is currently active</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                            <UserX size={20} className="text-red-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">Inactive</p>
                                            <p className="text-sm text-muted-foreground">This team member has been deactivated</p>
                                        </div>
                                    </>
                                )}
                            </div>
                            <button
                                onClick={toggleActiveStatus}
                                disabled={isTogglingStatus}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    member.active
                                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                        : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                } disabled:opacity-50`}
                            >
                                {isTogglingStatus ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : member.active ? (
                                    'Deactivate'
                                ) : (
                                    'Reactivate'
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Activity placeholder */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
                        <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                                <Clock size={24} className="text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">Activity tracking coming soon</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Assigned deals, tasks, and interactions will appear here
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Details card */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Details</h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                    <Mail size={18} className="text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Email</p>
                                    <p className="text-sm font-medium text-foreground">{member.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                    <Shield size={18} className="text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Role</p>
                                    <p className="text-sm font-medium text-foreground capitalize">{member.role}</p>
                                </div>
                            </div>
                            {member.timezone_id && (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                        <Clock size={18} className="text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Timezone</p>
                                        <p className="text-sm font-medium text-foreground">{member.timezone_id}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                    <Calendar size={18} className="text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Member Since</p>
                                    <p className="text-sm font-medium text-foreground">{formatDate(member.created_at)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
                        <div className="space-y-2">
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="flex items-center gap-2 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                            >
                                <Pencil size={16} />
                                Edit Details
                            </button>
                            <a
                                href={`mailto:${member.email}`}
                                className="flex items-center gap-2 w-full px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm"
                            >
                                <Mail size={16} />
                                Send Email
                            </a>
                            <button
                                onClick={fetchMember}
                                className="flex items-center gap-2 w-full px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm"
                            >
                                <Loader2 size={16} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && member && (
                <EditMemberModal
                    member={member}
                    onClose={() => setShowEditModal(false)}
                    onSave={(updated) => setMember(updated)}
                />
            )}

            {/* Delete Modal */}
            {showDeleteModal && member && (
                <DeleteConfirmModal
                    member={member}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={() => router.push('/team')}
                />
            )}
        </div>
    );
}

