'use client';

import { useState, useEffect } from 'react';
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
    const [testData, setTestData] = useState<Record<string, any>>({}); // Store IDs for placeholders

    useEffect(() => {
        checkMCPAvailability();
    }, []);

    async function checkMCPAvailability() {
        try {
            await listTools();
            setMcpAvailable(true);
        } catch (error) {
            setMcpAvailable(false);
            console.error('MCP server not available:', error);
        }
    }

    // Replace placeholders in args with actual IDs from testData
    function resolveArgs(args: Record<string, any>): Record<string, any> {
        const resolved: Record<string, any> = {};
        for (const [key, value] of Object.entries(args)) {
            if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
                const placeholder = value.slice(1, -1); // Remove { }
                resolved[key] = testData[placeholder] || value;
            } else {
                resolved[key] = value;
            }
        }
        return resolved;
    }

    async function runSingleTest(test: MCPTest): Promise<TestResult> {
        const startTime = Date.now();
        
        try {
            const resolvedArgs = resolveArgs(test.args);
            const result = await callTool(test.tool, resolvedArgs);
            const duration = Date.now() - startTime;

            // Extract ID for cleanup if needed
            if (test.cleanup && result.structuredContent) {
                const id = test.cleanup.getIdFromResult(result);
                if (id) {
                    const key = test.cleanup.tool.replace(/(create_|get_|list_|update_|delete_)/, '').replace(/_/g, '') + '_id';
                    setTestData(prev => ({ ...prev, [key]: id }));
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

                {/* MCP Status */}
                {mcpAvailable === false && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-800">
                            <AlertCircle size={20} />
                            <span className="font-medium">MCP Server Not Available</span>
                        </div>
                        <p className="text-sm text-red-600 mt-1">
                            Cannot connect to MCP server at {process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:3001/mcp'}
                        </p>
                    </div>
                )}

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
                            onClick={runAllTests}
                            disabled={isRunning || mcpAvailable === false}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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



