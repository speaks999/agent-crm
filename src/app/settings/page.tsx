'use client';

import { useState } from 'react';
import { Moon, Sun, Key, CreditCard, User, Bell, Shield } from 'lucide-react';

export default function SettingsPage() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');

    const handleThemeToggle = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        // In a real app, you'd save this to localStorage and apply theme classes
        document.documentElement.classList.toggle('dark');
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setPasswordMessage('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setPasswordMessage('Password must be at least 8 characters');
            return;
        }

        // In a real app, you'd call an API to change the password
        setPasswordMessage('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="flex flex-col h-full p-8 overflow-y-auto">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Settings</h1>
            <p className="text-slate-600 mb-8">Manage your account preferences and settings</p>

            <div className="max-w-4xl space-y-6">
                {/* Appearance Section */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        {theme === 'light' ? <Sun className="text-amber-500" size={24} /> : <Moon className="text-indigo-500" size={24} />}
                        <h2 className="text-xl font-semibold text-slate-800">Appearance</h2>
                    </div>
                    <p className="text-slate-600 mb-4">Customize how the application looks</p>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                            <p className="font-medium text-slate-800">Theme</p>
                            <p className="text-sm text-slate-600">Switch between light and dark mode</p>
                        </div>
                        <button
                            onClick={handleThemeToggle}
                            className={`relative w-14 h-7 rounded-full transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'
                                }`}
                        >
                            <div
                                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Account Section */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <User className="text-indigo-600" size={24} />
                        <h2 className="text-xl font-semibold text-slate-800">Account</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-600 mb-1">Email</p>
                            <p className="font-medium text-slate-800">user@example.com</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-600 mb-1">Account Type</p>
                            <p className="font-medium text-slate-800">Professional</p>
                        </div>
                    </div>
                </div>

                {/* Security Section */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Key className="text-indigo-600" size={24} />
                        <h2 className="text-xl font-semibold text-slate-800">Security</h2>
                    </div>
                    <p className="text-slate-600 mb-4">Update your password to keep your account secure</p>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        {passwordMessage && (
                            <div className={`p-3 rounded-lg ${passwordMessage.includes('success')
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-red-50 text-red-700'
                                }`}>
                                {passwordMessage}
                            </div>
                        )}
                        <button
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Update Password
                        </button>
                    </form>
                </div>

                {/* Subscription Section */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <CreditCard className="text-indigo-600" size={24} />
                        <h2 className="text-xl font-semibold text-slate-800">Subscription</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-slate-600">Current Plan</p>
                                <span className="px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded-full">
                                    Professional
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-800 mb-1">$49/month</p>
                            <p className="text-sm text-slate-600">Billed monthly • Renews on Dec 23, 2025</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="text-sm text-slate-600 mb-1">Team Members</p>
                                <p className="text-xl font-semibold text-slate-800">4 / 10</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="text-sm text-slate-600 mb-1">Storage Used</p>
                                <p className="text-xl font-semibold text-slate-800">2.4 GB / 50 GB</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                Upgrade Plan
                            </button>
                            <button className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                                Manage Billing
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Bell className="text-indigo-600" size={24} />
                        <h2 className="text-xl font-semibold text-slate-800">Notifications</h2>
                    </div>
                    <p className="text-slate-600 mb-4">Manage your notification preferences</p>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-medium text-slate-800">Email Notifications</p>
                                <p className="text-sm text-slate-600">Receive updates via email</p>
                            </div>
                            <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600 rounded" />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-medium text-slate-800">Task Reminders</p>
                                <p className="text-sm text-slate-600">Get notified about upcoming tasks</p>
                            </div>
                            <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600 rounded" />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-medium text-slate-800">Weekly Reports</p>
                                <p className="text-sm text-slate-600">Receive weekly activity summaries</p>
                            </div>
                            <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded" />
                        </div>
                    </div>
                </div>

                {/* Privacy Section */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="text-indigo-600" size={24} />
                        <h2 className="text-xl font-semibold text-slate-800">Privacy & Data</h2>
                    </div>

                    <div className="space-y-3">
                        <button className="w-full text-left p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                            <p className="font-medium text-slate-800">Download Your Data</p>
                            <p className="text-sm text-slate-600">Export all your CRM data</p>
                        </button>
                        <button className="w-full text-left p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                            <p className="font-medium text-slate-800">Privacy Policy</p>
                            <p className="text-sm text-slate-600">View our privacy policy</p>
                        </button>
                        <button className="w-full text-left p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                            <p className="font-medium text-red-700">Delete Account</p>
                            <p className="text-sm text-red-600">Permanently delete your account and data</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
