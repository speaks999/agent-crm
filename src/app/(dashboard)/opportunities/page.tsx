'use client';

import { useState, useEffect } from 'react';
import { Target, Loader2, RefreshCw, DollarSign, Calendar, TrendingUp, Plus, ArrowLeft, Filter, UserCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { fetchMCPData, getAuthHeaders } from '@/lib/fetchMCPData';

interface Deal {
    id: string;
    name: string;
    amount?: number;
    stage?: string;
    status?: string;
    close_date?: string;
    assigned_to?: string;
    created_at?: string;
}

interface TeamMember {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

export default function DealsPage() {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [allDeals, setAllDeals] = useState<Deal[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [selectedAssignee, setSelectedAssignee] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchTeamMembers();
        fetchDeals();
    }, []);

    useEffect(() => {
        // Filter deals when selectedAssignee changes
        if (selectedAssignee === '') {
            setDeals(allDeals);
        } else if (selectedAssignee === 'unassigned') {
            setDeals(allDeals.filter(d => !d.assigned_to));
        } else {
            setDeals(allDeals.filter(d => d.assigned_to === selectedAssignee));
        }
    }, [selectedAssignee, allDeals]);

    async function fetchTeamMembers() {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch('/api/team', { headers, credentials: 'include' });
            const data = await response.json();
            setTeamMembers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch team members:', error);
        }
    }

    async function fetchDeals() {
        try {
            const data = await fetchMCPData('list_deals');
            const dealsList = data.deals || [];
            // Sort by newest first
            const sorted = [...dealsList].sort((a: Deal, b: Deal) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateB - dateA;
            });
            setAllDeals(sorted);
            setDeals(sorted);
        } catch (error) {
            console.error('Failed to fetch deals:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function refreshDeals() {
        setIsRefreshing(true);
        await fetchDeals();
        setIsRefreshing(false);
    }

    function getAssigneeName(assigneeId?: string) {
        if (!assigneeId) return null;
        const member = teamMembers.find(m => m.id === assigneeId);
        return member ? `${member.first_name} ${member.last_name}` : null;
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

    const getStatusColor = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'won':
                return 'bg-success/20 text-success';
            case 'lost':
                return 'bg-destructive/20 text-destructive';
            case 'open':
            default:
                return 'bg-info/20 text-info';
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

    // Calculate totals
    const totalValue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
    const openDeals = deals.filter(d => d.status?.toLowerCase() === 'open' || !d.status);
    const wonDeals = deals.filter(d => d.status?.toLowerCase() === 'won');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-8">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Link 
                        href="/data" 
                        className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Deals</h2>
                        <p className="text-muted-foreground mt-1">
                            {deals.length} {selectedAssignee ? 'filtered' : ''} deals • {openDeals.length} open • {wonDeals.length} won
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {/* Assignee Filter */}
                    <div className="relative">
                        <select
                            value={selectedAssignee}
                            onChange={(e) => setSelectedAssignee(e.target.value)}
                            className="appearance-none pl-10 pr-8 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                        >
                            <option value="">All Team Members</option>
                            <option value="unassigned">Unassigned</option>
                            {teamMembers.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.first_name} {member.last_name}
                                </option>
                            ))}
                        </select>
                        <UserCircle size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                    <button
                        onClick={refreshDeals}
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
                        Create Deal
                    </a>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-card p-4 rounded-xl border border-border">
                    <p className="text-sm text-muted-foreground">Total Pipeline Value</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(totalValue) || '$0'}</p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                    <p className="text-sm text-muted-foreground">Open Deals</p>
                    <p className="text-2xl font-bold text-info">{openDeals.length}</p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                    <p className="text-sm text-muted-foreground">Won Deals</p>
                    <p className="text-2xl font-bold text-success">{wonDeals.length}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deals.map((deal) => (
                    <a
                        key={deal.id}
                        href={`/opportunities/${deal.id}`}
                        className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all hover:border-primary cursor-pointer"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-primary-muted flex items-center justify-center text-primary">
                                <Target size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground truncate">
                                    {deal.name || 'Unnamed Deal'}
                                </h3>
                                {deal.amount && (
                                    <div className="flex items-center gap-1 text-lg font-bold text-success mt-2">
                                        <DollarSign size={18} />
                                        <span>{formatCurrency(deal.amount)}</span>
                                    </div>
                                )}
                                {deal.stage && (
                                    <div className="mt-3">
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStageColor(deal.stage)}`}>
                                            {deal.stage}
                                        </span>
                                    </div>
                                )}
                                {deal.close_date && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                                        <Calendar size={14} />
                                        <span>Close {new Date(deal.close_date).toLocaleDateString()}</span>
                                    </div>
                                )}
                                {deal.status && (
                                    <div className="mt-2">
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deal.status)}`}>
                                            {deal.status.toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                {deal.assigned_to && getAssigneeName(deal.assigned_to) && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                                        <UserCircle size={14} />
                                        <span>{getAssigneeName(deal.assigned_to)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </a>
                ))}
            </div>

            {deals.length === 0 && (
                <div className="text-center py-12">
                    <Target className="mx-auto text-muted-foreground" size={64} />
                    <p className="text-muted-foreground mt-4">No deals found</p>
                    <a
                        href="/chat"
                        className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors"
                    >
                        Create your first deal
                    </a>
                </div>
            )}
        </div>
    );
}
