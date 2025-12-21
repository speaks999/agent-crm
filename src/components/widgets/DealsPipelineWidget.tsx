'use client';

import React, { useState, useEffect } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetProps } from './types';

interface StageData {
    name: string;
    count: number;
    value: number;
    color: string;
}

const STAGE_COLORS: Record<string, string> = {
    'Qualification': 'bg-blue-500',
    'Proposal': 'bg-yellow-500',
    'Negotiation': 'bg-orange-500',
    'Closed Won': 'bg-green-500',
    'Closed Lost': 'bg-red-500',
    'Discovery': 'bg-purple-500',
    'Demo': 'bg-pink-500',
    'default': 'bg-primary',
};

export function DealsPipelineWidget({ config, onRemove, onResize, onSettings, onDragStart, onDragOver, onDrop, isDragging, isDropTarget }: WidgetProps) {
    const [stages, setStages] = useState<StageData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchDeals() {
            try {
                const response = await fetch('/api/mcp/call-tool', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'list_deals', arguments: {} }),
                });
                const result = await response.json();
                const deals = result.result?.structuredContent?.deals || [];
                
                // Group by stage
                const stageMap: Record<string, { count: number; value: number }> = {};
                deals.forEach((deal: any) => {
                    const stage = deal.stage || 'Unknown';
                    if (!stageMap[stage]) {
                        stageMap[stage] = { count: 0, value: 0 };
                    }
                    stageMap[stage].count++;
                    stageMap[stage].value += deal.amount || 0;
                });

                setStages(Object.entries(stageMap).map(([name, data]) => ({
                    name,
                    count: data.count,
                    value: data.value,
                    color: STAGE_COLORS[name] || STAGE_COLORS.default,
                })));
            } catch (error) {
                console.error('Failed to fetch pipeline:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchDeals();
    }, []);

    const totalDeals = stages.reduce((sum, s) => sum + s.count, 0);
    const totalValue = stages.reduce((sum, s) => sum + s.value, 0);

    return (
        <WidgetWrapper config={config} onRemove={onRemove} onResize={onResize} onSettings={onSettings} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} isDragging={isDragging} isDropTarget={isDropTarget}>
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
                    <div className="space-y-3">
                        {stages.map((stage) => (
                            <div key={stage.name} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-foreground font-medium">{stage.name}</span>
                                    <span className="text-muted-foreground">{stage.count} deals • ${stage.value.toLocaleString()}</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${stage.color} rounded-full transition-all`}
                                        style={{ width: `${(stage.count / totalDeals) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </WidgetWrapper>
    );
}

