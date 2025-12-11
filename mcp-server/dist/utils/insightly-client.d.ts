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
export declare class InsightlyApiError extends Error {
    readonly status: number;
    readonly body: unknown;
    constructor(message: string, status: number, body?: unknown);
}
/**
 * Lightweight REST client for the Insightly API.
 */
export declare class InsightlyClient {
    private readonly baseUrl;
    private readonly authHeader;
    private readonly userAgent;
    constructor(options: InsightlyClientOptions);
    private request;
    listContacts(params?: ListContactsParams): Promise<InsightlyContact[]>;
    getContact(contactId: number): Promise<InsightlyContact>;
    createContact(payload: InsightlyContactPayload): Promise<InsightlyContact>;
    updateContact(payload: InsightlyContactPayload & {
        CONTACT_ID: number;
    }): Promise<InsightlyContact>;
    deleteContact(contactId: number): Promise<void>;
    searchContacts(params: SearchContactsParams): Promise<InsightlyContact[]>;
}
//# sourceMappingURL=insightly-client.d.ts.map