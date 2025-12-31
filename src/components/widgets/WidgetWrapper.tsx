'use client';

import React, { ReactNode } from 'react';
import { X, Settings, GripVertical, Maximize2, Minimize2, Square } from 'lucide-react';
import { WidgetConfig, WidgetSize, getAllowedSizes, getNextSize, SIZE_ORDER } from './types';

interface WidgetWrapperProps {
    config: WidgetConfig;
    children: ReactNode;
    onRemove: (id: string) => void;
    onResize?: (id: string, size: WidgetSize) => void;
    onSettings?: (id: string) => void;
    onDragStart?: (e: React.DragEvent, id: string) => void;
    isDragging?: boolean;
}


const sizeLabels: Record<WidgetSize, string> = {
    small: 'S',
    medium: 'M',
    large: 'L',
};

export function WidgetWrapper({ 
    config, 
    children, 
    onRemove, 
    onResize, 
    onSettings,
    onDragStart,
    isDragging,
}: WidgetWrapperProps) {
    const allowedSizes = getAllowedSizes(config.type);
    const canResize = allowedSizes.length > 1;

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(e, config.id);
    };

    return (
        <div 
            className={`relative bg-card rounded-xl border shadow-sm overflow-hidden group transition-all duration-200 h-full flex flex-col ${
                isDragging ? 'ring-2 ring-purple-500 cursor-grabbing' : 'border-border cursor-grab'
            }`}
            draggable
            onDragStart={handleDragStart}
        >
            {/* Widget Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <GripVertical 
                        size={16} 
                        className="text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground" 
                    />
                    <h3 className="font-semibold text-foreground text-sm">{config.title}</h3>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Size selector buttons */}
                    {onResize && canResize && (
                        <div className="flex items-center gap-0.5 mr-1">
                            {SIZE_ORDER.map((size) => {
                                const isAllowed = allowedSizes.includes(size);
                                const isActive = config.size === size;
                                return (
                                    <button
                                        key={size}
                                        onClick={() => isAllowed && onResize(config.id, size)}
                                        disabled={!isAllowed}
                                        className={`w-5 h-5 rounded text-[10px] font-bold transition-colors ${
                                            isActive
                                                ? 'bg-primary text-primary-foreground'
                                                : isAllowed
                                                    ? 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                                                    : 'bg-muted/30 text-muted-foreground/30 cursor-not-allowed'
                                        }`}
                                        title={isAllowed ? `Resize to ${size}` : `${size} is too small for this widget`}
                                    >
                                        {sizeLabels[size]}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    {onSettings && (
                        <button
                            onClick={() => onSettings(config.id)}
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Widget settings"
                        >
                            <Settings size={14} />
                        </button>
                    )}
                    <button
                        onClick={() => onRemove(config.id)}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Remove widget"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
            {/* Widget Content */}
            <div className="p-4 flex-1 flex flex-col min-h-0">
                {children}
            </div>
        </div>
    );
}

