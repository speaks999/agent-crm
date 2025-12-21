'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, LayoutGrid } from 'lucide-react';
import { WidgetConfig, WidgetType, WidgetSize, WIDGET_CATALOG } from '@/components/widgets/types';
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {widgets.map((widget) => (
                        <WidgetRenderer
                            key={widget.id}
                            config={widget}
                            onRemove={handleRemoveWidget}
                            onResize={handleResizeWidget}
                        />
                    ))}
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
