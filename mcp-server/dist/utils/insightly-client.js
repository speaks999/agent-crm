export class InsightlyApiError extends Error {
    status;
    body;
    constructor(message, status, body) {
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
    baseUrl;
    authHeader;
    userAgent;
    constructor(options) {
        const { apiKey, pod = 'na1', apiVersion = 'v3.1', userAgent = 'insightly-contacts-mcp' } = options;
        if (!apiKey) {
            throw new Error('InsightlyClient requires an API key');
        }
        this.baseUrl = `https://api.${pod}.insightly.com/${apiVersion}`;
        this.authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
        this.userAgent = userAgent;
    }
    async request(path, options = {}) {
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
            throw new InsightlyApiError(`Insightly API error (${response.status})`, response.status, parsedBody || rawText);
        }
        return parsedBody ?? undefined;
    }
    async listContacts(params = {}) {
        return this.request('/Contacts', {
            params,
        });
    }
    async getContact(contactId) {
        return this.request(`/Contacts/${contactId}`);
    }
    async createContact(payload) {
        return this.request('/Contacts', {
            method: 'POST',
            body: payload,
        });
    }
    async updateContact(payload) {
        return this.request('/Contacts', {
            method: 'PUT',
            body: payload,
        });
    }
    async deleteContact(contactId) {
        await this.request(`/Contacts/${contactId}`, {
            method: 'DELETE',
        });
    }
    async searchContacts(params) {
        return this.request('/Contacts/Search', {
            params,
        });
    }
}
function safeJsonParse(value) {
    try {
        return JSON.parse(value);
    }
    catch {
        return value;
    }
}
//# sourceMappingURL=insightly-client.js.map