'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetProps } from './types';
import { TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle } from 'lucide-react';

interface StockQuote {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    isDemo?: boolean;
}

const DEFAULT_SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];

export function StockTickerWidget({ config, onRemove, onResize, onSettings, onDragStart, onDragOver, onDrop, isDragging, isDropTarget }: WidgetProps) {
    const [stocks, setStocks] = useState<StockQuote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const symbols = config.settings?.symbols || DEFAULT_SYMBOLS;

    const fetchStocks = useCallback(async () => {
        try {
            setError(null);
            const response = await fetch(`/api/stocks?symbols=${symbols.join(',')}`);
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            setStocks(data.quotes || []);
            setLastUpdated(new Date());
        } catch (err: any) {
            console.error('Failed to fetch stocks:', err);
            setError(err.message || 'Failed to load stock data');
        } finally {
            setIsLoading(false);
        }
    }, [symbols]);

    useEffect(() => {
        fetchStocks();
        
        // Refresh every 30 seconds
        const interval = setInterval(fetchStocks, 30000);
        return () => clearInterval(interval);
    }, [fetchStocks]);

    const getTrendIcon = (change: number) => {
        if (change > 0) return <TrendingUp size={14} className="text-green-500" />;
        if (change < 0) return <TrendingDown size={14} className="text-red-500" />;
        return <Minus size={14} className="text-muted-foreground" />;
    };

    const displayCount = config.size === 'small' ? 3 : config.size === 'medium' ? 4 : 5;

    return (
        <WidgetWrapper 
            config={config} 
            onRemove={onRemove} 
            onResize={onResize} 
            onSettings={onSettings}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            isDragging={isDragging}
            isDropTarget={isDropTarget}
        >
            {isLoading ? (
                <div className="h-[140px] flex items-center justify-center">
                    <RefreshCw className="animate-spin text-muted-foreground" size={20} />
                </div>
            ) : error ? (
                <div className="h-[140px] flex flex-col items-center justify-center text-center">
                    <AlertCircle className="text-destructive mb-2" size={24} />
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <button 
                        onClick={fetchStocks}
                        className="mt-2 text-xs text-primary hover:underline"
                    >
                        Try again
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {stocks.slice(0, displayCount).map((stock) => (
                        <div key={stock.symbol} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                                {getTrendIcon(stock.change)}
                                <div>
                                    <span className="font-semibold text-foreground text-sm">{stock.symbol}</span>
                                    {config.size !== 'small' && (
                                        <p className="text-xs text-muted-foreground truncate max-w-[100px]">{stock.name}</p>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-medium text-foreground text-sm">${stock.price.toFixed(2)}</p>
                                <p className={`text-xs ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                                </p>
                            </div>
                        </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                            {stocks[0]?.isDemo ? '📊 Demo data' : '🔴 Live'}
                        </p>
                        {lastUpdated && (
                            <p className="text-xs text-muted-foreground">
                                {lastUpdated.toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </WidgetWrapper>
    );
}
