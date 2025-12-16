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
            // Ensure data is always an array
            if (Array.isArray(data)) {
                setProjects(data);
            } else if (data.error) {
                console.error('Error fetching projects:', data.error);
                setProjects([]);
            } else {
                setProjects([]);
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
            setProjects([]);
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

    const filteredProjects = Array.isArray(projects) ? projects.filter(project => {
        if (filter === 'active') return !project.completed;
        if (filter === 'completed') return project.completed;
        return true;
    }) : [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Projects</h2>
                    <p className="text-muted-foreground mt-1">{filteredProjects.length} projects</p>
                </div>
                <button
                    onClick={syncProjects}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
                    {isSyncing ? 'Syncing...' : 'Sync from Insightly'}
                </button>
            </div>

            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all' ? 'bg-primary-muted text-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('active')}
                    className={`px-4 py-2 rounded-lg transition-colors ${filter === 'active' ? 'bg-primary-muted text-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                    Active
                </button>
                <button
                    onClick={() => setFilter('completed')}
                    className={`px-4 py-2 rounded-lg transition-colors ${filter === 'completed' ? 'bg-primary-muted text-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                    Completed
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                    <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all hover:border-primary"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-primary-muted flex items-center justify-center text-primary">
                                <FolderKanban size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground truncate">
                                    {project.project_name}
                                </h3>
                                <div className="mt-2">
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${project.completed ? 'bg-success/20 text-success' : 'bg-info/20 text-info'}`}>
                                        {project.completed ? 'Completed' : 'Active'}
                                    </span>
                                </div>
                                {project.started_date && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
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
                    <FolderKanban className="mx-auto text-muted-foreground" size={64} />
                    <p className="text-muted-foreground mt-4">No projects found</p>
                    {filter !== 'all' && (
                        <button
                            onClick={() => setFilter('all')}
                            className="mt-4 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                        >
                            View All Projects
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
