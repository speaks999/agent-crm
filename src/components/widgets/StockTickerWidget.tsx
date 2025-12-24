'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetProps } from './types';
import { TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle, Plus, X, Settings, Check } from 'lucide-react';

interface StockQuote {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    isDemo?: boolean;
}

const DEFAULT_SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
const STORAGE_KEY = 'stock-ticker-symbols';

export function StockTickerWidget({ config, onRemove, onResize, onSettings, onDragStart, isDragging }: WidgetProps) {
    const [stocks, setStocks] = useState<StockQuote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [newSymbol, setNewSymbol] = useState('');
    const [symbols, setSymbols] = useState<string[]>([]);

    // Load symbols from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setSymbols(parsed);
                    return;
                }
            } catch (e) {
                console.error('Failed to parse stored symbols:', e);
            }
        }
        setSymbols(config.settings?.symbols || DEFAULT_SYMBOLS);
    }, [config.settings?.symbols]);

    // Save symbols to localStorage when they change
    useEffect(() => {
        if (symbols.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols));
        }
    }, [symbols]);

    const fetchStocks = useCallback(async () => {
        if (symbols.length === 0) {
            setStocks([]);
            setIsLoading(false);
            return;
        }
        
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

    const addSymbol = () => {
        const symbol = newSymbol.trim().toUpperCase();
        if (symbol && !symbols.includes(symbol)) {
            setSymbols([...symbols, symbol]);
            setNewSymbol('');
        }
    };

    const removeSymbol = (symbolToRemove: string) => {
        setSymbols(symbols.filter(s => s !== symbolToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSymbol();
        }
    };

    const getTrendIcon = (change: number) => {
        if (change > 0) return <TrendingUp size={14} className="text-green-500" />;
        if (change < 0) return <TrendingDown size={14} className="text-red-500" />;
        return <Minus size={14} className="text-muted-foreground" />;
    };

    return (
        <WidgetWrapper 
            config={config} 
            onRemove={onRemove} 
            onResize={onResize} 
            onSettings={onSettings}
            onDragStart={onDragStart}
            isDragging={isDragging}
        >
            {isEditing ? (
                <div className="space-y-3">
                    {/* Add new symbol */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newSymbol}
                            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                            onKeyDown={handleKeyDown}
                            placeholder="Add symbol (e.g. NVDA)"
                            className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                            maxLength={10}
                        />
                        <button
                            onClick={addSymbol}
                            disabled={!newSymbol.trim()}
                            className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors disabled:opacity-50"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    {/* Current symbols list */}
                    <div className="space-y-1 max-h-[120px] overflow-y-auto">
                        {symbols.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-2">No symbols added</p>
                        ) : (
                            symbols.map((symbol) => (
                                <div key={symbol} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                    <span className="font-medium text-sm text-foreground">{symbol}</span>
                                    <button
                                        onClick={() => removeSymbol(symbol)}
                                        className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Done button */}
                    <button
                        onClick={() => setIsEditing(false)}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors text-sm"
                    >
                        <Check size={16} />
                        Done
                    </button>
                </div>
            ) : isLoading ? (
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
                    {stocks.length === 0 ? (
                        <div className="h-[100px] flex flex-col items-center justify-center">
                            <p className="text-sm text-muted-foreground mb-2">No stocks to display</p>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-xs text-primary hover:underline"
                            >
                                Add stocks
                            </button>
                        </div>
                    ) : (
                        <div className="max-h-[180px] overflow-y-auto space-y-1 pr-1">
                            {stocks.map((stock) => (
                                <div key={stock.symbol} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group">
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
                        </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">
                                {stocks[0]?.isDemo ? '📊 Demo' : '🔴 Live'}
                            </p>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                                title="Edit stocks"
                            >
                                <Settings size={12} />
                            </button>
                        </div>
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
