'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { submitUserMessage } from './actions';
import { BarChartComponent, LineChartComponent, PieChartComponent, TableComponent } from '@/components/analytics/Charts';

interface Message {
    role: 'user' | 'assistant';
    content?: string;
    chartData?: any;
}

export default function AnalyticsPage() {
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const value = inputValue;
        setInputValue('');
        setIsLoading(true);

        // Add user message
        setMessages((prev) => [...prev, { role: 'user', content: value }]);

        try {
            const response = await submitUserMessage(value);

            if (response.type === 'error') {
                setMessages((prev) => [...prev, { role: 'assistant', content: response.message }]);
            } else {
                setMessages((prev) => [...prev, { role: 'assistant', chartData: response }]);
            }
        } catch (error) {
            console.error(error);
            setMessages((prev) => [...prev, { role: 'assistant', content: 'An error occurred' }]);
        }

        setIsLoading(false);
    };

    return (
        <div className="flex flex-col h-full p-8 overflow-hidden">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Analytics Assistant</h2>

            <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <p className="mb-2">Ask me anything about your data!</p>
                        <div className="flex gap-2 text-sm">
                            <span className="bg-slate-100 px-3 py-1 rounded-full">"Show revenue by stage"</span>
                            <span className="bg-slate-100 px-3 py-1 rounded-full">"Top 5 opportunities"</span>
                        </div>
                    </div>
                ) : (
                    messages.map((message, idx) => (
                        <div key={idx}>
                            {message.role === 'user' ? (
                                <div className="flex justify-end mb-4">
                                    <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg max-w-[80%]">
                                        {message.content}
                                    </div>
                                </div>
                            ) : message.chartData ? (
                                <div className="mb-4">
                                    {message.chartData.chartType === 'bar' && (
                                        <BarChartComponent
                                            data={message.chartData.data}
                                            title={message.chartData.config.title}
                                            xAxisKey={message.chartData.config.xAxis || 'name'}
                                            yAxisKey={message.chartData.config.yAxis || 'value'}
                                        />
                                    )}
                                    {message.chartData.chartType === 'line' && (
                                        <LineChartComponent
                                            data={message.chartData.data}
                                            title={message.chartData.config.title}
                                            xAxisKey={message.chartData.config.xAxis || 'name'}
                                            yAxisKey={message.chartData.config.yAxis || 'value'}
                                        />
                                    )}
                                    {message.chartData.chartType === 'pie' && (
                                        <PieChartComponent
                                            data={message.chartData.data}
                                            title={message.chartData.config.title}
                                            nameKey={message.chartData.config.xAxis || 'name'}
                                            dataKey={message.chartData.config.yAxis || 'value'}
                                        />
                                    )}
                                    {(message.chartData.chartType === 'table' || message.chartData.chartType === 'number') && (
                                        <TableComponent
                                            data={message.chartData.data}
                                            title={message.chartData.config.title}
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="bg-slate-100 px-4 py-2 rounded-lg max-w-[80%]">
                                    {message.content}
                                </div>
                            )}
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-lg text-slate-500">
                        <Loader2 className="animate-spin" size={20} />
                        <span>Analyzing data...</span>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask for a chart or analysis..."
                    className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
}
