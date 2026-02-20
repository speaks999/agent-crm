'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface Team {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    owner_id: string;
    role: string;
    isCurrent: boolean;
    created_at: string;
}

interface TeamInvite {
    id: string;
    role: string;
    status: string;
    created_at: string;
    expires_at: string;
    teams: {
        id: string;
        name: string;
        logo_url?: string;
    };
    invited_by_user: {
        email: string;
    };
}

interface TeamContextType {
    currentTeam: Team | null;
    teams: Team[];
    invites: TeamInvite[];
    loading: boolean;
    error: string | null;
    switchTeam: (teamId: string) => Promise<void>;
    createTeam: (name: string) => Promise<Team | null>;
    refreshTeams: () => Promise<void>;
    refreshInvites: () => Promise<void>;
    acceptInvite: (inviteId: string) => Promise<void>;
    declineInvite: (inviteId: string) => Promise<void>;
    sendInvite: (teamId: string, email: string, role?: string) => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: React.ReactNode }) {
    const { user, session } = useAuth();
    const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [invites, setInvites] = useState<TeamInvite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Note: Using Bearer token for authentication
    const getAuthHeaders = useCallback(async (): Promise<HeadersInit> => {
        if (!session?.access_token) {
            return {
                'Content-Type': 'application/json',
            };
        }
        
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        };
    }, [session]);

    const refreshTeams = useCallback(async () => {
        if (!user || !session) {
            setTeams([]);
            setCurrentTeam(null);
            setLoading(false);
            return;
        }

        try {
            setError(null);
            const headers = await getAuthHeaders();
            
            // If no auth headers available yet, wait
            if (!session?.access_token) {
                setLoading(false);
                return;
            }
            
            const response = await fetch('/api/teams', { headers, credentials: 'include' });

            const data = await response.json();
            
            // API now returns empty arrays on error, so this should always work
            setTeams(data.teams || []);
            
            // Set current team
            const current = data.teams?.find((t: Team) => t.isCurrent);
            if (current) {
                setCurrentTeam(current);
            } else if (data.teams?.length > 0) {
                // If no current team set, use first team
                setCurrentTeam(data.teams[0]);
            } else {
                setCurrentTeam(null);
            }
        } catch (err: any) {
            // Don't log as error - this is expected when teams feature isn't set up
            console.warn('Could not fetch teams:', err.message);
            setTeams([]);
            setCurrentTeam(null);
        } finally {
            setLoading(false);
        }
    }, [user, session, getAuthHeaders]);

    const refreshInvites = useCallback(async () => {
        if (!user || !session) {
            setInvites([]);
            return;
        }

        try {
            const headers = await getAuthHeaders();
            
            // If no auth headers available yet, skip
            if (!session?.access_token) {
                return;
            }
            
            const response = await fetch('/api/teams/invites', { headers, credentials: 'include' });
            const data = await response.json();
            setInvites(data.invites || []);
        } catch (err: any) {
            // Don't log as error - expected when teams feature isn't set up
            console.warn('Could not fetch invites:', err.message);
            setInvites([]);
        }
    }, [user, session, getAuthHeaders]);

    // Load teams and invites on mount and when user changes
    useEffect(() => {
        if (user && session) {
            refreshTeams();
            refreshInvites();
        } else {
            setTeams([]);
            setCurrentTeam(null);
            setInvites([]);
            setLoading(false);
        }
    }, [user, session, refreshTeams, refreshInvites]);

    const switchTeam = useCallback(async (teamId: string) => {
        if (!session) return;

        try {
            setError(null);
            const response = await fetch('/api/teams/current', {
                method: 'PUT',
                headers: await getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({ team_id: teamId }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to switch team');
            }

            const data = await response.json();
            
            // Update local state
            setCurrentTeam(data.team);
            setTeams(prev => prev.map(t => ({
                ...t,
                isCurrent: t.id === teamId,
            })));

            // Refresh the page to reload data with new team context
            window.location.reload();
        } catch (err: any) {
            console.error('Error switching team:', err);
            setError(err.message);
            throw err;
        }
    }, [session, getAuthHeaders]);

    const createTeam = useCallback(async (name: string): Promise<Team | null> => {
        if (!session) return null;

        try {
            setError(null);
            const response = await fetch('/api/teams', {
                method: 'POST',
                headers: await getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({ name }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create team');
            }

            const data = await response.json();
            
            // Refresh teams list
            await refreshTeams();
            
            return data.team;
        } catch (err: any) {
            console.error('Error creating team:', err);
            setError(err.message);
            throw err;
        }
    }, [session, getAuthHeaders, refreshTeams]);

    const acceptInvite = useCallback(async (inviteId: string) => {
        if (!session) return;

        try {
            setError(null);
            const response = await fetch('/api/teams/invites', {
                method: 'PUT',
                headers: await getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({ invite_id: inviteId, action: 'accept' }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to accept invite');
            }

            // Refresh both teams and invites
            await Promise.all([refreshTeams(), refreshInvites()]);
        } catch (err: any) {
            console.error('Error accepting invite:', err);
            setError(err.message);
            throw err;
        }
    }, [session, getAuthHeaders, refreshTeams, refreshInvites]);

    const declineInvite = useCallback(async (inviteId: string) => {
        if (!session) return;

        try {
            setError(null);
            const response = await fetch('/api/teams/invites', {
                method: 'PUT',
                headers: await getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({ invite_id: inviteId, action: 'decline' }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to decline invite');
            }

            // Refresh invites
            await refreshInvites();
        } catch (err: any) {
            console.error('Error declining invite:', err);
            setError(err.message);
            throw err;
        }
    }, [session, getAuthHeaders, refreshInvites]);

    const sendInvite = useCallback(async (teamId: string, email: string, role: string = 'member') => {
        if (!session) return;

        try {
            setError(null);
            const response = await fetch('/api/teams/invites', {
                method: 'POST',
                headers: await getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({ team_id: teamId, email, role }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to send invite');
            }
        } catch (err: any) {
            console.error('Error sending invite:', err);
            setError(err.message);
            throw err;
        }
    }, [session, getAuthHeaders]);

    return (
        <TeamContext.Provider
            value={{
                currentTeam,
                teams,
                invites,
                loading,
                error,
                switchTeam,
                createTeam,
                refreshTeams,
                refreshInvites,
                acceptInvite,
                declineInvite,
                sendInvite,
            }}
        >
            {children}
        </TeamContext.Provider>
    );
}

export function useTeam() {
    const context = useContext(TeamContext);
    if (context === undefined) {
        throw new Error('useTeam must be used within a TeamProvider');
    }
    return context;
}

