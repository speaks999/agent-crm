'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function Header() {
    const pathname = usePathname();

    const getTitle = () => {
        switch (pathname) {
            case '/dashboard':
            case '/':
                return 'Overview';
            case '/chat':
                return 'Chat Assistant';
            case '/contacts':
                return 'Contacts';
            case '/deals':
                return 'Deals Pipeline';
            case '/analytics':
                return 'Analytics';
            default:
                return 'Overview';
        }
    };

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
            <h1 className="text-xl font-semibold text-slate-800">{getTitle()}</h1>
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-200"></div>
            </div>
        </header>
    );
}
