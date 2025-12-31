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
    | 'calendar'
    | 'my-work';

export type WidgetSize = 'small' | 'medium' | 'large';

// Size order for cycling through sizes
export const SIZE_ORDER: WidgetSize[] = ['small', 'medium', 'large'];

// CSS classes for widget sizes in grid
export const WIDGET_SIZE_CLASSES: Record<WidgetSize, string> = {
    small: 'col-span-1',
    medium: 'col-span-1 md:col-span-2',
    large: 'col-span-1 md:col-span-2 lg:col-span-3',
};

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
    onResize?: (id: string, size: WidgetSize) => void;
    onSettings?: (id: string) => void;
    onDragStart?: (e: React.DragEvent, id: string) => void;
    isDragging?: boolean;
}

// Minimum sizes for each widget type based on content requirements
export const WIDGET_MIN_SIZES: Record<WidgetType, WidgetSize> = {
    'revenue-chart': 'medium',      // Charts need space for axes and bars
    'deals-pipeline': 'medium',     // Pipeline visualization needs width
    'tasks-overview': 'small',
    'stock-ticker': 'small',        // Ticker can be compact
    'stock-chart': 'medium',        // Charts need space
    'open-deals': 'small',          // List can be compact
    'open-tasks': 'small',          // List can be compact
    'recent-activity': 'small',     // List can be compact
    'contacts-summary': 'small',    // Stats grid works at small
    'calendar': 'small',            // Calendar grid works at small
    'my-work': 'medium',            // Needs space for tabs and list items
};

export interface WidgetCatalogItem {
    type: WidgetType;
    name: string;
    description: string;
    icon: string;
    defaultSize: WidgetSize;
    minSize: WidgetSize;
}

export const WIDGET_CATALOG: WidgetCatalogItem[] = [
    { type: 'my-work', name: 'My Work', description: 'View all items assigned to you', icon: '👤', defaultSize: 'medium', minSize: 'medium' },
    { type: 'revenue-chart', name: 'Revenue Chart', description: 'Visualize revenue by stage or time', icon: '📊', defaultSize: 'large', minSize: 'medium' },
    { type: 'deals-pipeline', name: 'Deals Pipeline', description: 'View your deal pipeline stages', icon: '🎯', defaultSize: 'large', minSize: 'medium' },
    { type: 'open-deals', name: 'Open Deals', description: 'Track your active deals', icon: '💰', defaultSize: 'medium', minSize: 'small' },
    { type: 'open-tasks', name: 'Open Tasks', description: 'View pending tasks', icon: '✅', defaultSize: 'medium', minSize: 'small' },
    { type: 'stock-ticker', name: 'Stock Ticker', description: 'Live stock price updates', icon: '📈', defaultSize: 'small', minSize: 'small' },
    { type: 'stock-chart', name: 'Stock Chart', description: 'Stock price chart visualization', icon: '📉', defaultSize: 'large', minSize: 'medium' },
    { type: 'recent-activity', name: 'Recent Activity', description: 'Latest CRM activities', icon: '🕐', defaultSize: 'medium', minSize: 'small' },
    { type: 'contacts-summary', name: 'Contacts Summary', description: 'Overview of your contacts', icon: '👥', defaultSize: 'small', minSize: 'small' },
    { type: 'calendar', name: 'Calendar', description: 'Upcoming meetings and events', icon: '📅', defaultSize: 'medium', minSize: 'small' },
];

// Helper to get allowed sizes for a widget type
export function getAllowedSizes(type: WidgetType): WidgetSize[] {
    const minSize = WIDGET_MIN_SIZES[type];
    const minIndex = SIZE_ORDER.indexOf(minSize);
    return SIZE_ORDER.slice(minIndex);
}

// Helper to get next valid size (cycling through allowed sizes)
export function getNextSize(type: WidgetType, currentSize: WidgetSize): WidgetSize {
    const allowed = getAllowedSizes(type);
    const currentIndex = allowed.indexOf(currentSize);
    const nextIndex = (currentIndex + 1) % allowed.length;
    return allowed[nextIndex];
}

