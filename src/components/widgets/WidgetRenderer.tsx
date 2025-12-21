'use client';

import React from 'react';
import { WidgetConfig, WidgetProps } from './types';
import { RevenueChartWidget } from './RevenueChartWidget';
import { OpenDealsWidget } from './OpenDealsWidget';
import { OpenTasksWidget } from './OpenTasksWidget';
import { StockTickerWidget } from './StockTickerWidget';
import { StockChartWidget } from './StockChartWidget';
import { RecentActivityWidget } from './RecentActivityWidget';
import { DealsPipelineWidget } from './DealsPipelineWidget';
import { ContactsSummaryWidget } from './ContactsSummaryWidget';
import { CalendarWidget } from './CalendarWidget';

interface WidgetRendererProps {
    config: WidgetConfig;
    onRemove: (id: string) => void;
    onSettings?: (id: string) => void;
}

export function WidgetRenderer({ config, onRemove, onSettings }: WidgetRendererProps) {
    const props: WidgetProps = { config, onRemove, onSettings };

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
        default:
            return (
                <div className="bg-card rounded-xl border border-border p-6 text-center text-muted-foreground">
                    Unknown widget type: {config.type}
                </div>
            );
    }
}

