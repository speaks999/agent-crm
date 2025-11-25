'use client';

import { Message } from './ChatInterface';

export function MessageBubble({ message }: { message: Message }) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser
                        ? 'bg-blue-600 text-white ml-auto'
                        : 'bg-surface border border-default'
                    }`}
            >
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                <div className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-secondary'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    );
}
