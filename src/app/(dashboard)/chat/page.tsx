'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { TodoList } from '@/components/chat/TodoList';

export default function ChatPage() {
    const [sidebarWidth, setSidebarWidth] = useState(320); // default 320px
    const isDraggingRef = useRef(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current) return;
            // Constrain width between 260px and 520px
            const newWidth = Math.min(520, Math.max(260, e.clientX * -1 + window.innerWidth));
            setSidebarWidth(newWidth);
        };

        const handleMouseUp = () => {
            isDraggingRef.current = false;
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const startDrag = () => {
        isDraggingRef.current = true;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
    };

    return (
        <div className="flex-1 overflow-hidden flex bg-background">
            {/* Main chat area */}
            <div className="flex-1 overflow-hidden flex flex-col min-w-0">
                <ChatInterface />
            </div>
            {/* Todo list sidebar (resizable) */}
            <div className="hidden lg:flex items-stretch" style={{ width: `${sidebarWidth}px` }}>
                <div
                    className="w-1 cursor-col-resize bg-border hover:bg-primary/40 transition-colors"
                    onMouseDown={startDrag}
                    title="Drag to resize"
                />
                <div className="flex-1 min-w-[240px] max-w-[520px]">
                    <TodoList />
                </div>
            </div>
        </div>
    );
}
