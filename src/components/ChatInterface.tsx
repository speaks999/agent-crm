'use client';

import React, { useState } from 'react';
import { Send, Loader2, TrendingUp, Users, DollarSign, Briefcase, Calendar, Mail, Phone } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    data?: any;
}

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Hi! Tell me about your customer interactions and I\'ll update the CRM for you. You can also ask me for analytics like "Show me revenue by stage".',
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            // Determine if this is a data entry or analytics query
            const analyticsKeywords = [
                'show', 'how many', 'count', 'total', 'revenue', 'chart', 'list',
                'all deals', 'all contacts', 'average', 'avg', 'mean',
                'top', 'bottom', 'biggest', 'smallest', 'best', 'worst',
                'from this', 'last', 'this week', 'this month', 'this quarter'
            ];
            const isAnalyticsQuery = analyticsKeywords.some(keyword =>
                userMessage.toLowerCase().includes(keyword)
            );

            if (isAnalyticsQuery) {
                // Call Analyst Agent
                const response = await fetch('/api/agent/analyst', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: userMessage }),
                });

                const result = await response.json();

                if (result.error) {
                    throw new Error(result.error);
                }

                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: `Here's your ${result.config?.type || 'data'} chart: "${result.config?.title || 'Analytics Result'}"`,
                        data: result,
                    },
                ]);
            } else {
                // Call Scribe Agent
                const response = await fetch('/api/agent/scribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: userMessage }),
                });

                const result = await response.json();

                if (result.success) {
                    setMessages((prev) => [
                        ...prev,
                        {
                            role: 'assistant',
                            content: `✅ Got it! I've recorded this interaction.\n\n**Summary:** ${result.data.summary}\n**Sentiment:** ${result.data.sentiment}\n${result.data.nextSteps?.length > 0 ? `\n**Next Steps:**\n${result.data.nextSteps.map((s: string) => `• ${s}`).join('\n')}` : ''}`,
                        },
                    ]);
                } else {
                    setMessages((prev) => [
                        ...prev,
                        { role: 'assistant', content: '❌ Sorry, I had trouble processing that. Can you try again?' },
                    ]);
                }
            }
        } catch (error: any) {
            console.error('Error:', error);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: `❌ Something went wrong: ${error.message || 'Please try again.'}` },
            ]);
        }

        setIsLoading(false);
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800">Whitespace Assistant</h2>
                <p className="text-sm text-slate-500">Your AI-powered CRM companion</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-800'
                                }`}
                        >
                            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                        </div>
                        {msg.data?.data && Array.isArray(msg.data.data) && (
                            <div className="mt-4 w-full max-w-4xl">
                                <DataCards data={msg.data.data} />
                            </div>
                        )}
                        {msg.data?.data && !Array.isArray(msg.data.data) && (
                            <div className="mt-2 p-2 bg-slate-50 rounded text-xs w-full max-w-[80%]">
                                <pre className="overflow-x-auto">{JSON.stringify(msg.data.data, null, 2)}</pre>
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-100 rounded-lg px-4 py-2">
                            <Loader2 size={16} className="animate-spin text-slate-600" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Tell me about a customer interaction or ask for analytics..."
                        className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
}

function DataCards({ data }: { data: any[] }) {
    if (data.length === 0) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((item, idx) => (
                <Card key={item.id || idx} item={item} />
            ))}
        </div>
    );
}

function Card({ item }: { item: any }) {
    // Heuristics to determine title and subtitle
    const title = item.name ||
        (item.first_name && item.last_name ? `${item.first_name} ${item.last_name}` : null) ||
        item.title ||
        'Unknown';

    const subtitle = item.role || item.stage || item.industry || item.email;

    // Filter out ID, timestamps, and title/subtitle fields for the body
    const bodyFields = Object.entries(item).filter(([key]) =>
        !['id', 'created_at', 'updated_at', 'account_id', 'contact_id', 'deal_id', 'name', 'first_name', 'last_name', 'title', 'role', 'stage', 'industry', 'email'].includes(key)
    );

    return (
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-3">
                <h3 className="font-semibold text-slate-800 truncate" title={title}>{title}</h3>
                {subtitle && <p className="text-sm text-slate-500 truncate">{subtitle}</p>}
            </div>

            <div className="space-y-1">
                {/* Explicitly show Email if present (it was filtered out of body) */}
                {item.email && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Mail size={12} />
                        <span className="truncate">{item.email}</span>
                    </div>
                )}
                {/* Explicitly show Amount if present */}
                {item.amount !== undefined && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <DollarSign size={12} />
                        <span className="font-medium">${item.amount.toLocaleString()}</span>
                    </div>
                )}

                {bodyFields.slice(0, 3).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-xs">
                        <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-slate-600 font-medium truncate max-w-[60%]">{String(value)}</span>
                    </div>
                ))}
                {bodyFields.length > 3 && (
                    <p className="text-xs text-slate-400 italic mt-1">+{bodyFields.length - 3} more fields</p>
                )}
            </div>
        </div>
    );
}
