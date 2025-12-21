'use client';

import { Message, MessageAction, DuplicateContact, DuplicateGroup } from './ChatInterface';
import { Trash2 } from 'lucide-react';
import React from 'react';

interface MessageBubbleProps {
    message: Message;
    onAction?: (action: MessageAction) => void;
    isLoading?: boolean;
}

// Parse basic markdown and return React elements
function parseMarkdown(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    let key = 0;
    
    // Split by lines first to handle line-by-line formatting
    const lines = text.split('\n');
    
    lines.forEach((line, lineIndex) => {
        if (lineIndex > 0) {
            parts.push(<br key={`br-${key++}`} />);
        }
        
        // Parse inline formatting: **bold**, *italic*, `code`
        let remaining = line;
        let match;
        
        while (remaining.length > 0) {
            // Bold: **text**
            match = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)/);
            if (match) {
                if (match[1]) parts.push(<span key={key++}>{match[1]}</span>);
                parts.push(<strong key={key++} className="font-semibold">{match[2]}</strong>);
                remaining = match[3];
                continue;
            }
            
            // Italic: *text*
            match = remaining.match(/^(.*?)\*(.+?)\*(.*)/);
            if (match) {
                if (match[1]) parts.push(<span key={key++}>{match[1]}</span>);
                parts.push(<em key={key++}>{match[2]}</em>);
                remaining = match[3];
                continue;
            }
            
            // Inline code: `code`
            match = remaining.match(/^(.*?)`(.+?)`(.*)/);
            if (match) {
                if (match[1]) parts.push(<span key={key++}>{match[1]}</span>);
                parts.push(
                    <code key={key++} className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
                        {match[2]}
                    </code>
                );
                remaining = match[3];
                continue;
            }
            
            // No more matches, add remaining text
            parts.push(<span key={key++}>{remaining}</span>);
            break;
        }
    });
    
    return parts;
}

// Compact table for duplicate contacts
function DuplicateTable({ 
    contacts, 
    title, 
    variant = 'default' 
}: { 
    contacts: DuplicateContact[]; 
    title: string;
    variant?: 'default' | 'removed' | 'toRemove';
}) {
    if (!contacts || contacts.length === 0) return null;
    
    const variantStyles = {
        default: 'bg-muted/50',
        removed: 'bg-destructive/10',
        toRemove: 'bg-amber-500/10',
    };

    return (
        <div className={`mt-3 rounded-lg overflow-hidden ${variantStyles[variant]}`}>
            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground border-b border-border/50 flex items-center gap-2">
                {variant === 'toRemove' && <Trash2 size={12} className="text-amber-500" />}
                {variant === 'removed' && <Trash2 size={12} className="text-destructive" />}
                {title} ({contacts.length})
            </div>
            <table className="w-full text-xs">
                <thead>
                    <tr className="border-b border-border/30">
                        <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Name</th>
                        <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Email</th>
                    </tr>
                </thead>
                <tbody>
                    {contacts.map((contact, idx) => (
                        <tr key={contact.id || idx} className="border-b border-border/20 last:border-0">
                            <td className="px-3 py-1.5 text-foreground">
                                {contact.first_name} {contact.last_name}
                            </td>
                            <td className="px-3 py-1.5 text-muted-foreground truncate max-w-[150px]">
                                {contact.email || '—'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Show duplicate groups
function DuplicateGroups({ groups }: { groups: DuplicateGroup[] }) {
    if (!groups || groups.length === 0) return null;
    
    return (
        <div className="mt-3 space-y-2">
            {groups.map((group, idx) => (
                <div key={idx} className="rounded-lg overflow-hidden bg-muted/50">
                    <div className="px-3 py-1.5 text-xs font-medium text-foreground border-b border-border/50 flex items-center justify-between">
                        <span>"{group.name}"</span>
                        <span className="text-muted-foreground">{group.count} contacts</span>
                    </div>
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-border/30">
                                <th className="px-3 py-1 text-left font-medium text-muted-foreground">Name</th>
                                <th className="px-3 py-1 text-left font-medium text-muted-foreground">Email</th>
                                <th className="px-3 py-1 text-left font-medium text-muted-foreground">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {group.contacts.map((contact, cidx) => (
                                <tr key={contact.id || cidx} className="border-b border-border/20 last:border-0">
                                    <td className="px-3 py-1 text-foreground">
                                        {contact.first_name} {contact.last_name}
                                    </td>
                                    <td className="px-3 py-1 text-muted-foreground truncate max-w-[120px]">
                                        {contact.email || '—'}
                                    </td>
                                    <td className="px-3 py-1">
                                        {cidx === 0 ? (
                                            <span className="text-primary text-[10px] font-medium">KEEP</span>
                                        ) : (
                                            <span className="text-destructive text-[10px] font-medium">REMOVE</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
}

export function MessageBubble({ message, onAction, isLoading }: MessageBubbleProps) {
    const isUser = message.role === 'user';

    const getButtonClasses = (variant: MessageAction['variant']) => {
        const base = 'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
        switch (variant) {
            case 'primary':
                return `${base} bg-primary text-primary-foreground hover:bg-primary-glow`;
            case 'secondary':
                return `${base} bg-muted text-foreground hover:bg-muted/80 border border-border`;
            case 'destructive':
                return `${base} bg-destructive text-destructive-foreground hover:bg-destructive/90`;
            default:
                return base;
        }
    };

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${isUser
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-card border border-border text-foreground'
                    }`}
            >
                <div className="text-sm leading-relaxed">{parseMarkdown(message.content)}</div>
                
                {/* Duplicate Groups Table */}
                {message.duplicates?.groups && (
                    <DuplicateGroups groups={message.duplicates.groups} />
                )}
                
                {/* To Remove Table (dry run) */}
                {message.duplicates?.toRemove && (
                    <DuplicateTable 
                        contacts={message.duplicates.toRemove} 
                        title="Will be removed" 
                        variant="toRemove"
                    />
                )}
                
                {/* Removed Table (after deletion) */}
                {message.duplicates?.removed && (
                    <DuplicateTable 
                        contacts={message.duplicates.removed} 
                        title="Removed" 
                        variant="removed"
                    />
                )}
                
                {/* Action Buttons */}
                {message.actions && message.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
                        {message.actions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => onAction?.(action)}
                                disabled={isLoading}
                                className={getButtonClasses(action.variant)}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
