'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, CheckSquare, Loader2, Plus, Calendar, MessageSquare, Phone, Mail, FileText, Clock, UserCircle } from 'lucide-react';
import Link from 'next/link';

interface Interaction {
    id: string;
    type: 'call' | 'meeting' | 'email' | 'note';
    summary?: string;
    transcript?: string;
    contact_id?: string;
    deal_id?: string;
    due_date?: string;
    assigned_to?: string;
    created_at: string;
}

interface TeamMember {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

async function fetchMCPData(toolName: string, args: Record<string, unknown> = {}) {
    const response = await fetch('/api/mcp/call-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: toolName, arguments: args }),
    });
    
    if (!response.ok) {
        throw new Error(`MCP request failed: ${response.status}`);
    }
    
    const json = await response.json();
    return json.result?.structuredContent || {};
}

const typeIcons: Record<string, React.ReactNode> = {
    call: <Phone size={20} />,
    meeting: <MessageSquare size={20} />,
    email: <Mail size={20} />,
    note: <FileText size={20} />,
};

const typeColors: Record<string, string> = {
    call: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    meeting: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    email: 'bg-green-500/20 text-green-400 border-green-500/30',
    note: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export default function TasksPage() {
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [allInteractions, setAllInteractions] = useState<Interaction[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [selectedAssignee, setSelectedAssignee] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'call' | 'meeting' | 'email' | 'note'>('all');

    useEffect(() => {
        fetchTeamMembers();
        fetchInteractions();
    }, []);

    useEffect(() => {
        // Filter interactions when selectedAssignee changes
        if (selectedAssignee === '') {
            setInteractions(allInteractions);
        } else if (selectedAssignee === 'unassigned') {
            setInteractions(allInteractions.filter(i => !i.assigned_to));
        } else {
            setInteractions(allInteractions.filter(i => i.assigned_to === selectedAssignee));
        }
    }, [selectedAssignee, allInteractions]);

    async function fetchTeamMembers() {
        try {
            const response = await fetch('/api/team');
            const data = await response.json();
            setTeamMembers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch team members:', error);
        }
    }

    async function fetchInteractions() {
        try {
            const data = await fetchMCPData('list_interactions');
            const list = data.interactions || [];
            setAllInteractions(list);
            setInteractions(list);
        } catch (error) {
            console.error('Failed to fetch interactions:', error);
        } finally {
            setIsLoading(false);
        }
    }

    function getAssigneeName(assigneeId?: string) {
        if (!assigneeId) return null;
        const member = teamMembers.find(m => m.id === assigneeId);
        return member ? `${member.first_name} ${member.last_name}` : null;
    }

    const filteredInteractions = interactions.filter(interaction => {
        if (filter === 'all') return true;
        return interaction.type === filter;
    });

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
                <div className="flex items-center gap-4">
                    <Link
                        href="/data"
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        title="Back to Data Hub"
                    >
                        <ArrowLeft size={20} className="text-muted-foreground" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Tasks</h2>
                        <p className="text-muted-foreground mt-1">{filteredInteractions.length} {selectedAssignee ? 'filtered ' : ''}interactions</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {/* Assignee Filter */}
                    <div className="relative">
                        <select
                            value={selectedAssignee}
                            onChange={(e) => setSelectedAssignee(e.target.value)}
                            className="appearance-none pl-10 pr-8 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                        >
                            <option value="">All Team Members</option>
                            <option value="unassigned">Unassigned</option>
                            {teamMembers.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.first_name} {member.last_name}
                                </option>
                            ))}
                        </select>
                        <UserCircle size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                    <Link
                        href="/chat"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors"
                    >
                        <Plus size={20} />
                        Add Task
                    </Link>
                </div>
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all' ? 'bg-primary-muted text-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('call')}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${filter === 'call' ? 'bg-blue-500/20 text-blue-400' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                    <Phone size={16} />
                    Calls
                </button>
                <button
                    onClick={() => setFilter('meeting')}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${filter === 'meeting' ? 'bg-purple-500/20 text-purple-400' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                    <MessageSquare size={16} />
                    Meetings
                </button>
                <button
                    onClick={() => setFilter('email')}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${filter === 'email' ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                    <Mail size={16} />
                    Emails
                </button>
                <button
                    onClick={() => setFilter('note')}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${filter === 'note' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                    <FileText size={16} />
                    Notes
                </button>
            </div>

            <div className="space-y-3">
                {filteredInteractions.map((interaction) => (
                    <Link
                        key={interaction.id}
                        href={`/tasks/${interaction.id}`}
                        className="block bg-card p-4 rounded-lg border border-border shadow-sm hover:shadow-md transition-all hover:border-primary"
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg border ${typeColors[interaction.type] || 'bg-muted text-muted-foreground'}`}>
                                {typeIcons[interaction.type] || <FileText size={20} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${typeColors[interaction.type] || 'bg-muted text-muted-foreground'}`}>
                                        {interaction.type}
                                    </span>
                                    {interaction.due_date && (
                                        <span className="flex items-center gap-1 text-xs text-orange-400">
                                            <Clock size={12} />
                                            Due {new Date(interaction.due_date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: 'numeric',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(interaction.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </span>
                                </div>
                                <h3 className="font-medium text-foreground">
                                    {interaction.summary || interaction.transcript || `${interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)} interaction`}
                                </h3>
                                {interaction.summary && interaction.transcript && (
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {interaction.transcript}
                                    </p>
                                )}
                                {interaction.assigned_to && getAssigneeName(interaction.assigned_to) && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                                        <UserCircle size={14} />
                                        <span>{getAssigneeName(interaction.assigned_to)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {filteredInteractions.length === 0 && (
                <div className="text-center py-12">
                    <CheckSquare className="mx-auto text-muted-foreground" size={64} />
                    <p className="text-muted-foreground mt-4">No tasks found</p>
                    <Link
                        href="/chat"
                        className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors"
                    >
                        <Plus size={16} />
                        Create your first task
                    </Link>
                </div>
            )}
        </div>
    );
}
