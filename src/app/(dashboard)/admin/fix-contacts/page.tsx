'use client';

import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabaseClient';

export default function FixContactsPage() {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fixContacts = async () => {
        setLoading(true);
        try {
            // Get auth token
            const supabase = createBrowserClient();
            const { data: { session } } = await supabase.auth.getSession();
            
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };
            
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }
            
            const response = await fetch('/api/admin/fix-contacts-team', {
                method: 'POST',
                headers,
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
                        <h3 className="font-semibold mb-2">
                            {result.success ? '✅ Success!' : '❌ Error'}
                        </h3>
                        <pre className="text-sm overflow-auto">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                        
                        {result.success && (
                            <p className="mt-4 text-sm text-muted-foreground">
                                {result.updated} contacts updated. Now go to the Contacts page and click refresh!
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
