'use client';

import { useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';

export default function SendInvitePage() {
    const [email, setEmail] = useState('evans27@learn.cssd.ab.ca');
    const [role, setRole] = useState('member');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSend = async () => {
        setSending(true);
        setError(null);
        setResult(null);

        try {
            const { createBrowserClient } = await import('@/lib/supabaseClient');
            const supabase = createBrowserClient();
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                setError('No active session. Please log in.');
                setSending(false);
                return;
            }

            // Get current team
            const teamResponse = await fetch('/api/teams/current', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
                credentials: 'include',
            });

            if (!teamResponse.ok) {
                throw new Error('Failed to get current team');
            }

            const { team_id } = await teamResponse.json();

            if (!team_id) {
                throw new Error('No team selected');
            }

            // Send invite
            const response = await fetch('/api/teams/invites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                credentials: 'include',
                body: JSON.stringify({
                    team_id,
                    email,
                    role,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send invite');
            }

            setResult(`✅ Invitation sent to ${email}!`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex-1 overflow-auto p-8">
            <div className="max-w-md mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <Mail className="text-primary" size={32} />
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Send Team Invite</h1>
                        <p className="text-sm text-muted-foreground">Quick invite tool</p>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="email@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                        </select>
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={sending || !email}
                        className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {sending ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Mail size={16} />
                                Send Invite
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    {result && (
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm">
                            {result}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
