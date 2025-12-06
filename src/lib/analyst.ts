import { openai } from '@/lib/ai';
import { supabase } from '@/lib/supabaseClient';
import { generateObject } from 'ai';
import { z } from 'zod';

export const schemaDef = `
    Table: deals
    Columns: id, name, amount, stage, close_date, status, account_id, pipeline_id, created_at, updated_at
    Note: status can be 'open', 'won', or 'lost'. amount is numeric (revenue/value).
    
    Table: interactions
    Columns: id, type, summary, transcript, sentiment, created_at, contact_id, deal_id
    Note: type can be 'call', 'meeting', 'email', or 'note'.
    
    Table: contacts
    Columns: id, first_name, last_name, email, phone, role, account_id, created_at, updated_at
    
    Table: accounts
    Columns: id, name, industry, website, created_at, updated_at
    
    Table: pipelines
    Columns: id, name, stages (jsonb array of stage names)
`;

// Map legacy column names to actual column names
function mapColumnName(table: string, column: string): string {
    const mappings: Record<string, Record<string, string>> = {
        deals: {
            'opportunity_name': 'name',
            'opportunity_value': 'amount',
            'value': 'amount',
            'stage_id': 'stage',
            'actual_close_date': 'close_date',
            'opportunity_state': 'status',
            'closed': 'status', // Handle boolean-like filters
        },
        interactions: {
            'opportunity_id': 'deal_id',
        },
    };
    
    return mappings[table]?.[column] || column;
}

// Validate and normalize filter
function normalizeFilter(table: string, filter: { column: string; operator: string; value: any }) {
    const mappedColumn = mapColumnName(table, filter.column);
    
    // Handle special cases like "closed" status
    if (mappedColumn === 'status' && filter.value === 'closed') {
        return { ...filter, column: mappedColumn, value: 'won' };
    }
    
    // Handle status values - ensure they're valid
    if (mappedColumn === 'status') {
        // Valid status values: 'open', 'won', 'lost'
        const validStatuses = ['open', 'won', 'lost'];
        const statusValue = String(filter.value).toLowerCase();
        if (!validStatuses.includes(statusValue)) {
            console.warn(`Invalid status value: ${filter.value}, skipping filter`);
            return null; // Return null to skip this filter
        }
        return { ...filter, column: mappedColumn, value: statusValue };
    }
    
    return { ...filter, column: mappedColumn };
}

export async function analyzeAndFetchData(query: string) {
    // 1. Analyze the query to determine what data to fetch
    const { object: analysis } = await generateObject({
        model: openai('gpt-4o'),
        schema: z.object({
            table: z.enum(['deals', 'contacts', 'accounts', 'interactions']).describe('The primary table to query'),
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

IMPORTANT FILTERING RULES:
- Only add filters when explicitly requested in the query (e.g., "closed deals", "won opportunities")
- For general revenue/amount queries, DO NOT filter by status unless the user specifically asks for it
- Valid status values for deals table: 'open', 'won', 'lost'
- When calculating total revenue, include ALL deals unless the user specifies otherwise

For date filters, interpret natural language like:
- "this week" = last 7 days
- "this month" = current month
- "last month" = previous month
- "Q4" = Oct-Dec of current year
- "closing soon" = next 30 days

For sorting, detect keywords like "top", "biggest", "newest", "oldest", "best", "worst".

For revenue queries:
- Use the 'amount' column from the 'deals' table
- Use 'sum' aggregation for total revenue
- Only filter by status if the user explicitly mentions it (e.g., "revenue from won deals")`,
        prompt: query,
    });

    // 1. Build query - handle joins for related table columns
    let needsAccountJoin = false;
    if (analysis.table === 'contacts' && (
        (analysis.groupBy && analysis.groupBy.includes('account')) ||
        (analysis.sortBy && analysis.sortBy.includes('account'))
    )) {
        needsAccountJoin = true;
    }
    
    let queryBuilder;
    if (needsAccountJoin) {
        // Join accounts table when grouping/sorting by account fields
        queryBuilder = supabase
            .from(analysis.table)
            .select('*, accounts(*)');
    } else {
        queryBuilder = supabase.from(analysis.table).select('*');
    }

    // 2. Apply filters
    if (analysis.filters && Array.isArray(analysis.filters)) {
        for (const filter of analysis.filters) {
            // Validate filter before applying
            if (!filter || !filter.column || !filter.operator || filter.value === undefined || filter.value === null) {
                console.warn('Skipping invalid filter:', filter);
                continue;
            }
            
            // Normalize filter (map column names and handle special cases)
            const normalized = normalizeFilter(analysis.table, filter);
            
            // Skip if normalization returned null (invalid filter)
            if (!normalized) {
                continue;
            }
            
            // Additional validation
            if (!normalized.column || !normalized.operator) {
                console.warn('Skipping filter with missing column or operator:', normalized);
                continue;
            }
            
            // Clean the column name (remove any leading/trailing dots or spaces)
            const cleanColumn = normalized.column.trim().replace(/^\.+|\.+$/g, '');
            if (!cleanColumn) {
                console.warn('Skipping filter with empty column name:', normalized);
                continue;
            }
            
            // Ensure value is properly formatted and clean
            let filterValue = typeof normalized.value === 'string' ? normalized.value : String(normalized.value);
            filterValue = filterValue.trim().replace(/^\.+|\.+$/g, ''); // Remove leading/trailing dots
            
            // Map operator to Supabase-compatible format
            const operatorMap: Record<string, string> = {
                '=': 'eq',
                '!=': 'neq',
                '>': 'gt',
                '<': 'lt',
                '>=': 'gte',
                '<=': 'lte',
                'like': 'like',
                'ilike': 'ilike',
            };
            const supabaseOperator = operatorMap[normalized.operator] || normalized.operator;
            
            // Validate column exists in the table schema
            try {
                queryBuilder = queryBuilder.filter(cleanColumn, supabaseOperator, filterValue);
            } catch (error) {
                console.warn(`Failed to apply filter ${cleanColumn} ${supabaseOperator} ${filterValue}:`, error);
                // Continue with other filters
            }
        }
    }

    // 3. Apply date filtering
    if (analysis.dateFilter?.column && analysis.dateFilter?.value) {
        const dateValue = parseDateFilter(analysis.dateFilter.value);
        if (dateValue) {
            const mappedColumn = mapColumnName(analysis.table, analysis.dateFilter.column);
            // Clean the column name (remove any leading/trailing dots or spaces)
            const cleanColumn = mappedColumn.trim().replace(/^\.+|\.+$/g, '');
            if (!cleanColumn) {
                console.warn('Skipping date filter with empty column name');
            } else {
                // Map operator to Supabase-compatible format
                const operatorMap: Record<string, string> = {
                    '=': 'eq',
                    '!=': 'neq',
                    '>': 'gt',
                    '<': 'lt',
                    '>=': 'gte',
                    '<=': 'lte',
                };
                const dateOperator = analysis.dateFilter.operator || '>=';
                const supabaseOperator = operatorMap[dateOperator] || dateOperator;
                
                // Ensure date is in ISO format and clean
                let cleanDateValue = dateValue.trim();
                // Remove any leading dots that might have been added incorrectly
                cleanDateValue = cleanDateValue.replace(/^\.+/, '');
                
                try {
                    queryBuilder = queryBuilder.filter(cleanColumn, supabaseOperator, cleanDateValue);
                } catch (error) {
                    console.warn(`Failed to apply date filter ${cleanColumn} ${supabaseOperator} ${cleanDateValue}:`, error);
                }
            }
        }
    }

    // 4. Apply sorting - skip if sorting by joined table column (Supabase doesn't support this directly)
    if (analysis.sortBy) {
        const mappedSortBy = mapColumnName(analysis.table, analysis.sortBy);
        // Skip ordering if it references a joined table (contains a dot)
        if (!mappedSortBy.includes('.')) {
            try {
                queryBuilder = queryBuilder.order(mappedSortBy, {
                    ascending: analysis.sortOrder === 'asc'
                });
            } catch (error) {
                console.warn(`Failed to apply sort ${mappedSortBy}:`, error);
                // Continue without sorting - we'll sort in JavaScript if needed
            }
        } else {
            console.warn(`Skipping sort by joined table column: ${mappedSortBy}`);
        }
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
            const mappedGroupBy = mapColumnName(analysis.table, analysis.groupBy!);
            // Handle joined table columns (e.g., accounts.industry)
            const getGroupKey = (row: any) => {
                if (mappedGroupBy.includes('.')) {
                    const [table, column] = mappedGroupBy.split('.');
                    if (table === 'accounts' && row.accounts) {
                        return row.accounts[column] || 'Unknown';
                    }
                    return 'Unknown';
                }
                return row[mappedGroupBy] || 'Unknown';
            };
            
            const grouped = data?.reduce((acc: any, row: any) => {
                const key = getGroupKey(row);
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});

            // Use a clean column name for the result (just the column part, not table.column)
            const displayColumn = mappedGroupBy.includes('.') ? mappedGroupBy.split('.')[1] : mappedGroupBy;
            queryResult = Object.entries(grouped || {}).map(([key, value]) => ({
                [displayColumn]: key,
                count: value,
            }));
        } else {
            queryResult = [{ count: data?.length || 0 }];
        }
    } else if (analysis.aggregation === 'sum' && analysis.valueColumn) {
        if (analysis.groupBy) {
            const mappedGroupBy = mapColumnName(analysis.table, analysis.groupBy!);
            const mappedValueColumn = mapColumnName(analysis.table, analysis.valueColumn!);
            
            // Handle joined table columns for groupBy
            const getGroupKey = (row: any) => {
                if (mappedGroupBy.includes('.')) {
                    const [table, column] = mappedGroupBy.split('.');
                    if (table === 'accounts' && row.accounts) {
                        return row.accounts[column] || 'Unknown';
                    }
                    return 'Unknown';
                }
                return row[mappedGroupBy] || 'Unknown';
            };
            
            const grouped = data?.reduce((acc: any, row: any) => {
                const key = getGroupKey(row);
                const value = parseFloat(row[mappedValueColumn]) || 0;
                acc[key] = (acc[key] || 0) + value;
                return acc;
            }, {});

            const displayColumn = mappedGroupBy.includes('.') ? mappedGroupBy.split('.')[1] : mappedGroupBy;
            queryResult = Object.entries(grouped || {}).map(([key, value]) => ({
                [displayColumn]: key,
                total: value,
            }));
        } else {
            const mappedValueColumn = mapColumnName(analysis.table, analysis.valueColumn!);
            const total = data?.reduce((sum, row) => sum + (parseFloat(row[mappedValueColumn]) || 0), 0);
            queryResult = [{ total }];
        }
    } else if (analysis.aggregation === 'avg' && analysis.valueColumn) {
        if (analysis.groupBy) {
            const mappedGroupBy = mapColumnName(analysis.table, analysis.groupBy!);
            const mappedValueColumn = mapColumnName(analysis.table, analysis.valueColumn!);
            
            // Handle joined table columns for groupBy
            const getGroupKey = (row: any) => {
                if (mappedGroupBy.includes('.')) {
                    const [table, column] = mappedGroupBy.split('.');
                    if (table === 'accounts' && row.accounts) {
                        return row.accounts[column] || 'Unknown';
                    }
                    return 'Unknown';
                }
                return row[mappedGroupBy] || 'Unknown';
            };
            
            const grouped = data?.reduce((acc: any, row: any) => {
                const key = getGroupKey(row);
                const value = parseFloat(row[mappedValueColumn]) || 0;
                if (!acc[key]) acc[key] = { sum: 0, count: 0 };
                acc[key].sum += value;
                acc[key].count += 1;
                return acc;
            }, {});

            const displayColumn = mappedGroupBy.includes('.') ? mappedGroupBy.split('.')[1] : mappedGroupBy;
            queryResult = Object.entries(grouped || {}).map(([key, value]: [string, any]) => ({
                [displayColumn]: key,
                average: value.sum / value.count,
            }));
        } else {
            const mappedValueColumn = mapColumnName(analysis.table, analysis.valueColumn!);
            const sum = data?.reduce((s, row) => s + (parseFloat(row[mappedValueColumn]) || 0), 0) || 0;
            const avg = data && data.length > 0 ? sum / data.length : 0;
            queryResult = [{ average: avg }];
        }
    }

    // Map groupBy column name for display (extract column name if it's a joined table reference)
    let displayGroupBy: string | undefined;
    if (analysis.groupBy) {
        const mapped = mapColumnName(analysis.table, analysis.groupBy);
        // If it's a joined table column (e.g., accounts.industry), use just the column name
        displayGroupBy = mapped.includes('.') ? mapped.split('.')[1] : mapped;
    }
    
    return {
        data: queryResult,
        config: {
            type: analysis.chartType,
            title: analysis.title,
            xAxis: displayGroupBy,
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
