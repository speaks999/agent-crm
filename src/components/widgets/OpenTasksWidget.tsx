'use client';

import React, { useState, useEffect } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetProps } from './types';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';

interface Task {
    id: string;
    title: string;
    status: string;
    priority?: string;
    due_date?: string;
}

export function OpenTasksWidget({ config, onRemove, onSettings }: WidgetProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchTasks() {
            try {
                const response = await fetch('/api/mcp/call-tool', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'list_tasks', arguments: {} }),
                });
                const result = await response.json();
                const allTasks = result.result?.structuredContent?.tasks || [];
                // Filter for open/pending tasks
                const openTasks = allTasks.filter((t: Task) => 
                    t.status === 'pending' || t.status === 'in_progress' || t.status === 'open' || !t.status
                ).slice(0, 6);
                setTasks(openTasks);
            } catch (error) {
                console.error('Failed to fetch tasks:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchTasks();
    }, []);

    const getPriorityColor = (priority?: string) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'text-destructive';
            case 'medium': return 'text-yellow-500';
            default: return 'text-muted-foreground';
        }
    };

    return (
        <WidgetWrapper config={config} onRemove={onRemove} onSettings={onSettings}>
            {isLoading ? (
                <div className="h-[180px] flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground">Loading...</div>
                </div>
            ) : (
                <div className="space-y-2">
                    {tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <CheckCircle2 size={32} className="mb-2 text-primary" />
                            <p>All caught up!</p>
                        </div>
                    ) : (
                        tasks.map((task) => (
                            <div key={task.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                <Circle size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground text-sm truncate">{task.title}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {task.priority && (
                                            <span className={`text-xs ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                        )}
                                        {task.due_date && (
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock size={10} />
                                                {new Date(task.due_date).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </WidgetWrapper>
    );
}

