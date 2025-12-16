'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, MessageSquare, UsersRound, TestTube, Shield, Settings, Database } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'chat', label: 'Chat', href: '/chat', icon: <MessageSquare size={18} /> },
  { id: 'data', label: 'Data', href: '/data', icon: <Database size={18} /> },
  { id: 'team', label: 'Team', href: '/team', icon: <UsersRound size={18} /> },
  { id: 'mcp-tests', label: 'MCP Tests', href: '/admin/test', icon: <TestTube size={18} /> },
  { id: 'auth-tests', label: 'Auth Tests', href: '/admin/auth-test', icon: <Shield size={18} /> },
  { id: 'settings', label: 'Settings', href: '/settings', icon: <Settings size={18} /> },
];

export function ChatTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border bg-background">
      <div className="flex items-center gap-2 px-8 py-3 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = 
            pathname === tab.href || 
            (tab.id === 'data' && (
              pathname?.startsWith('/contacts') ||
              pathname?.startsWith('/organizations') ||
              pathname?.startsWith('/opportunities') ||
              pathname?.startsWith('/tasks') ||
              pathname?.startsWith('/projects')
            )) ||
            (tab.id === 'mcp-tests' && pathname?.startsWith('/admin/test') && !pathname?.startsWith('/admin/auth-test')) ||
            (tab.id === 'auth-tests' && pathname?.startsWith('/admin/auth-test'));
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

