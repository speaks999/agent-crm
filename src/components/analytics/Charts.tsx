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
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full h-[400px] flex flex-col">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#f1f5f9' }}
                        />
                        <Bar dataKey={yAxisKey} fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export function LineChartComponent({ data, title, xAxisKey = 'name', yAxisKey = 'value' }: ChartProps) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full h-[400px] flex flex-col">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line type="monotone" dataKey={yAxisKey} stroke="#4f46e5" strokeWidth={2} dot={{ r: 4, fill: '#4f46e5' }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export function PieChartComponent({ data, title, dataKey = 'value', nameKey = 'name' }: ChartProps) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full h-[400px] flex flex-col">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
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
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export function TableComponent({ data, title }: { data: any[], title: string }) {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full overflow-hidden">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            {columns.map((col) => (
                                <th key={col} className="px-4 py-3 font-semibold text-slate-900 capitalize whitespace-nowrap">
                                    {col.replace(/_/g, ' ')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {data.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                                {columns.map((col) => (
                                    <td key={col} className="px-4 py-3 whitespace-nowrap">
                                        {typeof row[col] === 'object' && row[col] !== null
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
