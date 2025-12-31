'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, CheckCircle2, XCircle, AlertCircle, Loader2, Filter, RefreshCw, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { MCP_TESTS, TESTS_BY_CATEGORY, ALL_CATEGORIES, type MCPTest } from '@/lib/mcp-tests';
import { callTool, listTools } from '@/lib/mcp-client';

interface CreatedTestData {
    type: 'account' | 'contact' | 'deal' | 'pipeline' | 'interaction';
    id: string;
    name?: string;
    createdAt: Date;
}

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
    const [showFailedOnly, setShowFailedOnly] = useState(false);
    const [currentFailedIndex, setCurrentFailedIndex] = useState(0);
    const [mcpAvailable, setMcpAvailable] = useState<boolean | null>(null);
    const [createdTestData, setCreatedTestData] = useState<CreatedTestData[]>([]);
    const [isCleaningUp, setIsCleaningUp] = useState(false);
    const [cleanupStatus, setCleanupStatus] = useState<string | null>(null);
    const testDataRef = useRef<Record<string, any>>({}); // Store IDs for placeholders (ref for synchronous access)
    const testCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const defaultUrl = typeof window !== 'undefined'
        ? (localStorage.getItem('mcpUrl') || process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:3004/mcp')
        : (process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:3004/mcp');
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

    // Track created test data for cleanup
    function trackCreatedData(type: CreatedTestData['type'], id: string, name?: string) {
        setCreatedTestData(prev => {
            // Avoid duplicates
            if (prev.some(item => item.id === id)) return prev;
            return [...prev, { type, id, name, createdAt: new Date() }];
        });
    }

    // Clean up all test data
    async function cleanupTestData() {
        if (createdTestData.length === 0) {
            setCleanupStatus('No test data to clean up');
            setTimeout(() => setCleanupStatus(null), 3000);
            return;
        }

        setIsCleaningUp(true);
        setCleanupStatus('Cleaning up test data...');

        const deleteTools: Record<CreatedTestData['type'], string> = {
            interaction: 'delete_interaction',
            deal: 'delete_deal',
            contact: 'delete_contact',
            account: 'delete_account',
            pipeline: 'delete_pipeline',
        };

        // Delete in reverse order of dependencies: interactions -> deals -> contacts -> accounts -> pipelines
        const deleteOrder: CreatedTestData['type'][] = ['interaction', 'deal', 'contact', 'account', 'pipeline'];
        
        let deletedCount = 0;
        let errorCount = 0;

        for (const entityType of deleteOrder) {
            const itemsToDelete = createdTestData.filter(item => item.type === entityType);
            
            for (const item of itemsToDelete) {
                try {
                    await callTool(deleteTools[entityType], { id: item.id }, mcpUrl);
                    deletedCount++;
                } catch (error) {
                    console.warn(`Failed to delete ${entityType} ${item.id}:`, error);
                    errorCount++;
                }
            }
        }

        // Clear the tracked data
        setCreatedTestData([]);
        testDataRef.current = {};

        setIsCleaningUp(false);
        setCleanupStatus(
            errorCount > 0
                ? `Cleaned up ${deletedCount} items (${errorCount} errors)`
                : `Successfully cleaned up ${deletedCount} test items`
        );
        setTimeout(() => setCleanupStatus(null), 5000);
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
                                trackCreatedData('account', resolvedValue, 'Test Account');
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
                            trackCreatedData('contact', resolvedValue, 'Test Contact');
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
                            trackCreatedData('deal', resolvedValue, 'Test Deal');
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
                            trackCreatedData('pipeline', resolvedValue, 'Test Pipeline');
                        }
                    } catch (error) {
                        console.warn(`Could not create test pipeline for ${placeholder}, skipping optional field`);
                        continue; // Skip this field
                    }
                }

                // If interaction_id is needed but not available, create a test interaction
                if (!resolvedValue && placeholder === 'interaction_id') {
                    try {
                        const interactionResult = await callTool('create_interaction', { 
                            type: 'call',
                            title: 'Test Interaction',
                            summary: 'Auto-created test interaction'
                        }, mcpUrl);
                        if (interactionResult?.structuredContent?.interactions?.[0]?.id) {
                            resolvedValue = interactionResult.structuredContent.interactions[0].id;
                            testDataRef.current.interaction_id = resolvedValue;
                            trackCreatedData('interaction', resolvedValue, 'Test Interaction');
                        }
                    } catch (error) {
                        console.warn(`Could not create test interaction for ${placeholder}, skipping optional field`);
                        continue; // Skip this field
                    }
                }

                // If team_member_id is needed but not available, fetch first team member
                if (!resolvedValue && placeholder === 'team_member_id') {
                    try {
                        const teamResponse = await fetch('/api/team');
                        const teamData = await teamResponse.json();
                        const teamMembers = Array.isArray(teamData) ? teamData : [];
                        if (teamMembers.length > 0) {
                            resolvedValue = teamMembers[0].id;
                            testDataRef.current.team_member_id = resolvedValue;
                        } else {
                            console.warn('No team members found, skipping team_member_id field');
                            continue;
                        }
                    } catch (error) {
                        console.warn(`Could not fetch team members for ${placeholder}, skipping optional field`);
                        continue; // Skip this field
                    }
                }
                
                if (!resolvedValue) {
                    // For optional fields, skip them rather than throwing
                    if (placeholder === 'account_id' || placeholder === 'contact_id' || placeholder === 'deal_id' || placeholder === 'pipeline_id' || placeholder === 'team_member_id' || placeholder === 'interaction_id') {
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
                const account = result.structuredContent.accounts[0];
                if (account.id) {
                    testDataRef.current.account_id = account.id;
                    // Track if this was a create operation
                    if (test.tool === 'create_account') {
                        trackCreatedData('account', account.id, account.name);
                    }
                }
            }

            // Extract contact_id from contact operations for subsequent tests
            if (result.structuredContent?.contacts && result.structuredContent.contacts.length > 0) {
                const contact = result.structuredContent.contacts[0];
                if (contact.id) {
                    testDataRef.current.contact_id = contact.id;
                    // Track if this was a create operation
                    if (test.tool === 'create_contact') {
                        trackCreatedData('contact', contact.id, `${contact.first_name} ${contact.last_name}`);
                    }
                }
            }

            // Extract deal_id from deal operations for subsequent tests
            if (result.structuredContent?.deals && result.structuredContent.deals.length > 0) {
                const deal = result.structuredContent.deals[0];
                if (deal.id) {
                    testDataRef.current.deal_id = deal.id;
                    // Track if this was a create operation
                    if (test.tool === 'create_deal') {
                        trackCreatedData('deal', deal.id, deal.name);
                    }
                }
            }

            // Extract pipeline_id from pipeline operations for subsequent tests
            if (result.structuredContent?.pipelines && result.structuredContent.pipelines.length > 0) {
                const pipeline = result.structuredContent.pipelines[0];
                if (pipeline.id) {
                    testDataRef.current.pipeline_id = pipeline.id;
                    // Track if this was a create operation
                    if (test.tool === 'create_pipeline') {
                        trackCreatedData('pipeline', pipeline.id, pipeline.name);
                    }
                }
            }

            // Extract interaction_id from interaction operations for subsequent tests
            if (result.structuredContent?.interactions && result.structuredContent.interactions.length > 0) {
                const interaction = result.structuredContent.interactions[0];
                if (interaction.id) {
                    testDataRef.current.interaction_id = interaction.id;
                    // Track if this was a create operation
                    if (test.tool === 'create_interaction') {
                        trackCreatedData('interaction', interaction.id, interaction.summary || interaction.title);
                    }
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

        if (showFailedOnly) {
            filtered = filtered.filter(t => results[t.id]?.status === 'failed');
        }
        
        return filtered;
    }

    // Get list of failed test IDs
    const getFailedTests = useCallback((): string[] => {
        return Object.entries(results)
            .filter(([, r]) => r.status === 'failed')
            .map(([id]) => id);
    }, [results]);

    // Jump to a specific failed test
    const jumpToFailedTest = useCallback((index: number) => {
        const failedTests = getFailedTests();
        if (failedTests.length === 0) return;
        
        const targetIndex = Math.max(0, Math.min(index, failedTests.length - 1));
        const testId = failedTests[targetIndex];
        const element = testCardRefs.current[testId];
        
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add a brief highlight effect
            element.classList.add('ring-2', 'ring-destructive');
            setTimeout(() => {
                element.classList.remove('ring-2', 'ring-destructive');
            }, 2000);
        }
        
        setCurrentFailedIndex(targetIndex);
    }, [getFailedTests]);

    // Jump to next failed test
    const jumpToNextFailed = useCallback(() => {
        const failedTests = getFailedTests();
        if (failedTests.length === 0) return;
        
        const nextIndex = (currentFailedIndex + 1) % failedTests.length;
        jumpToFailedTest(nextIndex);
    }, [currentFailedIndex, getFailedTests, jumpToFailedTest]);

    // Jump to previous failed test
    const jumpToPrevFailed = useCallback(() => {
        const failedTests = getFailedTests();
        if (failedTests.length === 0) return;
        
        const prevIndex = currentFailedIndex === 0 ? failedTests.length - 1 : currentFailedIndex - 1;
        jumpToFailedTest(prevIndex);
    }, [currentFailedIndex, getFailedTests, jumpToFailedTest]);

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
        <div className="flex-1 overflow-auto p-8 bg-background">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-foreground mb-2">MCP Server Test Suite</h1>
                    <p className="text-muted-foreground">
                        Comprehensive testing for all 30 MCP tools with typical salesperson queries
                    </p>
                </div>

                {/* MCP Endpoint & Status */}
                <div className="mb-6 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="text-sm text-foreground font-medium">MCP Server URL</label>
                        <input
                            type="text"
                            value={mcpUrl}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            className="w-72 max-w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground"
                            placeholder="http://localhost:3004/mcp"
                        />
                        <button
                            onClick={checkMCPAvailability}
                            className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted"
                        >
                            <RefreshCw size={14} />
                            Check
                        </button>
                        {mcpAvailable === true && (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/20 text-success text-sm">
                                <CheckCircle2 size={14} />
                                Available
                            </span>
                        )}
                        {mcpAvailable === false && (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/20 text-destructive text-sm">
                                <AlertCircle size={14} />
                                Unavailable
                            </span>
                        )}
                    </div>

                    {mcpAvailable === false && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <div className="flex items-center gap-2 text-destructive">
                                <AlertCircle size={20} />
                                <span className="font-medium">MCP Server Not Available</span>
                            </div>
                            <p className="text-sm text-destructive mt-1">
                                Cannot connect to MCP server at {mcpUrl}
                            </p>
                        </div>
                    )}
                </div>

                {/* Cleanup Status */}
                {(cleanupStatus || createdTestData.length > 0) && (
                    <div className={`mb-6 p-4 rounded-lg border ${
                        cleanupStatus?.includes('error') 
                            ? 'bg-destructive/10 border-destructive/30' 
                            : cleanupStatus?.includes('Successfully')
                            ? 'bg-success/10 border-success/30'
                            : 'bg-muted border-border'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Trash2 size={20} className={
                                    cleanupStatus?.includes('error') 
                                        ? 'text-destructive' 
                                        : cleanupStatus?.includes('Successfully')
                                        ? 'text-success'
                                        : 'text-muted-foreground'
                                } />
                                <div>
                                    {cleanupStatus ? (
                                        <p className="font-medium">{cleanupStatus}</p>
                                    ) : (
                                        <>
                                            <p className="font-medium text-foreground">
                                                {createdTestData.length} test item{createdTestData.length !== 1 ? 's' : ''} tracked
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Click "Clean Up Test Data" to remove these items after testing
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                            {createdTestData.length > 0 && !cleanupStatus && (
                                <div className="text-xs text-muted-foreground">
                                    {createdTestData.filter(d => d.type === 'account').length} accounts,{' '}
                                    {createdTestData.filter(d => d.type === 'contact').length} contacts,{' '}
                                    {createdTestData.filter(d => d.type === 'deal').length} deals,{' '}
                                    {createdTestData.filter(d => d.type === 'pipeline').length} pipelines,{' '}
                                    {createdTestData.filter(d => d.type === 'interaction').length} interactions
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Stats Bar */}
                <div className="grid grid-cols-5 gap-4 mb-6">
                    <div className="bg-card p-4 rounded-lg border border-border">
                        <div className="text-sm text-muted-foreground">Total Tests</div>
                        <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                    </div>
                    <div className="bg-card p-4 rounded-lg border border-border">
                        <div className="text-sm text-muted-foreground">Passed</div>
                        <div className="text-2xl font-bold text-success">{stats.passed}</div>
                    </div>
                    <div 
                        className={`bg-card p-4 rounded-lg border transition-colors cursor-pointer ${
                            stats.failed > 0 
                                ? 'border-destructive hover:bg-destructive/10' 
                                : 'border-border'
                        }`}
                        onClick={() => stats.failed > 0 && jumpToFailedTest(0)}
                        title={stats.failed > 0 ? 'Click to jump to first failed test' : ''}
                    >
                        <div className="text-sm text-muted-foreground">Failed</div>
                        <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
                    </div>
                    <div className="bg-card p-4 rounded-lg border border-border">
                        <div className="text-sm text-muted-foreground">Running</div>
                        <div className="text-2xl font-bold text-info">{stats.running}</div>
                    </div>
                    <div className="bg-card p-4 rounded-lg border border-border">
                        <div className="text-sm text-muted-foreground">Pending</div>
                        <div className="text-2xl font-bold text-muted-foreground">{stats.pending}</div>
                    </div>
                </div>

                {/* Failed Tests Quick Navigation */}
                {stats.failed > 0 && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                                <XCircle className="text-destructive" size={24} />
                                <div>
                                    <div className="font-semibold text-destructive">
                                        {stats.failed} Failed Test{stats.failed !== 1 ? 's' : ''}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Viewing {currentFailedIndex + 1} of {getFailedTests().length}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={jumpToPrevFailed}
                                    className="flex items-center gap-1 px-3 py-2 bg-card border border-destructive/50 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
                                    title="Previous failed test"
                                >
                                    <ChevronUp size={18} />
                                    Prev
                                </button>
                                <button
                                    onClick={jumpToNextFailed}
                                    className="flex items-center gap-1 px-3 py-2 bg-card border border-destructive/50 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
                                    title="Next failed test"
                                >
                                    Next
                                    <ChevronDown size={18} />
                                </button>
                                <button
                                    onClick={() => setShowFailedOnly(!showFailedOnly)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                                        showFailedOnly 
                                            ? 'bg-destructive text-destructive-foreground' 
                                            : 'bg-card border border-destructive/50 text-destructive hover:bg-destructive/20'
                                    }`}
                                >
                                    <Filter size={16} />
                                    {showFailedOnly ? 'Show All' : 'Show Failed Only'}
                                </button>
                            </div>
                        </div>
                        {/* Failed test list for quick access */}
                        <div className="mt-4 flex flex-wrap gap-2">
                            {getFailedTests().map((testId, index) => {
                                const testResult = results[testId];
                                return (
                                    <button
                                        key={testId}
                                        onClick={() => jumpToFailedTest(index)}
                                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                            index === currentFailedIndex
                                                ? 'bg-destructive text-destructive-foreground'
                                                : 'bg-card border border-destructive/30 text-destructive hover:bg-destructive/20'
                                        }`}
                                        title={testResult?.test.description}
                                    >
                                        {testResult?.test.name || testId}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div className="bg-card p-4 rounded-lg border border-border mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            onClick={() => runTests(filteredTests)}
                            disabled={isRunning || mcpAvailable === false || filteredTests.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-card border-2 border-foreground text-foreground rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            <Play size={18} />
                            Run Filtered Tests ({filteredTests.length})
                        </button>
                        
                        <button
                            onClick={runAllTests}
                            disabled={isRunning || mcpAvailable === false}
                            className="flex items-center gap-2 px-4 py-2 bg-card border-2 border-foreground text-foreground rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            <Play size={18} />
                            Run All Tests ({MCP_TESTS.length})
                        </button>

                        <button
                            onClick={cleanupTestData}
                            disabled={isRunning || isCleaningUp || mcpAvailable === false || createdTestData.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-destructive/10 border-2 border-destructive text-destructive rounded-lg hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            title={createdTestData.length > 0 ? `Remove ${createdTestData.length} test items` : 'No test data to clean up'}
                        >
                            {isCleaningUp ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Trash2 size={18} />
                            )}
                            Clean Up Test Data ({createdTestData.length})
                        </button>

                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-muted-foreground" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="all">All Categories</option>
                                {ALL_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            <select
                                value={selectedTool}
                                onChange={(e) => setSelectedTool(e.target.value)}
                                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="all">All Tools</option>
                                {allTools.map(tool => (
                                    <option key={tool} value={tool}>{tool}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={checkMCPAvailability}
                            className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
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
                                className="px-3 py-1 text-sm bg-muted text-foreground rounded-lg hover:bg-muted/80 disabled:opacity-50 transition-colors"
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
                                ref={(el) => { testCardRefs.current[test.id] = el; }}
                                className={`bg-card border rounded-lg overflow-hidden transition-all duration-300 ${
                                    status === 'failed' 
                                        ? 'border-destructive/50' 
                                        : 'border-border'
                                }`}
                            >
                                <div className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                {status === 'passed' && (
                                                    <CheckCircle2 size={20} className="text-success" />
                                                )}
                                                {status === 'failed' && (
                                                    <XCircle size={20} className="text-destructive" />
                                                )}
                                                {status === 'running' && (
                                                    <Loader2 size={20} className="text-info animate-spin" />
                                                )}
                                                {status === 'pending' && (
                                                    <div className="w-5 h-5 border-2 border-border rounded-full" />
                                                )}

                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-foreground">
                                                            {test.name}
                                                        </span>
                                                        <span className="text-xs px-2 py-1 bg-primary-muted text-primary rounded">
                                                            {test.category}
                                                        </span>
                                                        <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded">
                                                            {test.tool}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {test.description}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-2 p-3 bg-muted rounded-lg">
                                                <div className="text-xs font-medium text-muted-foreground mb-1">Query:</div>
                                                <div className="text-sm text-foreground italic">"{test.query}"</div>
                                            </div>

                                            {result && (
                                                <div className="mt-3 space-y-2">
                                                    {result.error && (
                                                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                                                            <div className="text-sm font-medium text-destructive mb-1">
                                                                Error:
                                                            </div>
                                                            <div className="text-sm text-destructive">{result.error}</div>
                                                        </div>
                                                    )}

                                                    {result.result && (
                                                        <div className="p-3 bg-muted rounded-lg">
                                                            <div className="text-xs font-medium text-muted-foreground mb-1">
                                                                Result:
                                                            </div>
                                                            <pre className="text-xs text-foreground overflow-x-auto">
                                                                {JSON.stringify(result.result, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )}

                                                    {result.duration && (
                                                        <div className="text-xs text-muted-foreground">
                                                            Duration: {result.duration}ms
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => runSingleTestById(test.id)}
                                            disabled={isRunning || mcpAvailable === false}
                                            className="ml-4 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary-glow disabled:opacity-50 transition-colors"
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
                    <div className="text-center py-12 bg-card rounded-lg border border-border">
                        <p className="text-muted-foreground">No tests match the current filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
}



