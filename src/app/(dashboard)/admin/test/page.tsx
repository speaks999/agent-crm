'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, CheckCircle2, XCircle, AlertCircle, Loader2, Filter, RefreshCw } from 'lucide-react';
import { MCP_TESTS, TESTS_BY_CATEGORY, ALL_CATEGORIES, type MCPTest } from '@/lib/mcp-tests';
import { callTool, listTools } from '@/lib/mcp-client';

interface TestResult {
    test: MCPTest;
    status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
    result?: any;
    error?: string;
    duration?: number;
    timestamp?: Date;
}

export default function MCPTestPage() {
    const [results, setResults] = useState<Record<string, TestResult>>({});
    const [isRunning, setIsRunning] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedTool, setSelectedTool] = useState<string>('all');
    const [mcpAvailable, setMcpAvailable] = useState<boolean | null>(null);
    const testDataRef = useRef<Record<string, any>>({}); // Store IDs for placeholders (ref for synchronous access)
    const defaultUrl = typeof window !== 'undefined'
        ? (localStorage.getItem('mcpUrl') || process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:3001/mcp')
        : (process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:3001/mcp');
    const [mcpUrl, setMcpUrl] = useState<string>(defaultUrl);

    useEffect(() => {
        // Load saved URL if available
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('mcpUrl');
            if (stored) {
                setMcpUrl(stored);
            }
        }
        checkMCPAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function checkMCPAvailability() {
        try {
            await listTools(mcpUrl);
            setMcpAvailable(true);
        } catch (error) {
            setMcpAvailable(false);
            console.error('MCP server not available:', error);
        }
    }

    // Replace placeholders in args with actual IDs from testDataRef
    async function resolveArgs(args: Record<string, any>): Promise<Record<string, any>> {
        const resolved: Record<string, any> = {};
        const timestamp = Date.now(); // Generate timestamp once per test run
        for (const [key, value] of Object.entries(args)) {
            if (typeof value === 'string') {
                // Handle {timestamp} placeholder
                if (value.includes('{timestamp}')) {
                    resolved[key] = value.replace(/{timestamp}/g, timestamp.toString());
                    continue;
                }
                // Handle other placeholders like {account_id}
                if (value.startsWith('{') && value.endsWith('}')) {
                    const placeholder = value.slice(1, -1); // Remove { }
                    let resolvedValue = testDataRef.current[placeholder];
                
                // Debug logging
                if (placeholder === 'account_id') {
                    console.log('Resolving account_id, current testDataRef:', testDataRef.current);
                }
                
                // If account_id is needed but not available, check if setup stored it
                if (!resolvedValue && placeholder === 'account_id') {
                    // Check if account_id was set by setup function
                    if (testDataRef.current.account_id) {
                        resolvedValue = testDataRef.current.account_id;
                        console.log('Using account_id from setup/testDataRef:', resolvedValue);
                    } else {
                        try {
                            const accountResult = await callTool('create_account', { name: 'Test Account' }, mcpUrl);
                            if (accountResult?.structuredContent?.accounts?.[0]?.id) {
                                resolvedValue = accountResult.structuredContent.accounts[0].id;
                                testDataRef.current.account_id = resolvedValue;
                            }
                        } catch (error) {
                            // If we can't create an account, skip the optional field
                            console.warn(`Could not create test account for ${placeholder}, skipping optional field`);
                            continue; // Skip this field
                        }
                    }
                }

                // If contact_id is needed but not available, create a test contact
                if (!resolvedValue && placeholder === 'contact_id') {
                    try {
                        // First ensure we have an account
                        if (!testDataRef.current.account_id) {
                            const accountResult = await callTool('create_account', { name: 'Test Account' }, mcpUrl);
                            if (accountResult?.structuredContent?.accounts?.[0]?.id) {
                                testDataRef.current.account_id = accountResult.structuredContent.accounts[0].id;
                            }
                        }
                        const contactResult = await callTool('create_contact', { 
                            first_name: 'Test', 
                            last_name: 'Contact',
                            account_id: testDataRef.current.account_id 
                        }, mcpUrl);
                        if (contactResult?.structuredContent?.contacts?.[0]?.id) {
                            resolvedValue = contactResult.structuredContent.contacts[0].id;
                            testDataRef.current.contact_id = resolvedValue;
                        }
                    } catch (error) {
                        console.warn(`Could not create test contact for ${placeholder}, skipping optional field`);
                        continue; // Skip this field
                    }
                }

                // If deal_id is needed but not available, create a test deal
                if (!resolvedValue && placeholder === 'deal_id') {
                    try {
                        // First ensure we have an account
                        if (!testDataRef.current.account_id) {
                            const accountResult = await callTool('create_account', { name: 'Test Account' }, mcpUrl);
                            if (accountResult?.structuredContent?.accounts?.[0]?.id) {
                                testDataRef.current.account_id = accountResult.structuredContent.accounts[0].id;
                            }
                        }
                        const dealResult = await callTool('create_deal', { 
                            name: 'Test Deal',
                            stage: 'Discovery',
                            account_id: testDataRef.current.account_id 
                        }, mcpUrl);
                        if (dealResult?.structuredContent?.deals?.[0]?.id) {
                            resolvedValue = dealResult.structuredContent.deals[0].id;
                            testDataRef.current.deal_id = resolvedValue;
                        }
                    } catch (error) {
                        console.warn(`Could not create test deal for ${placeholder}, skipping optional field`);
                        continue; // Skip this field
                    }
                }

                // If pipeline_id is needed but not available, create a test pipeline
                if (!resolvedValue && placeholder === 'pipeline_id') {
                    try {
                        const pipelineResult = await callTool('create_pipeline', { 
                            name: 'Test Pipeline',
                            stages: ['Lead', 'Discovery', 'Proposal', 'Closed']
                        }, mcpUrl);
                        if (pipelineResult?.structuredContent?.pipelines?.[0]?.id) {
                            resolvedValue = pipelineResult.structuredContent.pipelines[0].id;
                            testDataRef.current.pipeline_id = resolvedValue;
                        }
                    } catch (error) {
                        console.warn(`Could not create test pipeline for ${placeholder}, skipping optional field`);
                        continue; // Skip this field
                    }
                }
                
                if (!resolvedValue) {
                    // For optional fields, skip them rather than throwing
                    if (placeholder === 'account_id' || placeholder === 'contact_id' || placeholder === 'deal_id' || placeholder === 'pipeline_id') {
                        continue; // Skip optional fields
                    }
                    throw new Error(`Placeholder ${value} not resolved. Required ID not available from previous tests.`);
                }
                resolved[key] = resolvedValue;
            } else {
                // String value that doesn't match placeholder pattern - use as-is
                resolved[key] = value;
            }
        } else {
            // Non-string value - use as-is
            resolved[key] = value;
        }
        }
        return resolved;
    }

    async function runSingleTest(test: MCPTest): Promise<TestResult> {
        const startTime = Date.now();
        
        try {
            // Run setup function if provided (e.g., for deduplication tests)
            if (test.setup) {
                try {
                    const setupResult = await test.setup(mcpUrl);
                    if (setupResult) {
                        // Check if setup returns a special format like "account_id:<id>"
                        if (typeof setupResult === 'string' && setupResult.startsWith('account_id:')) {
                            const accountId = setupResult.replace('account_id:', '');
                            testDataRef.current.account_id = accountId;
                            // Log for debugging
                            console.log('Setup stored account_id:', accountId);
                        } else {
                            // Store setup ID for potential cleanup
                            const key = test.tool.replace('create_', '').replace(/_/g, '') + '_id';
                            testDataRef.current[key] = setupResult;
                        }
                    }
                    // Add a delay to ensure database commit and visibility
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (setupError: any) {
                    console.warn('Setup function failed:', setupError);
                    // Continue with test anyway
                }
            }

            // Handle analyst API tests (charts) differently from MCP tools
            if (test.tool === 'analyst_api') {
                const resolvedArgs = await resolveArgs(test.args);
                // Resolve timestamp in query string as well
                const timestamp = Date.now();
                const resolvedQuery = test.query.replace(/{timestamp}/g, timestamp.toString());
                const response = await fetch('/api/agent/analyst', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: resolvedArgs.query || resolvedQuery }),
                });

                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(`Analyst API failed: ${response.status} ${response.statusText}. ${text.substring(0, 200)}`);
                }

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const text = await response.text();
                    throw new Error(`Server returned non-JSON response: ${text.substring(0, 200)}`);
                }

                const result = await response.json();

                if (result.error) {
                    throw new Error(result.error);
                }

                const duration = Date.now() - startTime;

                // Format result to match MCP tool result structure
                const formattedResult = {
                    content: [
                        {
                            type: 'text',
                            text: `Chart generated: ${result.config?.title || 'Analytics Result'}`,
                        },
                    ],
                    structuredContent: result.data ? { chartData: result.data, config: result.config } : undefined,
                    config: result.config,
                    data: result.data,
                };

                // Check expected results
                let passed = true;
                if (test.expectedResult) {
                    const expected = test.expectedResult;
                    
                    if (expected.hasContent && !formattedResult.content?.[0]?.text) {
                        passed = false;
                    }
                    
                    if (expected.hasStructuredContent && !formattedResult.structuredContent) {
                        passed = false;
                    }
                    
                    if (expected.containsText) {
                        const text = formattedResult.content?.[0]?.text || '';
                        if (!expected.containsText.some(s => text.toLowerCase().includes(s.toLowerCase()))) {
                            passed = false;
                        }
                    }
                }

                return {
                    test,
                    status: passed ? 'passed' : 'failed',
                    result: formattedResult,
                    duration,
                    timestamp: new Date(),
                };
            }

            // Regular MCP tool tests
            const resolvedArgs = await resolveArgs(test.args);
            const result = await callTool(test.tool, resolvedArgs, mcpUrl);
            if (!result) {
                throw new Error('MCP call returned no result');
            }
            const duration = Date.now() - startTime;

            // Extract ID for cleanup if needed
            if (test.cleanup && result.structuredContent) {
                const id = test.cleanup.getIdFromResult(result);
                if (id) {
                    const key = test.cleanup.tool.replace(/(create_|get_|list_|update_|delete_)/, '').replace(/_/g, '') + '_id';
                    testDataRef.current[key] = id;
                }
            }

            // Extract account_id from account operations for subsequent tests
            if (result.structuredContent?.accounts && result.structuredContent.accounts.length > 0) {
                const accountId = result.structuredContent.accounts[0].id;
                if (accountId) {
                    testDataRef.current.account_id = accountId;
                }
            }

            // Extract contact_id from contact operations for subsequent tests
            if (result.structuredContent?.contacts && result.structuredContent.contacts.length > 0) {
                const contactId = result.structuredContent.contacts[0].id;
                if (contactId) {
                    testDataRef.current.contact_id = contactId;
                }
            }

            // Extract deal_id from deal operations for subsequent tests
            if (result.structuredContent?.deals && result.structuredContent.deals.length > 0) {
                const dealId = result.structuredContent.deals[0].id;
                if (dealId) {
                    testDataRef.current.deal_id = dealId;
                }
            }

            // Extract pipeline_id from pipeline operations for subsequent tests
            if (result.structuredContent?.pipelines && result.structuredContent.pipelines.length > 0) {
                const pipelineId = result.structuredContent.pipelines[0].id;
                if (pipelineId) {
                    testDataRef.current.pipeline_id = pipelineId;
                }
            }

            // Extract interaction_id from interaction operations for subsequent tests
            if (result.structuredContent?.interactions && result.structuredContent.interactions.length > 0) {
                const interactionId = result.structuredContent.interactions[0].id;
                if (interactionId) {
                    testDataRef.current.interaction_id = interactionId;
                }
            }

            // Check expected results
            let passed = true;
            if (test.expectedResult) {
                const expected = test.expectedResult;
                
                if (expected.hasContent && !result.content?.[0]?.text) {
                    passed = false;
                }
                
                if (expected.hasStructuredContent && !result.structuredContent) {
                    passed = false;
                }
                
                if (expected.containsText) {
                    const text = result.content?.[0]?.text || '';
                    if (!expected.containsText.some(s => text.includes(s))) {
                        passed = false;
                    }
                }
                
                if (expected.errorExpected && !result.isError) {
                    passed = false;
                }
            }

            return {
                test,
                status: passed ? 'passed' : 'failed',
                result,
                duration,
                timestamp: new Date(),
            };
        } catch (error: any) {
            const duration = Date.now() - startTime;
            return {
                test,
                status: 'failed',
                error: error.message || String(error),
                duration,
                timestamp: new Date(),
            };
        }
    }

    async function runTests(tests: MCPTest[]) {
        setIsRunning(true);
        // Reset test data at the start of a test run
        testDataRef.current = {};
        const newResults: Record<string, TestResult> = { ...results };

        // Initialize all tests as pending
        tests.forEach(test => {
            newResults[test.id] = {
                test,
                status: 'pending',
            };
        });
        setResults(newResults);

        // Run tests sequentially
        for (const test of tests) {
            newResults[test.id] = {
                test,
                status: 'running',
            };
            setResults({ ...newResults });

            const result = await runSingleTest(test);
            newResults[test.id] = result;
            setResults({ ...newResults });

            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        setIsRunning(false);
    }

    function runAllTests() {
        runTests(MCP_TESTS);
    }

    function runCategory(category: string) {
        const categoryTests = TESTS_BY_CATEGORY[category] || [];
        runTests(categoryTests);
    }

    function runSingleTestById(testId: string) {
        const test = MCP_TESTS.find(t => t.id === testId);
        if (test) {
            runTests([test]);
        }
    }

    function handleUrlChange(value: string) {
        setMcpUrl(value);
        if (typeof window !== 'undefined') {
            localStorage.setItem('mcpUrl', value);
        }
    }

    function getFilteredTests(): MCPTest[] {
        let filtered = MCP_TESTS;
        
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(t => t.category === selectedCategory);
        }
        
        if (selectedTool !== 'all') {
            filtered = filtered.filter(t => t.tool === selectedTool);
        }
        
        return filtered;
    }

    function getStats() {
        const filtered = getFilteredTests();
        const filteredResults = Object.values(results).filter(r => filtered.some(t => t.id === r.test.id));
        
        return {
            total: filtered.length,
            passed: filteredResults.filter(r => r.status === 'passed').length,
            failed: filteredResults.filter(r => r.status === 'failed').length,
            running: filteredResults.filter(r => r.status === 'running').length,
            pending: filteredResults.filter(r => r.status === 'pending').length,
        };
    }

    const stats = getStats();
    const filteredTests = getFilteredTests();
    const allTools = Array.from(new Set(MCP_TESTS.map(t => t.tool)));

    return (
        <div className="flex-1 overflow-auto p-8 bg-slate-50">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">MCP Server Test Suite</h1>
                    <p className="text-slate-600">
                        Comprehensive testing for all 30 MCP tools with typical salesperson queries
                    </p>
                </div>

                {/* MCP Endpoint & Status */}
                <div className="mb-6 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="text-sm text-slate-600 font-medium">MCP Server URL</label>
                        <input
                            type="text"
                            value={mcpUrl}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            className="w-72 max-w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            placeholder="http://localhost:3001/mcp"
                        />
                        <button
                            onClick={checkMCPAvailability}
                            className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                        >
                            <RefreshCw size={14} />
                            Check
                        </button>
                        {mcpAvailable === true && (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm">
                                <CheckCircle2 size={14} />
                                Available
                            </span>
                        )}
                        {mcpAvailable === false && (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm">
                                <AlertCircle size={14} />
                                Unavailable
                            </span>
                        )}
                    </div>

                    {mcpAvailable === false && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 text-red-800">
                                <AlertCircle size={20} />
                                <span className="font-medium">MCP Server Not Available</span>
                            </div>
                            <p className="text-sm text-red-600 mt-1">
                                Cannot connect to MCP server at {mcpUrl}
                            </p>
                        </div>
                    )}
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-5 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <div className="text-sm text-slate-600">Total Tests</div>
                        <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <div className="text-sm text-slate-600">Passed</div>
                        <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <div className="text-sm text-slate-600">Failed</div>
                        <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <div className="text-sm text-slate-600">Running</div>
                        <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <div className="text-sm text-slate-600">Pending</div>
                        <div className="text-2xl font-bold text-slate-400">{stats.pending}</div>
                    </div>
                </div>

                {/* Controls */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            onClick={() => runTests(filteredTests)}
                            disabled={isRunning || mcpAvailable === false || filteredTests.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black text-black rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            <Play size={18} />
                            Run Filtered Tests ({filteredTests.length})
                        </button>
                        
                        <button
                            onClick={runAllTests}
                            disabled={isRunning || mcpAvailable === false}
                            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black text-black rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            <Play size={18} />
                            Run All Tests ({MCP_TESTS.length})
                        </button>

                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-slate-600" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">All Categories</option>
                                {ALL_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            <select
                                value={selectedTool}
                                onChange={(e) => setSelectedTool(e.target.value)}
                                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">All Tools</option>
                                {allTools.map(tool => (
                                    <option key={tool} value={tool}>{tool}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={checkMCPAvailability}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            <RefreshCw size={18} />
                            Check MCP Status
                        </button>
                    </div>

                    {/* Category Quick Run */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        {ALL_CATEGORIES.map(category => (
                            <button
                                key={category}
                                onClick={() => runCategory(category)}
                                disabled={isRunning}
                                className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
                            >
                                Run {category} ({TESTS_BY_CATEGORY[category]?.length || 0})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Test Results */}
                <div className="space-y-4">
                    {filteredTests.map(test => {
                        const result = results[test.id];
                        const status = result?.status || 'pending';

                        return (
                            <div
                                key={test.id}
                                className="bg-white border border-slate-200 rounded-lg overflow-hidden"
                            >
                                <div className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                {status === 'passed' && (
                                                    <CheckCircle2 size={20} className="text-green-600" />
                                                )}
                                                {status === 'failed' && (
                                                    <XCircle size={20} className="text-red-600" />
                                                )}
                                                {status === 'running' && (
                                                    <Loader2 size={20} className="text-blue-600 animate-spin" />
                                                )}
                                                {status === 'pending' && (
                                                    <div className="w-5 h-5 border-2 border-slate-300 rounded-full" />
                                                )}

                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-slate-800">
                                                            {test.name}
                                                        </span>
                                                        <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                                                            {test.category}
                                                        </span>
                                                        <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                                                            {test.tool}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mt-1">
                                                        {test.description}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                                                <div className="text-xs font-medium text-slate-500 mb-1">Query:</div>
                                                <div className="text-sm text-slate-700 italic">"{test.query}"</div>
                                            </div>

                                            {result && (
                                                <div className="mt-3 space-y-2">
                                                    {result.error && (
                                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                                            <div className="text-sm font-medium text-red-800 mb-1">
                                                                Error:
                                                            </div>
                                                            <div className="text-sm text-red-600">{result.error}</div>
                                                        </div>
                                                    )}

                                                    {result.result && (
                                                        <div className="p-3 bg-slate-50 rounded-lg">
                                                            <div className="text-xs font-medium text-slate-500 mb-1">
                                                                Result:
                                                            </div>
                                                            <pre className="text-xs text-slate-700 overflow-x-auto">
                                                                {JSON.stringify(result.result, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )}

                                                    {result.duration && (
                                                        <div className="text-xs text-slate-500">
                                                            Duration: {result.duration}ms
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => runSingleTestById(test.id)}
                                            disabled={isRunning || mcpAvailable === false}
                                            className="ml-4 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                        >
                                            Run
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredTests.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                        <p className="text-slate-500">No tests match the current filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
}



