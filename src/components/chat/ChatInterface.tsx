'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { ToolResultCard } from './ToolResultCard';

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    toolCalls?: Array<{
        name: string;
        args: any;
        result?: any;
    }>;
    timestamp: Date;
}

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Hello! I\'m your CRM assistant. I can help you manage accounts, contacts, opportunities, and more. Try asking me to list accounts or create a new contact.',
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

                    // Update the message with accumulated text
                    setMessages(prev => prev.map(msg =>
                        msg.id === assistantMessageId
                            ? { ...msg, content: accumulatedText }
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
        <div className="flex h-full flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(message => (
                    <div key={message.id}>
                        <MessageBubble message={message} />
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
                    <div className="flex items-center gap-2 text-secondary text-sm">
                        <div className="animate-pulse">Thinking...</div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-subtle p-4">
                <div className="flex gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Ask me anything about your CRM..."
                        className="flex-1 rounded-lg border border-default bg-surface px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
