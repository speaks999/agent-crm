'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, TestTube, Shield, UserCheck, Rocket } from 'lucide-react';
import TeamSwitcher from './TeamSwitcher';

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

    // Load avatar and keep it in sync with localStorage changes (user-specific)
    const userId = user?.id;
    useEffect(() => {
        if (!userId) {
            setAvatarUrl(null);
            return;
        }

        const storageKey = `profileAvatar_${userId}`;

        const loadAvatar = () => {
            try {
                const saved = localStorage.getItem(storageKey);
                setAvatarUrl(saved);
            } catch (err) {
                console.error('Failed to load avatar', err);
            }
        };

        // Initial load
        loadAvatar();

        // Listen for changes from other tabs
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === storageKey) {
                setAvatarUrl(e.newValue);
            }
        };

        // Poll for changes in the same tab (storage event only fires cross-tab)
        const interval = setInterval(loadAvatar, 1000);

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [userId]);

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
            <div className="h-16 flex items-center justify-between px-8">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        {/* Show white logo on dark backgrounds, black logo on light backgrounds */}
                        {resolvedTheme === 'dark' ? (
                            <img
                                key="logo-white"
                                src="/Logo White.png"
                                alt="Whitespace logo"
                                className="h-10 w-auto"
                                loading="eager"
                            />
                        ) : (
                            <img
                                key="logo-black"
                                src="/Logo Black.png"
                                alt="Whitespace logo"
                                className="h-10 w-auto"
                                loading="eager"
                            />
                        )}
                    </div>
                    {/* Test Navigation Links - Hidden */}
                    {/* Uncomment to show test pages:
                    <nav className="flex items-center gap-2 ml-4">
                        <Link
                            href="/admin/mvp-tests"
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                pathname?.startsWith('/admin/mvp-tests')
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                        >
                            <Rocket size={16} />
                            <span>MVP Tests</span>
                        </Link>
                        <Link
                            href="/admin/test"
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                pathname?.startsWith('/admin/test') && !pathname?.startsWith('/admin/auth-test') && !pathname?.startsWith('/admin/team-tests') && !pathname?.startsWith('/admin/mvp-tests')
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                        >
                            <TestTube size={16} />
                            <span>MCP Tests</span>
                        </Link>
                        <Link
                            href="/admin/auth-test"
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                pathname?.startsWith('/admin/auth-test')
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                        >
                            <Shield size={16} />
                            <span>Auth Tests</span>
                        </Link>
                        <Link
                            href="/admin/team-tests"
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                pathname?.startsWith('/admin/team-tests')
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                        >
                            <UserCheck size={16} />
                            <span>Team Tests</span>
                        </Link>
                    </nav>
                    */}
                </div>
                <div className="flex items-center gap-4">
                    {user && (
                        <>
                            <TeamSwitcher />
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-full bg-primary overflow-hidden flex items-center justify-center text-primary-foreground text-xs font-semibold">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        (() => {
                                            // Try to get initials from user metadata first
                                            const metadata = user.user_metadata || {};
                                            const fullName = metadata.full_name || metadata.name || '';
                                            const firstName = metadata.first_name || '';
                                            const lastName = metadata.last_name || '';
                                            
                                            // If we have first/last name from metadata
                                            if (firstName && lastName) {
                                                return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
                                            }
                                            
                                            // If we have a full name, split it
                                            if (fullName) {
                                                const parts = fullName.trim().split(/\s+/);
                                                if (parts.length >= 2) {
                                                    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
                                                }
                                                return fullName.charAt(0).toUpperCase();
                                            }
                                            
                                            // Fall back to parsing email username
                                            const username = user.email?.split('@')[0] || '';
                                            // Try to split by common separators (., _, -)
                                            const nameParts = username.split(/[._-]/);
                                            if (nameParts.length >= 2) {
                                                return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
                                            }
                                            // Try to detect camelCase or concatenated names
                                            const camelMatch = username.match(/^([a-z]).*?([A-Z])/);
                                            if (camelMatch) {
                                                return (camelMatch[1] + camelMatch[2]).toUpperCase();
                                            }
                                            // Last resort: first letter only
                                            return username.charAt(0).toUpperCase();
                                        })()
                                    )}
                                </div>
                                <span className="text-foreground">
                                    {(() => {
                                        const metadata = user.user_metadata || {};
                                        const firstName = metadata.first_name || '';
                                        const lastName = metadata.last_name || '';
                                        const fullName = metadata.full_name || metadata.name || '';
                                        
                                        // If we have first/last name from metadata
                                        if (firstName && lastName) {
                                            return `${firstName} ${lastName}`;
                                        }
                                        
                                        // If we have a full name
                                        if (fullName) {
                                            return fullName;
                                        }
                                        
                                        // Fall back to email if no name available
                                        return user.email;
                                    })()}
                                </span>
                            </div>
                            <button
                                onClick={async () => {
                                    await signOut();
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                title="Sign out"
                            >
                                <LogOut size={16} />
                                <span>Sign Out</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
