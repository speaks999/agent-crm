'use client';

import { Message, MessageAction } from './ChatInterface';

interface MessageBubbleProps {
    message: Message;
    onAction?: (action: MessageAction) => void;
    isLoading?: boolean;
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
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-card border border-border text-foreground'
                    }`}
            >
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
                
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
