'use server';

import { analyzeAndFetchData } from '@/lib/analyst';
import { BarChartComponent, LineChartComponent, PieChartComponent, TableComponent } from '@/components/analytics/Charts';

export async function submitUserMessage(input: string) {
    try {
        const result = await analyzeAndFetchData(input);
        const { data, config } = result;

        if (!data || data.length === 0) {
            return {
                type: 'error',
                message: 'No data found for your query.',
            };
        }

        return {
            type: 'success',
            chartType: config.type,
            data,
            config,
        };
    } catch (error: any) {
        return {
            type: 'error',
            message: error.message || 'Failed to analyze data',
        };
    }
}
