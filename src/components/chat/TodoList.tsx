'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Calendar, Loader2, Phone, Mail, Users, FileText, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { fetchMCPData } from '@/lib/fetchMCPData';

interface Interaction {
    id: string;
    type: string;
    title?: string;
    summary?: string;
    due_date?: string;
    created_at?: string;
    contact_id?: string;
    deal_id?: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
    call: <Phone size={12} className="text-blue-500" />,
    email: <Mail size={12} className="text-green-500" />,
    meeting: <Users size={12} className="text-purple-500" />,
    note: <FileText size={12} className="text-yellow-500" />,
};

export function TodoList() {
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchInteractions();
        // Refresh every 30 seconds
        const interval = setInterval(fetchInteractions, 30000);
        return () => clearInterval(interval);
    }, []);

    async function fetchInteractions() {
        try {
            const result = await fetchMCPData('list_interactions');
            const allInteractions = result.interactions || [];
            setInteractions(allInteractions);
        } catch (error) {
            console.error('Failed to fetch interactions:', error);
        } finally {
            setIsLoading(false);
        }
    }

    // Sort by due_date (most urgent first), then by created_at
    const upcomingTasks = interactions
        .sort((a, b) => {
            // Items with due_date come first
            const aDue = a.due_date ? new Date(a.due_date).getTime() : null;
            const bDue = b.due_date ? new Date(b.due_date).getTime() : null;
            
            if (aDue && bDue) return aDue - bDue;
            if (aDue && !bDue) return -1;
            if (!aDue && bDue) return 1;
            
            // Fallback to created_at (most recent first)
            const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
            const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
            return bCreated - aCreated;
        })
        .slice(0, 10);

    const formatDate = (dateString?: string) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        const now = new Date();
        const today = new Date(now);
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Reset time for comparison
        today.setHours(0, 0, 0, 0);
        tomorrow.setHours(0, 0, 0, 0);
        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);

        const diffMs = date.getTime() - now.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            const overdueDays = Math.abs(diffDays);
            if (overdueDays === 0) return 'Today';
            return `${overdueDays}d overdue`;
        }
        if (compareDate.getTime() === today.getTime()) {
            return 'Today';
        }
        if (compareDate.getTime() === tomorrow.getTime()) {
            return 'Tomorrow';
        }
        if (diffDays < 7) {
            return `In ${diffDays} days`;
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getUrgencyClass = (dateString?: string) => {
        if (!dateString) return 'text-muted-foreground';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'text-destructive';
        if (diffDays === 0) return 'text-orange-500';
        if (diffDays <= 2) return 'text-yellow-500';
        return 'text-muted-foreground';
    };

    return (
        <div className="h-full flex flex-col bg-card border-l border-border">
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckSquare size={18} className="text-primary" />
                        <h2 className="text-lg font-semibold text-foreground">To Do List</h2>
                    </div>
                    {upcomingTasks.length > 0 && (
                        <span className="text-xs text-muted-foreground">{upcomingTasks.length} tasks</span>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="animate-spin text-primary" size={24} />
                    </div>
                ) : upcomingTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <CheckSquare size={32} className="text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No upcoming tasks</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Ask me to create a task!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {upcomingTasks.map((task) => (
                            <Link
                                key={task.id}
                                href={`/tasks/${task.id}`}
                                className="block p-3 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 shrink-0">
                                        {TYPE_ICONS[task.type] || <FileText size={12} className="text-muted-foreground" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground line-clamp-2">
                                            {task.title || task.summary || `${task.type} interaction`}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-xs text-muted-foreground capitalize">
                                                {task.type}
                                            </span>
                                            {task.due_date ? (
                                                <div className={`flex items-center gap-1 text-xs ${getUrgencyClass(task.due_date)}`}>
                                                    <AlertCircle size={10} />
                                                    <span>{formatDate(task.due_date)}</span>
                                                </div>
                                            ) : task.created_at && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Calendar size={10} />
                                                    <span>{formatDate(task.created_at)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

