'use client';

import React, { useState, useEffect } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetProps } from './types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ChartPoint {
    time: string;
    price: number;
}

// Generate mock historical data
function generateMockData(symbol: string): ChartPoint[] {
    const data: ChartPoint[] = [];
    let basePrice = symbol === 'AAPL' ? 175 : symbol === 'GOOGL' ? 140 : symbol === 'MSFT' ? 375 : 180;
    const now = new Date();
    
    for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const randomWalk = (Math.random() - 0.5) * 5;
        basePrice += randomWalk;
        data.push({
            time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            price: Math.round(basePrice * 100) / 100,
        });
    }
    return data;
}

const SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];

export function StockChartWidget({ config, onRemove, onSettings }: WidgetProps) {
    const [selectedSymbol, setSelectedSymbol] = useState(config.settings?.symbol || 'AAPL');
    const [data, setData] = useState<ChartPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setData(generateMockData(selectedSymbol));
            setIsLoading(false);
        }, 500);
    }, [selectedSymbol]);

    const currentPrice = data[data.length - 1]?.price || 0;
    const startPrice = data[0]?.price || 0;
    const change = currentPrice - startPrice;
    const changePercent = startPrice ? (change / startPrice) * 100 : 0;
    const isPositive = change >= 0;

    return (
        <WidgetWrapper config={config} onRemove={onRemove} onSettings={onSettings}>
            <div className="space-y-4">
                {/* Symbol Selector and Price */}
                <div className="flex items-center justify-between">
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
                    </div>
                    {!isLoading && (
                        <div className="text-right">
                            <p className="font-bold text-foreground text-lg">${currentPrice.toFixed(2)}</p>
                            <p className={`text-sm flex items-center gap-1 justify-end ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {isPositive ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
                            </p>
                        </div>
                    )}
                </div>

                {/* Chart */}
                {isLoading ? (
                    <div className="h-[180px] flex items-center justify-center">
                        <div className="animate-pulse text-muted-foreground">Loading chart...</div>
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
                                    dataKey="time" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                                    interval="preserveStartEnd"
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                                    domain={['dataMin - 5', 'dataMax + 5']}
                                    tickFormatter={(v) => `$${v}`}
                                    width={50}
                                />
                                <Tooltip
                                    contentStyle={{ 
                                        borderRadius: '8px', 
                                        border: '1px solid hsl(var(--border))', 
                                        backgroundColor: 'hsl(var(--card))', 
                                        color: 'hsl(var(--foreground))' 
                                    }}
                                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="price"
                                    stroke={isPositive ? '#22c55e' : '#ef4444'}
                                    strokeWidth={2}
                                    fill={`url(#gradient-${selectedSymbol})`}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                <p className="text-xs text-muted-foreground text-center">
                    Demo data • 30 day history
                </p>
            </div>
        </WidgetWrapper>
    );
}

