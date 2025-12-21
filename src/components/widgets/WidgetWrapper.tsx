'use client';

import React, { ReactNode } from 'react';
import { X, Settings, GripVertical, Maximize2, Minimize2 } from 'lucide-react';
import { WidgetConfig, WidgetSize } from './types';

interface WidgetWrapperProps {
    config: WidgetConfig;
    children: ReactNode;
    onRemove: (id: string) => void;
    onResize?: (id: string, size: WidgetSize) => void;
    onSettings?: (id: string) => void;
}

const sizeClasses: Record<WidgetSize, string> = {
    small: 'col-span-1',
    medium: 'col-span-1 md:col-span-2',
    large: 'col-span-1 md:col-span-2 lg:col-span-3',
};

export function WidgetWrapper({ config, children, onRemove, onResize, onSettings }: WidgetWrapperProps) {
    const nextSize: Record<WidgetSize, WidgetSize> = {
        small: 'medium',
        medium: 'large',
        large: 'small',
    };

    return (
        <div className={`bg-card rounded-xl border border-border shadow-sm overflow-hidden group ${sizeClasses[config.size]}`}>
            {/* Widget Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                    <GripVertical size={16} className="text-muted-foreground cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                    <h3 className="font-semibold text-foreground text-sm">{config.title}</h3>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onResize && (
                        <button
                            onClick={() => onResize(config.id, nextSize[config.size])}
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Resize widget"
                        >
                            {config.size === 'large' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        </button>
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
            <div className="p-4">
                {children}
            </div>
        </div>
    );
}

