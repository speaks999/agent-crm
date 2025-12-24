'use client';

import { useState, useEffect } from 'react';
import { Building2, Loader2, RefreshCw, Globe, Briefcase, Plus, Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Account {
    id: string;
    name: string;
    industry?: string;
    website?: string;
    created_at?: string;
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

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchAccounts();
    }, []);

    async function fetchAccounts() {
        try {
            const data = await fetchMCPData('list_accounts');
            const accountsList = data.accounts || [];
            // Sort by newest first
            const sorted = [...accountsList].sort((a: Account, b: Account) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateB - dateA;
            });
            setAccounts(sorted);
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function refreshAccounts() {
        setIsRefreshing(true);
        await fetchAccounts();
        setIsRefreshing(false);
    }

    const filteredAccounts = accounts.filter(account => {
        const query = searchQuery.toLowerCase();
        return (
            account.name?.toLowerCase().includes(query) ||
            account.industry?.toLowerCase().includes(query) ||
            account.website?.toLowerCase().includes(query)
        );
    });

    // Group by industry for stats
    const industries = accounts.reduce((acc, account) => {
        const industry = account.industry || 'Other';
        acc[industry] = (acc[industry] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-8">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <Link 
                        href="/data" 
                        className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Accounts</h2>
                        <p className="text-muted-foreground mt-1">
                            {filteredAccounts.length} accounts
                            {Object.keys(industries).length > 0 && ` • ${Object.keys(industries).length} industries`}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={refreshAccounts}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <a
                        href="/chat"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors"
                    >
                        <Plus size={18} />
                        Add Account
                    </a>
                </div>
            </div>

            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search accounts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAccounts.map((account) => (
                    <div
                        key={account.id}
                        className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all hover:border-primary group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-primary-muted flex items-center justify-center text-primary shrink-0">
                                <Building2 size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                    {account.name || 'Unnamed Account'}
                                </h3>

                                {account.industry && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                                        <Briefcase size={14} />
                                        <span className="truncate">{account.industry}</span>
                                    </div>
                                )}

                                {account.website && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                        <Globe size={14} />
                                        <a 
                                            href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="truncate hover:text-primary transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {account.website}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredAccounts.length === 0 && (
                <div className="text-center py-12">
                    <Building2 className="mx-auto text-muted-foreground" size={64} />
                    <p className="text-muted-foreground mt-4">
                        {searchQuery ? `No accounts found matching "${searchQuery}"` : 'No accounts found'}
                    </p>
                    <a
                        href="/chat"
                        className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors"
                    >
                        Create your first account
                    </a>
                </div>
            )}
        </div>
    );
}
