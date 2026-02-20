'use client';

import { useState } from 'react';
import { Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function CheckTeamMembershipPage() {
    const [checking, setChecking] = useState(false);
    const [fixing, setFixing] = useState(false);
    const [cleaning, setCleaning] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleCheck = async () => {
        setChecking(true);
        setError(null);
        setResult(null);

        try {
            // Get the session token
            const { createBrowserClient } = await import('@/lib/supabaseClient');
            const supabase = createBrowserClient();
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                setError('No active session. Please log in.');
                setChecking(false);
                return;
            }

            const response = await fetch('/api/admin/check-team-membership', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to check team membership');
            } else {
                setResult(data);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setChecking(false);
        }
    };

    const handleFix = async () => {
        setFixing(true);
        setError(null);

        try {
            // Get the session token
            const { createBrowserClient } = await import('@/lib/supabaseClient');
            const supabase = createBrowserClient();
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                setError('No active session. Please log in.');
                setFixing(false);
                return;
            }

            const response = await fetch('/api/admin/check-team-membership', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to fix team membership');
            } else {
                alert(data.message);
                // Recheck after fixing
                handleCheck();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setFixing(false);
        }
    };

    const handleCleanup = async () => {
        if (!confirm('This will delete all your duplicate teams and consolidate your data into one team. This cannot be undone. Continue?')) {
            return;
        }

        setCleaning(true);
        setError(null);

        try {
            const { createBrowserClient } = await import('@/lib/supabaseClient');
            const supabase = createBrowserClient();
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                setError('No active session. Please log in.');
                setCleaning(false);
                return;
            }

            const response = await fetch('/api/admin/cleanup-teams', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to cleanup teams');
            } else {
                alert(`Success! ${data.message}\n\nDeleted ${data.deletedTeams} teams\nMoved ${data.movedData.contacts} contacts, ${data.movedData.accounts} accounts, ${data.movedData.deals} deals, ${data.movedData.interactions} tasks`);
                // Recheck after cleanup
                handleCheck();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setCleaning(false);
        }
    };

    return (
        <div className="flex-1 overflow-auto p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <Shield className="text-primary" size={32} />
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Check Team Membership</h1>
                        <p className="text-sm text-muted-foreground">
                            Verify and fix your team membership status
                        </p>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <div className="flex gap-3">
                        <button
                            onClick={handleCheck}
                            disabled={checking}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {checking ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Checking...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={16} />
                                    Check Status
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleFix}
                            disabled={fixing}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {fixing ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Fixing...
                                </>
                            ) : (
                                <>
                                    <Shield size={16} />
                                    Fix Team Membership
                                </>
                            )}
                        </button>

                        {result?.memberships?.length > 1 && (
                            <button
                                onClick={handleCleanup}
                                disabled={cleaning}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {cleaning ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Cleaning...
                                    </>
                                ) : (
                                    <>
                                        <XCircle size={16} />
                                        Cleanup Duplicate Teams
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                            <div className="flex items-center gap-2">
                                <XCircle size={16} />
                                <span className="font-medium">Error:</span>
                            </div>
                            <p className="mt-1 text-sm">{error}</p>
                        </div>
                    )}

                    {result && (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                                <h3 className="font-semibold text-foreground mb-2">User Information</h3>
                                <div className="space-y-1 text-sm">
                                    <p><span className="text-muted-foreground">User ID:</span> <code className="text-xs">{result.userId}</code></p>
                                    <p><span className="text-muted-foreground">Email:</span> {result.userEmail}</p>
                                    {result.userMetadata && (
                                        <>
                                            <p><span className="text-muted-foreground">First Name:</span> {result.userMetadata.first_name || 'N/A'}</p>
                                            <p><span className="text-muted-foreground">Last Name:</span> {result.userMetadata.last_name || 'N/A'}</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 bg-muted rounded-lg">
                                <h3 className="font-semibold text-foreground mb-2">Team Memberships ({result.memberships?.length || 0})</h3>
                                {result.memberships?.length > 0 ? (
                                    <div className="space-y-2">
                                        {result.memberships.map((m: any) => (
                                            <div key={m.id} className="p-3 bg-background rounded border border-border text-sm">
                                                <p><span className="text-muted-foreground">Team ID:</span> <code className="text-xs">{m.team_id}</code></p>
                                                <p><span className="text-muted-foreground">Role:</span> <span className="font-medium text-primary">{m.role}</span></p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No team memberships found</p>
                                )}
                            </div>

                            <div className="p-4 bg-muted rounded-lg">
                                <h3 className="font-semibold text-foreground mb-2">Team Members Records ({result.teamMembers?.length || 0})</h3>
                                {result.teamMembers?.length > 0 ? (
                                    <div className="space-y-2">
                                        {result.teamMembers.map((m: any) => (
                                            <div key={m.id} className="p-3 bg-background rounded border border-border text-sm">
                                                <p><span className="text-muted-foreground">Team ID:</span> <code className="text-xs">{m.team_id}</code></p>
                                                <p><span className="text-muted-foreground">Name:</span> {m.first_name} {m.last_name}</p>
                                                <p><span className="text-muted-foreground">Role:</span> <span className="font-medium text-primary">{m.role}</span></p>
                                                <p><span className="text-muted-foreground">Active:</span> {m.active ? 'Yes' : 'No'}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No team member records found</p>
                                )}
                            </div>

                            <div className="p-4 bg-muted rounded-lg">
                                <h3 className="font-semibold text-foreground mb-2">Current Team Preference</h3>
                                {result.preferences ? (
                                    <div className="text-sm">
                                        <p><span className="text-muted-foreground">Current Team ID:</span> <code className="text-xs">{result.preferences.current_team_id}</code></p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No team preference set</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <h3 className="font-semibold text-foreground mb-2">Instructions</h3>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Click "Check Status" to see your current team membership status</li>
                        <li>If you're missing from team_memberships or team_members, click "Fix Team Membership"</li>
                        <li>If you have no teams, it will create a new team and add you as the owner</li>
                        <li>If you have a team but aren't in team_members, it will add you</li>
                        <li>After fixing, refresh the page or navigate to Team settings to verify</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
