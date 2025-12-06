'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Loader2, RefreshCw, Calendar, User, Circle, CheckCircle2 } from 'lucide-react';

interface Task {
    id: string;
    insightly_id: number;
    title: string;
    due_date?: string;
    completed: boolean;
    priority?: number;
    status?: string;
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

    useEffect(() => {
        fetchTasks();
    }, []);

    async function fetchTasks() {
        try {
            const response = await fetch('/api/insightly/tasks');
            const data = await response.json();
            setTasks(data);
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function syncTasks() {
        setIsSyncing(true);
        try {
            const response = await fetch('/api/insightly/tasks/sync', {
                method: 'POST',
            });
            const result = await response.json();
            if (result.success) {
                await fetchTasks();
            }
        } catch (error) {
            console.error('Failed to sync tasks:', error);
        } finally {
            setIsSyncing(false);
        }
    }

    const filteredTasks = tasks.filter(task => {
        if (filter === 'active') return !task.completed;
        if (filter === 'completed') return task.completed;
        return true;
    });

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
                    <h2 className="text-2xl font-bold text-slate-800">Tasks</h2>
                    <p className="text-slate-500 mt-1">{filteredTasks.length} tasks</p>
                </div>
                <button
                    onClick={syncTasks}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
                    {isSyncing ? 'Syncing...' : 'Sync from Insightly'}
                </button>
            </div>

            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('active')}
                    className={`px-4 py-2 rounded-lg transition-colors ${filter === 'active' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    Active
                </button>
                <button
                    onClick={() => setFilter('completed')}
                    className={`px-4 py-2 rounded-lg transition-colors ${filter === 'completed' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    Completed
                </button>
            </div>

            <div className="space-y-3">
                {filteredTasks.map((task) => (
                    <div
                        key={task.id}
                        className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-indigo-200 flex items-center gap-4"
                    >
                        {task.completed ? (
                            <CheckCircle2 className="text-green-600 flex-shrink-0" size={24} />
                        ) : (
                            <Circle className="text-slate-300 flex-shrink-0" size={24} />
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className={`font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                {task.title}
                            </h3>
                            {task.due_date && (
                                <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                                    <Calendar size={14} />
                                    <span>Due {new Date(task.due_date).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                        {task.priority && task.priority > 0 && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.priority === 3 ? 'bg-red-100 text-red-800' : task.priority === 2 ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {task.priority === 3 ? 'High' : task.priority === 2 ? 'Medium' : 'Low'}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {filteredTasks.length === 0 && (
                <div className="text-center py-12">
                    <CheckSquare className="mx-auto text-slate-300" size={64} />
                    <p className="text-slate-500 mt-4">No tasks found</p>
                </div>
            )}
        </div>
    );
}
