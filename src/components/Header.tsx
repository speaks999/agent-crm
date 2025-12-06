'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

export default function Header() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();

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
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8">
            <h1 className="text-xl font-semibold text-foreground">{getTitle()}</h1>
            <div className="flex items-center gap-4">
                {user && (
                    <>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User size={16} />
                            <span className="text-foreground">{user.email}</span>
                        </div>
                        <button
                            onClick={() => signOut()}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            title="Sign out"
                        >
                            <LogOut size={16} />
                            <span>Sign Out</span>
                        </button>
                    </>
                )}
            </div>
        </header>
    );
}
