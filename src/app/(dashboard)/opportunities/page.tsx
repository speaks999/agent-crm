'use client';

import { useState, useEffect } from 'react';
import { Target, Loader2, RefreshCw, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface Opportunity {
    id: string;
    insightly_id: number;
    opportunity_name: string;
    bid_amount?: number;
    bid_currency?: string;
    probability?: number;
    forecast_close_date?: string;
    opportunity_state?: string;
}

export default function OpportunitiesPage() {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        fetchOpportunities();
    }, []);

    async function fetchOpportunities() {
        try {
            const response = await fetch('/api/insightly/opportunities');
            const data = await response.json();
            setOpportunities(data);
        } catch (error) {
            console.error('Failed to fetch opportunities:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function syncOpportunities() {
        setIsSyncing(true);
        try {
            const response = await fetch('/api/insightly/opportunities/sync', {
                method: 'POST',
            });
            const result = await response.json();
            if (result.success) {
                await fetchOpportunities();
            }
        } catch (error) {
            console.error('Failed to sync opportunities:', error);
        } finally {
            setIsSyncing(false);
        }
    }

    const formatCurrency = (amount?: number, currency?: string) => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Opportunities</h2>
                    <p className="text-slate-500 mt-1">{opportunities.length} opportunities</p>
                </div>
                <button
                    onClick={syncOpportunities}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
                    {isSyncing ? 'Syncing...' : 'Sync from Insightly'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {opportunities.map((opp) => (
                    <Link
                        key={opp.id}
                        href={`/opportunities/${opp.id}`}
                        className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-indigo-200"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <Target size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-800 truncate">
                                    {opp.opportunity_name}
                                </h3>
                                {opp.bid_amount && (
                                    <div className="flex items-center gap-1 text-lg font-bold text-green-600 mt-2">
                                        <DollarSign size={18} />
                                        <span>{formatCurrency(opp.bid_amount, opp.bid_currency)}</span>
                                    </div>
                                )}
                                {opp.probability !== undefined && (
                                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-2">
                                        <TrendingUp size={14} />
                                        <span>{opp.probability}% probability</span>
                                    </div>
                                )}
                                {opp.forecast_close_date && (
                                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                                        <Calendar size={14} />
                                        <span>Close {new Date(opp.forecast_close_date).toLocaleDateString()}</span>
                                    </div>
                                )}
                                {opp.opportunity_state && (
                                    <div className="mt-3">
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${opp.opportunity_state === 'WON' ? 'bg-green-100 text-green-800' : opp.opportunity_state === 'LOST' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {opp.opportunity_state}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {opportunities.length === 0 && (
                <div className="text-center py-12">
                    <Target className="mx-auto text-slate-300" size={64} />
                    <p className="text-slate-500 mt-4">No opportunities found</p>
                    <button
                        onClick={syncOpportunities}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Sync from Insightly
                    </button>
                </div>
            )}
        </div>
    );
}
