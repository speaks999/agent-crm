'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Calendar, Loader2 } from 'lucide-react';

interface Task {
    id: string;
    insightly_id: number;
    title: string;
    due_date?: string;
    completed: boolean;
    priority?: number;
    status?: string;
}

export function TodoList() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
        // Refresh tasks every 30 seconds
        const interval = setInterval(fetchTasks, 30000);
        return () => clearInterval(interval);
    }, []);

    async function fetchTasks() {
        try {
            const response = await fetch('/api/insightly/tasks');
            const data = await response.json();
            setTasks(data || []);
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        } finally {
            setIsLoading(false);
        }
    }

    // Filter incomplete tasks and sort by due date (earliest first)
    const upcomingTasks = tasks
        .filter(task => {
            // Filter out completed tasks (treat undefined/null as incomplete)
            const isCompleted = task.completed === true;
            // Only include tasks with a due date
            return !isCompleted && task.due_date;
        })
        .sort((a, b) => {
            const dateA = new Date(a.due_date!).getTime();
            const dateB = new Date(b.due_date!).getTime();
            return dateA - dateB;
        })
        .slice(0, 10); // Limit to 10 most upcoming tasks

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Reset time for comparison
        today.setHours(0, 0, 0, 0);
        tomorrow.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        if (date.getTime() === today.getTime()) {
            return 'Today';
        } else if (date.getTime() === tomorrow.getTime()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    const getPriorityColor = (priority?: number) => {
        if (!priority) return 'text-muted-foreground';
        if (priority === 3) return 'text-destructive';
        if (priority === 2) return 'text-warning';
        return 'text-info';
    };

    return (
        <div className="h-full flex flex-col bg-card border-l border-border">
            <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <CheckSquare size={18} className="text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">To Do List</h2>
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
                    </div>
                ) : (
                    <div className="space-y-3">
                        {upcomingTasks.map((task) => (
                            <div
                                key={task.id}
                                className="p-3 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5">
                                        <div className="w-4 h-4 rounded border-2 border-border" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground line-clamp-2">
                                            {task.title}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2">
                                            {task.due_date && (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Calendar size={12} />
                                                    <span>{formatDate(task.due_date)}</span>
                                                </div>
                                            )}
                                            {task.priority && task.priority > 0 && (
                                                <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                                    {task.priority === 3 ? 'High' : task.priority === 2 ? 'Medium' : 'Low'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

