import { openai } from '@/lib/ai';
import { generateText } from 'ai';
import { callTool, listTools } from '@/lib/mcp-client';

export const maxDuration = 60;

/**
 * Safely extract and parse JSON from AI response text
 * Handles markdown code blocks and whitespace
 */
function extractJSON(text: string): any {
    try {
        // First, try to parse as-is
        return JSON.parse(text);
    } catch (e) {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[1].trim());
            } catch (e2) {
                // Fall through to default
            }
        }

        // Try to find JSON object in the text
        const objectMatch = text.match(/\{[\s\S]*\}/);
        if (objectMatch) {
            try {
                return JSON.parse(objectMatch[0]);
            } catch (e3) {
                // Fall through to default
            }
        }

        // Default fallback: treat as conversational response
        return {
            needsTool: false,
            response: text.trim()
        };
    }
}

export async function POST(req: Request) {
    const { messages } = await req.json();

    try {
        // Get available MCP tools
        const mcpTools = await listTools();

        //  First, use AI to determine intent and extract parameters
        const intentAnalysis = await generateText({
            model: openai('gpt-4o'),
            messages: [
                ...messages,
                {
                    role: 'system',
                    content: `Analyze the user's last message and determine if they want to use a CRM tool.

Available tools: ${mcpTools.map(t => t.name).join(', ')}

IMPORTANT: Respond with ONLY valid JSON, no markdown formatting or code blocks.

If they want to use a tool, respond with this exact JSON format:
{
  "needsTool": true,
  "toolName": "tool_name",
  "args": {/* extracted arguments */}
}

If it's just a question or conversation, respond with this exact JSON format:
{
  "needsTool": false,  
  "response": "your conversational response"
}

Examples:
- "list all accounts" -> {"needsTool": true, "toolName": "list_accounts", "args": {}}
- "create an account for Acme Corp" -> {"needsTool": true, "toolName": "create_account", "args":  {"name": "Acme Corp"}}
- "what can you do?" -> {"needsTool": false, "response": "I can help you manage..."}`,
                },
            ],
        });

        let responseText = '';
        const intent = extractJSON(intentAnalysis.text);

        if (intent.needsTool && intent.toolName) {
            // Execute the tool
            try {
                const toolResult = await callTool(intent.toolName, intent.args || {});
                const resultText = toolResult.content[0]?.text || '';

                // Have AI format the result nicely
                const formattedResponse = await generateText({
                    model: openai('gpt-4o'),
                    messages: [
                        ...messages,
                        {
                            role: 'system',
                            content: `The tool "${intent.toolName}" was executed with args: ${JSON.stringify(intent.args)}
              
Result: ${resultText}

IMPORTANT FORMATTING RULES - YOU MUST FOLLOW THESE:
1. NEVER show ID fields (id, account_id, contact_id, deal_id, pipeline_id, insightly_id) - these are internal UUIDs that mean nothing to users
2. NEVER show timestamp fields (created_at, updated_at) unless the user asks about dates
3. NEVER show empty arrays like "tags: []"
4. For contacts: Show name, email, phone, role - NOT ids
5. For accounts: Show name, industry, website - NOT ids  
6. For deals: Show name, amount, stage, status - NOT ids
7. Use a clean list format with bullet points, NOT tables with ID columns
8. Start with a summary count, then list the key details

Example good format for contacts:
"Found 3 contacts:
• John Smith - john@example.com, Sales Manager
• Jane Doe - jane@example.com, CEO
• Bob Wilson - bob@example.com, Developer"

Example BAD format (DO NOT DO THIS):
"| ID | Account ID | Name | Email |"`,
                        },
                    ],
                });

                responseText = formattedResponse.text;
            } catch (toolError: any) {
                responseText = `I tried to ${intent.toolName} but encountered an error: ${toolError.message}`;
            }
        } else {
            responseText = intent.response || "I'm here to help with your CRM. What would you like to do?";
        }

        // Return as plain text stream
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode(responseText));
                controller.close();
            },
        });

        return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });

    } catch (error: any) {
        console.error('Chat API error:', error);
        console.error('Error stack:', error.stack);
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode(`Sorry, I encountered an error: ${error.message}`));
                controller.close();
            },
        });
        return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
    }
}
