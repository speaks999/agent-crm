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
    Tag,
    Plus,
    X,
    GitBranch,
    ChevronRight,
    Pencil,
    UserCircle,
} from 'lucide-react';
import { fetchMCPData, getAuthHeaders } from '@/lib/fetchMCPData';

interface Deal {
    id: string;
    name: string;
    amount?: number;
    stage?: string;
    status?: string;
    close_date?: string;
    account_id?: string;
    pipeline_id?: string;
    tags?: string[];
    assigned_to?: string;
    created_at?: string;
    updated_at?: string;
}

interface Account {
    id: string;
    name: string;
}

interface Pipeline {
    id: string;
    name: string;
    stages: string[];
}

interface TeamMember {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
}

// Stage colors for visual progression
const STAGE_COLORS = [
    'bg-blue-500', 'bg-purple-500', 'bg-cyan-500', 'bg-emerald-500',
    'bg-amber-500', 'bg-orange-500', 'bg-rose-500', 'bg-pink-500',
];

function EditDealModal({
    deal,
    accounts,
    teamMembers,
    onClose,
    onSave,
}: {
    deal: Deal;
    accounts: Account[];
    teamMembers: TeamMember[];
    onClose: () => void;
    onSave: (updated: Deal) => void;
}) {
    const [formData, setFormData] = useState({
        name: deal.name || '',
        amount: deal.amount?.toString() || '',
        close_date: deal.close_date ? deal.close_date.split('T')[0] : '',
        status: deal.status || '',
        account_id: deal.account_id || '',
        assigned_to: deal.assigned_to || '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        if (!deal.id || typeof deal.id !== 'string') {
            setError('Invalid deal ID');
            setIsSaving(false);
            return;
        }

        try {
            const args: Record<string, unknown> = {
                id: deal.id,
            };
            
            if (formData.name) args.name = formData.name;
            if (formData.amount) args.amount = parseFloat(formData.amount);
            if (formData.close_date) args.close_date = formData.close_date;
            if (formData.status) args.status = formData.status;
            if (formData.account_id) args.account_id = formData.account_id;
            // Handle assigned_to - allow null to unassign
            if (formData.assigned_to) {
                args.assigned_to = formData.assigned_to;
            } else if (deal.assigned_to && !formData.assigned_to) {
                args.assigned_to = null; // Explicitly unassign
            }

            await fetchMCPData('update_deal', args);

            onSave({
                ...deal,
                name: formData.name,
                amount: formData.amount ? parseFloat(formData.amount) : undefined,
                close_date: formData.close_date || undefined,
                status: formData.status || undefined,
                account_id: formData.account_id || undefined,
                assigned_to: formData.assigned_to || undefined,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-card border border-border rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <Pencil size={20} className="text-primary" />
                        <h2 className="font-semibold text-foreground">Edit Deal</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <X size={20} className="text-muted-foreground" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(85vh-140px)]">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                            Deal Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                            Amount
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <input
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full pl-7 pr-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                step="0.01"
                                min="0"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                            Close Date
                        </label>
                        <input
                            type="date"
                            value={formData.close_date}
                            onChange={(e) => setFormData({ ...formData, close_date: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="">Select status</option>
                            <option value="open">Open</option>
                            <option value="won">Won</option>
                            <option value="lost">Lost</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                            Account
                        </label>
                        <select
                            value={formData.account_id}
                            onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="">No account linked</option>
                            {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                            Assigned To
                        </label>
                        <select
                            value={formData.assigned_to}
                            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="">Unassigned</option>
                            {teamMembers.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.first_name} {member.last_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4 border-t border-border">
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

export default function DealDetailPage() {
    const params = useParams();
    const router = useRouter();
    const dealId = params.id as string;

    const [deal, setDeal] = useState<Deal | null>(null);
    const [account, setAccount] = useState<Account | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [assignedMember, setAssignedMember] = useState<TeamMember | null>(null);
    const [pipelines, setPipelines] = useState<Pipeline[]>([]);
    const [currentPipeline, setCurrentPipeline] = useState<Pipeline | null>(null);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [showPipelineDropdown, setShowPipelineDropdown] = useState(false);
    const [isMovingStage, setIsMovingStage] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        fetchDeal();
        fetchAvailableTags();
        fetchPipelines();
        fetchTeamMembers();
        fetchAccounts();
    }, [dealId]);

    async function fetchPipelines() {
        try {
            const data = await fetchMCPData('list_pipelines', {});
            setPipelines(data.pipelines || []);
        } catch (err) {
            console.error('Failed to fetch pipelines:', err);
        }
    }

    async function fetchAccounts() {
        try {
            const data = await fetchMCPData('list_accounts', {});
            setAccounts(data.accounts || []);
        } catch (err) {
            console.error('Failed to fetch accounts:', err);
        }
    }

    async function fetchTeamMembers() {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch('/api/team', { headers, credentials: 'include' });
            const data = await response.json();
            const members = Array.isArray(data) ? data : [];
            setTeamMembers(members);
        } catch (err) {
            console.error('Failed to fetch team members:', err);
        }
    }

    async function assignDeal(memberId: string | null) {
        if (!deal) return;
        setIsAssigning(true);

        try {
            await fetchMCPData('update_deal', {
                id: deal.id,
                assigned_to: memberId,
            });
            setDeal({ ...deal, assigned_to: memberId || undefined });
            if (memberId) {
                const member = teamMembers.find(m => m.id === memberId);
                setAssignedMember(member || null);
            } else {
                setAssignedMember(null);
            }
        } catch (err) {
            console.error('Failed to assign deal:', err);
        } finally {
            setIsAssigning(false);
        }
    }

    // Determine current pipeline from deal's stage tag
    function detectPipelineFromStage(dealData: Deal, pipelinesList: Pipeline[]) {
        if (!dealData.stage) return null;
        
        // Stage format is "Pipeline Name - Stage Name"
        for (const pipeline of pipelinesList) {
            if (dealData.stage.startsWith(`${pipeline.name} - `)) {
                return pipeline;
            }
        }
        return null;
    }

    // Get current stage name from the full stage tag
    function getCurrentStageName(deal: Deal, pipeline: Pipeline | null): string | null {
        if (!deal.stage || !pipeline) return null;
        const prefix = `${pipeline.name} - `;
        if (deal.stage.startsWith(prefix)) {
            return deal.stage.substring(prefix.length);
        }
        return null;
    }

    async function assignToPipeline(pipeline: Pipeline) {
        if (!deal) return;
        
        setIsMovingStage(true);
        const firstStage = pipeline.stages[0];
        const newStageTag = `${pipeline.name} - ${firstStage}`;
        
        // Update tags: remove any existing pipeline stage tags, add new one
        const currentTags = deal.tags || [];
        const nonPipelineTags = currentTags.filter(tag => {
            // Remove tags that match any pipeline stage format
            for (const p of pipelines) {
                if (tag.startsWith(`${p.name} - `)) {
                    return false;
                }
            }
            return true;
        });
        const updatedTags = [...nonPipelineTags, newStageTag];

        try {
            await fetchMCPData('update_deal', {
                id: deal.id,
                stage: newStageTag,
                tags: updatedTags,
            });
            setDeal({ ...deal, stage: newStageTag, tags: updatedTags });
            setCurrentPipeline(pipeline);
            setShowPipelineDropdown(false);
        } catch (err) {
            console.error('Failed to assign to pipeline:', err);
        } finally {
            setIsMovingStage(false);
        }
    }

    async function moveToStage(stageName: string) {
        if (!deal || !currentPipeline) return;
        
        setIsMovingStage(true);
        const newStageTag = `${currentPipeline.name} - ${stageName}`;
        
        // Update tags: remove old pipeline stage tag, add new one
        const currentTags = deal.tags || [];
        const nonPipelineTags = currentTags.filter(tag => {
            // Remove tags that match this pipeline's stage format
            return !tag.startsWith(`${currentPipeline.name} - `);
        });
        const updatedTags = [...nonPipelineTags, newStageTag];

        try {
            await fetchMCPData('update_deal', {
                id: deal.id,
                stage: newStageTag,
                tags: updatedTags,
            });
            setDeal({ ...deal, stage: newStageTag, tags: updatedTags });
        } catch (err) {
            console.error('Failed to move stage:', err);
        } finally {
            setIsMovingStage(false);
        }
    }

    async function removeFromPipeline() {
        if (!deal || !currentPipeline) return;
        
        setIsMovingStage(true);
        
        // Remove pipeline stage tags
        const currentTags = deal.tags || [];
        const nonPipelineTags = currentTags.filter(tag => {
            return !tag.startsWith(`${currentPipeline.name} - `);
        });

        try {
            await fetchMCPData('update_deal', {
                id: deal.id,
                stage: '',
                tags: nonPipelineTags,
            });
            setDeal({ ...deal, stage: '', tags: nonPipelineTags });
            setCurrentPipeline(null);
        } catch (err) {
            console.error('Failed to remove from pipeline:', err);
        } finally {
            setIsMovingStage(false);
        }
    }

    async function fetchAvailableTags() {
        try {
            const data = await fetchMCPData('list_tags', {});
            const tags = data.tags || [];
            setAvailableTags(tags.map((t: { tag_name: string }) => t.tag_name).sort());
        } catch (err) {
            console.error('Failed to fetch available tags:', err);
        }
    }

    async function addTag(tagName: string) {
        if (!deal || !tagName.trim()) return;
        
        const trimmedTag = tagName.trim();
        const currentTags = deal.tags || [];
        
        if (currentTags.includes(trimmedTag)) {
            setShowTagDropdown(false);
            return;
        }

        setIsAddingTag(true);
        const updatedTags = [...currentTags, trimmedTag];

        try {
            await fetchMCPData('update_deal', {
                id: deal.id,
                tags: updatedTags,
            });
            setDeal({ ...deal, tags: updatedTags });
            setShowTagDropdown(false);
        } catch (err) {
            console.error('Failed to add tag:', err);
        } finally {
            setIsAddingTag(false);
        }
    }

    async function removeTag(tagToRemove: string) {
        if (!deal) return;
        
        const currentTags = deal.tags || [];
        const updatedTags = currentTags.filter(t => t !== tagToRemove);

        // Optimistic update
        setDeal({ ...deal, tags: updatedTags });

        try {
            await fetchMCPData('update_deal', {
                id: deal.id,
                tags: updatedTags,
            });
        } catch (err) {
            console.error('Failed to remove tag:', err);
            // Revert on error
            setDeal({ ...deal, tags: currentTags });
        }
    }

    async function fetchDeal() {
        try {
            setError(null);
            const data = await fetchMCPData('get_deal', { id: dealId });
            // API returns deals as an array
            const dealData = data.deals?.[0] || data.deal;
            if (dealData) {
                setDeal(dealData);
                
                // Detect current pipeline from stage
                const pipelinesData = await fetchMCPData('list_pipelines', {});
                const pipelinesList = pipelinesData.pipelines || [];
                setPipelines(pipelinesList);
                const detected = detectPipelineFromStage(dealData, pipelinesList);
                setCurrentPipeline(detected);
                
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
                
                // Fetch assigned team member if exists
                if (dealData.assigned_to) {
                    try {
                        const headers = await getAuthHeaders();
                        const response = await fetch('/api/team', { headers, credentials: 'include' });
                        const members = await response.json();
                        if (Array.isArray(members)) {
                            const member = members.find((m: TeamMember) => m.id === dealData.assigned_to);
                            setAssignedMember(member || null);
                        }
                    } catch (err) {
                        console.error('Failed to fetch assigned member:', err);
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

                    {/* Pipeline Section */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <GitBranch size={20} className="text-muted-foreground" />
                                Pipeline
                            </h2>
                            {currentPipeline && (
                                <button
                                    onClick={removeFromPipeline}
                                    disabled={isMovingStage}
                                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                                >
                                    Remove from pipeline
                                </button>
                            )}
                        </div>

                        {!currentPipeline ? (
                            // Pipeline Selection
                            <div className="relative">
                                <button
                                    onClick={() => setShowPipelineDropdown(!showPipelineDropdown)}
                                    disabled={isMovingStage}
                                    className="flex items-center gap-2 px-4 py-3 bg-background border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors w-full justify-between"
                                >
                                    <span className="flex items-center gap-2">
                                        {isMovingStage ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Plus size={16} />
                                        )}
                                        Assign to a pipeline...
                                    </span>
                                    <svg className={`w-4 h-4 transition-transform ${showPipelineDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                
                                {showPipelineDropdown && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-10" 
                                            onClick={() => setShowPipelineDropdown(false)}
                                        />
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                                            {pipelines.length === 0 ? (
                                                <div className="p-4 text-sm text-muted-foreground text-center">
                                                    No pipelines available. Create one in Sales.
                                                </div>
                                            ) : (
                                                pipelines.map((pipeline) => (
                                                    <button
                                                        key={pipeline.id}
                                                        onClick={() => assignToPipeline(pipeline)}
                                                        className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-0"
                                                    >
                                                        <p className="font-medium text-foreground">{pipeline.name}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {pipeline.stages.length} stages: {pipeline.stages.slice(0, 3).join(' → ')}
                                                            {pipeline.stages.length > 3 && '...'}
                                                        </p>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            // Pipeline Stage Progression
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-sm font-medium text-primary">{currentPipeline.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        ({currentPipeline.stages.length} stages)
                                    </span>
                                </div>
                                
                                {/* Stage Progression Bar */}
                                <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
                                    {currentPipeline.stages.map((stage, index) => {
                                        const currentStageName = getCurrentStageName(deal, currentPipeline);
                                        const isCurrentStage = stage === currentStageName;
                                        const currentIndex = currentPipeline.stages.indexOf(currentStageName || '');
                                        const isPastStage = currentIndex >= 0 && index < currentIndex;
                                        const stageColor = STAGE_COLORS[index % STAGE_COLORS.length];
                                        
                                        return (
                                            <div key={stage} className="flex items-center">
                                                <button
                                                    onClick={() => moveToStage(stage)}
                                                    disabled={isMovingStage || isCurrentStage}
                                                    className={`
                                                        relative px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap
                                                        ${isCurrentStage 
                                                            ? `${stageColor} text-white shadow-lg scale-105` 
                                                            : isPastStage
                                                                ? 'bg-muted text-muted-foreground'
                                                                : 'bg-background border border-border text-foreground hover:border-primary/50 hover:bg-muted'
                                                        }
                                                        disabled:cursor-not-allowed
                                                    `}
                                                >
                                                    {isMovingStage && isCurrentStage && (
                                                        <Loader2 size={12} className="animate-spin absolute -top-1 -right-1" />
                                                    )}
                                                    {stage}
                                                </button>
                                                {index < currentPipeline.stages.length - 1 && (
                                                    <ChevronRight size={16} className="text-muted-foreground mx-1 shrink-0" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Current Stage Info */}
                                {getCurrentStageName(deal, currentPipeline) && (
                                    <div className="p-3 bg-muted rounded-lg">
                                        <p className="text-xs text-muted-foreground">Current Stage</p>
                                        <p className="font-medium text-foreground">
                                            {getCurrentStageName(deal, currentPipeline)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
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
                    {/* Tags Section */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Tag size={18} className="text-muted-foreground" />
                            Tags
                        </h2>
                        
                        {/* Quick Add Tag Dropdown */}
                        <div className="relative mb-4">
                            <button
                                onClick={() => setShowTagDropdown(!showTagDropdown)}
                                disabled={isAddingTag}
                                className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors w-full justify-between"
                            >
                                <span className="flex items-center gap-2">
                                    {isAddingTag ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Plus size={14} />
                                    )}
                                    Add a tag...
                                </span>
                                <svg className={`w-4 h-4 transition-transform ${showTagDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {showTagDropdown && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-10" 
                                        onClick={() => setShowTagDropdown(false)}
                                    />
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                                        {(() => {
                                            const currentTags = deal.tags || [];
                                            const unusedTags = availableTags.filter(t => !currentTags.includes(t));
                                            
                                            if (unusedTags.length === 0) {
                                                return (
                                                    <div className="p-3 text-sm text-muted-foreground text-center">
                                                        {availableTags.length === 0 
                                                            ? 'No tags exist yet. Create one in the Data Hub.'
                                                            : 'All available tags are already added.'}
                                                    </div>
                                                );
                                            }
                                            
                                            return unusedTags.map((tag) => (
                                                <button
                                                    key={tag}
                                                    onClick={() => addTag(tag)}
                                                    className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                                                >
                                                    <span className="w-2 h-2 rounded-full bg-primary" />
                                                    {tag}
                                                </button>
                                            ));
                                        })()}
                                    </div>
                                </>
                            )}
                        </div>
                        
                        {/* Tags List */}
                        {deal.tags && deal.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {deal.tags.map((tag, idx) => (
                                    <span 
                                        key={idx} 
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-muted text-primary text-sm rounded-full group"
                                    >
                                        {tag}
                                        <button
                                            onClick={() => removeTag(tag)}
                                            className="p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                                            title="Remove tag"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic text-sm">No tags yet. Select one above!</p>
                        )}
                    </div>

                    {/* Assigned To */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <UserCircle size={20} className="text-primary" />
                            Assigned To
                        </h2>
                        
                        {assignedMember ? (
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center text-primary font-semibold border border-primary/20">
                                    {assignedMember.first_name[0]}{assignedMember.last_name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground truncate">
                                        {assignedMember.first_name} {assignedMember.last_name}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">{assignedMember.email}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm mb-4">Not assigned to anyone</p>
                        )}
                        
                        <select
                            value={deal?.assigned_to || ''}
                            onChange={(e) => assignDeal(e.target.value || null)}
                            disabled={isAssigning}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm disabled:opacity-50"
                        >
                            <option value="">Unassigned</option>
                            {teamMembers.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.first_name} {member.last_name}
                                </option>
                            ))}
                        </select>
                        {isAssigning && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                <Loader2 size={14} className="animate-spin" />
                                Updating...
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
                        <div className="space-y-2">
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="flex items-center gap-2 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors text-sm"
                            >
                                <Edit2 size={16} />
                                Edit Deal
                            </button>
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

            {/* Edit Modal */}
            {showEditModal && deal && (
                <EditDealModal
                    deal={deal}
                    accounts={accounts}
                    teamMembers={teamMembers}
                    onClose={() => setShowEditModal(false)}
                    onSave={(updated) => {
                        setDeal(updated);
                        setShowEditModal(false);
                        // Update the associated account display if changed
                        if (updated.account_id) {
                            const newAccount = accounts.find(a => a.id === updated.account_id);
                            setAccount(newAccount || null);
                        } else {
                            setAccount(null);
                        }
                        // Update the assigned member display if changed
                        if (updated.assigned_to) {
                            const newMember = teamMembers.find(m => m.id === updated.assigned_to);
                            setAssignedMember(newMember || null);
                        } else {
                            setAssignedMember(null);
                        }
                    }}
                />
            )}
        </div>
    );
}

