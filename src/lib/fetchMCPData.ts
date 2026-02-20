import { createBrowserClient } from './supabaseClient';

/**
 * Get the current access token from Supabase session
 */
export async function getAccessToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    
    try {
        const supabase = createBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            let token = session.access_token;
            
            if (typeof token !== 'string') {
                console.log(`[getAccessToken] ERROR: access_token is ${typeof token}, not string`);
                return null;
            }
            
            // If token is too large but starts with eyJ, analyze and try to decode
            if (token.startsWith('eyJ') && token.length > 5000) {
                console.log(`[getAccessToken] Token too large (${token.length} chars), analyzing...`);
                
                const parts = token.split('.');
                console.log(`[getAccessToken] Token parts: ${parts.length}, lengths: [${parts.map(p => p.length).join(', ')}]`);
                
                // Try to decode the payload to see what's in it
                if (parts.length >= 2) {
                    try {
                        const payload = JSON.parse(atob(parts[1]));
                        console.log('[getAccessToken] JWT payload keys:', Object.keys(payload));
                        console.log('[getAccessToken] JWT payload user_metadata size:', 
                            JSON.stringify(payload.user_metadata || {}).length);
                        console.log('[getAccessToken] JWT payload app_metadata size:', 
                            JSON.stringify(payload.app_metadata || {}).length);
                        
                        // Check if user_metadata has something huge
                        if (payload.user_metadata) {
                            const metaKeys = Object.keys(payload.user_metadata);
                            console.log('[getAccessToken] user_metadata keys:', metaKeys);
                            metaKeys.forEach(key => {
                                const val = payload.user_metadata[key];
                                const size = typeof val === 'string' ? val.length : JSON.stringify(val).length;
                                if (size > 100) {
                                    console.log(`[getAccessToken] Large metadata field "${key}": ${size} chars`);
                                }
                            });
                        }
                    } catch (e) {
                        console.log('[getAccessToken] Could not decode JWT payload:', e);
                    }
                }
                
                // Don't clear - let's see the structure first
                console.log('[getAccessToken] Returning null due to oversized token');
                return null;
            }
            
            // Valid JWTs start with "eyJ" and are typically 1-3KB
            if (token.startsWith('eyJ') && token.length < 5000) {
                console.log(`[getAccessToken] Valid JWT token (${token.length} chars)`);
                return token;
            } else {
                console.log(`[getAccessToken] WARNING: Invalid token format`);
                return null;
            }
        } else {
            console.log('[getAccessToken] No session found');
        }
    } catch (e) {
        console.log('[getAccessToken] Supabase getSession failed:', e);
    }

    // Fallback: read cached session from localStorage
    try {
        const raw = localStorage.getItem('agent-crm-auth');
        if (!raw) {
            console.log('[getAccessToken] No auth data in localStorage');
            return null;
        }
        const parsed = JSON.parse(raw);
        
        // Debug: log the structure keys
        console.log('[getAccessToken] localStorage keys:', Object.keys(parsed || {}));
        
        // Try to find access_token in the parsed structure
        const token = parsed?.access_token ||
            parsed?.session?.access_token ||
            parsed?.currentSession?.access_token ||
            parsed?.data?.session?.access_token ||
            null;
        
        if (token && typeof token === 'string' && token.length < 5000) {
            // Valid JWT tokens are typically 1-2KB
            console.log(`[getAccessToken] Got valid token from localStorage (${token.length} chars)`);
            return token;
        } else if (token) {
            console.log(`[getAccessToken] Token found but invalid size: ${typeof token === 'string' ? token.length : typeof token}`);
        }
        
        console.log('[getAccessToken] Could not find valid access_token in localStorage structure');
        return null;
    } catch (e) {
        console.log('[getAccessToken] localStorage parse failed:', e);
        return null;
    }
}

/**
 * Get headers for API requests
 * Note: Auth is handled via cookies (credentials: 'include'), not Bearer token
 * to avoid 431 Request Header Fields Too Large errors
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
    const accessToken = await getAccessToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    return headers;
}

/**
 * Fetch team members with auth (uses cookies)
 */
export async function fetchTeamMembers(): Promise<any[]> {
    const response = await fetch('/api/team', { 
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' 
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
}

/**
 * Fetch data from MCP server via the API route
 * Sends access token in request body to avoid header size limits
 */
export async function fetchMCPData(
    toolName: string, 
    args: Record<string, unknown> = {},
) {
    // Get access token from localStorage
    const accessToken = await getAccessToken();
    console.log(`[fetchMCPData] Tool: ${toolName}, Token: ${accessToken ? `present (${accessToken.length} chars)` : 'NULL'}`);
    
    const response = await fetch('/api/mcp/call-tool', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            name: toolName, 
            arguments: args,
            _accessToken: accessToken, // Send token in body, not header
        }),
    });

    if (!response.ok) {
        throw new Error(`MCP request failed: ${response.status}`);
    }

    const json = await response.json();
    return json.result?.structuredContent || {};
}

