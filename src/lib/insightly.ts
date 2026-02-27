const INSIGHTLY_API_KEY = process.env.INSIGHTLY_API_KEY;
const INSIGHTLY_POD = process.env.INSIGHTLY_POD || 'na1';
const BASE_URL = `https://api.${INSIGHTLY_POD}.insightly.com/v3.1`;

// Base64 encode the API key for authentication (deferred to avoid build-time crash)
const authHeader = INSIGHTLY_API_KEY
    ? `Basic ${Buffer.from(`${INSIGHTLY_API_KEY}:`).toString('base64')}`
    : '';

interface InsightlyRequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    params?: Record<string, string | number>;
}

interface PaginationOptions {
    top?: number; // Number of records to return (max 500)
    skip?: number; // Number of records to skip
}

/**
 * Make a request to the Insightly API
 */
async function insightlyRequest<T>(
    endpoint: string,
    options: InsightlyRequestOptions = {}
): Promise<T> {
    const { method = 'GET', body, params } = options;

    if (!INSIGHTLY_API_KEY) {
        throw new Error('INSIGHTLY_API_KEY environment variable is not set');
    }

    // Build URL with query parameters
    const url = new URL(`${BASE_URL}${endpoint}`);
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, String(value));
        });
    }

    const response = await fetch(url.toString(), {
        method,
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Insightly API error (${response.status}): ${errorText}`);
    }

    return response.json();
}

/**
 * Fetch all records with automatic pagination
 */
async function fetchAllRecords<T>(
    endpoint: string,
    options: PaginationOptions = {}
): Promise<T[]> {
    const { top = 500 } = options;
    let skip = options.skip || 0;
    let allRecords: T[] = [];
    let hasMore = true;

    while (hasMore) {
        const records = await insightlyRequest<T[]>(endpoint, {
            params: { top, skip },
        });

        allRecords = allRecords.concat(records);

        // If we got fewer records than requested, we've reached the end
        if (records.length < top) {
            hasMore = false;
        } else {
            skip += top;
        }
    }

    return allRecords;
}

// Entity-specific API functions

/**
 * Organizations
 */
export async function getOrganizations(pagination?: PaginationOptions) {
    return fetchAllRecords('/Organisations', pagination);
}

export async function getOrganization(id: number) {
    return insightlyRequest(`/Organisations/${id}`);
}

/**
 * Projects
 */
export async function getProjects(pagination?: PaginationOptions) {
    return fetchAllRecords('/Projects', pagination);
}

export async function getProject(id: number) {
    return insightlyRequest(`/Projects/${id}`);
}

/**
 * Tasks
 */
export async function getTasks(pagination?: PaginationOptions) {
    return fetchAllRecords('/Tasks', pagination);
}

export async function getTask(id: number) {
    return insightlyRequest(`/Tasks/${id}`);
}

/**
 * Events
 */
export async function getEvents(pagination?: PaginationOptions) {
    return fetchAllRecords('/Events', pagination);
}

export async function getEvent(id: number) {
    return insightlyRequest(`/Events/${id}`);
}

/**
 * Opportunities
 */
export async function getOpportunities(pagination?: PaginationOptions) {
    return fetchAllRecords('/Opportunities', pagination);
}

export async function getOpportunity(id: number) {
    return insightlyRequest(`/Opportunities/${id}`);
}

/**
 * Contacts (already exists in our system, but adding Insightly integration)
 */
export async function getContacts(pagination?: PaginationOptions) {
    return fetchAllRecords('/Contacts', pagination);
}

export async function getContact(id: number) {
    return insightlyRequest(`/Contacts/${id}`);
}

/**
 * Custom Fields
 */
export async function getCustomFields() {
    return insightlyRequest('/CustomFields');
}

/**
 * Users (for team management)
 */
export async function getUsers() {
    return insightlyRequest('/Users');
}

export async function getUser(id: number) {
    return insightlyRequest(`/Users/${id}`);
}
