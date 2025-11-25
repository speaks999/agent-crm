'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Users, PieChart, Settings, Building2, FolderKanban, CheckSquare, Calendar, Target, UsersRound } from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
            <div className="p-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">W</span>
                </div>
                <span className="text-xl font-bold text-slate-800">Whitespace</span>
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

            <div className="p-4 border-t border-slate-200">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-600 hover:bg-slate-100">
                    <Settings size={20} />
                    <span className="font-medium">Settings</span>
                </button>
            </div>
        </aside>
    );
}

function NavItem({ icon, label, active = false, href }: { icon: React.ReactNode, label: string, active?: boolean, href: string }) {
    return (
        <Link
            href={href}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${active ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100'}`}
        >
            {icon}
            <span className="font-medium">{label}</span>
        </Link>
    );
}
