export interface InsightlyClientOptions {
    apiKey: string;
    pod?: string;
    apiVersion?: string;
    userAgent?: string;
}

export interface InsightlyRequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: Record<string, unknown> | Record<string, unknown>[] | undefined;
    params?: Record<string, unknown>;
    headers?: Record<string, string>;
}

export interface ListContactsParams extends Record<string, unknown> {
    top?: number;
    skip?: number;
    brief?: boolean;
    count_total?: boolean;
    tag?: string;
    email?: string;
    phone?: string;
    updated_after_utc?: string;
}

export interface SearchContactsParams extends Record<string, unknown> {
    field_name: string;
    field_value: string;
}

export interface InsightlyTag {
    TAG_NAME: string;
}

export interface InsightlyCustomField {
    CUSTOM_FIELD_ID: string;
    FIELD_VALUE: string | number | boolean;
}

export interface InsightlyContactAddress {
    ADDRESS_TYPE?: string;
    STREET_ADDRESS?: string;
    CITY?: string;
    STATE?: string;
    POSTCODE?: string;
    COUNTRY?: string;
}

export interface InsightlyContact {
    CONTACT_ID: number;
    SALUTATION?: string;
    FIRST_NAME?: string;
    LAST_NAME?: string;
    TITLE?: string;
    EMAIL_ADDRESS?: string;
    PHONE?: string;
    MOBILE?: string;
    FAX?: string;
    ASSISTANT_NAME?: string;
    ASSISTANT_PHONE?: string;
    DATE_CREATED_UTC?: string;
    DATE_UPDATED_UTC?: string;
    OWNER_USER_ID?: number;
    BACKGROUND?: string;
    TAGS?: InsightlyTag[];
    CUSTOMFIELDS?: InsightlyCustomField[];
    ADDRESSES?: InsightlyContactAddress[];
    [key: string]: unknown;
}

export type InsightlyContactPayload = Partial<Omit<InsightlyContact, 'CONTACT_ID'>> & {
    CONTACT_ID?: number;
};

export class InsightlyApiError extends Error {
    public readonly status: number;
    public readonly body: unknown;

    constructor(message: string, status: number, body?: unknown) {
        super(message);
        this.name = 'InsightlyApiError';
        this.status = status;
        this.body = body;
    }
}

/**
 * Lightweight REST client for the Insightly API.
 */
export class InsightlyClient {
    private readonly baseUrl: string;
    private readonly authHeader: string;
    private readonly userAgent: string;

    constructor(options: InsightlyClientOptions) {
        const { apiKey, pod = 'na1', apiVersion = 'v3.1', userAgent = 'insightly-contacts-mcp' } = options;
        if (!apiKey) {
            throw new Error('InsightlyClient requires an API key');
        }

        this.baseUrl = `https://api.${pod}.insightly.com/${apiVersion}`;
        this.authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
        this.userAgent = userAgent;
    }

    private async request<T>(path: string, options: InsightlyRequestOptions = {}): Promise<T> {
        const { method = 'GET', body, params, headers } = options;
        const url = new URL(`${this.baseUrl}${path}`);

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value === undefined || value === null) {
                    return;
                }
                url.searchParams.append(key, String(value));
            });
        }

        const response = await fetch(url, {
            method,
            headers: {
                Authorization: this.authHeader,
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'User-Agent': this.userAgent,
                ...headers,
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });

        const rawText = await response.text();
        const parsedBody = rawText ? safeJsonParse(rawText) : undefined;

        if (!response.ok) {
            throw new InsightlyApiError(
                `Insightly API error (${response.status})`,
                response.status,
                parsedBody || rawText
            );
        }

        return (parsedBody as T) ?? (undefined as T);
    }

    async listContacts(params: ListContactsParams = {}): Promise<InsightlyContact[]> {
        return this.request<InsightlyContact[]>('/Contacts', {
            params,
        });
    }

    async getContact(contactId: number): Promise<InsightlyContact> {
        return this.request<InsightlyContact>(`/Contacts/${contactId}`);
    }

    async createContact(payload: InsightlyContactPayload): Promise<InsightlyContact> {
        return this.request<InsightlyContact>('/Contacts', {
            method: 'POST',
            body: payload,
        });
    }

    async updateContact(payload: InsightlyContactPayload & { CONTACT_ID: number }): Promise<InsightlyContact> {
        return this.request<InsightlyContact>('/Contacts', {
            method: 'PUT',
            body: payload,
        });
    }

    async deleteContact(contactId: number): Promise<void> {
        await this.request<void>(`/Contacts/${contactId}`, {
            method: 'DELETE',
        });
    }

    async searchContacts(params: SearchContactsParams): Promise<InsightlyContact[]> {
        return this.request<InsightlyContact[]>('/Contacts/Search', {
            params,
        });
    }
}

function safeJsonParse(value: string) {
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}
