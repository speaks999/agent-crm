import React from 'react';

export default function StatCard({ title, value, change }: { title: string, value: string, change: string }) {
    return (
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
            <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-foreground">{value}</span>
                <span className="text-sm font-medium text-success bg-primary-muted px-2 py-1 rounded">{change}</span>
            </div>
        </div>
    );
}
