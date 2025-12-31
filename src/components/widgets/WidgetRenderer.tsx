'use client';

import React from 'react';
import { WidgetConfig, WidgetProps, WidgetSize } from './types';
import { RevenueChartWidget } from './RevenueChartWidget';
import { OpenDealsWidget } from './OpenDealsWidget';
import { OpenTasksWidget } from './OpenTasksWidget';
import { StockTickerWidget } from './StockTickerWidget';
import { StockChartWidget } from './StockChartWidget';
import { RecentActivityWidget } from './RecentActivityWidget';
import { DealsPipelineWidget } from './DealsPipelineWidget';
import { ContactsSummaryWidget } from './ContactsSummaryWidget';
import { CalendarWidget } from './CalendarWidget';
import { MyWorkWidget } from './MyWorkWidget';

interface WidgetRendererProps {
    config: WidgetConfig;
    onRemove: (id: string) => void;
    onResize?: (id: string, size: WidgetSize) => void;
    onSettings?: (id: string) => void;
    onDragStart?: (e: React.DragEvent, id: string) => void;
    isDragging?: boolean;
}

export function WidgetRenderer({ 
    config, 
    onRemove, 
    onResize, 
    onSettings,
    onDragStart,
    isDragging,
}: WidgetRendererProps) {
    const props: WidgetProps = { 
        config, 
        onRemove, 
        onResize, 
        onSettings,
        onDragStart,
        isDragging,
    };

    switch (config.type) {
        case 'revenue-chart':
            return <RevenueChartWidget {...props} />;
        case 'deals-pipeline':
            return <DealsPipelineWidget {...props} />;
        case 'open-deals':
            return <OpenDealsWidget {...props} />;
        case 'open-tasks':
            return <OpenTasksWidget {...props} />;
        case 'stock-ticker':
            return <StockTickerWidget {...props} />;
        case 'stock-chart':
            return <StockChartWidget {...props} />;
        case 'recent-activity':
            return <RecentActivityWidget {...props} />;
        case 'contacts-summary':
            return <ContactsSummaryWidget {...props} />;
        case 'calendar':
            return <CalendarWidget {...props} />;
        case 'my-work':
            return <MyWorkWidget {...props} />;
        default:
            return (
                <div className="bg-card rounded-xl border border-border p-6 text-center text-muted-foreground">
                    Unknown widget type: {config.type}
                </div>
            );
    }
}

