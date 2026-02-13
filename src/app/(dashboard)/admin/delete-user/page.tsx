'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle, Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function DeleteUserPage() {
    const [email, setEmail] = useState('evanspeaker10@gmail.com');
    const [preview, setPreview] = useState<any>(null);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePreview = async () => {
        setLoading(true);
        setError(null);
        setPreview(null);
        setResult(null);

        try {
            const response = await fetch('/api/admin/delete-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, confirm: false })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to preview deletion');
                return;
            }

            setPreview(data);
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Are you ABSOLUTELY SURE you want to delete ${email} and ALL related data? This CANNOT be undone!`)) {
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/admin/delete-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, confirm: true })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to delete user');
                return;
            }

            setResult(data);
            setPreview(null);
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-red-600 flex items-center gap-2">
                    <AlertTriangle size={32} />
                    Delete User - DANGER ZONE
                </h1>
                <p className="text-muted-foreground mt-2">
                    This will permanently delete a user and ALL their related data. This action cannot be undone.
                </p>
            </div>

            {/* Input Section */}
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
                <label className="block mb-2 font-medium">
                    User Email to Delete
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                    placeholder="user@example.com"
                />

                <div className="flex gap-3 mt-4">
                    <button
                        onClick={handlePreview}
                        disabled={loading || !email}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                        Preview What Will Be Deleted
                    </button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-red-800 dark:text-red-400">Error</h3>
                        <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Success Display */}
            {result && result.success && (
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-300 dark:border-green-800 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-green-800 dark:text-green-400">User Deleted Successfully</h3>
                        <p className="text-green-700 dark:text-green-300 text-sm mt-1">{result.message}</p>
                        <p className="text-green-600 dark:text-green-400 text-xs mt-1">User ID: {result.deletedUserId}</p>
                    </div>
                </div>
            )}

            {/* Preview Display */}
            {preview && (
                <div className="bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-400 dark:border-yellow-700 rounded-lg p-6 mb-6">
                    <div className="flex items-start gap-3 mb-4">
                        <AlertTriangle size={24} className="text-yellow-600 flex-shrink-0" />
                        <div>
                            <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-400">
                                Deletion Preview
                            </h2>
                            <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                                Review what will be permanently deleted
                            </p>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mb-4">
                        <h3 className="font-semibold mb-2">User Information</h3>
                        <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Email:</span> {preview.user.email}</p>
                            <p><span className="font-medium">User ID:</span> {preview.user.id}</p>
                            <p><span className="font-medium">Created:</span> {new Date(preview.user.created_at).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* What Will Be Deleted */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mb-4">
                        <h3 className="font-semibold mb-3 text-red-600">What Will Be Deleted</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Teams owned (with ALL team data):</span>
                                <span className="font-bold text-red-600">{preview.willDelete.teamsOwned}</span>
                            </div>
                            
                            {preview.willDelete.teamsList?.length > 0 && (
                                <div className="ml-4 mt-2 space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Teams to be deleted:</p>
                                    {preview.willDelete.teamsList.map((team: any) => (
                                        <div key={team.id} className="text-xs text-red-600">
                                            • {team.name} ({team.id})
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-between">
                                <span>Team memberships:</span>
                                <span className="font-bold">{preview.willDelete.memberships}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Team invites sent:</span>
                                <span className="font-bold">{preview.willDelete.invitesSent}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>User preferences:</span>
                                <span className="font-bold">{preview.willDelete.userPreferences}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Team preferences:</span>
                                <span className="font-bold">{preview.willDelete.teamPreferences}</span>
                            </div>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 rounded-lg p-4 mb-4">
                        <h3 className="font-semibold text-red-800 dark:text-red-400 mb-2">⚠️ CASCADE Deletion Warning</h3>
                        <p className="text-red-700 dark:text-red-300 text-sm">
                            {preview.warning}
                        </p>
                        <p className="text-red-700 dark:text-red-300 text-sm mt-2">
                            This includes: accounts, contacts, deals, interactions, pipelines, tags, and team members.
                        </p>
                    </div>

                    {/* Delete Button */}
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
                    >
                        <Trash2 size={20} />
                        {loading ? 'Deleting...' : 'PERMANENTLY DELETE USER AND ALL DATA'}
                    </button>
                </div>
            )}
        </div>
    );
}
