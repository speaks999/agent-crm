'use client';

import React, { useState, useEffect } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetProps } from './types';
import { CheckCircle2, Phone, Mail, Calendar, FileText, AlertCircle, X, User, Briefcase, Clock, Pencil, Save, Loader2 } from 'lucide-react';
import { fetchMCPData } from '@/lib/fetchMCPData';

interface Interaction {
    id: string;
    type: string;
    title?: string;
    summary?: string;
    transcript?: string;
    created_at?: string;
    due_date?: string;
    contact_id?: string;
    deal_id?: string;
    sentiment?: string;
}

interface Contact {
    id: string;
    first_name: string;
    last_name: string;
}

interface Deal {
    id: string;
    name: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
    call: <Phone size={14} className="text-blue-500" />,
    email: <Mail size={14} className="text-green-500" />,
    meeting: <Calendar size={14} className="text-purple-500" />,
    note: <FileText size={14} className="text-yellow-500" />,
};

const TYPE_ICONS_LARGE: Record<string, React.ReactNode> = {
    call: <Phone size={24} className="text-blue-500" />,
    email: <Mail size={24} className="text-green-500" />,
    meeting: <Calendar size={24} className="text-purple-500" />,
    note: <FileText size={24} className="text-yellow-500" />,
};

const INTERACTION_TYPES = ['call', 'email', 'meeting', 'note'] as const;
const SENTIMENT_OPTIONS = ['positive', 'neutral', 'negative'] as const;

function EditInteractionModal({
    interaction,
    onClose,
    onSave,
}: {
    interaction: Interaction;
    onClose: () => void;
    onSave: (updated: Interaction) => void;
}) {
    const [formData, setFormData] = useState({
        type: interaction.type,
        title: interaction.title || interaction.summary || '',
        summary: interaction.summary || '',
        transcript: interaction.transcript || '',
        due_date: interaction.due_date ? interaction.due_date.slice(0, 16) : '',
        contact_id: interaction.contact_id || '',
        deal_id: interaction.deal_id || '',
        sentiment: interaction.sentiment || '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);

    useEffect(() => {
        async function fetchOptions() {
            try {
                const [contactsData, dealsData] = await Promise.all([
                    fetchMCPData('list_contacts'),
                    fetchMCPData('list_deals'),
                ]);
                setContacts(contactsData.contacts || []);
                setDeals(dealsData.deals || []);
            } catch (err) {
                console.error('Failed to fetch options:', err);
            } finally {
                setLoadingOptions(false);
            }
        }
        fetchOptions();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        // Validate interaction ID exists
        if (!interaction.id || typeof interaction.id !== 'string') {
            setError('Invalid interaction ID');
            setIsSaving(false);
            return;
        }

        try {
            // Build arguments object, only including non-empty values
            const args: Record<string, unknown> = {
                id: interaction.id,
                type: formData.type,
            };
            
            if (formData.title || formData.summary) args.summary = formData.title || formData.summary;
            if (formData.transcript) args.transcript = formData.transcript;
            if (formData.contact_id) args.contact_id = formData.contact_id;
            if (formData.deal_id) args.deal_id = formData.deal_id;
            if (formData.sentiment) args.sentiment = formData.sentiment;

            await fetchMCPData('update_interaction', args);

            onSave({
                ...interaction,
                type: formData.type,
                title: formData.title,
                summary: formData.title || formData.summary,
                transcript: formData.transcript,
                due_date: formData.due_date || undefined,
                contact_id: formData.contact_id || undefined,
                deal_id: formData.deal_id || undefined,
                sentiment: formData.sentiment || undefined,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div
                className="bg-card border border-border rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <Pencil size={20} className="text-primary" />
                        <h2 className="font-semibold text-foreground">Edit Interaction</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <X size={20} className="text-muted-foreground" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[65vh]">
                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            {INTERACTION_TYPES.map((type) => (
                                <option key={type} value={type} className="capitalize">
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Enter a title..."
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Due Date</label>
                        <input
                            type="datetime-local"
                            value={formData.due_date}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    {/* Contact */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Contact</label>
                        <select
                            value={formData.contact_id}
                            onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
                            disabled={loadingOptions}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                        >
                            <option value="">No contact linked</option>
                            {contacts.map((contact) => (
                                <option key={contact.id} value={contact.id}>
                                    {contact.first_name} {contact.last_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Deal */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Deal</label>
                        <select
                            value={formData.deal_id}
                            onChange={(e) => setFormData({ ...formData, deal_id: e.target.value })}
                            disabled={loadingOptions}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                        >
                            <option value="">No deal linked</option>
                            {deals.map((deal) => (
                                <option key={deal.id} value={deal.id}>
                                    {deal.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sentiment */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Sentiment</label>
                        <select
                            value={formData.sentiment}
                            onChange={(e) => setFormData({ ...formData, sentiment: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="">Not set</option>
                            {SENTIMENT_OPTIONS.map((sentiment) => (
                                <option key={sentiment} value={sentiment}>
                                    {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Notes/Transcript */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Notes / Details</label>
                        <textarea
                            value={formData.transcript}
                            onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
                            placeholder="Add notes or details..."
                            rows={4}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="p-4 border-t border-border flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function InteractionDetailModal({ 
    interaction, 
    onClose,
    onEdit,
}: { 
    interaction: Interaction; 
    onClose: () => void;
    onEdit: () => void;
}) {
    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return 'Not set';
        return new Date(dateStr).toLocaleString();
    };

    const getSentimentColor = (sentiment?: string) => {
        switch (sentiment?.toLowerCase()) {
            case 'positive': return 'text-green-500 bg-green-500/10';
            case 'negative': return 'text-red-500 bg-red-500/10';
            default: return 'text-muted-foreground bg-muted';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-card border border-border rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        {TYPE_ICONS_LARGE[interaction.type] || <FileText size={24} className="text-muted-foreground" />}
                        <div>
                            <h2 className="font-semibold text-foreground capitalize">{interaction.type}</h2>
                            <p className="text-xs text-muted-foreground">Interaction Details</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <X size={20} className="text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
                    {/* Title/Summary */}
                    <div>
                        <h3 className="text-lg font-medium text-foreground">
                            {interaction.title || interaction.summary || `${interaction.type} interaction`}
                        </h3>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Created */}
                        <div className="p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Clock size={14} />
                                <span className="text-xs">Created</span>
                            </div>
                            <p className="text-sm text-foreground">{formatDateTime(interaction.created_at)}</p>
                        </div>

                        {/* Due Date */}
                        <div className="p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <AlertCircle size={14} />
                                <span className="text-xs">Due Date</span>
                            </div>
                            <p className="text-sm text-foreground">{formatDateTime(interaction.due_date)}</p>
                        </div>

                        {/* Contact */}
                        {interaction.contact_id && (
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <User size={14} />
                                    <span className="text-xs">Contact</span>
                                </div>
                                <a 
                                    href={`/contacts/${interaction.contact_id}`}
                                    className="text-sm text-primary hover:underline"
                                >
                                    View Contact →
                                </a>
                            </div>
                        )}

                        {/* Deal */}
                        {interaction.deal_id && (
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <Briefcase size={14} />
                                    <span className="text-xs">Deal</span>
                                </div>
                                <a 
                                    href={`/opportunities/${interaction.deal_id}`}
                                    className="text-sm text-primary hover:underline"
                                >
                                    View Deal →
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Sentiment */}
                    {interaction.sentiment && (
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">Sentiment</p>
                            <span className={`inline-flex px-3 py-1 rounded-full text-sm capitalize ${getSentimentColor(interaction.sentiment)}`}>
                                {interaction.sentiment}
                            </span>
                        </div>
                    )}

                    {/* Summary */}
                    {interaction.summary && interaction.summary !== interaction.title && (
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">Summary</p>
                            <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg">
                                {interaction.summary}
                            </p>
                        </div>
                    )}

                    {/* Transcript/Notes */}
                    {interaction.transcript && (
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">Notes / Transcript</p>
                            <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg whitespace-pre-wrap">
                                {interaction.transcript}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={onEdit}
                        className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        <Pencil size={16} />
                        Edit
                    </button>
                </div>
            </div>
        </div>
    );
}

export function OpenTasksWidget({ config, onRemove, onResize, onSettings, onDragStart, isDragging }: WidgetProps) {
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);
    const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);

    useEffect(() => {
        async function fetchInteractions() {
            try {
                const result = await fetchMCPData('list_interactions');
                const allInteractions = result.interactions || [];
                
                // Sort by due_date (most urgent first), then by created_at (most recent first)
                const sortedInteractions = allInteractions
                    .sort((a: Interaction, b: Interaction) => {
                        // Items with due_date come first
                        const aDue = a.due_date ? new Date(a.due_date).getTime() : null;
                        const bDue = b.due_date ? new Date(b.due_date).getTime() : null;
                        
                        // If both have due dates, sort by due date (earliest first)
                        if (aDue && bDue) {
                            return aDue - bDue;
                        }
                        
                        // If only one has a due date, prioritize it
                        if (aDue && !bDue) return -1;
                        if (!aDue && bDue) return 1;
                        
                        // If neither has due date, sort by created_at (most recent first)
                        const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
                        const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
                        return bCreated - aCreated;
                    })
                    .slice(0, 6);
                    
                setInteractions(sortedInteractions);
            } catch (error) {
                console.error('Failed to fetch interactions:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchInteractions();
    }, []);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            const overdueDays = Math.abs(diffDays);
            if (overdueDays === 0) return 'Today';
            if (overdueDays === 1) return 'Yesterday';
            return `${overdueDays} days overdue`;
        }
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays < 7) return `In ${diffDays} days`;
        return date.toLocaleDateString();
    };

    const getUrgencyColor = (dueDate?: string) => {
        if (!dueDate) return '';
        const date = new Date(dueDate);
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'text-destructive'; // Overdue
        if (diffDays === 0) return 'text-orange-500'; // Due today
        if (diffDays <= 2) return 'text-yellow-500'; // Due soon
        return 'text-muted-foreground';
    };

    const handleEditClick = () => {
        if (selectedInteraction) {
            setEditingInteraction(selectedInteraction);
        }
    };

    const handleSaveInteraction = (updated: Interaction) => {
        setInteractions((prev) =>
            prev.map((i) => (i.id === updated.id ? updated : i))
        );
        setSelectedInteraction(updated);
        setEditingInteraction(null);
    };

    return (
        <>
            <WidgetWrapper config={config} onRemove={onRemove} onResize={onResize} onSettings={onSettings} onDragStart={onDragStart} isDragging={isDragging}>
                {isLoading ? (
                    <div className="h-[180px] flex items-center justify-center">
                        <div className="animate-pulse text-muted-foreground">Loading...</div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {interactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                <CheckCircle2 size={32} className="mb-2 text-primary" />
                                <p>No recent activity</p>
                            </div>
                        ) : (
                            interactions.map((interaction) => (
                                <div 
                                    key={interaction.id} 
                                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => setSelectedInteraction(interaction)}
                                >
                                    <div className="mt-0.5 flex-shrink-0">
                                        {TYPE_ICONS[interaction.type] || <FileText size={14} className="text-muted-foreground" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground text-sm truncate">
                                            {interaction.title || interaction.summary || interaction.transcript?.substring(0, 50) || `${interaction.type} interaction`}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-muted-foreground capitalize">
                                                {interaction.type}
                                            </span>
                                            {interaction.due_date ? (
                                                <span className={`text-xs flex items-center gap-1 ${getUrgencyColor(interaction.due_date)}`}>
                                                    <AlertCircle size={10} />
                                                    {formatDate(interaction.due_date)}
                                                </span>
                                            ) : interaction.created_at && (
                                                <span className="text-xs text-muted-foreground">
                                                    • {formatDate(interaction.created_at)}
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

            {/* Detail Modal */}
            {selectedInteraction && !editingInteraction && (
                <InteractionDetailModal 
                    interaction={selectedInteraction} 
                    onClose={() => setSelectedInteraction(null)}
                    onEdit={handleEditClick}
                />
            )}

            {/* Edit Modal */}
            {editingInteraction && (
                <EditInteractionModal
                    interaction={editingInteraction}
                    onClose={() => setEditingInteraction(null)}
                    onSave={handleSaveInteraction}
                />
            )}
        </>
    );
}
