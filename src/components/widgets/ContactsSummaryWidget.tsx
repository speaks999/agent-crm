'use client';

import React, { useState, useEffect } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetProps } from './types';
import { Users, UserPlus, Building2 } from 'lucide-react';

interface ContactStats {
    total: number;
    newThisWeek: number;
    withCompany: number;
}

export function ContactsSummaryWidget({ config, onRemove, onSettings }: WidgetProps) {
    const [stats, setStats] = useState<ContactStats>({ total: 0, newThisWeek: 0, withCompany: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await fetch('/api/mcp/call-tool', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'list_contacts', arguments: {} }),
                });
                const result = await response.json();
                const contacts = result.result?.structuredContent?.contacts || [];
                
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                
                setStats({
                    total: contacts.length,
                    newThisWeek: contacts.filter((c: any) => new Date(c.created_at) > weekAgo).length,
                    withCompany: contacts.filter((c: any) => c.account_id).length,
                });
            } catch (error) {
                console.error('Failed to fetch contact stats:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchStats();
    }, []);

    return (
        <WidgetWrapper config={config} onRemove={onRemove} onSettings={onSettings}>
            {isLoading ? (
                <div className="h-[120px] flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground">Loading...</div>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <Users className="mx-auto mb-1 text-primary" size={20} />
                        <p className="text-xl font-bold text-foreground">{stats.total}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <UserPlus className="mx-auto mb-1 text-green-500" size={20} />
                        <p className="text-xl font-bold text-foreground">{stats.newThisWeek}</p>
                        <p className="text-xs text-muted-foreground">This Week</p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <Building2 className="mx-auto mb-1 text-blue-500" size={20} />
                        <p className="text-xl font-bold text-foreground">{stats.withCompany}</p>
                        <p className="text-xs text-muted-foreground">With Company</p>
                    </div>
                </div>
            )}
        </WidgetWrapper>
    );
}

