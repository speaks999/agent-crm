// MCP Client for browser-side communication with MCP server

const MCP_SERVER_URL = process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:3001/mcp';

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
}

/**
 * List all available MCP tools
 */
export async function listTools(): Promise<MCPTool[]> {
    const response = await fetch(MCP_SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: requestId++,
            method: 'tools/list',
        }),
    });

    if (!response.ok) {
        throw new Error(`MCP request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
        throw new Error(`MCP error: ${data.error.message}`);
    }

    return data.result.tools || [];
}

/**
 * Call a specific MCP tool with arguments
 */
export async function callTool(name: string, args: any = {}): Promise<MCPCallResult> {
    const response = await fetch(MCP_SERVER_URL, {
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
        throw new Error(`MCP request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
        throw new Error(`MCP error: ${data.error.message}`);
    }

    return data.result;
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
