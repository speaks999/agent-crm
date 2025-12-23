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
    const [dropIndex, setDropIndex] = useState<number | null>(null);
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
            setDropIndex(null);
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
        setDropIndex(null);
    }, []);

    // Calculate drop position based on mouse position
    const handleGridDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!draggedWidgetId || !gridRef.current) return;

        // Get all widget containers (not drop zones)
        const widgetContainers = Array.from(gridRef.current.querySelectorAll('[data-widget-id]')) as HTMLElement[];
        
        if (widgetContainers.length === 0) {
            setDropIndex(0);
            return;
        }

        const draggedIndex = widgets.findIndex(w => w.id === draggedWidgetId);
        let bestIndex = widgets.length; // Default to end
        let bestScore = Infinity;

        widgetContainers.forEach((container) => {
            const widgetId = container.dataset.widgetId;
            const widgetIndex = widgets.findIndex(w => w.id === widgetId);
            if (widgetIndex === -1) return;

            const rect = container.getBoundingClientRect();
            const midX = rect.left + rect.width / 2;
            const midY = rect.top + rect.height / 2;

            // Check if mouse is in the left half (insert before) or right half (insert after)
            const isLeftHalf = e.clientX < midX;
            const isTopHalf = e.clientY < midY;
            
            // Calculate vertical distance to determine row
            const verticalDist = Math.abs(e.clientY - midY);
            const horizontalDist = Math.abs(e.clientX - midX);
            
            // Prioritize same row, then horizontal position
            const score = verticalDist * 2 + horizontalDist;

            // Determine target index based on position
            let targetIndex: number;
            if (isLeftHalf || isTopHalf) {
                targetIndex = widgetIndex;
            } else {
                targetIndex = widgetIndex + 1;
            }

            if (score < bestScore) {
                bestScore = score;
                bestIndex = targetIndex;
            }
        });

        // Don't show drop indicator at or adjacent to dragged widget's position
        if (bestIndex === draggedIndex || bestIndex === draggedIndex + 1) {
            setDropIndex(null);
        } else {
            setDropIndex(bestIndex);
        }
    }, [draggedWidgetId, widgets]);

    const handleGridDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        
        if (!draggedWidgetId || dropIndex === null) {
            setDraggedWidgetId(null);
            setDropIndex(null);
            return;
        }

        setWidgets(prev => {
            const newWidgets = [...prev];
            const draggedIndex = newWidgets.findIndex(w => w.id === draggedWidgetId);
            
            if (draggedIndex === -1) return prev;
            
            // Remove dragged widget
            const [draggedWidget] = newWidgets.splice(draggedIndex, 1);
            
            // Calculate new index (account for removal shifting indices)
            let insertIndex = dropIndex;
            if (draggedIndex < dropIndex) {
                insertIndex--;
            }
            
            // Insert at new position
            newWidgets.splice(insertIndex, 0, draggedWidget);
            
            return newWidgets;
        });

        setDraggedWidgetId(null);
        setDropIndex(null);
    }, [draggedWidgetId, dropIndex]);

    const handleWidgetDrop = useCallback((e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!draggedWidgetId || draggedWidgetId === targetId) {
            setDraggedWidgetId(null);
            setDropIndex(null);
            return;
        }

        setWidgets(prev => {
            const newWidgets = [...prev];
            const draggedIndex = newWidgets.findIndex(w => w.id === draggedWidgetId);
            const targetIndex = newWidgets.findIndex(w => w.id === targetId);
            
            if (draggedIndex === -1 || targetIndex === -1) return prev;
            
            // Remove dragged widget and insert at target position
            const [draggedWidget] = newWidgets.splice(draggedIndex, 1);
            const insertIndex = draggedIndex < targetIndex ? targetIndex : targetIndex;
            newWidgets.splice(insertIndex, 0, draggedWidget);
            
            return newWidgets;
        });

        setDraggedWidgetId(null);
        setDropIndex(null);
    }, [draggedWidgetId]);

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
                    onDragOver={handleGridDragOver}
                    onDrop={handleGridDrop}
                    onDragLeave={() => setDropIndex(null)}
                >
                    {widgets.map((widget, index) => (
                        <React.Fragment key={widget.id}>
                            {/* Drop indicator before this widget */}
                            {dropIndex === index && draggedWidgetId && (
                                <div 
                                    className="col-span-1 h-24 rounded-xl border-2 border-dashed border-purple-500 bg-purple-500/10 flex items-center justify-center pointer-events-none"
                                    data-dropzone="true"
                                >
                                    <span className="text-purple-500 font-medium text-sm">Drop here</span>
                                </div>
                            )}
                            <div
                                data-widget-id={widget.id}
                                className={`relative ${WIDGET_SIZE_CLASSES[widget.size]} transition-all duration-200 ${
                                    draggedWidgetId === widget.id ? 'opacity-50 scale-95' : ''
                                }`}
                            >
                                <WidgetRenderer
                                    config={widget}
                                    onRemove={handleRemoveWidget}
                                    onResize={handleResizeWidget}
                                    onDragStart={handleDragStart}
                                    onDragOver={handleDragOver}
                                    onDrop={handleWidgetDrop}
                                    isDragging={draggedWidgetId === widget.id}
                                    isDropTarget={false}
                                />
                            </div>
                        </React.Fragment>
                    ))}
                    {/* Drop indicator at the end */}
                    {dropIndex === widgets.length && draggedWidgetId && (
                        <div 
                            className="col-span-1 h-24 rounded-xl border-2 border-dashed border-purple-500 bg-purple-500/10 flex items-center justify-center pointer-events-none"
                            data-dropzone="true"
                        >
                            <span className="text-purple-500 font-medium text-sm">Drop here</span>
                        </div>
                    )}
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
