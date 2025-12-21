'use client';

import React, { useState, useEffect } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetProps } from './types';
import { DollarSign, TrendingUp, Clock } from 'lucide-react';

interface Deal {
    id: string;
    name: string;
    amount: number;
    stage: string;
    status: string;
}

export function OpenDealsWidget({ config, onRemove, onResize, onSettings, onDragStart, onDragOver, onDrop, isDragging, isDropTarget }: WidgetProps) {
    const [deals, setDeals] = useState<Deal[]>([]);
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
                const allDeals = result.result?.structuredContent?.deals || [];
                // Filter for open/active deals
                const openDeals = allDeals.filter((d: Deal) => 
                    d.status === 'open' || d.status === 'active' || !d.status
                ).slice(0, 5);
                setDeals(openDeals);
            } catch (error) {
                console.error('Failed to fetch deals:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchDeals();
    }, []);

    const totalValue = deals.reduce((sum, d) => sum + (d.amount || 0), 0);

    return (
        <WidgetWrapper config={config} onRemove={onRemove} onResize={onResize} onSettings={onSettings} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} isDragging={isDragging} isDropTarget={isDropTarget}>
            {isLoading ? (
                <div className="h-[180px] flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground">Loading...</div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Summary */}
                    <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                        <div className="flex items-center gap-2">
                            <DollarSign className="text-primary" size={20} />
                            <span className="text-sm text-muted-foreground">Pipeline Value</span>
                        </div>
                        <span className="font-bold text-foreground">${totalValue.toLocaleString()}</span>
                    </div>

                    {/* Deal List */}
                    <div className="space-y-2">
                        {deals.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">No open deals</p>
                        ) : (
                            deals.map((deal) => (
                                <div key={deal.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground truncate text-sm">{deal.name}</p>
                                        <p className="text-xs text-muted-foreground">{deal.stage || 'No stage'}</p>
                                    </div>
                                    <span className="text-sm font-semibold text-primary ml-2">
                                        ${(deal.amount || 0).toLocaleString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </WidgetWrapper>
    );
}

