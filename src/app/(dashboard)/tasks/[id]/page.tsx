'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Phone, MessageSquare, Mail, FileText, Calendar, User, Briefcase, Trash2, Clock, UserCircle } from 'lucide-react';
import { fetchMCPData, getAuthHeaders } from '@/lib/fetchMCPData';

interface Interaction {
    id: string;
    type: 'call' | 'meeting' | 'email' | 'note';
    summary?: string;
    transcript?: string;
    contact_id?: string;
    deal_id?: string;
    audio_url?: string;
    sentiment?: string;
    due_date?: string;
    assigned_to?: string;
    created_at: string;
}

interface Contact {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
}

interface Deal {
    id: string;
    name?: string;
    stage?: string;
}

interface TeamMember {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
}

const typeIcons: Record<string, React.ReactNode> = {
    call: <Phone size={24} />,
    meeting: <MessageSquare size={24} />,
    email: <Mail size={24} />,
    note: <FileText size={24} />,
};

const typeColors: Record<string, string> = {
    call: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    meeting: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    email: 'bg-green-500/20 text-green-400 border-green-500/30',
    note: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export default function TaskDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [interaction, setInteraction] = useState<Interaction | null>(null);
    const [contact, setContact] = useState<Contact | null>(null);
    const [deal, setDeal] = useState<Deal | null>(null);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [assignedMember, setAssignedMember] = useState<TeamMember | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete() {
        if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
            return;
        }

        setIsDeleting(true);
        try {
            await fetchMCPData('delete_interaction', { id });
            router.push('/tasks');
        } catch (err) {
            console.error('Failed to delete task:', err);
            alert('Failed to delete task. Please try again.');
            setIsDeleting(false);
        }
    }

    async function fetchTeamMembers() {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch('/api/team', { headers, credentials: 'include' });
            const data = await response.json();
            const members = Array.isArray(data) ? data : [];
            setTeamMembers(members);
        } catch (err) {
            console.error('Failed to fetch team members:', err);
        }
    }

    async function assignTask(memberId: string | null) {
        if (!interaction) return;
        setIsAssigning(true);

        try {
            await fetchMCPData('update_interaction', {
                id: interaction.id,
                assigned_to: memberId,
            });
            setInteraction({ ...interaction, assigned_to: memberId || undefined });
            if (memberId) {
                const member = teamMembers.find(m => m.id === memberId);
                setAssignedMember(member || null);
            } else {
                setAssignedMember(null);
            }
        } catch (err) {
            console.error('Failed to assign task:', err);
        } finally {
            setIsAssigning(false);
        }
    }

    useEffect(() => {
        async function fetchData() {
            try {
                // First fetch team members
                const headers = await getAuthHeaders();
                const teamResponse = await fetch('/api/team', { headers, credentials: 'include' });
                const teamData = await teamResponse.json();
                const members = Array.isArray(teamData) ? teamData : [];
                setTeamMembers(members);

                const data = await fetchMCPData('get_interaction', { id });
                const interactionData = data.interactions?.[0] || data.interaction;
                
                if (!interactionData) {
                    setError('Task not found');
                    return;
                }
                
                setInteraction(interactionData);

                // Fetch related contact if exists
                if (interactionData.contact_id) {
                    try {
                        const contactData = await fetchMCPData('get_contact', { id: interactionData.contact_id });
                        setContact(contactData.contacts?.[0] || contactData.contact || null);
                    } catch (e) {
                        console.error('Failed to fetch contact:', e);
                    }
                }

                // Fetch related deal if exists
                if (interactionData.deal_id) {
                    try {
                        const dealData = await fetchMCPData('get_deal', { id: interactionData.deal_id });
                        setDeal(dealData.deals?.[0] || dealData.deal || null);
                    } catch (e) {
                        console.error('Failed to fetch deal:', e);
                    }
                }

                // Set assigned member if exists
                if (interactionData.assigned_to && members.length > 0) {
                    const member = members.find((m: TeamMember) => m.id === interactionData.assigned_to);
                    setAssignedMember(member || null);
                }
            } catch (err) {
                console.error('Failed to fetch task:', err);
                setError('Failed to load task');
            } finally {
                setIsLoading(false);
            }
        }

        if (id) {
            fetchData();
        }
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    if (error || !interaction) {
        return (
            <div className="flex-1 overflow-auto p-8">
                <Link
                    href="/tasks"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
                >
                    <ArrowLeft size={20} />
                    Back to Tasks
                </Link>
                <div className="text-center py-12">
                    <p className="text-destructive text-lg">{error || 'Task not found'}</p>
                </div>
            </div>
        );
    }

    const title = interaction.summary || interaction.transcript || `${interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)} interaction`;

    return (
        <div className="flex-1 overflow-auto p-8">
            <div className="flex items-center justify-between mb-6">
                <Link
                    href="/tasks"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft size={20} />
                    Back to Tasks
                </Link>
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                    title="Delete task"
                >
                    {isDeleting ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <Trash2 size={18} />
                    )}
                    <span className="hidden sm:inline">Delete</span>
                </button>
            </div>

            <div className="max-w-3xl">
                {/* Header */}
                <div className="flex items-start gap-4 mb-8">
                    <div className={`p-3 rounded-xl border ${typeColors[interaction.type] || 'bg-muted text-muted-foreground'}`}>
                        {typeIcons[interaction.type] || <FileText size={24} />}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${typeColors[interaction.type] || 'bg-muted text-muted-foreground'}`}>
                                {interaction.type}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                        {interaction.due_date && (
                            <p className="text-orange-400 mt-1 flex items-center gap-2 font-medium">
                                <Clock size={16} />
                                Due {new Date(interaction.due_date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                })}
                            </p>
                        )}
                        <p className="text-muted-foreground mt-1 flex items-center gap-2">
                            <Calendar size={16} />
                            Created {new Date(interaction.created_at).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                            })}
                        </p>
                    </div>
                </div>

                {/* Related Items */}
                {(contact || deal) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {contact && (
                            <Link
                                href={`/contacts/${contact.id}`}
                                className="bg-card p-4 rounded-lg border border-border hover:border-primary transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Related Contact</p>
                                        <p className="font-medium text-foreground">
                                            {contact.first_name} {contact.last_name}
                                        </p>
                                        {contact.email && (
                                            <p className="text-sm text-muted-foreground">{contact.email}</p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        )}
                        {deal && (
                            <Link
                                href={`/opportunities/${deal.id}`}
                                className="bg-card p-4 rounded-lg border border-border hover:border-primary transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                                        <Briefcase size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Related Deal</p>
                                        <p className="font-medium text-foreground">{deal.name}</p>
                                        {deal.stage && (
                                            <p className="text-sm text-muted-foreground">{deal.stage}</p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        )}
                    </div>
                )}

                {/* Assigned To */}
                <div className="bg-card p-6 rounded-lg border border-border mb-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <UserCircle size={20} className="text-primary" />
                        Assigned To
                    </h2>
                    
                    {assignedMember ? (
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center text-primary font-semibold border border-primary/20">
                                {assignedMember.first_name[0]}{assignedMember.last_name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">
                                    {assignedMember.first_name} {assignedMember.last_name}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">{assignedMember.email}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm mb-4">Not assigned to anyone</p>
                    )}
                    
                    <select
                        value={interaction?.assigned_to || ''}
                        onChange={(e) => assignTask(e.target.value || null)}
                        disabled={isAssigning}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm disabled:opacity-50"
                    >
                        <option value="">Unassigned</option>
                        {teamMembers.map((member) => (
                            <option key={member.id} value={member.id}>
                                {member.first_name} {member.last_name}
                            </option>
                        ))}
                    </select>
                    {isAssigning && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <Loader2 size={14} className="animate-spin" />
                            Updating...
                        </div>
                    )}
                </div>

                {/* Summary */}
                {interaction.summary && (
                    <div className="bg-card p-6 rounded-lg border border-border mb-6">
                        <h2 className="text-lg font-semibold text-foreground mb-3">Summary</h2>
                        <p className="text-foreground whitespace-pre-wrap">{interaction.summary}</p>
                    </div>
                )}

                {/* Transcript / Notes */}
                {interaction.transcript && (
                    <div className="bg-card p-6 rounded-lg border border-border mb-6">
                        <h2 className="text-lg font-semibold text-foreground mb-3">
                            {interaction.type === 'note' ? 'Notes' : 'Transcript'}
                        </h2>
                        <p className="text-foreground whitespace-pre-wrap">{interaction.transcript}</p>
                    </div>
                )}

                {/* Sentiment */}
                {interaction.sentiment && (
                    <div className="bg-card p-6 rounded-lg border border-border mb-6">
                        <h2 className="text-lg font-semibold text-foreground mb-3">Sentiment Analysis</h2>
                        <p className="text-foreground">{interaction.sentiment}</p>
                    </div>
                )}

                {/* Audio */}
                {interaction.audio_url && (
                    <div className="bg-card p-6 rounded-lg border border-border mb-6">
                        <h2 className="text-lg font-semibold text-foreground mb-3">Audio Recording</h2>
                        <audio controls className="w-full">
                            <source src={interaction.audio_url} />
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                )}
            </div>
        </div>
    );
}

