'use client';

import { useEffect, useState } from 'react';
import { getAuthHeaders } from '@/lib/fetchMCPData';

export default function TeamDebugPage() {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function test() {
            try {
                const headers = await getAuthHeaders();
                console.log('Headers:', headers);
                
                const response = await fetch('/api/team', { 
                    headers, 
                    credentials: 'include' 
                });
                
                console.log('Response status:', response.status);
                console.log('Response headers:', Object.fromEntries(response.headers.entries()));
                
                const json = await response.json();
                console.log('Response data:', json);
                
                setData({
                    status: response.status,
                    headers: Object.fromEntries(response.headers.entries()),
                    body: json,
                    isArray: Array.isArray(json),
                    length: Array.isArray(json) ? json.length : 'N/A'
                });
            } catch (err: any) {
                console.error('Error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        test();
    }, []);

    if (loading) return <div className="p-8">Loading...</div>;
    if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Team API Debug</h1>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );
}
