import { openai } from '@/lib/ai';
import { generateText } from 'ai';
import { listTools } from '@/lib/mcp-client';

export const maxDuration = 60;

/**
 * Call a tool via the internal /api/mcp/call-tool endpoint
 * This ensures proper authentication and team_id injection
 */
async function callToolViaAPI(toolName: string, args: any, accessToken: string, requestUrl: string): Promise<any> {
    // Use the same origin as the incoming request
    const url = new URL(requestUrl);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    console.log(`[Chat] Internal API call with token: ${accessToken ? 'present' : 'none'}`);
    
    const response = await fetch(`${baseUrl}/api/mcp/call-tool`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: toolName,
            arguments: args,
            _accessToken: accessToken,
        }),
    });
    
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Tool call failed: ${response.status} - ${text}`);
    }
    
    const data = await response.json();
    return data.result;
}

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
    const body = await req.json();
    const { messages, _accessToken } = body;
    
    // Use access token from body if available
    const authToken = _accessToken || '';
    console.log(`[Chat] Access token present: ${authToken ? 'yes' : 'no'}`);

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
- "create an account for Acme Corp" -> {"needsTool": true, "toolName": "create_account", "args": {"name": "Acme Corp"}}
- "what can you do?" -> {"needsTool": false, "response": "I can help you manage..."}

ACCOUNT/COMPANY CREATION - CRITICAL:
When the user wants to create an account or add a company:
1. If they provide a specific company name, use it: {"needsTool": true, "toolName": "create_account", "args": {"name": "Company Name"}}
2. If they say "I want to add a company" without a name, ask for details: {"needsTool": false, "response": "I'd be happy to help you add a company! What's the company name? You can also optionally provide the industry and website."}
3. If they only provide partial info, ask for the missing required field (company name)

Rules for create_account:
- name: REQUIRED - the company name
- industry: OPTIONAL - the industry sector  
- website: OPTIONAL - company website (must be valid URL format like https://example.com or can be empty)
- DO NOT create an account without a company name - always ask first if not provided

TASK/INTERACTION CREATION - CRITICAL:
ANY request to create, add, schedule, or log a task, call, meeting, email, note, or reminder MUST use "create_interaction".
DO NOT say you cannot complete the task - YOU CAN by using create_interaction.

Rules:
- type: "call" for phone calls, "meeting" for meetings, "email" for emails, "note" for notes/reminders/general tasks
- title: The task description
- due_date: Convert any mentioned date/time to ISO format in the user's local timezone.
  * Today's date (user's timezone): ${new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' })}
  * Use YYYY-MM-DDTHH:mm:ss format
  * "tomorrow" = add 1 day to today's date
  * "next Monday" = calculate the next occurrence of that day
  * If only date is mentioned (no time), use "T09:00:00"
  * If time is mentioned, use that time (convert 5pm to 17:00:00)

ALWAYS use create_interaction for these patterns:
- "add a task to..." -> create_interaction
- "call [person]" -> create_interaction with type: "call"
- "remind me to..." -> create_interaction with type: "note"
- "schedule..." -> create_interaction with type: "meeting"
- "follow up with..." -> create_interaction

Example: "Add a task to Meet with Mark on Feb 21st"
Response: {"needsTool": true, "toolName": "create_interaction", "args": {"type": "meeting", "title": "Meet with Mark", "due_date": "2026-02-21T09:00:00"}}

Example: "Call John tomorrow at 3pm"
Response: {"needsTool": true, "toolName": "create_interaction", "args": {"type": "call", "title": "Call John", "due_date": "2026-02-20T15:00:00"}}

UPDATE OPERATIONS - CRITICAL:
- update_contact, update_account, update_deal, update_interaction ALL REQUIRE the record's UUID "id" field.
- If the user wants to update a record but you don't have the ID, you MUST first search for it using list_contacts, list_accounts, search_contacts, etc.
- NEVER call update_* without a valid UUID string for the "id" field.
- If you cannot determine the ID, respond with needsTool: false and ask the user to specify which record to update or use the search first.

Example: "Update John Smith's role to CEO"
WRONG: {"needsTool": true, "toolName": "update_contact", "args": {"first_name": "John", "role": "CEO"}}
CORRECT APPROACH: First use search_contacts to find John Smith's ID, then use update_contact with the ID.`,
                },
            ],
        });

        let responseText = '';
        let structuredContent: any = null;
        let chartData: any = null;
        const intent = extractJSON(intentAnalysis.text);

        // Detect if this is an analytics query
        const userMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
        const isAnalyticsQuery = userMessage.includes('revenue') || 
            userMessage.includes('chart') || 
            userMessage.includes('graph') ||
            userMessage.includes('by stage') ||
            userMessage.includes('analytics') ||
            userMessage.includes('breakdown') ||
            userMessage.includes('distribution');

        if (intent.needsTool && intent.toolName) {
            // Execute the tool via internal API (handles auth and team_id injection)
            try {
                console.log(`[Chat] Calling tool ${intent.toolName} via internal API`);
                const toolResult = await callToolViaAPI(
                    intent.toolName, 
                    intent.args || {}, 
                    authToken,
                    req.url
                );
                const resultText = toolResult.content[0]?.text || '';
                structuredContent = toolResult.structuredContent;

                // Extract chart data if this is an analytics query with deal/account data
                if (isAnalyticsQuery && structuredContent) {
                    const deals = structuredContent.deals || [];
                    const accounts = structuredContent.accounts || [];
                    
                    // Group deals by stage for revenue chart
                    if (deals.length > 0 && (userMessage.includes('revenue') || userMessage.includes('stage'))) {
                        const stageData: { [key: string]: { count: number; revenue: number } } = {};
                        deals.forEach((deal: any) => {
                            const stage = deal.stage || 'Unknown';
                            if (!stageData[stage]) {
                                stageData[stage] = { count: 0, revenue: 0 };
                            }
                            stageData[stage].count++;
                            stageData[stage].revenue += (deal.amount || 0);
                        });
                        
                        chartData = {
                            type: 'bar',
                            title: 'Revenue by Stage',
                            data: Object.entries(stageData).map(([name, data]) => ({
                                name,
                                value: data.revenue,
                                count: data.count,
                            })),
                            xAxisKey: 'name',
                            yAxisKey: 'value',
                        };
                    }
                    
                    // Group accounts by industry
                    if (accounts.length > 0 && userMessage.includes('industry')) {
                        const industryData: { [key: string]: number } = {};
                        accounts.forEach((account: any) => {
                            const industry = account.industry || 'Unknown';
                            industryData[industry] = (industryData[industry] || 0) + 1;
                        });
                        
                        chartData = {
                            type: 'pie',
                            title: 'Accounts by Industry',
                            data: Object.entries(industryData).map(([name, value]) => ({
                                name,
                                value,
                            })),
                        };
                    }
                }

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
${chartData ? '\n9. A chart will be displayed alongside your response, so provide a brief summary rather than listing all items.' : ''}

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

        // Return JSON with text, structured content, chart data, and tool name
        const responseData = {
            text: responseText,
            structuredContent,
            chartData,
            toolName: intent.needsTool ? intent.toolName : null,
        };

        return new Response(JSON.stringify(responseData), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Chat API error:', error);
        console.error('Error stack:', error.stack);
        return new Response(JSON.stringify({
            text: `Sorry, I encountered an error: ${error.message}`,
            structuredContent: null,
        }), {
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
