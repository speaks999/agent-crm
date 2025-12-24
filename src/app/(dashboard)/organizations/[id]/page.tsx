'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Building2, Loader2, ArrowLeft, Globe, Briefcase, Calendar, Trash2, Edit2 } from 'lucide-react';
import Link from 'next/link';

interface Account {
    id: string;
    name: string;
    industry?: string;
    website?: string;
    tags?: string[];
    created_at?: string;
    updated_at?: string;
}

async function fetchMCPData(toolName: string, args: Record<string, unknown> = {}) {
    const response = await fetch('/api/mcp/call-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: toolName, arguments: args }),
    });

    if (!response.ok) {
        throw new Error(`MCP request failed: ${response.status}`);
    }

    const json = await response.json();
    return json.result?.structuredContent || {};
}

export default function AccountDetailPage() {
    const params = useParams();
    const router = useRouter();
    const accountId = params.id as string;

    const [account, setAccount] = useState<Account | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        fetchAccount();
    }, [accountId]);

    async function fetchAccount() {
        try {
            setError(null);
            const data = await fetchMCPData('get_account', { id: accountId });
            const accountData = data.accounts?.[0] || data.account;
            if (accountData) {
                setAccount(accountData);
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
                    <a
                        href="/chat"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors"
                    >
                        <Edit2 size={16} />
                        Edit in Chat
                    </a>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                    >
                        <Trash2 size={16} />
                        Delete
                    </button>
                </div>
            </div>

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

                    {/* Tags */}
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4">Tags</h3>
                        <div className="bg-muted p-4 rounded-lg min-h-[150px]">
                            {account.tags && account.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {account.tags.map((tag, idx) => (
                                        <span 
                                            key={idx} 
                                            className="px-3 py-1 bg-primary-muted text-primary text-sm rounded-full"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground italic">No tags</p>
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
