'use client';

import React, { useState, useEffect } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetProps } from './types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StockData {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
}

// Mock stock data - in production, this would come from a real API
const MOCK_STOCKS: StockData[] = [
    { symbol: 'AAPL', price: 178.72, change: 2.34, changePercent: 1.33 },
    { symbol: 'GOOGL', price: 141.80, change: -0.45, changePercent: -0.32 },
    { symbol: 'MSFT', price: 378.91, change: 4.12, changePercent: 1.10 },
    { symbol: 'AMZN', price: 178.25, change: 1.89, changePercent: 1.07 },
    { symbol: 'TSLA', price: 248.50, change: -3.20, changePercent: -1.27 },
];

export function StockTickerWidget({ config, onRemove, onResize, onSettings, onDragStart, onDragOver, onDrop, isDragging, isDropTarget }: WidgetProps) {
    const [stocks, setStocks] = useState<StockData[]>(MOCK_STOCKS);
    const [isLoading, setIsLoading] = useState(false);

    // Simulate live updates
    useEffect(() => {
        const interval = setInterval(() => {
            setStocks(prev => prev.map(stock => {
                const randomChange = (Math.random() - 0.5) * 2;
                const newPrice = stock.price + randomChange;
                const newChange = stock.change + randomChange * 0.1;
                return {
                    ...stock,
                    price: Math.round(newPrice * 100) / 100,
                    change: Math.round(newChange * 100) / 100,
                    changePercent: Math.round((newChange / newPrice) * 10000) / 100,
                };
            }));
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const getTrendIcon = (change: number) => {
        if (change > 0) return <TrendingUp size={14} className="text-green-500" />;
        if (change < 0) return <TrendingDown size={14} className="text-red-500" />;
        return <Minus size={14} className="text-muted-foreground" />;
    };

    return (
        <WidgetWrapper config={config} onRemove={onRemove} onResize={onResize} onSettings={onSettings} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} isDragging={isDragging} isDropTarget={isDropTarget}>
            <div className="space-y-2">
                {stocks.slice(0, config.size === 'small' ? 3 : 5).map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                            {getTrendIcon(stock.change)}
                            <span className="font-semibold text-foreground text-sm">{stock.symbol}</span>
                        </div>
                        <div className="text-right">
                            <p className="font-medium text-foreground text-sm">${stock.price.toFixed(2)}</p>
                            <p className={`text-xs ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                            </p>
                        </div>
                    </div>
                ))}
                <p className="text-xs text-muted-foreground text-center pt-2">
                    Demo data • Updates every 5s
                </p>
            </div>
        </WidgetWrapper>
    );
}

