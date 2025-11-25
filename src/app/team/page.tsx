'use client';

import { useState, useEffect } from 'react';
import { Plus, Mail, Shield, User, Loader2 } from 'lucide-react';

interface TeamMember {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: 'admin' | 'manager' | 'member';
    avatar_url?: string;
    active: boolean;
}

export default function TeamPage() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    async function fetchTeamMembers() {
        try {
            const response = await fetch('/api/team');
            const data = await response.json();
            setMembers(data);
        } catch (error) {
            console.error('Failed to fetch team members:', error);
        } finally {
            setIsLoading(false);
        }
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-purple-100 text-purple-800';
            case 'manager':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-slate-100 text-slate-800';
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin':
                return <Shield size={14} />;
            case 'manager':
                return <User size={14} />;
            default:
                return <User size={14} />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Team</h2>
                    <p className="text-slate-500 mt-1">{members.length} team members</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    Add Member
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((member) => (
                    <div
                        key={member.id}
                        className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-lg">
                                {member.first_name[0]}{member.last_name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-800 truncate">
                                    {member.first_name} {member.last_name}
                                </h3>
                                <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                                    <Mail size={14} />
                                    <span className="truncate">{member.email}</span>
                                </div>
                                <div className="mt-3">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                                        {getRoleIcon(member.role)}
                                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {members.length === 0 && (
                <div className="text-center py-12">
                    <User className="mx-auto text-slate-300" size={64} />
                    <p className="text-slate-500 mt-4">No team members yet</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Add Your First Member
                    </button>
                </div>
            )}

            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Add Team Member</h3>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const data = {
                                first_name: formData.get('first_name'),
                                last_name: formData.get('last_name'),
                                email: formData.get('email'),
                                role: formData.get('role'),
                            };

                            try {
                                const response = await fetch('/api/team', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(data),
                                });

                                if (response.ok) {
                                    setShowAddModal(false);
                                    fetchTeamMembers();
                                }
                            } catch (error) {
                                console.error('Failed to add member:', error);
                            }
                        }}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                                        <input name="first_name" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                                        <input name="last_name" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input name="email" type="email" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                    <select name="role" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        <option value="member">Member</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Add Member
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
