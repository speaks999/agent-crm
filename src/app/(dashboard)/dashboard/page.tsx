'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, LayoutGrid } from 'lucide-react';
import { WidgetConfig, WidgetType, WidgetSize, WIDGET_CATALOG, WIDGET_SIZE_CLASSES } from '@/components/widgets/types';
import { WidgetRenderer } from '@/components/widgets/WidgetRenderer';
import { AddWidgetModal } from '@/components/widgets/AddWidgetModal';

const STORAGE_KEY = 'dashboard-widgets';

// Default widgets for new users
const DEFAULT_WIDGETS: WidgetConfig[] = [
    { id: '1', type: 'deals-pipeline', title: 'Deals Pipeline', size: 'large' },
    { id: '2', type: 'open-deals', title: 'Open Deals', size: 'medium' },
    { id: '3', type: 'open-tasks', title: 'Open Tasks', size: 'medium' },
    { id: '4', type: 'stock-ticker', title: 'Stock Ticker', size: 'small' },
    { id: '5', type: 'calendar', title: 'Calendar', size: 'medium' },
];

export default function Dashboard() {
    const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    
    // Drag and drop state
    const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);
    const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    // Load widgets from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setWidgets(JSON.parse(saved));
            } catch {
                setWidgets(DEFAULT_WIDGETS);
            }
        } else {
            setWidgets(DEFAULT_WIDGETS);
        }
        setIsLoaded(true);
    }, []);

    // Save widgets to localStorage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
        }
    }, [widgets, isLoaded]);

    const handleAddWidget = useCallback((type: WidgetType) => {
        const catalogItem = WIDGET_CATALOG.find(w => w.type === type);
        if (!catalogItem) return;

        const newWidget: WidgetConfig = {
            id: Date.now().toString(),
            type,
            title: catalogItem.name,
            size: catalogItem.defaultSize,
        };
        setWidgets(prev => [...prev, newWidget]);
    }, []);

    const handleRemoveWidget = useCallback((id: string) => {
        setWidgets(prev => prev.filter(w => w.id !== id));
    }, []);

    const handleResizeWidget = useCallback((id: string, size: WidgetSize) => {
        setWidgets(prev => prev.map(w => 
            w.id === id ? { ...w, size } : w
        ));
    }, []);

    const handleResetWidgets = useCallback(() => {
        setWidgets(DEFAULT_WIDGETS);
    }, []);

    // Drag and drop handlers
    const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
        if (!id) {
            setDraggedWidgetId(null);
            setDropTargetId(null);
            setDropPosition(null);
            return;
        }
        setDraggedWidgetId(id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDragEnd = useCallback(() => {
        setDraggedWidgetId(null);
        setDropTargetId(null);
        setDropPosition(null);
    }, []);

    // Handle drag over a specific widget
    const handleWidgetDragOver = useCallback((e: React.DragEvent, widgetId: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!draggedWidgetId || draggedWidgetId === widgetId) {
            setDropTargetId(null);
            setDropPosition(null);
            return;
        }

        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const threshold = rect.width * 0.3; // 30% from each edge
        
        // Determine if dropping before or after based on mouse position
        if (mouseX < threshold) {
            setDropTargetId(widgetId);
            setDropPosition('before');
        } else if (mouseX > rect.width - threshold) {
            setDropTargetId(widgetId);
            setDropPosition('after');
        } else {
            // In the middle - swap positions
            setDropTargetId(widgetId);
            setDropPosition('before');
        }
    }, [draggedWidgetId]);

    const handleWidgetDragLeave = useCallback((e: React.DragEvent) => {
        // Only clear if leaving to outside the widget
        const relatedTarget = e.relatedTarget as HTMLElement;
        const currentTarget = e.currentTarget as HTMLElement;
        
        if (!currentTarget.contains(relatedTarget)) {
            setDropTargetId(null);
            setDropPosition(null);
        }
    }, []);

    const handleWidgetDrop = useCallback((e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!draggedWidgetId || draggedWidgetId === targetId) {
            setDraggedWidgetId(null);
            setDropTargetId(null);
            setDropPosition(null);
            return;
        }

        setWidgets(prev => {
            const newWidgets = [...prev];
            const draggedIndex = newWidgets.findIndex(w => w.id === draggedWidgetId);
            const targetIndex = newWidgets.findIndex(w => w.id === targetId);
            
            if (draggedIndex === -1 || targetIndex === -1) return prev;
            
            // Remove dragged widget
            const [draggedWidget] = newWidgets.splice(draggedIndex, 1);
            
            // Calculate insert position
            let insertIndex = targetIndex;
            if (draggedIndex < targetIndex) {
                insertIndex--; // Account for removal
            }
            if (dropPosition === 'after') {
                insertIndex++;
            }
            
            // Clamp to valid range
            insertIndex = Math.max(0, Math.min(insertIndex, newWidgets.length));
            
            newWidgets.splice(insertIndex, 0, draggedWidget);
            
            return newWidgets;
        });

        setDraggedWidgetId(null);
        setDropTargetId(null);
        setDropPosition(null);
    }, [draggedWidgetId, dropPosition]);

    const handleGridDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        
        if (!draggedWidgetId) {
            return;
        }

        // If dropped on grid but not on a widget, move to end
        if (!dropTargetId) {
            setWidgets(prev => {
                const newWidgets = [...prev];
                const draggedIndex = newWidgets.findIndex(w => w.id === draggedWidgetId);
                if (draggedIndex === -1) return prev;
                
                const [draggedWidget] = newWidgets.splice(draggedIndex, 1);
                newWidgets.push(draggedWidget);
                return newWidgets;
            });
        }

        setDraggedWidgetId(null);
        setDropTargetId(null);
        setDropPosition(null);
    }, [draggedWidgetId, dropTargetId]);

    if (!isLoaded) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-1">Customize your workspace with widgets</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleResetWidgets}
                        className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Reset Layout
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors font-medium"
                    >
                        <Plus size={18} />
                        Add Widget
                    </button>
                </div>
            </div>

            {/* Widget Grid */}
            {widgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <LayoutGrid size={48} className="text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold text-foreground mb-2">No widgets yet</h2>
                    <p className="text-muted-foreground mb-6 max-w-md">
                        Add widgets to customize your dashboard with analytics, stock data, tasks, and more.
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors font-medium"
                    >
                        <Plus size={18} />
                        Add Your First Widget
                    </button>
                </div>
            ) : (
                <div 
                    ref={gridRef}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2 min-h-[200px]"
                    onDragOver={handleDragOver}
                    onDrop={handleGridDrop}
                    onDragEnd={handleDragEnd}
                >
                    {widgets.map((widget) => {
                        const isDropTarget = dropTargetId === widget.id;
                        const showBeforeIndicator = isDropTarget && dropPosition === 'before';
                        const showAfterIndicator = isDropTarget && dropPosition === 'after';
                        
                        return (
                            <div
                                key={widget.id}
                                data-widget-id={widget.id}
                                className={`relative ${WIDGET_SIZE_CLASSES[widget.size]} transition-all duration-200 ${
                                    draggedWidgetId === widget.id ? 'opacity-50 scale-95' : ''
                                }`}
                                onDragOver={(e) => handleWidgetDragOver(e, widget.id)}
                                onDragLeave={handleWidgetDragLeave}
                                onDrop={(e) => handleWidgetDrop(e, widget.id)}
                            >
                                {/* Drop indicator - left edge */}
                                {showBeforeIndicator && (
                                    <div className="absolute -left-3 top-0 bottom-0 w-1.5 bg-purple-500 rounded-full z-10 pointer-events-none" />
                                )}
                                
                                {/* Drop indicator - right edge */}
                                {showAfterIndicator && (
                                    <div className="absolute -right-3 top-0 bottom-0 w-1.5 bg-purple-500 rounded-full z-10 pointer-events-none" />
                                )}
                                
                                {/* Highlight border when drop target */}
                                <div className={`h-full transition-all duration-150 rounded-xl ${
                                    isDropTarget ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-background' : ''
                                }`}>
                                    <WidgetRenderer
                                        config={widget}
                                        onRemove={handleRemoveWidget}
                                        onResize={handleResizeWidget}
                                        onDragStart={handleDragStart}
                                        isDragging={draggedWidgetId === widget.id}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Drag hint */}
            {draggedWidgetId && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-card border border-border rounded-full px-4 py-2 shadow-lg text-sm text-muted-foreground">
                    Drag to reorder • Drop on purple zone
                </div>
            )}

            {/* Add Widget Modal */}
            <AddWidgetModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleAddWidget}
                existingWidgets={widgets.map(w => w.type)}
            />
        </div>
    );
}
