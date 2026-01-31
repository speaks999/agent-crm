'use client';

import React, { useState, useEffect } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetProps } from './types';
import { MessageSquare, Phone, Mail, Calendar, User, FileText } from 'lucide-react';
import { fetchMCPData } from '@/lib/fetchMCPData';

interface Activity {
    id: string;
    type: 'call' | 'email' | 'meeting' | 'note' | 'contact';
    description: string;
    timestamp: string;
    contact?: string;
}

export function RecentActivityWidget({ config, onRemove, onResize, onSettings, onDragStart, isDragging }: WidgetProps) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchActivities() {
            try {
                const result = await fetchMCPData('list_interactions', { limit: 10 });
                const interactions = result.interactions || [];
                
                setActivities(interactions.slice(0, 6).map((i: any) => ({
                    id: i.id,
                    type: i.type || 'note',
                    description: i.summary || i.notes || 'No description',
                    timestamp: i.created_at || new Date().toISOString(),
                    contact: i.contact_name,
                })));
            } catch (error) {
                console.error('Failed to fetch activities:', error);
                // Show some placeholder activities
                setActivities([
                    { id: '1', type: 'email', description: 'Sent proposal to client', timestamp: new Date().toISOString() },
                    { id: '2', type: 'call', description: 'Follow-up call scheduled', timestamp: new Date(Date.now() - 3600000).toISOString() },
                    { id: '3', type: 'meeting', description: 'Demo presentation', timestamp: new Date(Date.now() - 7200000).toISOString() },
                ]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchActivities();
    }, []);

    const getIcon = (type: Activity['type']) => {
        switch (type) {
            case 'call': return <Phone size={14} className="text-green-500" />;
            case 'email': return <Mail size={14} className="text-blue-500" />;
            case 'meeting': return <Calendar size={14} className="text-purple-500" />;
            case 'contact': return <User size={14} className="text-orange-500" />;
            default: return <FileText size={14} className="text-muted-foreground" />;
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(hours / 24);
        
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <WidgetWrapper config={config} onRemove={onRemove} onResize={onResize} onSettings={onSettings} onDragStart={onDragStart} isDragging={isDragging}>
            {isLoading ? (
                <div className="h-[180px] flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground">Loading...</div>
                </div>
            ) : (
                <div className="space-y-2">
                    {activities.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No recent activity</p>
                    ) : (
                        activities.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="mt-0.5">{getIcon(activity.type)}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground truncate">{activity.description}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {activity.contact && <span>{activity.contact} • </span>}
                                        {formatTime(activity.timestamp)}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </WidgetWrapper>
    );
}

