'use client';

import { useState, useEffect } from 'react';
import { FolderKanban, Loader2, RefreshCw, Calendar, User } from 'lucide-react';
import Link from 'next/link';

interface Project {
    id: string;
    insightly_id: number;
    project_name: string;
    status?: string;
    completed: boolean;
    started_date?: string;
    completed_date?: string;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

    useEffect(() => {
        fetchProjects();
    }, []);

    async function fetchProjects() {
        try {
            const response = await fetch('/api/insightly/projects');
            const data = await response.json();
            setProjects(data);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function syncProjects() {
        setIsSyncing(true);
        try {
            const response = await fetch('/api/insightly/projects/sync', {
                method: 'POST',
            });
            const result = await response.json();
            if (result.success) {
                await fetchProjects();
            }
        } catch (error) {
            console.error('Failed to sync projects:', error);
        } finally {
            setIsSyncing(false);
        }
    }

    const filteredProjects = projects.filter(project => {
        if (filter === 'active') return !project.completed;
        if (filter === 'completed') return project.completed;
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
                    <h2 className="text-2xl font-bold text-slate-800">Projects</h2>
                    <p className="text-slate-500 mt-1">{filteredProjects.length} projects</p>
                </div>
                <button
                    onClick={syncProjects}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                    <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-indigo-200"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <FolderKanban size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-800 truncate">
                                    {project.project_name}
                                </h3>
                                <div className="mt-2">
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${project.completed ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {project.completed ? 'Completed' : 'Active'}
                                    </span>
                                </div>
                                {project.started_date && (
                                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-2">
                                        <Calendar size={14} />
                                        <span>Started {new Date(project.started_date).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {filteredProjects.length === 0 && (
                <div className="text-center py-12">
                    <FolderKanban className="mx-auto text-slate-300" size={64} />
                    <p className="text-slate-500 mt-4">No projects found</p>
                    {filter !== 'all' && (
                        <button
                            onClick={() => setFilter('all')}
                            className="mt-4 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            View All Projects
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
