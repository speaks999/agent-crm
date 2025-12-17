'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createBrowserClient } from '@/lib/supabaseClient';
import { Moon, Sun, Key, CreditCard, User, Bell, Shield, Mail, Phone, Globe, Clock, Save, Download, Trash2, ExternalLink, CheckCircle2, AlertCircle, Zap, Database, Link as LinkIcon, Eye, EyeOff } from 'lucide-react';

export default function SettingsPage() {
    const { user } = useAuth();
    const supabase = useMemo(() => createBrowserClient(), []);
    // Theme state with localStorage persistence
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [themeSaved, setThemeSaved] = useState(false);

    // Account state
    const [accountData, setAccountData] = useState({
        name: '',
        email: '',
        phone: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        language: (typeof navigator !== 'undefined' ? navigator.language : 'English') || 'English',
        accountType: 'Professional',
        memberSince: '',
    });
    const [isEditingAccount, setIsEditingAccount] = useState(false);
    const [isSavingAccount, setIsSavingAccount] = useState(false);
    const [accountMessage, setAccountMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [savedAvatar, setSavedAvatar] = useState<string | null>(null);
    const [hasHydratedAccount, setHasHydratedAccount] = useState(false);
    const [avatarPendingSave, setAvatarPendingSave] = useState(false);
    const [isSavingAvatar, setIsSavingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Security state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    // Notifications state with localStorage persistence
    const [notifications, setNotifications] = useState({
        email: true,
        taskReminders: true,
        weeklyReports: false,
        dealUpdates: true,
        mentionNotifications: true,
        systemAlerts: true,
    });

    // Preferences state
    const [preferences, setPreferences] = useState({
        autoSave: true,
        compactMode: false,
        showTooltips: true,
        defaultView: 'dashboard',
    });

    // API Keys state
    const [apiKeys, setApiKeys] = useState([
        { id: '1', name: 'Production API Key', key: 'api_key_production_placeholder', masked: 'api_key_••••••••••••••••', created: '2024-01-15', lastUsed: '2024-12-06' },
        { id: '2', name: 'Development Key', key: 'api_key_development_placeholder', masked: 'api_key_••••••••••••••••', created: '2024-11-01', lastUsed: '2024-12-05' },
    ]);
    const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});

    // Load saved preferences from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme) {
            setTheme(savedTheme);
            if (savedTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                setTheme('dark');
                document.documentElement.classList.add('dark');
            }
        }

        const savedNotifications = localStorage.getItem('notifications');
        if (savedNotifications) {
            setNotifications(JSON.parse(savedNotifications));
        }

        const savedPreferences = localStorage.getItem('preferences');
        if (savedPreferences) {
            setPreferences(JSON.parse(savedPreferences));
        }
    }, []);

    // Hydrate account details from the authenticated user (Supabase).
    // Avoid overwriting in-progress edits by skipping hydration while editing.
    useEffect(() => {
        if (!user) return;
        if (isEditingAccount) return;

        const metadata = user.user_metadata || {};
        const fullName =
            metadata.full_name ||
            metadata.name ||
            [metadata.first_name, metadata.last_name].filter(Boolean).join(' ') ||
            (user.email ? user.email.split('@')[0] : '');

        const memberSince = user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : '';

        setAccountData(prev => ({
            ...prev,
            name: fullName || prev.name,
            email: user.email || prev.email,
            phone: metadata.phone || prev.phone,
            timezone: metadata.timezone || prev.timezone,
            language: metadata.language || prev.language,
            accountType: metadata.account_type || prev.accountType,
            memberSince: memberSince || prev.memberSince,
        }));

        if (!avatarPreview && metadata.avatar_url) {
            setAvatarPreview(metadata.avatar_url);
        }

        if (!savedAvatar && metadata.avatar_url) {
            setSavedAvatar(metadata.avatar_url);
        }

        setHasHydratedAccount(true);
    }, [user, avatarPreview, savedAvatar, isEditingAccount]);

    // Save avatar only (for quick avatar changes outside of full profile edit)
    const handleAvatarSave = async () => {
        if (!user) {
            setAccountMessage({ type: 'error', text: 'You must be signed in to update your profile picture.' });
            return;
        }

        setIsSavingAvatar(true);
        setAccountMessage(null);

        try {
            const { data: sessionCheck, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionCheck.session) {
                const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
                if (refreshError || !refreshed.session) {
                    setAccountMessage({ type: 'error', text: 'Session expired. Please sign in again.' });
                    return;
                }
            }

            const { error } = await supabase.auth.updateUser({
                data: {
                    avatar_url: avatarPreview || undefined,
                },
            });

            if (error) {
                setAccountMessage({ type: 'error', text: error.message || 'Failed to update profile picture.' });
            } else {
                setAccountMessage({ type: 'success', text: 'Profile picture updated!' });
                setSavedAvatar(avatarPreview || null);
                setAvatarPendingSave(false);
                try {
                    if (avatarPreview) {
                        localStorage.setItem('profileAvatar', avatarPreview);
                    } else {
                        localStorage.removeItem('profileAvatar');
                    }
                } catch (err) {
                    console.error('Failed to persist avatar locally', err);
                }
            }
        } catch (err: any) {
            setAccountMessage({ type: 'error', text: err?.message || 'Unexpected error while updating profile picture.' });
        } finally {
            setIsSavingAvatar(false);
        }
    };

    // Cancel avatar change
    const handleAvatarCancel = () => {
        setAvatarPreview(savedAvatar);
        setAvatarPendingSave(false);
    };

    const handleThemeToggle = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        setThemeSaved(true);
        setTimeout(() => setThemeSaved(false), 2000);
    };

    const handleAccountSave = async () => {
        if (!user) {
            setAccountMessage({ type: 'error', text: 'You must be signed in to update your profile.' });
            return;
        }

        setIsSavingAccount(true);
        setAccountMessage(null);

        try {
            // Ensure we have a valid session before attempting the update; if not, try to refresh.
            console.log('[profile-save] url', process.env.NEXT_PUBLIC_SUPABASE_URL);
            const { data: sessionCheck, error: sessionError } = await supabase.auth.getSession();
            console.log('[profile-save] session check', { session: Boolean(sessionCheck.session), sessionError });
            if (sessionError) {
                setAccountMessage({ type: 'error', text: sessionError.message || 'Unable to verify session.' });
                return;
            }

            if (!sessionCheck.session) {
                const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
                console.log('[profile-save] refresh session', { session: Boolean(refreshed.session), refreshError });
                if (refreshError || !refreshed.session) {
                    setAccountMessage({ type: 'error', text: refreshError?.message || 'No active session. Please sign in again.' });
                    return;
                }
            }

            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Profile update timed out. Please try again.')), 15000)
            );

            const raceResult = await Promise.race([
                supabase.auth.updateUser({
                    data: {
                        full_name: accountData.name,
                        phone: accountData.phone,
                        timezone: accountData.timezone,
                        language: accountData.language,
                        account_type: accountData.accountType,
                        avatar_url: avatarPreview || undefined,
                    },
                }),
                timeoutPromise,
            ]);

            const error = (raceResult as any)?.error;
            console.log('[profile-save] update result', { error, accountData });

            if (error) {
                setAccountMessage({ type: 'error', text: error.message || 'Failed to update account.' });
            } else {
                setAccountMessage({ type: 'success', text: 'Account updated.' });
                setIsEditingAccount(false);
                setSavedAvatar(avatarPreview || null);
                setAvatarPendingSave(false);
                try {
                    if (avatarPreview) {
                        localStorage.setItem('profileAvatar', avatarPreview);
                    } else {
                        localStorage.removeItem('profileAvatar');
                    }
                } catch (err) {
                    console.error('Failed to persist avatar locally', err);
                }
            }
        } catch (err: any) {
            console.log('[profile-save] caught error', err);
            setAccountMessage({ type: 'error', text: err?.message || 'Unexpected error while updating account.' });
        } finally {
            setIsSavingAccount(false);
        }
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

        if (!/[A-Z]/.test(newPassword)) {
            setPasswordMessage('Password must contain at least one uppercase letter');
            return;
        }

        if (!/[a-z]/.test(newPassword)) {
            setPasswordMessage('Password must contain at least one lowercase letter');
            return;
        }

        if (!/[0-9]/.test(newPassword)) {
            setPasswordMessage('Password must contain at least one number');
            return;
        }

        // In a real app, you'd call an API to change the password
        setPasswordMessage('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        setTimeout(() => setPasswordMessage(''), 5000);
    };

    const handleNotificationChange = (key: keyof typeof notifications) => {
        const updated = { ...notifications, [key]: !notifications[key] };
        setNotifications(updated);
        localStorage.setItem('notifications', JSON.stringify(updated));
    };

    const handlePreferenceChange = (key: keyof typeof preferences) => {
        const updated = { ...preferences, [key]: !preferences[key] };
        setPreferences(updated);
        localStorage.setItem('preferences', JSON.stringify(updated));
    };

    const handleDownloadData = () => {
        // In a real app, this would trigger a data export
        alert('Data export will be sent to your email address within 24 hours.');
    };

    const handleDeleteAccount = () => {
        const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');
        if (confirmed) {
            // In a real app, this would call an API to delete the account
            alert('Account deletion request submitted. You will receive a confirmation email.');
        }
    };

    const toggleApiKeyVisibility = (id: string) => {
        setShowApiKey(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const copyApiKey = (key: string) => {
        navigator.clipboard.writeText(key);
        // Show toast notification
    };

    const memberSinceLabel = accountData.memberSince
        ? new Date(accountData.memberSince).toLocaleDateString()
        : 'Not available';

    return (
        <div className="flex flex-col h-full p-8 overflow-y-auto bg-background">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
                <p className="text-muted-foreground">Manage your account preferences and settings</p>
            </div>

            <div className="max-w-4xl space-y-6">
                {/* Appearance Section */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center gap-3 mb-4">
                        {theme === 'light' ? <Sun className="text-warning" size={24} /> : <Moon className="text-primary" size={24} />}
                        <h2 className="text-xl font-semibold text-foreground">Appearance</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">Customize how the application looks</p>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div>
                                <p className="font-medium text-foreground">Theme</p>
                                <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {themeSaved && (
                                    <span className="text-sm text-success flex items-center gap-1">
                                        <CheckCircle2 size={16} />
                                        Saved
                                    </span>
                                )}
                                <button
                                    onClick={handleThemeToggle}
                                    className={`relative w-14 h-7 rounded-full transition-colors border border-border shadow-inner ${theme === 'dark' ? 'bg-primary' : 'bg-muted/60'
                                        }`}
                                >
                                    <div
                                        className={`absolute top-1 left-1 w-5 h-5 bg-card rounded-full shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div>
                                <p className="font-medium text-foreground">Compact Mode</p>
                                <p className="text-sm text-muted-foreground">Reduce spacing for a denser layout</p>
                            </div>
                            <button
                                onClick={() => handlePreferenceChange('compactMode')}
                                className={`relative w-14 h-7 rounded-full transition-colors border border-border shadow-inner ${preferences.compactMode ? 'bg-primary' : 'bg-muted/60'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 left-1 w-5 h-5 bg-card rounded-full shadow-sm transition-transform ${preferences.compactMode ? 'translate-x-7' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div>
                                <p className="font-medium text-foreground">Show Tooltips</p>
                                <p className="text-sm text-muted-foreground">Display helpful hints on hover</p>
                            </div>
                            <button
                                onClick={() => handlePreferenceChange('showTooltips')}
                                className={`relative w-14 h-7 rounded-full transition-colors border border-border shadow-inner ${preferences.showTooltips ? 'bg-primary' : 'bg-muted/60'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 left-1 w-5 h-5 bg-card rounded-full shadow-sm transition-transform ${preferences.showTooltips ? 'translate-x-7' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Account Section */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <User className="text-primary" size={24} />
                            <h2 className="text-xl font-semibold text-foreground">Account</h2>
                        </div>
                        {!isEditingAccount ? (
                            <button
                                onClick={() => {
                                    setIsEditingAccount(true);
                                    // Once editing starts, avoid auto-hydrate from auth user so user input is not overwritten.
                                    setHasHydratedAccount(true);
                                }}
                                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors"
                            >
                                Edit Profile
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setIsEditingAccount(false);
                                        setAvatarPreview(savedAvatar);
                                        setAvatarPendingSave(false);
                                    }}
                                    className="px-4 py-2 text-sm border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAccountSave}
                                    disabled={isSavingAccount}
                                    className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors flex items-center gap-2 disabled:opacity-70"
                                >
                                    <Save size={16} />
                                    {isSavingAccount ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        )}
                    </div>

                    {accountMessage && (
                        <div
                            className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${accountMessage.type === 'success'
                                ? 'bg-success/10 text-success'
                                : 'bg-destructive/10 text-destructive'
                                }`}
                        >
                            {accountMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            <span className="text-sm">{accountMessage.text}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Profile Picture */}
                        <div className="flex items-center gap-4 pb-4 border-b border-border">
                            <div className={`relative w-20 h-20 rounded-full bg-primary flex items-center justify-center overflow-hidden border-2 transition-colors ${
                                avatarPendingSave ? 'border-warning ring-2 ring-warning/30' : 'border-border'
                            }`}>
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold text-primary-foreground">
                                        {accountData.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                )}
                                {avatarPendingSave && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-warning rounded-full flex items-center justify-center">
                                        <span className="text-xs text-warning-foreground font-bold">!</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                {avatarPendingSave ? (
                                    <>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm font-medium text-warning flex items-center gap-1">
                                                <AlertCircle size={14} />
                                                Unsaved changes
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={handleAvatarSave}
                                                disabled={isSavingAvatar}
                                                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors flex items-center gap-2 disabled:opacity-70"
                                            >
                                                <Save size={14} />
                                                {isSavingAvatar ? 'Saving...' : 'Save Photo'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleAvatarCancel}
                                                disabled={isSavingAvatar}
                                                className="px-4 py-2 text-sm border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-4 py-2 text-sm border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                                        >
                                            Change Photo
                                        </button>
                                        <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF. Max size 2MB</p>
                                    </>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/gif"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        if (file.size > 2 * 1024 * 1024) {
                                            alert('File must be under 2MB');
                                            return;
                                        }
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                            const result = reader.result as string;
                                            setAvatarPreview(result);
                                            setAvatarPendingSave(true);
                                        };
                                        reader.readAsDataURL(file);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                                {isEditingAccount ? (
                                    <input
                                        type="text"
                                        value={accountData.name}
                                        onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                                    />
                                ) : (
                                    <div className="p-4 bg-muted rounded-lg">
                                        <p className="font-medium text-foreground">{accountData.name}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                    <Mail size={16} />
                                    Email
                                </label>
                                <div className="p-4 bg-muted rounded-lg">
                                    <p className="font-medium text-foreground">{accountData.email}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                    <Phone size={16} />
                                    Phone
                                </label>
                                {isEditingAccount ? (
                                    <input
                                        type="tel"
                                        value={accountData.phone}
                                        onChange={(e) => setAccountData({ ...accountData, phone: e.target.value })}
                                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                                    />
                                ) : (
                                    <div className="p-4 bg-muted rounded-lg">
                                        <p className="font-medium text-foreground">{accountData.phone}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                    <Clock size={16} />
                                    Timezone
                                </label>
                                {isEditingAccount ? (
                                    <select
                                        value={accountData.timezone}
                                        onChange={(e) => setAccountData({ ...accountData, timezone: e.target.value })}
                                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                                    >
                                        <option value="America/New_York">Eastern Time (ET)</option>
                                        <option value="America/Chicago">Central Time (CT)</option>
                                        <option value="America/Denver">Mountain Time (MT)</option>
                                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                        <option value="Europe/London">London (GMT)</option>
                                        <option value="Europe/Paris">Paris (CET)</option>
                                        <option value="Asia/Tokyo">Tokyo (JST)</option>
                                    </select>
                                ) : (
                                    <div className="p-4 bg-muted rounded-lg">
                                        <p className="font-medium text-foreground">{accountData.timezone}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                    <Globe size={16} />
                                    Language
                                </label>
                                {isEditingAccount ? (
                                    <select
                                        value={accountData.language}
                                        onChange={(e) => setAccountData({ ...accountData, language: e.target.value })}
                                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                                    >
                                        <option value="English">English</option>
                                        <option value="Spanish">Spanish</option>
                                        <option value="French">French</option>
                                        <option value="German">German</option>
                                        <option value="Japanese">Japanese</option>
                                    </select>
                                ) : (
                                    <div className="p-4 bg-muted rounded-lg">
                                        <p className="font-medium text-foreground">{accountData.language}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Account Type</label>
                                <div className="p-4 bg-muted rounded-lg">
                                    <p className="font-medium text-foreground">{accountData.accountType}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Member since {memberSinceLabel}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Section */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Key className="text-primary" size={24} />
                        <h2 className="text-xl font-semibold text-foreground">Security</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">Update your password to keep your account secure</p>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Current Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.current ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-2 pr-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.new ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2 pr-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Must be at least 8 characters with uppercase, lowercase, and number
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2 pr-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        {passwordMessage && (
                            <div className={`p-3 rounded-lg flex items-center gap-2 ${passwordMessage.includes('success')
                                    ? 'bg-primary-muted text-success'
                                    : 'bg-destructive/10 text-destructive'
                                }`}>
                                {passwordMessage.includes('success') ? (
                                    <CheckCircle2 size={18} />
                                ) : (
                                    <AlertCircle size={18} />
                                )}
                                {passwordMessage}
                            </div>
                        )}
                        <button
                            type="submit"
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors"
                        >
                            Update Password
                        </button>
                    </form>

                    {/* Two-Factor Authentication */}
                    <div className="mt-6 pt-6 border-t border-border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-foreground">Two-Factor Authentication</p>
                                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                            </div>
                            <button className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors">
                                Enable 2FA
                            </button>
                        </div>
                    </div>
                </div>

                {/* Subscription Section */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <CreditCard className="text-primary" size={24} />
                        <h2 className="text-xl font-semibold text-foreground">Subscription</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 gradient-primary rounded-lg border border-border">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-primary-foreground">Current Plan</p>
                                <span className="px-3 py-1 bg-primary-foreground/20 text-primary-foreground text-sm font-medium rounded-full">
                                    Professional
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-primary-foreground mb-1">$49/month</p>
                            <p className="text-sm text-primary-foreground/80">Billed monthly • Renews on Dec 23, 2025</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">Team Members</p>
                                <p className="text-xl font-semibold text-foreground">4 / 10</p>
                            </div>
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">Storage Used</p>
                                <p className="text-xl font-semibold text-foreground">2.4 GB / 50 GB</p>
                            </div>
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">API Calls</p>
                                <p className="text-xl font-semibold text-foreground">12.5K / 50K</p>
                            </div>
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">Next Billing</p>
                                <p className="text-xl font-semibold text-foreground">Dec 23, 2025</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors">
                                Upgrade Plan
                            </button>
                            <button className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors">
                                Manage Billing
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Bell className="text-primary" size={24} />
                        <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">Manage your notification preferences</p>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div>
                                <p className="font-medium text-foreground">Email Notifications</p>
                                <p className="text-sm text-muted-foreground">Receive updates via email</p>
                            </div>
                            <button
                                onClick={() => handleNotificationChange('email')}
                                className={`relative w-14 h-7 rounded-full transition-colors ${notifications.email ? 'bg-primary' : 'bg-muted'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 left-1 w-5 h-5 bg-card rounded-full transition-transform ${notifications.email ? 'translate-x-7' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div>
                                <p className="font-medium text-foreground">Task Reminders</p>
                                <p className="text-sm text-muted-foreground">Get notified about upcoming tasks</p>
                            </div>
                            <button
                                onClick={() => handleNotificationChange('taskReminders')}
                                className={`relative w-14 h-7 rounded-full transition-colors ${notifications.taskReminders ? 'bg-primary' : 'bg-muted'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 left-1 w-5 h-5 bg-card rounded-full transition-transform ${notifications.taskReminders ? 'translate-x-7' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div>
                                <p className="font-medium text-foreground">Deal Updates</p>
                                <p className="text-sm text-muted-foreground">Notifications when deals change stage</p>
                            </div>
                            <button
                                onClick={() => handleNotificationChange('dealUpdates')}
                                className={`relative w-14 h-7 rounded-full transition-colors ${notifications.dealUpdates ? 'bg-primary' : 'bg-muted'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 left-1 w-5 h-5 bg-card rounded-full transition-transform ${notifications.dealUpdates ? 'translate-x-7' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div>
                                <p className="font-medium text-foreground">Mention Notifications</p>
                                <p className="text-sm text-muted-foreground">When someone mentions you</p>
                            </div>
                            <button
                                onClick={() => handleNotificationChange('mentionNotifications')}
                                className={`relative w-14 h-7 rounded-full transition-colors ${notifications.mentionNotifications ? 'bg-primary' : 'bg-muted'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 left-1 w-5 h-5 bg-card rounded-full transition-transform ${notifications.mentionNotifications ? 'translate-x-7' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div>
                                <p className="font-medium text-foreground">Weekly Reports</p>
                                <p className="text-sm text-muted-foreground">Receive weekly activity summaries</p>
                            </div>
                            <button
                                onClick={() => handleNotificationChange('weeklyReports')}
                                className={`relative w-14 h-7 rounded-full transition-colors ${notifications.weeklyReports ? 'bg-primary' : 'bg-muted'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 left-1 w-5 h-5 bg-card rounded-full transition-transform ${notifications.weeklyReports ? 'translate-x-7' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div>
                                <p className="font-medium text-foreground">System Alerts</p>
                                <p className="text-sm text-muted-foreground">Important system notifications</p>
                            </div>
                            <button
                                onClick={() => handleNotificationChange('systemAlerts')}
                                className={`relative w-14 h-7 rounded-full transition-colors ${notifications.systemAlerts ? 'bg-primary' : 'bg-muted'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 left-1 w-5 h-5 bg-card rounded-full transition-transform ${notifications.systemAlerts ? 'translate-x-7' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* API Keys Section */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Zap className="text-primary" size={24} />
                            <h2 className="text-xl font-semibold text-foreground">API Keys</h2>
                        </div>
                        <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors">
                            Create New Key
                        </button>
                    </div>
                    <p className="text-muted-foreground mb-4">Manage your API keys for programmatic access</p>

                    <div className="space-y-3">
                        {apiKeys.map((apiKey) => (
                            <div key={apiKey.id} className="p-4 bg-muted rounded-lg border border-border">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="font-medium text-foreground">{apiKey.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Created {new Date(apiKey.created).toLocaleDateString()} • Last used {new Date(apiKey.lastUsed).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => toggleApiKeyVisibility(apiKey.id)}
                                            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showApiKey[apiKey.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                        <button
                                            onClick={() => copyApiKey(apiKey.key)}
                                            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <LinkIcon size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 px-3 py-2 bg-background border border-border rounded text-sm font-mono text-foreground break-all">
                                        {showApiKey[apiKey.id] ? apiKey.key : apiKey.masked}
                                    </code>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Integrations Section */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <LinkIcon className="text-primary" size={24} />
                        <h2 className="text-xl font-semibold text-foreground">Integrations</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">Connect with external services</p>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                                    <Database size={20} className="text-primary-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">Supabase</p>
                                    <p className="text-sm text-muted-foreground">Database and backend services</p>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-success/10 text-success text-sm font-medium rounded-full">
                                Connected
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                    <Mail size={20} className="text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">Email Service</p>
                                    <p className="text-sm text-muted-foreground">Send emails and notifications</p>
                                </div>
                            </div>
                            <button className="px-4 py-2 text-sm border border-border text-foreground rounded-lg hover:bg-muted transition-colors">
                                Connect
                            </button>
                        </div>
                    </div>
                </div>

                {/* Privacy Section */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="text-primary" size={24} />
                        <h2 className="text-xl font-semibold text-foreground">Privacy & Data</h2>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleDownloadData}
                            className="w-full text-left p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors flex items-center justify-between"
                        >
                            <div>
                                <p className="font-medium text-foreground flex items-center gap-2">
                                    <Download size={18} />
                                    Download Your Data
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">Export all your CRM data</p>
                            </div>
                            <ExternalLink size={18} className="text-muted-foreground" />
                        </button>
                        <button className="w-full text-left p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors flex items-center justify-between">
                            <div>
                                <p className="font-medium text-foreground flex items-center gap-2">
                                    <Shield size={18} />
                                    Privacy Policy
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">View our privacy policy</p>
                            </div>
                            <ExternalLink size={18} className="text-muted-foreground" />
                        </button>
                        <button
                            onClick={handleDeleteAccount}
                            className="w-full text-left p-4 bg-destructive/10 rounded-lg hover:bg-destructive/20 transition-colors flex items-center justify-between"
                        >
                            <div>
                                <p className="font-medium text-destructive flex items-center gap-2">
                                    <Trash2 size={18} />
                                    Delete Account
                                </p>
                                <p className="text-sm text-destructive/80 mt-1">Permanently delete your account and data</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
