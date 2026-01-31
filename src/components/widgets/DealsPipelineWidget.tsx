'use client';

import React, { useState, useEffect } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetProps } from './types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { fetchMCPData } from '@/lib/fetchMCPData';

interface Deal {
    id: string;
    name: string;
    amount: number;
    stage: string;
}

interface StageData {
    name: string;
    count: number;
    value: number;
    color: string;
    deals: Deal[];
}

const STAGE_COLORS: Record<string, string> = {
    'Qualification': 'bg-blue-500',
    'Proposal': 'bg-yellow-500',
    'Negotiation': 'bg-orange-500',
    'Closed Won': 'bg-green-500',
    'Closed Lost': 'bg-red-500',
    'Discovery': 'bg-purple-500',
    'Demo': 'bg-pink-500',
    'New': 'bg-cyan-500',
    'Lead': 'bg-indigo-500',
    'Qualified': 'bg-teal-500',
    'default': 'bg-primary',
};

export function DealsPipelineWidget({ config, onRemove, onResize, onSettings, onDragStart, isDragging }: WidgetProps) {
    const [stages, setStages] = useState<StageData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());

    useEffect(() => {
        async function fetchDeals() {
            try {
                const result = await fetchMCPData('list_deals');
                const deals = result.deals || [];
                
                // Group by stage
                const stageMap: Record<string, { count: number; value: number; deals: Deal[] }> = {};
                deals.forEach((deal: any) => {
                    const stage = deal.stage || 'Unknown';
                    if (!stageMap[stage]) {
                        stageMap[stage] = { count: 0, value: 0, deals: [] };
                    }
                    stageMap[stage].count++;
                    stageMap[stage].value += deal.amount || 0;
                    stageMap[stage].deals.push({
                        id: deal.id,
                        name: deal.name || 'Unnamed Deal',
                        amount: deal.amount || 0,
                        stage: stage,
                    });
                });

                setStages(Object.entries(stageMap).map(([name, data]) => ({
                    name,
                    count: data.count,
                    value: data.value,
                    color: STAGE_COLORS[name] || STAGE_COLORS.default,
                    deals: data.deals,
                })));
            } catch (error) {
                console.error('Failed to fetch pipeline:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchDeals();
    }, []);

    const toggleStage = (stageName: string) => {
        setExpandedStages(prev => {
            const next = new Set(prev);
            if (next.has(stageName)) {
                next.delete(stageName);
            } else {
                next.add(stageName);
            }
            return next;
        });
    };

    const totalDeals = stages.reduce((sum, s) => sum + s.count, 0);
    const totalValue = stages.reduce((sum, s) => sum + s.value, 0);

    return (
        <WidgetWrapper config={config} onRemove={onRemove} onResize={onResize} onSettings={onSettings} onDragStart={onDragStart} isDragging={isDragging}>
            {isLoading ? (
                <div className="h-[200px] flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground">Loading...</div>
                </div>
            ) : stages.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    No deals in pipeline
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-foreground">{totalDeals}</p>
                            <p className="text-xs text-muted-foreground">Total Deals</p>
                        </div>
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-primary">${(totalValue / 1000).toFixed(0)}k</p>
                            <p className="text-xs text-muted-foreground">Pipeline Value</p>
                        </div>
                    </div>

                    {/* Pipeline Visualization */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {stages.map((stage) => {
                            const isExpanded = expandedStages.has(stage.name);
                            return (
                                <div key={stage.name} className="space-y-1">
                                    <button
                                        onClick={() => toggleStage(stage.name)}
                                        className="w-full flex items-center gap-2 hover:bg-muted/50 rounded-lg p-1 -ml-1 transition-colors"
                                    >
                                        {isExpanded ? (
                                            <ChevronDown size={14} className="text-muted-foreground shrink-0" />
                                        ) : (
                                            <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                                        )}
                                        <div className="flex-1 text-left">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-foreground font-medium">{stage.name}</span>
                                                <span className="text-muted-foreground text-xs">{stage.count} • ${stage.value.toLocaleString()}</span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden mt-1">
                                                <div 
                                                    className={`h-full ${stage.color} rounded-full transition-all`}
                                                    style={{ width: `${(stage.count / totalDeals) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </button>
                                    
                                    {/* Expanded deals list */}
                                    {isExpanded && (
                                        <div className="ml-5 pl-2 border-l-2 border-border space-y-1">
                                            {stage.deals.map((deal) => (
                                                <a
                                                    key={deal.id}
                                                    href={`/opportunities/${deal.id}`}
                                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                                                >
                                                    <span className="text-foreground truncate max-w-[150px]">{deal.name}</span>
                                                    {deal.amount > 0 && (
                                                        <span className="text-muted-foreground text-xs">
                                                            ${deal.amount.toLocaleString()}
                                                        </span>
                                                    )}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </WidgetWrapper>
    );
}
