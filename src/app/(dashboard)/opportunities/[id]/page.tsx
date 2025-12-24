'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Target,
    Loader2,
    ArrowLeft,
    DollarSign,
    Calendar,
    Building2,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
} from 'lucide-react';

interface Deal {
    id: string;
    name: string;
    amount?: number;
    stage?: string;
    status?: string;
    close_date?: string;
    account_id?: string;
    pipeline_id?: string;
    created_at?: string;
    updated_at?: string;
}

interface Account {
    id: string;
    name: string;
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

export default function DealDetailPage() {
    const params = useParams();
    const router = useRouter();
    const dealId = params.id as string;

    const [deal, setDeal] = useState<Deal | null>(null);
    const [account, setAccount] = useState<Account | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        fetchDeal();
    }, [dealId]);

    async function fetchDeal() {
        try {
            setError(null);
            const data = await fetchMCPData('get_deal', { id: dealId });
            // API returns deals as an array
            const dealData = data.deals?.[0] || data.deal;
            if (dealData) {
                setDeal(dealData);
                // Fetch associated account if exists
                if (dealData.account_id) {
                    try {
                        const accountData = await fetchMCPData('get_account', { id: dealData.account_id });
                        const accountInfo = accountData.accounts?.[0] || accountData.account;
                        if (accountInfo) {
                            setAccount(accountInfo);
                        }
                    } catch (err) {
                        console.error('Failed to fetch account:', err);
                    }
                }
            } else {
                setError('Deal not found');
            }
        } catch (err: any) {
            console.error('Error fetching deal:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    async function updateDealStatus(newStatus: 'won' | 'lost') {
        if (!deal) return;
        setIsUpdating(true);
        try {
            await fetchMCPData('close_deal', { id: deal.id, status: newStatus });
            await fetchDeal();
        } catch (err: any) {
            console.error('Error updating deal:', err);
            alert('Failed to update deal: ' + err.message);
        } finally {
            setIsUpdating(false);
        }
    }

    async function updateDealStage(newStage: string) {
        if (!deal) return;
        setIsUpdating(true);
        try {
            await fetchMCPData('move_deal_stage', { id: deal.id, stage: newStage });
            await fetchDeal();
        } catch (err: any) {
            console.error('Error updating deal stage:', err);
            alert('Failed to update deal stage: ' + err.message);
        } finally {
            setIsUpdating(false);
        }
    }

    async function deleteDeal() {
        if (!deal) return;
        setIsDeleting(true);
        try {
            await fetchMCPData('delete_deal', { id: deal.id });
            router.push('/opportunities');
        } catch (err: any) {
            console.error('Error deleting deal:', err);
            alert('Failed to delete deal: ' + err.message);
            setIsDeleting(false);
        }
    }

    const formatCurrency = (amount?: number) => {
        if (!amount) return null;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusColor = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'won':
                return 'bg-success/20 text-success border-success/30';
            case 'lost':
                return 'bg-destructive/20 text-destructive border-destructive/30';
            case 'open':
            default:
                return 'bg-info/20 text-info border-info/30';
        }
    };

    const getStageColor = (stage?: string) => {
        const stageLower = stage?.toLowerCase() || '';
        if (stageLower.includes('won') || stageLower.includes('closed won')) {
            return 'bg-success/20 text-success';
        }
        if (stageLower.includes('lost') || stageLower.includes('closed lost')) {
            return 'bg-destructive/20 text-destructive';
        }
        if (stageLower.includes('proposal') || stageLower.includes('negotiation')) {
            return 'bg-warning/20 text-warning';
        }
        if (stageLower.includes('discovery') || stageLower.includes('qualified')) {
            return 'bg-primary/20 text-primary';
        }
        return 'bg-muted text-muted-foreground';
    };

    const commonStages = ['New', 'Discovery', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    if (error || !deal) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <Target className="mx-auto text-muted-foreground" size={64} />
                    <p className="text-destructive mt-4">{error || 'Deal not found'}</p>
                <button
                    onClick={() => router.push('/opportunities')}
                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors"
                >
                    Back to Deals
                </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.push('/opportunities')}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-foreground">{deal.name || 'Unnamed Deal'}</h1>
                    <p className="text-muted-foreground">Deal Details</p>
                </div>
                <div className="flex gap-2">
                    {deal.status?.toLowerCase() === 'open' && (
                        <>
                            <button
                                onClick={() => updateDealStatus('won')}
                                disabled={isUpdating}
                                className="flex items-center gap-2 px-4 py-2 bg-success/20 text-success border border-success/30 rounded-lg hover:bg-success/30 transition-colors disabled:opacity-50"
                            >
                                <CheckCircle size={18} />
                                Mark Won
                            </button>
                            <button
                                onClick={() => updateDealStatus('lost')}
                                disabled={isUpdating}
                                className="flex items-center gap-2 px-4 py-2 bg-destructive/20 text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/30 transition-colors disabled:opacity-50"
                            >
                                <XCircle size={18} />
                                Mark Lost
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                    >
                        <Trash2 size={18} />
                        Delete
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-foreground mb-2">Delete Deal?</h3>
                        <p className="text-muted-foreground mb-4">
                            Are you sure you want to delete "{deal.name}"? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteDeal}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Overview Card */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Overview</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Deal Value</p>
                                <div className="flex items-center gap-2 text-2xl font-bold text-success">
                                    <DollarSign size={24} />
                                    {formatCurrency(deal.amount) || 'Not set'}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Status</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(deal.status)}`}>
                                    {deal.status?.toUpperCase() || 'OPEN'}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Stage</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStageColor(deal.stage)}`}>
                                    {deal.stage || 'Not set'}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Expected Close Date</p>
                                <div className="flex items-center gap-2 text-foreground">
                                    <Calendar size={18} />
                                    {formatDate(deal.close_date) || 'Not set'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stage Progression */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Move to Stage</h2>
                        <div className="flex flex-wrap gap-2">
                            {commonStages.map((stage) => (
                                <button
                                    key={stage}
                                    onClick={() => updateDealStage(stage)}
                                    disabled={isUpdating || deal.stage === stage}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                                        deal.stage === stage
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted hover:bg-muted/80 text-foreground'
                                    }`}
                                >
                                    {stage}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Account Info */}
                    {account && (
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4">Associated Account</h2>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-primary-muted flex items-center justify-center text-primary">
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">{account.name}</p>
                                    <p className="text-sm text-muted-foreground">Account</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Info */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Details</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Deal ID</p>
                                <p className="text-foreground font-mono text-xs truncate">{deal.id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Created</p>
                                <div className="flex items-center gap-2 text-foreground text-sm">
                                    <Clock size={14} />
                                    {formatDateTime(deal.created_at) || 'Unknown'}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Last Updated</p>
                                <div className="flex items-center gap-2 text-foreground text-sm">
                                    <Clock size={14} />
                                    {formatDateTime(deal.updated_at) || 'Unknown'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
                        <div className="space-y-2">
                            <a
                                href="/chat"
                                className="flex items-center gap-2 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors text-sm"
                            >
                                <Edit2 size={16} />
                                Edit in Chat
                            </a>
                            <button
                                onClick={fetchDeal}
                                className="flex items-center gap-2 w-full px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm"
                            >
                                <Loader2 size={16} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

