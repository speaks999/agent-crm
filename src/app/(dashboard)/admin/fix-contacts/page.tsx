'use client';

import { useState } from 'react';

export default function FixContactsPage() {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fixContacts = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/fix-contacts-team', {
                method: 'POST',
                credentials: 'include',
            });
            const data = await response.json();
            setResult(data);
        } catch (error: any) {
            setResult({ error: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md w-full bg-card border border-border rounded-lg p-8">
                <h1 className="text-2xl font-bold mb-4">Fix Contact Team IDs</h1>
                <p className="text-muted-foreground mb-6">
                    This will assign your team ID to all contacts that don't have one.
                </p>
                
                <button
                    onClick={fixContacts}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow disabled:opacity-50 font-semibold"
                >
                    {loading ? 'Fixing...' : 'Fix Contacts'}
                </button>
                
                {result && (
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                        <pre className="text-sm overflow-auto">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
