import { openai } from '@/lib/ai';
import { supabase } from '@/lib/supabaseClient';
import { generateObject } from 'ai';
import { z } from 'zod';

export const schemaDef = `
    Table: opportunities
    Columns: id, opportunity_name, opportunity_value, stage_id, actual_close_date, opportunity_state, probability, created_at, updated_at
    
    Table: interactions
    Columns: id, type, summary, sentiment, created_at, contact_id, opportunity_id
    
    Table: contacts
    Columns: id, first_name, last_name, email, role, account_id, created_at
    
    Table: accounts
    Columns: id, name, industry, created_at
`;

export async function analyzeAndFetchData(query: string) {
    // 1. Analyze the query to determine what data to fetch
    const { object: analysis } = await generateObject({
        model: openai('gpt-4o'),
        schema: z.object({
            table: z.enum(['opportunities', 'contacts', 'accounts', 'interactions']).describe('The primary table to query'),
            aggregation: z.enum(['none', 'count', 'sum', 'avg']).describe('Type of aggregation needed'),
            groupBy: z.string().nullable().optional().describe('Column to group by if aggregating'),
            valueColumn: z.string().nullable().optional().describe('Column to aggregate (for sum/avg)'),
            sortBy: z.string().nullable().optional().describe('Column to sort by'),
            sortOrder: z.enum(['asc', 'desc']).nullable().optional().describe('Sort order'),
            limit: z.number().nullable().optional().describe('Maximum number of results to return'),
            dateFilter: z.object({
                column: z.string().optional().describe('Date column to filter on'),
                operator: z.enum(['>', '<', '>=', '<=', '=']).optional().describe('Comparison operator'),
                value: z.string().optional().describe('Date value or relative time (e.g., "7 days ago", "this month")'),
            }).nullable().optional().describe('Date-based filtering'),
            filters: z.array(z.object({
                column: z.string(),
                operator: z.enum(['=', '!=', '>', '<', '>=', '<=', 'like', 'ilike']),
                value: z.string(),
            })).nullable().optional().describe('Additional filters'),
            chartType: z.enum(['bar', 'line', 'pie', 'number', 'table']).describe('Best chart type'),
            title: z.string().describe('Chart title'),
        }),
        system: `Analyze the user's query and determine what data to fetch from the database. 
      
Schema: ${schemaDef}

For date filters, interpret natural language like:
- "this week" = last 7 days
- "this month" = current month
- "last month" = previous month
- "Q4" = Oct-Dec of current year
- "closing soon" = next 30 days

For sorting, detect keywords like "top", "biggest", "newest", "oldest", "best", "worst".`,
        prompt: query,
    });

    let queryBuilder = supabase.from(analysis.table).select('*');

    // 2. Apply filters
    if (analysis.filters) {
        for (const filter of analysis.filters) {
            queryBuilder = queryBuilder.filter(filter.column, filter.operator, filter.value);
        }
    }

    // 3. Apply date filtering
    if (analysis.dateFilter?.column && analysis.dateFilter?.value) {
        const dateValue = parseDateFilter(analysis.dateFilter.value);
        if (dateValue) {
            queryBuilder = queryBuilder.filter(
                analysis.dateFilter.column,
                analysis.dateFilter.operator || '>=',
                dateValue
            );
        }
    }

    // 4. Apply sorting
    if (analysis.sortBy) {
        queryBuilder = queryBuilder.order(analysis.sortBy, {
            ascending: analysis.sortOrder === 'asc'
        });
    }

    // 5. Apply limit
    if (analysis.limit) {
        queryBuilder = queryBuilder.limit(analysis.limit);
    } else if (analysis.aggregation === 'none') {
        queryBuilder = queryBuilder.limit(100); // Default limit
    }

    // 6. Execute query
    const { data, error } = await queryBuilder;
    if (error) throw error;

    let queryResult: any;

    // 7. Apply aggregations
    if (analysis.aggregation === 'none') {
        queryResult = data;
    } else if (analysis.aggregation === 'count') {
        if (analysis.groupBy) {
            const grouped = data?.reduce((acc: any, row: any) => {
                const key = row[analysis.groupBy!] || 'Unknown';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});

            queryResult = Object.entries(grouped || {}).map(([key, value]) => ({
                [analysis.groupBy!]: key,
                count: value,
            }));
        } else {
            queryResult = [{ count: data?.length || 0 }];
        }
    } else if (analysis.aggregation === 'sum' && analysis.valueColumn) {
        if (analysis.groupBy) {
            const grouped = data?.reduce((acc: any, row: any) => {
                const key = row[analysis.groupBy!] || 'Unknown';
                const value = parseFloat(row[analysis.valueColumn!]) || 0;
                acc[key] = (acc[key] || 0) + value;
                return acc;
            }, {});

            queryResult = Object.entries(grouped || {}).map(([key, value]) => ({
                [analysis.groupBy!]: key,
                total: value,
            }));
        } else {
            const total = data?.reduce((sum, row) => sum + (parseFloat(row[analysis.valueColumn!]) || 0), 0);
            queryResult = [{ total }];
        }
    } else if (analysis.aggregation === 'avg' && analysis.valueColumn) {
        if (analysis.groupBy) {
            const grouped = data?.reduce((acc: any, row: any) => {
                const key = row[analysis.groupBy!] || 'Unknown';
                const value = parseFloat(row[analysis.valueColumn!]) || 0;
                if (!acc[key]) acc[key] = { sum: 0, count: 0 };
                acc[key].sum += value;
                acc[key].count += 1;
                return acc;
            }, {});

            queryResult = Object.entries(grouped || {}).map(([key, value]: [string, any]) => ({
                [analysis.groupBy!]: key,
                average: value.sum / value.count,
            }));
        } else {
            const sum = data?.reduce((s, row) => s + (parseFloat(row[analysis.valueColumn!]) || 0), 0) || 0;
            const avg = data && data.length > 0 ? sum / data.length : 0;
            queryResult = [{ average: avg }];
        }
    }

    return {
        data: queryResult,
        config: {
            type: analysis.chartType,
            title: analysis.title,
            xAxis: analysis.groupBy,
            yAxis: analysis.aggregation === 'count' ? 'count' : analysis.aggregation === 'avg' ? 'average' : 'total',
        },
    };
}

// Helper function to parse natural language date filters
function parseDateFilter(value: string): string | null {
    const now = new Date();
    const lowerValue = value.toLowerCase();

    // This week (last 7 days)
    if (lowerValue.includes('this week') || lowerValue.includes('last 7 days')) {
        const date = new Date(now);
        date.setDate(date.getDate() - 7);
        return date.toISOString();
    }

    // This month
    if (lowerValue.includes('this month')) {
        const date = new Date(now.getFullYear(), now.getMonth(), 1);
        return date.toISOString();
    }

    // Last month
    if (lowerValue.includes('last month')) {
        const date = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return date.toISOString();
    }

    // This quarter
    if (lowerValue.includes('this quarter') || lowerValue.includes('q4')) {
        const quarter = Math.floor(now.getMonth() / 3);
        const date = new Date(now.getFullYear(), quarter * 3, 1);
        return date.toISOString();
    }

    // Next 30 days (for "closing soon")
    if (lowerValue.includes('soon') || lowerValue.includes('next 30 days')) {
        return now.toISOString();
    }

    // Today
    if (lowerValue.includes('today')) {
        const date = new Date(now);
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
    }

    return null;
}
