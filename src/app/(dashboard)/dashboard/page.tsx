import React from 'react';
import StatCard from '@/components/StatCard';

export default function Dashboard() {
    return (
        <div className="flex-1 overflow-auto p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Total Revenue" value="$124,500" change="+12%" />
                <StatCard title="Active Deals" value="45" change="+5%" />
                <StatCard title="Pipeline Value" value="$1.2M" change="+8%" />
            </div>

            <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
                <p className="text-muted-foreground">Activity feed coming soon...</p>
            </div>
        </div>
    );
}
