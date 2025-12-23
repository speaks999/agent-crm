'use client';

import React, { useState, useEffect } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetProps } from './types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DealData {
    stage: string;
    amount: number;
    count: number;
}

export function RevenueChartWidget({ config, onRemove, onResize, onSettings, onDragStart, isDragging }: WidgetProps) {
    const [data, setData] = useState<DealData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('/api/mcp/call-tool', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'list_deals', arguments: {} }),
                });
                const result = await response.json();
                const deals = result.result?.structuredContent?.deals || [];
                
                // Group by stage
                const stageData: Record<string, { amount: number; count: number }> = {};
                deals.forEach((deal: any) => {
                    const stage = deal.stage || 'Unknown';
                    if (!stageData[stage]) {
                        stageData[stage] = { amount: 0, count: 0 };
                    }
                    stageData[stage].amount += deal.amount || 0;
                    stageData[stage].count++;
                });

                setData(Object.entries(stageData).map(([stage, d]) => ({
                    stage,
                    amount: d.amount,
                    count: d.count,
                })));
            } catch (error) {
                console.error('Failed to fetch revenue data:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <WidgetWrapper config={config} onRemove={onRemove} onResize={onResize} onSettings={onSettings} onDragStart={onDragStart} isDragging={isDragging}>
            {isLoading ? (
                <div className="h-[200px] flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground">Loading...</div>
                </div>
            ) : data.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    No deal data available
                </div>
            ) : (
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                            />
                            <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </WidgetWrapper>
    );
}

