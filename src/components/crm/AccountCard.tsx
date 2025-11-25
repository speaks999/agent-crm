'use client';

import { Badge } from '@openai/apps-sdk-ui/components/Badge';
import { Button } from '@openai/apps-sdk-ui/components/Button';
import { Building, Globe } from '@openai/apps-sdk-ui/components/Icon';

interface Account {
    id: string;
    name: string;
    industry?: string;
    website?: string;
    created_at: string;
}

export function AccountCard({ account }: { account: Account }) {
    return (
        <div className="w-full rounded-2xl border border-default bg-surface shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <Building className="size-5 text-secondary" />
                        <h3 className="font-semibold text-lg">{account.name}</h3>
                    </div>

                    {account.industry && (
                        <div className="mt-2">
                            <Badge color="secondary">{account.industry}</Badge>
                        </div>
                    )}

                    {account.website && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-secondary">
                            <Globe className="size-4" />
                            <a
                                href={account.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary underline"
                            >
                                {account.website}
                            </a>
                        </div>
                    )}

                    <div className="mt-3 text-xs text-secondary">
                        Created {new Date(account.created_at).toLocaleDateString()}
                    </div>
                </div>

                <Button size="sm" variant="soft" color="secondary">
                    View Details
                </Button>
            </div>
        </div>
    );
}
