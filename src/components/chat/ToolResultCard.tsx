'use client';

import { useState } from 'react';

interface ToolCall {
    name: string;
    args: any;
    result?: any;
}

export function ToolResultCard({ toolCall }: { toolCall: ToolCall }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="rounded-lg border border-default bg-surface p-3 text-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                        Tool
                    </span>
                    <span className="font-medium">{toolCall.name}</span>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-secondary hover:text-primary"
                >
                    {isExpanded ? 'Hide' : 'Show'} details
                </button>
            </div>

            {isExpanded && (
                <div className="mt-3 space-y-2">
                    {toolCall.args && Object.keys(toolCall.args).length > 0 && (
                        <div>
                            <div className="text-xs text-secondary mb-1">Arguments:</div>
                            <pre className="text-xs bg-gray-50 dark:bg-gray-900 rounded p-2 overflow-x-auto">
                                {JSON.stringify(toolCall.args, null, 2)}
                            </pre>
                        </div>
                    )}
                    {toolCall.result && (
                        <div>
                            <div className="text-xs text-secondary mb-1">Result:</div>
                            <pre className="text-xs bg-gray-50 dark:bg-gray-900 rounded p-2 overflow-x-auto">
                                {JSON.stringify(toolCall.result, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
