'use client';

import React from 'react';
import { X } from 'lucide-react';
import { WIDGET_CATALOG, WidgetType } from './types';

interface AddWidgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (type: WidgetType) => void;
    existingWidgets: WidgetType[];
}

export function AddWidgetModal({ isOpen, onClose, onAdd, existingWidgets }: AddWidgetModalProps) {
    if (!isOpen) return null;

    const handleAdd = (type: WidgetType) => {
        onAdd(type);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            
            {/* Modal */}
            <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-xl font-semibold text-foreground">Add Widget</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Widget Grid */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {WIDGET_CATALOG.map((widget) => {
                            const isAdded = existingWidgets.includes(widget.type);
                            return (
                                <button
                                    key={widget.type}
                                    onClick={() => !isAdded && handleAdd(widget.type)}
                                    disabled={isAdded}
                                    className={`p-4 rounded-xl border text-left transition-all ${
                                        isAdded
                                            ? 'bg-muted/50 border-border opacity-50 cursor-not-allowed'
                                            : 'bg-card border-border hover:border-primary hover:shadow-md cursor-pointer'
                                    }`}
                                >
                                    <div className="text-3xl mb-2">{widget.icon}</div>
                                    <h3 className="font-semibold text-foreground text-sm">{widget.name}</h3>
                                    <p className="text-xs text-muted-foreground mt-1">{widget.description}</p>
                                    {isAdded && (
                                        <span className="inline-block mt-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                            Already added
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border bg-muted/30">
                    <p className="text-xs text-muted-foreground text-center">
                        Click a widget to add it to your dashboard. You can resize or remove widgets at any time.
                    </p>
                </div>
            </div>
        </div>
    );
}

