'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetProps } from './types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react';

interface ChartPoint {
    date: string;
    close: number;
    displayDate: string;
}

interface StockMeta {
    symbol: string;
    currency: string;
    isDemo?: boolean;
}

const SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM'];
const RANGES = [
    { value: '1d', label: '1D' },
    { value: '5d', label: '5D' },
    { value: '1mo', label: '1M' },
    { value: '3mo', label: '3M' },
    { value: '6mo', label: '6M' },
    { value: '1y', label: '1Y' },
];

export function StockChartWidget({ config, onRemove, onResize, onSettings, onDragStart, isDragging }: WidgetProps) {
    const [selectedSymbol, setSelectedSymbol] = useState(config.settings?.symbol || 'AAPL');
    const [selectedRange, setSelectedRange] = useState(config.settings?.range || '1mo');
    const [data, setData] = useState<ChartPoint[]>([]);
    const [meta, setMeta] = useState<StockMeta | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Determine interval based on range
            let interval = '1d';
            if (selectedRange === '1d') interval = '5m';
            else if (selectedRange === '5d') interval = '15m';
            
            const response = await fetch(
                `/api/stocks/history?symbol=${selectedSymbol}&range=${selectedRange}&interval=${interval}`
            );
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            const history = result.history || [];
            
            // Format dates based on range
            const formattedData = history.map((point: any) => {
                const date = new Date(point.date);
                let displayDate: string;
                
                if (selectedRange === '1d') {
                    displayDate = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                } else if (selectedRange === '5d') {
                    displayDate = date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' });
                } else {
                    displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }
                
                return {
                    date: point.date,
                    close: point.close,
                    displayDate,
                };
            });
            
            setData(formattedData);
            setMeta({ symbol: result.symbol, currency: result.currency || 'USD', isDemo: result.isDemo });
        } catch (err: any) {
            console.error('Failed to fetch stock history:', err);
            setError(err.message || 'Failed to load chart data');
        } finally {
            setIsLoading(false);
        }
    }, [selectedSymbol, selectedRange]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const currentPrice = data[data.length - 1]?.close || 0;
    const startPrice = data[0]?.close || 0;
    const change = currentPrice - startPrice;
    const changePercent = startPrice ? (change / startPrice) * 100 : 0;
    const isPositive = change >= 0;

    return (
        <WidgetWrapper 
            config={config} 
            onRemove={onRemove} 
            onResize={onResize} 
            onSettings={onSettings}
            onDragStart={onDragStart}
            isDragging={isDragging}
        >
            <div className="space-y-4">
                {/* Symbol and Range Selectors */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedSymbol}
                            onChange={(e) => setSelectedSymbol(e.target.value)}
                            className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {SYMBOLS.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        
                        {!isLoading && !error && (
                            <div className="text-right">
                                <span className="font-bold text-foreground text-lg">${currentPrice.toFixed(2)}</span>
                                <span className={`text-sm ml-2 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                    {isPositive ? <TrendingUp size={14} className="inline" /> : <TrendingDown size={14} className="inline" />}
                                    {' '}{isPositive ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
                                </span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex gap-1">
                        {RANGES.map(range => (
                            <button
                                key={range.value}
                                onClick={() => setSelectedRange(range.value)}
                                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                    selectedRange === range.value
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chart */}
                {isLoading ? (
                    <div className="h-[180px] flex items-center justify-center">
                        <RefreshCw className="animate-spin text-muted-foreground" size={24} />
                    </div>
                ) : error ? (
                    <div className="h-[180px] flex flex-col items-center justify-center text-center">
                        <AlertCircle className="text-destructive mb-2" size={24} />
                        <p className="text-sm text-muted-foreground">{error}</p>
                        <button 
                            onClick={fetchHistory}
                            className="mt-2 text-xs text-primary hover:underline"
                        >
                            Try again
                        </button>
                    </div>
                ) : (
                    <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                                <defs>
                                    <linearGradient id={`gradient-${selectedSymbol}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis 
                                    dataKey="displayDate" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                                    interval="preserveStartEnd"
                                    minTickGap={30}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                                    domain={['dataMin - 2', 'dataMax + 2']}
                                    tickFormatter={(v) => `$${v.toFixed(0)}`}
                                    width={45}
                                />
                                <Tooltip
                                    contentStyle={{ 
                                        borderRadius: '8px', 
                                        border: '1px solid hsl(var(--border))', 
                                        backgroundColor: 'hsl(var(--card))', 
                                        color: 'hsl(var(--foreground))' 
                                    }}
                                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                                    labelFormatter={(label) => label}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="close"
                                    stroke={isPositive ? '#22c55e' : '#ef4444'}
                                    strokeWidth={2}
                                    fill={`url(#gradient-${selectedSymbol})`}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                <p className="text-xs text-muted-foreground text-center">
                    {meta?.isDemo ? '📊 Demo data' : '🔴 Live'} • {meta?.currency || 'USD'}
                </p>
            </div>
        </WidgetWrapper>
    );
}
