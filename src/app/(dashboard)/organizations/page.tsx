'use client';

import { useState, useEffect } from 'react';
import { Building2, Loader2, RefreshCw, MapPin, Globe } from 'lucide-react';
import Link from 'next/link';

interface Organization {
    id: string;
    insightly_id: number;
    name: string;
    address_billing_city?: string;
    address_billing_state?: string;
    website?: string;
    phone?: string;
    image_url?: string;
}

export default function OrganizationsPage() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchOrganizations();
    }, []);

    async function fetchOrganizations() {
        try {
            const response = await fetch('/api/insightly/organizations');
            const data = await response.json();
            setOrganizations(data);
        } catch (error) {
            console.error('Failed to fetch organizations:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function syncOrganizations() {
        setIsSyncing(true);
        try {
            const response = await fetch('/api/insightly/organizations/sync', {
                method: 'POST',
            });
            const result = await response.json();
            if (result.success) {
                await fetchOrganizations();
            }
        } catch (error) {
            console.error('Failed to sync organizations:', error);
        } finally {
            setIsSyncing(false);
        }
    }

    const filteredOrganizations = organizations.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                    <h2 className="text-2xl font-bold text-foreground">Organizations</h2>
                    <p className="text-muted-foreground mt-1">{filteredOrganizations.length} organizations</p>
                </div>
                <button
                    onClick={syncOrganizations}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
                    {isSyncing ? 'Syncing...' : 'Sync from Insightly'}
                </button>
            </div>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search organizations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full max-w-md px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrganizations.map((org) => (
                    <Link
                        key={org.id}
                        href={`/organizations/${org.id}`}
                        className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all hover:border-primary group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-primary-muted flex items-center justify-center text-primary shrink-0 overflow-hidden">
                                {org.image_url ? (
                                    <img src={org.image_url} alt={org.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Building2 size={24} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                    {org.name}
                                </h3>

                                {(org.address_billing_city || org.address_billing_state) && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                                        <MapPin size={14} />
                                        <span className="truncate">
                                            {[org.address_billing_city, org.address_billing_state].filter(Boolean).join(', ')}
                                        </span>
                                    </div>
                                )}

                                {org.website && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                        <Globe size={14} />
                                        <span className="truncate">{org.website}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {filteredOrganizations.length === 0 && (
                <div className="text-center py-12">
                    <Building2 className="mx-auto text-muted-foreground" size={64} />
                    <p className="text-muted-foreground mt-4">No organizations found</p>
                </div>
            )}
        </div>
    );
}
