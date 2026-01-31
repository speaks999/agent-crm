'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageBubble } from './MessageBubble';
import { ToolResultCard } from './ToolResultCard';
import { ChevronDown, Plus, Trash2, MessageSquare } from 'lucide-react';
import { getAuthHeaders, getAccessToken } from '@/lib/fetchMCPData';

export interface MessageAction {
    label: string;
    variant: 'primary' | 'secondary' | 'destructive';
    toolName: string;
    args: any;
}

export interface DuplicateContact {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    created_at?: string;
}

export interface DuplicateGroup {
    name: string;
    count: number;
    contacts: DuplicateContact[];
}

export interface ChartData {
    type: 'bar' | 'line' | 'pie';
    title: string;
    data: Array<{ name: string; value: number; [key: string]: any }>;
    xAxisKey?: string;
    yAxisKey?: string;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    toolCalls?: Array<{
        name: string;
        args: any;
        result?: any;
    }>;
    actions?: MessageAction[];
    duplicates?: {
        groups?: DuplicateGroup[];
        toRemove?: DuplicateContact[];
        removed?: DuplicateContact[];
    };
    chart?: ChartData;
    timestamp: Date;
}

interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
}

const STORAGE_KEY = 'whitespace-chat-history';
const MAX_SESSIONS = 20;

// Helper to generate session title from first user message
function generateTitle(messages: Message[]): string {
    const firstUserMsg = messages.find(m => m.role === 'user');
    if (firstUserMsg) {
        return firstUserMsg.content.slice(0, 40) + (firstUserMsg.content.length > 40 ? '...' : '');
    }
    return 'New Chat';
}

// Load sessions from localStorage
function loadSessions(): ChatSession[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const sessions = JSON.parse(stored);
            return sessions.map((s: any) => ({
                ...s,
                createdAt: new Date(s.createdAt),
                updatedAt: new Date(s.updatedAt),
                messages: s.messages.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp),
                })),
            }));
        }
    } catch (e) {
        console.error('Failed to load chat history:', e);
    }
    return [];
}

// Save sessions to localStorage
function saveSessions(sessions: ChatSession[]) {
    if (typeof window === 'undefined') return;
    try {
        // Keep only the most recent sessions
        const toSave = sessions.slice(0, MAX_SESSIONS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
        console.error('Failed to save chat history:', e);
    }
}

const DEFAULT_MESSAGE: Message = {
    id: '1',
    role: 'assistant',
    content: 'Hi! Tell me about your customer interactions and I\'ll update the CRM for you. You can also ask me for analytics like \'Show me revenue by stage\'.',
    timestamp: new Date(),
};

export function ChatInterface() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([DEFAULT_MESSAGE]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load sessions on mount
    useEffect(() => {
        const loaded = loadSessions();
        setSessions(loaded);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowHistory(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Save current session when messages change
    useEffect(() => {
        if (messages.length <= 1) return; // Don't save empty sessions
        
        const hasUserMessage = messages.some(m => m.role === 'user');
        if (!hasUserMessage) return;

        setSessions(prev => {
            let updated: ChatSession[];
            
            if (currentSessionId) {
                // Update existing session
                updated = prev.map(s => 
                    s.id === currentSessionId 
                        ? { ...s, messages, title: generateTitle(messages), updatedAt: new Date() }
                        : s
                );
            } else {
                // Create new session
                const newSession: ChatSession = {
                    id: Date.now().toString(),
                    title: generateTitle(messages),
                    messages,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                setCurrentSessionId(newSession.id);
                updated = [newSession, ...prev];
            }
            
            // Sort by most recent
            updated.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
            saveSessions(updated);
            return updated;
        });
    }, [messages, currentSessionId]);

    // Start a new chat
    const handleNewChat = () => {
        setCurrentSessionId(null);
        setMessages([DEFAULT_MESSAGE]);
        setShowHistory(false);
    };

    // Load a previous session
    const handleLoadSession = (session: ChatSession) => {
        setCurrentSessionId(session.id);
        setMessages(session.messages);
        setShowHistory(false);
    };

    // Delete a session
    const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        setSessions(prev => {
            const updated = prev.filter(s => s.id !== sessionId);
            saveSessions(updated);
            return updated;
        });
        if (currentSessionId === sessionId) {
            handleNewChat();
        }
    };

    // Get current session title
    const currentTitle = currentSessionId 
        ? sessions.find(s => s.id === currentSessionId)?.title || 'Chat'
        : 'New Chat';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Detect if response mentions duplicates and add action buttons
    const detectAndAddActions = (content: string): MessageAction[] => {
        const actions: MessageAction[] = [];
        
        // Check for duplicate contact responses
        if (content.toLowerCase().includes('duplicate') && 
            (content.toLowerCase().includes('contact') || content.toLowerCase().includes('name'))) {
            
            // Add preview button if this looks like a find duplicates response
            if (content.toLowerCase().includes('found') && content.includes('duplicate')) {
                actions.push({
                    label: 'Preview Removal',
                    variant: 'secondary',
                    toolName: 'remove_duplicate_contacts',
                    args: { dry_run: true },
                });
                actions.push({
                    label: 'Remove Duplicates',
                    variant: 'destructive',
                    toolName: 'remove_duplicate_contacts',
                    args: { dry_run: false },
                });
            }
            
            // If this is a dry run preview, add the actual remove button
            if (content.toLowerCase().includes('dry run') || content.toLowerCase().includes('would remove')) {
                actions.push({
                    label: 'Confirm & Remove Duplicates',
                    variant: 'destructive',
                    toolName: 'remove_duplicate_contacts',
                    args: { dry_run: false },
                });
            }
        }
        
        return actions;
    };

    // Handle action button clicks
    const handleAction = useCallback(async (action: MessageAction) => {
        setIsLoading(true);
        
        // Add a user message showing the action
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: `[Action: ${action.label}]`,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);

        // Create placeholder for response
        const assistantMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
        }]);

        try {
            // Call MCP tool through our API (avoids CORS issues)
            const headers = await getAuthHeaders();
            const response = await fetch('/api/mcp/call-tool', {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({
                    name: action.toolName,
                    arguments: action.args,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to execute action');
            }

            const result = await response.json();
            const resultText = result.result?.content?.[0]?.text || JSON.stringify(result);
            const structuredContent = result.result?.structuredContent;
            
            // Detect actions for this response too
            const newActions = detectAndAddActions(resultText);
            
            // Extract duplicate data from structured content
            let duplicates: Message['duplicates'] = undefined;
            if (structuredContent) {
                if (structuredContent.duplicateGroups) {
                    duplicates = { groups: structuredContent.duplicateGroups };
                }
                if (structuredContent.toRemove) {
                    duplicates = { ...duplicates, toRemove: structuredContent.toRemove };
                }
                if (structuredContent.removed) {
                    duplicates = { ...duplicates, removed: structuredContent.removed };
                }
            }

            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId
                    ? { 
                        ...msg, 
                        content: resultText, 
                        actions: newActions.length > 0 ? newActions : undefined,
                        duplicates 
                    }
                    : msg
            ));
        } catch (error: any) {
            console.error('Action error:', error);
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId
                    ? { ...msg, content: `Error: ${error.message}` }
                    : msg
            ));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Create a placeholder message for streaming
        const assistantMessageId = (Date.now() + 1).toString();
        const assistantMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);

        try {
            // Get access token and send in body (avoids header size limits)
            const accessToken = await getAccessToken();
            
            // Call chat API endpoint
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                    _accessToken: accessToken,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response from chat API');
            }

            // Parse JSON response
            const data = await response.json();
            const responseText = data.text || '';
            const structuredContent = data.structuredContent;
            const chartData = data.chartData;

            // Detect actions based on content
            const actions = detectAndAddActions(responseText);
            
            // Extract duplicate data from structured content
            let duplicates: Message['duplicates'] = undefined;
            if (structuredContent) {
                if (structuredContent.duplicateGroups) {
                    duplicates = { groups: structuredContent.duplicateGroups };
                }
                if (structuredContent.toRemove) {
                    duplicates = { ...duplicates, toRemove: structuredContent.toRemove };
                }
                if (structuredContent.toKeep) {
                    // toKeep comes from dry run - we can show what will be kept
                }
                if (structuredContent.removed) {
                    duplicates = { ...duplicates, removed: structuredContent.removed };
                }
            }

            // Update the message with response text, actions, duplicates, and chart
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId
                    ? { 
                        ...msg, 
                        content: responseText, 
                        actions: actions.length > 0 ? actions : undefined,
                        duplicates,
                        chart: chartData || undefined,
                    }
                    : msg
            ));
        } catch (error: any) {
            console.error('Chat error:', error);
            // Update the assistant message with error
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId
                    ? { ...msg, content: `Error: ${error.message}` }
                    : msg
            ));
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex h-full flex-col bg-background">
            {/* Chat Header with History Dropdown */}
            <div className="border-b border-border px-8 py-3 flex items-center justify-between bg-background">
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                        <MessageSquare size={16} />
                        <span className="max-w-[200px] truncate">{currentTitle}</span>
                        <ChevronDown size={16} className={`transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Dropdown */}
                    {showHistory && (
                        <div className="absolute top-full left-0 mt-2 w-72 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                            {/* New Chat Button */}
                            <button
                                onClick={handleNewChat}
                                className="w-full px-4 py-3 flex items-center gap-2 text-sm text-primary hover:bg-muted transition-colors border-b border-border"
                            >
                                <Plus size={16} />
                                New Chat
                            </button>
                            
                            {/* Session List */}
                            <div className="max-h-64 overflow-y-auto">
                                {sessions.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                                        No chat history yet
                                    </div>
                                ) : (
                                    sessions.map(session => (
                                        <div
                                            key={session.id}
                                            onClick={() => handleLoadSession(session)}
                                            className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-muted transition-colors group ${
                                                session.id === currentSessionId ? 'bg-muted' : ''
                                            }`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-foreground truncate">{session.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {session.updatedAt.toLocaleDateString()} {session.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteSession(e, session.id)}
                                                className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Delete chat"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* New Chat Button (always visible) */}
                <button
                    onClick={handleNewChat}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors"
                    title="New Chat"
                >
                    <Plus size={18} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
                {messages.map(message => (
                    <div key={message.id}>
                        <MessageBubble message={message} onAction={handleAction} isLoading={isLoading} />
                        {message.toolCalls && message.toolCalls.length > 0 && (
                            <div className="mt-2 space-y-2">
                                {message.toolCalls.map((tool, idx) => (
                                    <ToolResultCard key={idx} toolCall={tool} />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <div className="animate-pulse">Thinking...</div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border px-8 py-4 bg-background">
                <div className="flex items-end gap-3">
                    <div className="flex-1 relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Tell me about a customer interaction or ask for analytics..."
                            className="w-full rounded-lg border border-border bg-card px-4 py-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                            rows={1}
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 bottom-2 p-2 text-primary hover:text-primary-glow disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Send"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
