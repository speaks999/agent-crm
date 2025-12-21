'use client';

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface ChartProps {
    data: any[];
    title: string;
    xAxisKey?: string;
    yAxisKey?: string; // For Bar/Line
    dataKey?: string; // For Pie
    nameKey?: string; // For Pie
}

export function BarChartComponent({ data, title, xAxisKey = 'name', yAxisKey = 'value' }: ChartProps) {
    return (
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm w-full h-[400px] flex flex-col">
            <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: 'hsl(var(--muted))' }}
                        />
                        <Bar dataKey={yAxisKey} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export function LineChartComponent({ data, title, xAxisKey = 'name', yAxisKey = 'value' }: ChartProps) {
    return (
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm w-full h-[400px] flex flex-col">
            <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line type="monotone" dataKey={yAxisKey} stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export function PieChartComponent({ data, title, dataKey = 'value', nameKey = 'name' }: ChartProps) {
    return (
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm w-full h-[400px] flex flex-col">
            <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey={dataKey}
                            nameKey={nameKey}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

// Fields to hide from table display (IDs and technical fields)
const HIDDEN_FIELDS = [
    'id', 'account_id', 'contact_id', 'deal_id', 'pipeline_id', 'interaction_id',
    'insightly_id', 'created_at', 'updated_at', 'tags'
];

export function TableComponent({ data, title }: { data: any[], title: string }) {
    if (!data || data.length === 0) return null;

    // Filter out ID and technical columns
    const allColumns = Object.keys(data[0]);
    const columns = allColumns.filter(col => !HIDDEN_FIELDS.includes(col.toLowerCase()));

    // If all columns were filtered out, show a subset of the original
    const displayColumns = columns.length > 0 ? columns : allColumns.slice(0, 5);

    return (
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm w-full overflow-hidden">
            <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-foreground">
                    <thead className="bg-muted border-b border-border">
                        <tr>
                            {displayColumns.map((col) => (
                                <th key={col} className="px-4 py-3 font-semibold text-foreground capitalize whitespace-nowrap">
                                    {col.replace(/_/g, ' ')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.map((row, i) => (
                            <tr key={i} className="hover:bg-muted">
                                {displayColumns.map((col) => (
                                    <td key={col} className="px-4 py-3 whitespace-nowrap">
                                        {row[col] === null || row[col] === undefined
                                            ? '—'
                                            : typeof row[col] === 'object'
                                                ? JSON.stringify(row[col])
                                                : String(row[col])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
