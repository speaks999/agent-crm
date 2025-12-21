import { NextRequest } from 'next/server';

interface ChartPoint {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

// Fetch historical stock data from Yahoo Finance
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol') || 'AAPL';
    const range = searchParams.get('range') || '1mo'; // 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
    const interval = searchParams.get('interval') || '1d'; // 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo
    
    try {
        // Yahoo Finance chart API endpoint (same as yfinance uses)
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?range=${range}&interval=${interval}`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Origin': 'https://finance.yahoo.com',
                'Referer': 'https://finance.yahoo.com/',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`Yahoo Finance API error: ${response.status}`);
        }

        const data = await response.json();
        const result = data.chart?.result?.[0];
        
        if (!result) {
            throw new Error('No data returned from Yahoo Finance');
        }

        const timestamps = result.timestamp || [];
        const quote = result.indicators?.quote?.[0] || {};
        const meta = result.meta || {};

        const history: ChartPoint[] = timestamps.map((ts: number, i: number) => ({
            date: new Date(ts * 1000).toISOString(),
            open: quote.open?.[i] || 0,
            high: quote.high?.[i] || 0,
            low: quote.low?.[i] || 0,
            close: quote.close?.[i] || 0,
            volume: quote.volume?.[i] || 0,
        })).filter((point: ChartPoint) => point.close > 0); // Filter out invalid points

        return Response.json({
            symbol: meta.symbol,
            currency: meta.currency,
            exchangeName: meta.exchangeName,
            range,
            interval,
            history,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('Stock history API error:', error);
        return Response.json(
            { error: error.message, history: [] },
            { status: 500 }
        );
    }
}

