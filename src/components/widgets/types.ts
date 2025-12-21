export type WidgetType = 
    | 'revenue-chart'
    | 'deals-pipeline'
    | 'tasks-overview'
    | 'stock-ticker'
    | 'stock-chart'
    | 'open-deals'
    | 'open-tasks'
    | 'recent-activity'
    | 'contacts-summary'
    | 'calendar';

export type WidgetSize = 'small' | 'medium' | 'large';

export interface WidgetConfig {
    id: string;
    type: WidgetType;
    title: string;
    size: WidgetSize;
    settings?: Record<string, any>;
}

export interface WidgetProps {
    config: WidgetConfig;
    onRemove: (id: string) => void;
    onSettings?: (id: string) => void;
}

export const WIDGET_CATALOG: { type: WidgetType; name: string; description: string; icon: string; defaultSize: WidgetSize }[] = [
    { type: 'revenue-chart', name: 'Revenue Chart', description: 'Visualize revenue by stage or time', icon: '📊', defaultSize: 'large' },
    { type: 'deals-pipeline', name: 'Deals Pipeline', description: 'View your deal pipeline stages', icon: '🎯', defaultSize: 'large' },
    { type: 'open-deals', name: 'Open Deals', description: 'Track your active deals', icon: '💰', defaultSize: 'medium' },
    { type: 'open-tasks', name: 'Open Tasks', description: 'View pending tasks', icon: '✅', defaultSize: 'medium' },
    { type: 'stock-ticker', name: 'Stock Ticker', description: 'Live stock price updates', icon: '📈', defaultSize: 'small' },
    { type: 'stock-chart', name: 'Stock Chart', description: 'Stock price chart visualization', icon: '📉', defaultSize: 'large' },
    { type: 'recent-activity', name: 'Recent Activity', description: 'Latest CRM activities', icon: '🕐', defaultSize: 'medium' },
    { type: 'contacts-summary', name: 'Contacts Summary', description: 'Overview of your contacts', icon: '👥', defaultSize: 'small' },
    { type: 'calendar', name: 'Calendar', description: 'Upcoming meetings and events', icon: '📅', defaultSize: 'medium' },
];

