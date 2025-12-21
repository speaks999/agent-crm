'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageBubble } from './MessageBubble';
import { ToolResultCard } from './ToolResultCard';

export interface MessageAction {
    label: string;
    variant: 'primary' | 'secondary' | 'destructive';
    toolName: string;
    args: any;
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
    timestamp: Date;
}

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Hi! Tell me about your customer interactions and I\'ll update the CRM for you. You can also ask me for analytics like \'Show me revenue by stage\'.',
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
            // Call MCP tool directly
            const mcpUrl = process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:3001';
            const response = await fetch(`${mcpUrl}/mcp/call-tool`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
            
            // Detect actions for this response too
            const newActions = detectAndAddActions(resultText);

            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId
                    ? { ...msg, content: resultText, actions: newActions.length > 0 ? newActions : undefined }
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
            // Call chat API endpoint
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response from chat API');
            }

            // Read the streaming response
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    accumulatedText += chunk;

                    // Detect actions based on content
                    const actions = detectAndAddActions(accumulatedText);

                    // Update the message with accumulated text and actions
                    setMessages(prev => prev.map(msg =>
                        msg.id === assistantMessageId
                            ? { ...msg, content: accumulatedText, actions: actions.length > 0 ? actions : undefined }
                            : msg
                    ));
                }
            }
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
