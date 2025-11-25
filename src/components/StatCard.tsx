import React from 'react';

export default function StatCard({ title, value, change }: { title: string, value: string, change: string }) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 mb-1">{title}</h3>
            <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-slate-900">{value}</span>
                <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">{change}</span>
            </div>
        </div>
    );
}
