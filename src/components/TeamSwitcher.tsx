'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTeam } from '@/contexts/TeamContext';
import { 
    ChevronDown, 
    Check, 
    Plus, 
    Users, 
    Settings,
    Mail,
    Loader2,
    Building2
} from 'lucide-react';
import Link from 'next/link';

export default function TeamSwitcher() {
    const { currentTeam, teams, invites, loading, switchTeam, createTeam } = useTeam();
    const [isOpen, setIsOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isSwitching, setIsSwitching] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSwitchTeam = async (teamId: string) => {
        if (teamId === currentTeam?.id) {
            setIsOpen(false);
            return;
        }
        
        setIsSwitching(teamId);
        try {
            await switchTeam(teamId);
        } catch (err) {
            console.error('Failed to switch team:', err);
        } finally {
            setIsSwitching(null);
            setIsOpen(false);
        }
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTeamName.trim()) return;

        setIsCreating(true);
        try {
            const team = await createTeam(newTeamName.trim());
            if (team) {
                setNewTeamName('');
                setShowCreateModal(false);
                // Switch to the new team
                await switchTeam(team.id);
            }
        } catch (err) {
            console.error('Failed to create team:', err);
        } finally {
            setIsCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-card/50 rounded-lg">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
        );
    }

    if (!currentTeam) {
        return null;
    }

    return (
        <>
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-muted rounded-lg border border-border transition-colors min-w-[180px]"
                >
                    <div className="w-7 h-7 rounded-md bg-primary-muted flex items-center justify-center">
                        {currentTeam.logo_url ? (
                            <img 
                                src={currentTeam.logo_url} 
                                alt={currentTeam.name}
                                className="w-full h-full rounded-md object-cover"
                            />
                        ) : (
                            <Building2 size={14} className="text-primary" />
                        )}
                    </div>
                    <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-foreground truncate max-w-[120px]">
                            {currentTeam.name}
                        </p>
                    </div>
                    <ChevronDown 
                        size={16} 
                        className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                    />
                    {invites.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                            {invites.length}
                        </span>
                    )}
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                        {/* Teams List */}
                        <div className="p-2">
                            <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Your Teams
                            </p>
                            <div className="mt-1 space-y-1">
                                {teams.map((team) => (
                                    <button
                                        key={team.id}
                                        onClick={() => handleSwitchTeam(team.id)}
                                        disabled={isSwitching !== null}
                                        className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors ${
                                            team.id === currentTeam?.id
                                                ? 'bg-primary-muted'
                                                : 'hover:bg-muted'
                                        } disabled:opacity-50`}
                                    >
                                        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                                            {team.logo_url ? (
                                                <img 
                                                    src={team.logo_url} 
                                                    alt={team.name}
                                                    className="w-full h-full rounded-md object-cover"
                                                />
                                            ) : (
                                                <Building2 size={16} className="text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {team.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground capitalize">
                                                {team.role}
                                            </p>
                                        </div>
                                        {isSwitching === team.id ? (
                                            <Loader2 size={16} className="animate-spin text-primary" />
                                        ) : team.id === currentTeam?.id ? (
                                            <Check size={16} className="text-primary" />
                                        ) : null}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Pending Invites */}
                        {invites.length > 0 && (
                            <div className="border-t border-border p-2">
                                <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                    <Mail size={12} />
                                    Pending Invites
                                </p>
                                <div className="mt-1 space-y-1">
                                    {invites.slice(0, 3).map((invite) => (
                                        <Link
                                            key={invite.id}
                                            href="/team/invites"
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-md bg-primary-muted flex items-center justify-center shrink-0">
                                                <Users size={16} className="text-primary" />
                                            </div>
                                            <div className="flex-1 text-left min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">
                                                    {invite.teams.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Invited as {invite.role}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                    {invites.length > 3 && (
                                        <Link
                                            href="/team/invites"
                                            onClick={() => setIsOpen(false)}
                                            className="block px-2 py-1 text-sm text-primary hover:underline"
                                        >
                                            View all {invites.length} invites
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="border-t border-border p-2">
                            <button
                                onClick={() => {
                                    setShowCreateModal(true);
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors text-foreground"
                            >
                                <Plus size={16} />
                                <span className="text-sm">Create new team</span>
                            </button>
                            <Link
                                href="/team/settings"
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors text-foreground"
                            >
                                <Settings size={16} />
                                <span className="text-sm">Team settings</span>
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Team Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-foreground">Create New Team</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Create a new team to collaborate with others
                            </p>
                            
                            <form onSubmit={handleCreateTeam} className="mt-4">
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Team Name
                                </label>
                                <input
                                    type="text"
                                    value={newTeamName}
                                    onChange={(e) => setNewTeamName(e.target.value)}
                                    placeholder="My Awesome Team"
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    autoFocus
                                />
                                
                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            setNewTeamName('');
                                        }}
                                        className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreating || !newTeamName.trim()}
                                        className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isCreating ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Team'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

