// MCP Client for browser-side communication with MCP server

const DEFAULT_MCP_SERVER_URL =
  process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:3004/mcp';

function resolveUrl(override?: string) {
  return override?.trim() || DEFAULT_MCP_SERVER_URL;
}

// JSON-RPC request counter
let requestId = 1;

export interface MCPTool {
    name: string;
    description: string;
    inputSchema: any;
}

export interface MCPCallResult {
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
    structuredContent?: any;
}

/**
 * List all available MCP tools
 */
export async function listTools(baseUrl?: string): Promise<MCPTool[]> {
    const url = resolveUrl(baseUrl);
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: requestId++,
            method: 'tools/list',
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`MCP request failed: ${response.status} ${response.statusText}. ${text.substring(0, 200)}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`MCP server returned non-JSON response. Make sure the MCP server is running at ${url}. Response: ${text.substring(0, 200)}`);
    }

    const data = await response.json();

    if (data.error) {
        throw new Error(`MCP error: ${data.error.message}`);
    }

    const tools = data.result?.tools;
    if (!Array.isArray(tools)) {
        throw new Error(`Invalid MCP response: missing tools array`);
    }

    return tools;
}

/**
 * Call a specific MCP tool with arguments
 */
export async function callTool(name: string, args: any = {}, baseUrl?: string): Promise<MCPCallResult> {
    const url = resolveUrl(baseUrl);
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: requestId++,
            method: 'tools/call',
            params: {
                name,
                arguments: args,
            },
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`MCP request failed: ${response.status} ${response.statusText}. ${text.substring(0, 200)}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`MCP server returned non-JSON response. Make sure the MCP server is running at ${url}. Response: ${text.substring(0, 200)}`);
    }

    const data = await response.json();

    if (data.error) {
        throw new Error(`MCP error: ${data.error.message}`);
    }

    if (!('result' in data)) {
        throw new Error(`Invalid MCP response: missing result`);
    }

    const result: MCPCallResult = data.result;
    
    // Parse content text as JSON and add to structuredContent
    if (result.content?.[0]?.text) {
        try {
            result.structuredContent = JSON.parse(result.content[0].text);
        } catch {
            // Content is not JSON, leave structuredContent undefined
        }
    }

    return result;
}

/**
 * Format tool result for display
 */
export function formatToolResult(result: MCPCallResult): string {
    if (result.isError) {
        return result.content[0]?.text || 'Error occurred';
    }
    return result.content[0]?.text || '';
}

/**
 * Parse tool result as JSON
 */
export function parseToolResult(result: MCPCallResult): any {
    try {
        const text = formatToolResult(result);
        return JSON.parse(text);
    } catch (e) {
        return null;
    }
}
