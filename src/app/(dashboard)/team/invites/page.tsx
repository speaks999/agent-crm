'use client';

import React from 'react';
import { useTeam } from '@/contexts/TeamContext';
import { 
    Mail, 
    Users, 
    Check, 
    X, 
    Clock, 
    Loader2,
    ArrowLeft,
    Building2
} from 'lucide-react';
import Link from 'next/link';

export default function TeamInvitesPage() {
    const { invites, acceptInvite, declineInvite, loading } = useTeam();
    const [processingId, setProcessingId] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const handleAccept = async (inviteId: string) => {
        setProcessingId(inviteId);
        setError(null);
        try {
            await acceptInvite(inviteId);
        } catch (err: any) {
            setError(err.message || 'Failed to accept invite');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDecline = async (inviteId: string) => {
        setProcessingId(inviteId);
        setError(null);
        try {
            await declineInvite(inviteId);
        } catch (err: any) {
            setError(err.message || 'Failed to decline invite');
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getTimeRemaining = (expiresAt: string) => {
        const now = new Date();
        const expires = new Date(expiresAt);
        const diff = expires.getTime() - now.getTime();
        
        if (diff <= 0) return 'Expired';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
        return `${hours} hour${hours > 1 ? 's' : ''} left`;
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-8">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        href="/team"
                        className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Team Invitations</h1>
                        <p className="text-muted-foreground mt-1">
                            {invites.length} pending invite{invites.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                        {error}
                    </div>
                )}

                {invites.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                            <Mail size={32} className="text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground">No pending invites</h3>
                        <p className="text-muted-foreground mt-2">
                            When someone invites you to join their team, it will appear here.
                        </p>
                        <Link
                            href="/team"
                            className="inline-block mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors"
                        >
                            Back to Team
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {invites.map((invite) => (
                            <div
                                key={invite.id}
                                className="bg-card border border-border rounded-xl p-6"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-primary-muted flex items-center justify-center shrink-0">
                                        {invite.teams.logo_url ? (
                                            <img
                                                src={invite.teams.logo_url}
                                                alt={invite.teams.name}
                                                className="w-full h-full rounded-lg object-cover"
                                            />
                                        ) : (
                                            <Building2 size={24} className="text-primary" />
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-foreground">
                                            {invite.teams.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Invited by {invite.invited_by_user?.email || 'Unknown'}
                                        </p>
                                        
                                        <div className="flex flex-wrap items-center gap-4 mt-3">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-muted text-primary text-xs font-medium rounded-full">
                                                <Users size={12} />
                                                {invite.role}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Clock size={12} />
                                                {getTimeRemaining(invite.expires_at)}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                Received {formatDate(invite.created_at)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleDecline(invite.id)}
                                            disabled={processingId !== null}
                                            className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {processingId === invite.id ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <X size={16} />
                                            )}
                                            Decline
                                        </button>
                                        <button
                                            onClick={() => handleAccept(invite.id)}
                                            disabled={processingId !== null}
                                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {processingId === invite.id ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Check size={16} />
                                            )}
                                            Accept
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

