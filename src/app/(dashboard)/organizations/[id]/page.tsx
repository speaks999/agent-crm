'use client';

import { useState, useEffect } from 'react';
import { Building2, Loader2, ArrowLeft, MapPin, Globe, Phone } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Organization {
    id: string;
    insightly_id: number;
    name: string;
    background?: string;
    image_url?: string;
    website?: string;
    phone?: string;
    phone_fax?: string;
    address_billing_street?: string;
    address_billing_city?: string;
    address_billing_state?: string;
    address_billing_postcode?: string;
    address_billing_country?: string;
    address_ship_street?: string;
    address_ship_city?: string;
    address_ship_state?: string;
    address_ship_postcode?: string;
    address_ship_country?: string;
    customfields?: Record<string, any>;
}

export default function OrganizationDetailPage() {
    const params = useParams();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchOrganization(params.id as string);
        }
    }, [params.id]);

    async function fetchOrganization(id: string) {
        try {
            const response = await fetch(`/api/insightly/organizations/${id}`);
            const data = await response.json();
            setOrganization(data);
        } catch (error) {
            console.error('Failed to fetch organization:', error);
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    if (!organization) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-muted-foreground text-lg">Organization not found</p>
                <Link href="/organizations" className="mt-4 text-primary hover:underline">
                    Back to Organizations
                </Link>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-8">
            <Link href="/organizations" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft size={20} />
                Back to Organizations
            </Link>

            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-8 border-b border-border">
                    <div className="flex items-start gap-6">
                        <div className="w-24 h-24 rounded-xl bg-primary-muted flex items-center justify-center text-primary shrink-0 overflow-hidden">
                            {organization.image_url ? (
                                <img src={organization.image_url} alt={organization.name} className="w-full h-full object-cover" />
                            ) : (
                                <Building2 size={48} />
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-foreground">{organization.name}</h1>
                            {organization.background && (
                                <p className="text-muted-foreground mt-2 max-w-3xl">{organization.background}</p>
                            )}

                            <div className="flex flex-wrap gap-6 mt-6">
                                {organization.website && (
                                    <a href={organization.website.startsWith('http') ? organization.website : `https://${organization.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                                        <Globe size={18} />
                                        {organization.website}
                                    </a>
                                )}
                                {organization.phone && (
                                    <div className="flex items-center gap-2 text-foreground">
                                        <Phone size={18} />
                                        {organization.phone}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <MapPin size={20} className="text-muted-foreground" />
                            Billing Address
                        </h3>
                        <div className="bg-muted p-4 rounded-lg text-foreground">
                            {organization.address_billing_street && <p>{organization.address_billing_street}</p>}
                            <p>
                                {[
                                    organization.address_billing_city,
                                    organization.address_billing_state,
                                    organization.address_billing_postcode
                                ].filter(Boolean).join(', ')}
                            </p>
                            {organization.address_billing_country && <p>{organization.address_billing_country}</p>}

                            {!organization.address_billing_street && !organization.address_billing_city && (
                                <p className="text-muted-foreground italic">No billing address</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <MapPin size={20} className="text-muted-foreground" />
                            Shipping Address
                        </h3>
                        <div className="bg-muted p-4 rounded-lg text-foreground">
                            {organization.address_ship_street && <p>{organization.address_ship_street}</p>}
                            <p>
                                {[
                                    organization.address_ship_city,
                                    organization.address_ship_state,
                                    organization.address_ship_postcode
                                ].filter(Boolean).join(', ')}
                            </p>
                            {organization.address_ship_country && <p>{organization.address_ship_country}</p>}

                            {!organization.address_ship_street && !organization.address_ship_city && (
                                <p className="text-muted-foreground italic">No shipping address</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
