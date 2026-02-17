'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Users, PieChart, Settings, Building2, FolderKanban, CheckSquare, Calendar, Target, UsersRound, TestTube, Shield, UserCheck, Rocket, Trash2 } from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-card border-r border-border flex flex-col h-full">
            <div className="p-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-xl">W</span>
                </div>
                <span className="text-xl font-bold text-foreground">Whitespace</span>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                <NavItem
                    href="/dashboard"
                    icon={<LayoutDashboard size={20} />}
                    label="Dashboard"
                    active={pathname === '/dashboard'}
                />
                <NavItem
                    href="/chat"
                    icon={<MessageSquare size={20} />}
                    label="Chat"
                    active={pathname === '/chat'}
                />
                <NavItem
                    href="/opportunities"
                    icon={<Target size={20} />}
                    label="Opportunities"
                    active={pathname === '/opportunities' || pathname?.startsWith('/opportunities/')}
                />
                <NavItem
                    href="/organizations"
                    icon={<Building2 size={20} />}
                    label="Organizations"
                    active={pathname === '/organizations' || pathname?.startsWith('/organizations/')}
                />
                <NavItem
                    href="/contacts"
                    icon={<Users size={20} />}
                    label="Contacts"
                    active={pathname === '/contacts'}
                />
                <NavItem
                    href="/tasks"
                    icon={<CheckSquare size={20} />}
                    label="Tasks"
                    active={pathname === '/tasks'}
                />
                <NavItem
                    href="/projects"
                    icon={<FolderKanban size={20} />}
                    label="Projects"
                    active={pathname === '/projects' || pathname?.startsWith('/projects/')}
                />
                <NavItem
                    href="/events"
                    icon={<Calendar size={20} />}
                    label="Events"
                    active={pathname === '/events'}
                />
                <NavItem
                    href="/team"
                    icon={<UsersRound size={20} />}
                    label="Team"
                    active={pathname === '/team'}
                />
                <NavItem
                    href="/analytics"
                    icon={<PieChart size={20} />}
                    label="Analytics"
                    active={pathname === '/analytics'}
                />
            </nav>

            <div className="p-4 border-t border-border space-y-2">
                {/* Testing pages hidden but still accessible via direct URL */}
                {/* Uncomment to show testing pages:
                <NavItem
                    href="/admin/mvp-tests"
                    icon={<Rocket size={20} />}
                    label="MVP Tests"
                    active={pathname?.startsWith('/admin/mvp-tests')}
                />
                <NavItem
                    href="/admin/test"
                    icon={<TestTube size={20} />}
                    label="MCP Tests"
                    active={pathname?.startsWith('/admin/test') && !pathname?.startsWith('/admin/auth-test') && !pathname?.startsWith('/admin/team-tests') && !pathname?.startsWith('/admin/mvp-tests')}
                />
                <NavItem
                    href="/admin/auth-test"
                    icon={<Shield size={20} />}
                    label="Auth Tests"
                    active={pathname?.startsWith('/admin/auth-test')}
                />
                <NavItem
                    href="/admin/team-tests"
                    icon={<UserCheck size={20} />}
                    label="Team Tests"
                    active={pathname?.startsWith('/admin/team-tests')}
                />
                <NavItem
                    href="/admin/delete-user"
                    icon={<Trash2 size={20} />}
                    label="Delete User"
                    active={pathname?.startsWith('/admin/delete-user')}
                />
                */}
                <NavItem
                    href="/settings"
                    icon={<Settings size={20} />}
                    label="Settings"
                    active={pathname === '/settings'}
                />
            </div>
        </aside>
    );
}

function NavItem({ icon, label, active = false, href }: { icon: React.ReactNode, label: string, active?: boolean, href: string }) {
    return (
        <Link
            href={href}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${active ? 'bg-primary-muted text-primary' : 'text-muted-foreground hover:bg-muted'}`}
        >
            {icon}
            <span className="font-medium">{label}</span>
        </Link>
    );
}
