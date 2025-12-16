'use client';

import { Message } from './ChatInterface';

export function MessageBubble({ message }: { message: Message }) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-card border border-border text-foreground'
                    }`}
            >
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
            </div>
        </div>
    );
}
