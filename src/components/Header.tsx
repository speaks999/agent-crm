'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';

export default function Header() {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    // Initialize theme based on document class or default to light
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')) {
            return 'dark';
        }
        return 'light';
    });
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    useEffect(() => {
        try {
            const saved = localStorage.getItem('profileAvatar');
            if (saved) setAvatarUrl(saved);
        } catch (err) {
            console.error('Failed to load avatar', err);
        }
    }, []);

    // Ensure the document has the correct theme class so dark logos swap correctly.
    useEffect(() => {
        const applyTheme = (theme: 'light' | 'dark') => {
            setResolvedTheme(theme);
            if (theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        const loadTheme = () => {
            try {
                const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
                if (saved) {
                    applyTheme(saved);
                    return;
                }
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                applyTheme(prefersDark ? 'dark' : 'light');
            } catch (err) {
                console.error('Failed to resolve theme', err);
            }
        };

        loadTheme();

        // Listen for theme changes from other components (e.g., Settings page)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'theme' && e.newValue) {
                applyTheme(e.newValue as 'light' | 'dark');
            }
        };

        // Also poll for changes made in the same tab (storage event only fires cross-tab)
        const handleLocalThemeChange = () => {
            const current = localStorage.getItem('theme') as 'light' | 'dark' | null;
            if (current && current !== resolvedTheme) {
                applyTheme(current);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        const interval = setInterval(handleLocalThemeChange, 500);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [resolvedTheme]);

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

    const title = getTitle();

    return (
        <header className="bg-card border-b border-border">
            <div className="h-16 flex items-center justify-between px-4 sm:px-8">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        {/* Show white logo on dark backgrounds, black logo on light backgrounds */}
                        {resolvedTheme === 'dark' ? (
                            <img
                                key="logo-white"
                                src="/Logo White.png"
                                alt="Whitespace logo"
                                className="h-8 sm:h-10 w-auto"
                                loading="eager"
                            />
                        ) : (
                            <img
                                key="logo-black"
                                src="/Logo Black.png"
                                alt="Whitespace logo"
                                className="h-8 sm:h-10 w-auto"
                                loading="eager"
                            />
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {user && (
                        <>
                            <div className="flex items-center gap-3 text-sm min-w-0">
                                <div className="w-8 h-8 rounded-full bg-primary overflow-hidden flex items-center justify-center text-primary-foreground text-xs font-semibold">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        (() => {
                                            const username = user.email?.split('@')[0] || '';
                                            const first = username.charAt(0).toUpperCase();
                                            const last = username.charAt(username.length - 1).toUpperCase();
                                            return first + last;
                                        })()
                                    )}
                                </div>
                                <span className="hidden sm:inline text-foreground truncate max-w-[260px]">{user.email}</span>
                            </div>
                            <button
                                onClick={async () => {
                                    await signOut();
                                }}
                                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                title="Sign out"
                            >
                                <LogOut size={16} />
                                <span className="hidden sm:inline">Sign Out</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
