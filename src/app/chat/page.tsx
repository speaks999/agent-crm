import React from 'react';
import ChatInterface from '@/components/ChatInterface';

export default function ChatPage() {
    return (
        <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-hidden p-4 md:p-8">
                <div className="h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <ChatInterface />
                </div>
            </div>
        </div>
    );
}
