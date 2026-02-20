'use client';

import React, { useState, useEffect } from 'react';
import { useTeam } from '@/contexts/TeamContext';
import { 
    Settings, 
    Users, 
    Mail, 
    Trash2, 
    Crown,
    Shield,
    User,
    Loader2,
    ArrowLeft,
    Plus,
    Copy,
    Check,
    Building2
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface TeamMember {
    id: string;
    user_id: string;
    role: string;
    joined_at: string;
    user: {
        email: string;
    };
}

interface PendingInvite {
    id: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
    expires_at: string;
}

export default function TeamSettingsPage() {
    const { currentTeam, sendInvite, refreshTeams, loading: teamLoading } = useTeam();
    const { session } = useAuth();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Invite form
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [isSendingInvite, setIsSendingInvite] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState(false);

    // Edit team name
    const [isEditingName, setIsEditingName] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [isSavingName, setIsSavingName] = useState(false);
    const [nameSaveSuccess, setNameSaveSuccess] = useState(false);

    useEffect(() => {
        if (currentTeam) {
            setTeamName(currentTeam.name);
            fetchTeamData();
        }
    }, [currentTeam]);

    const fetchTeamData = async () => {
        if (!currentTeam || !session) return;

        try {
            setLoading(true);
            // Fetch team members and pending invites
            // For now, we'll use placeholder data since we need to create these endpoints
            // TODO: Create /api/teams/[id]/members endpoint
            setMembers([]);
            setPendingInvites([]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSendInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentTeam || !inviteEmail.trim()) return;

        setIsSendingInvite(true);
        setError(null);
        setInviteSuccess(false);

        try {
            await sendInvite(currentTeam.id, inviteEmail.trim(), inviteRole);
            setInviteSuccess(true);
            setInviteEmail('');
            setInviteRole('member');
            setTimeout(() => {
                setShowInviteForm(false);
                setInviteSuccess(false);
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to send invite');
        } finally {
            setIsSendingInvite(false);
        }
    };

    const handleSaveTeamName = async () => {
        if (!currentTeam || !session?.access_token) return;
        const nextName = teamName.trim();
        if (!nextName) {
            setError('Team name cannot be empty');
            return;
        }

        if (nextName === currentTeam.name) {
            setIsEditingName(false);
            return;
        }

        setIsSavingName(true);
        setError(null);
        setNameSaveSuccess(false);

        try {
            const response = await fetch('/api/teams', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                credentials: 'include',
                body: JSON.stringify({
                    team_id: currentTeam.id,
                    name: nextName,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update team name');
            }

            await refreshTeams();
            setIsEditingName(false);
            setNameSaveSuccess(true);
            setTimeout(() => setNameSaveSuccess(false), 2500);
        } catch (err: any) {
            setError(err.message || 'Failed to update team name');
        } finally {
            setIsSavingName(false);
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'owner':
                return <Crown size={14} className="text-yellow-500" />;
            case 'admin':
                return <Shield size={14} className="text-blue-500" />;
            default:
                return <User size={14} className="text-muted-foreground" />;
        }
    };

    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case 'owner':
                return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
            case 'admin':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    if (teamLoading || !currentTeam) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        href="/team"
                        className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Team Settings</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage {currentTeam.name}
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                        {error}
                    </div>
                )}

                {/* Team Info */}
                <section className="bg-card border border-border rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                        <Building2 size={20} />
                        Team Information
                    </h2>
                    
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-primary-muted flex items-center justify-center">
                            {currentTeam.logo_url ? (
                                <img
                                    src={currentTeam.logo_url}
                                    alt={currentTeam.name}
                                    className="w-full h-full rounded-xl object-cover"
                                />
                            ) : (
                                <Building2 size={32} className="text-primary" />
                            )}
                        </div>
                        <div className="flex-1">
                            {isEditingName ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={teamName}
                                        onChange={(e) => setTeamName(e.target.value)}
                                        className="px-3 py-1.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                    <button
                                        onClick={handleSaveTeamName}
                                        disabled={isSavingName}
                                        className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary-glow transition-colors"
                                    >
                                        {isSavingName ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTeamName(currentTeam.name);
                                            setIsEditingName(false);
                                        }}
                                        className="px-3 py-1.5 bg-muted text-foreground rounded-lg text-sm hover:bg-muted/80 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <h3 className="text-xl font-semibold text-foreground">
                                        {currentTeam.name}
                                    </h3>
                                    {currentTeam.slug && (
                                        <p className="text-sm text-muted-foreground">
                                            /{currentTeam.slug}
                                        </p>
                                    )}
                                    {nameSaveSuccess && (
                                        <p className="text-sm text-green-500 mt-1">Team name saved</p>
                                    )}
                                </div>
                            )}
                        </div>
                        {currentTeam.role === 'owner' && !isEditingName && (
                            <button
                                onClick={() => setIsEditingName(true)}
                                className="px-3 py-1.5 bg-muted text-foreground rounded-lg text-sm hover:bg-muted/80 transition-colors"
                            >
                                Edit
                            </button>
                        )}
                    </div>
                </section>

                {/* Invite Members */}
                <section className="bg-card border border-border rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Mail size={20} />
                            Invite Members
                        </h2>
                        {!showInviteForm && (
                            <button
                                onClick={() => setShowInviteForm(true)}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary-glow transition-colors flex items-center gap-2"
                            >
                                <Plus size={16} />
                                Invite
                            </button>
                        )}
                    </div>

                    {showInviteForm && (
                        <form onSubmit={handleSendInvite} className="mb-4">
                            <div className="flex flex-wrap gap-3">
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="colleague@company.com"
                                    className="flex-1 min-w-[200px] px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    required
                                />
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <button
                                    type="submit"
                                    disabled={isSendingInvite || !inviteEmail.trim()}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSendingInvite ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Sending...
                                        </>
                                    ) : inviteSuccess ? (
                                        <>
                                            <Check size={16} />
                                            Sent!
                                        </>
                                    ) : (
                                        <>
                                            <Mail size={16} />
                                            Send Invite
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowInviteForm(false);
                                        setInviteEmail('');
                                        setInviteRole('member');
                                    }}
                                    className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Invites expire after 7 days. The recipient will receive an email with instructions.
                            </p>
                        </form>
                    )}

                    {pendingInvites.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                Pending Invites
                            </h3>
                            <div className="space-y-2">
                                {pendingInvites.map((invite) => (
                                    <div
                                        key={invite.id}
                                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Mail size={16} className="text-muted-foreground" />
                                            <span className="text-sm text-foreground">{invite.email}</span>
                                            <span className={`px-2 py-0.5 text-xs rounded-full ${getRoleBadgeClass(invite.role)}`}>
                                                {invite.role}
                                            </span>
                                        </div>
                                        <button className="text-muted-foreground hover:text-destructive transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!showInviteForm && pendingInvites.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            Invite colleagues to collaborate on this team's CRM data.
                        </p>
                    )}
                </section>

                {/* Team Members */}
                <section className="bg-card border border-border rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                        <Users size={20} />
                        Team Members
                    </h2>

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="animate-spin text-primary" size={24} />
                        </div>
                    ) : members.length === 0 ? (
                        <div className="text-center py-8">
                            <Users size={32} className="mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                                You're the only member of this team. Invite others to collaborate!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {members.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary-muted flex items-center justify-center text-primary font-medium">
                                            {member.user.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">
                                                {member.user.email}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${getRoleBadgeClass(member.role)}`}>
                                                    {getRoleIcon(member.role)}
                                                    {member.role}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {member.role !== 'owner' && currentTeam.role === 'owner' && (
                                        <button className="text-muted-foreground hover:text-destructive transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Danger Zone */}
                {currentTeam.role === 'owner' && (
                    <section className="bg-destructive/5 border border-destructive/20 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-destructive flex items-center gap-2 mb-4">
                            <Trash2 size={20} />
                            Danger Zone
                        </h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            Deleting a team will permanently remove all associated data including contacts, deals, and interactions. This action cannot be undone.
                        </p>
                        <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors">
                            Delete Team
                        </button>
                    </section>
                )}
            </div>
        </div>
    );
}

