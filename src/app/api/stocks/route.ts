import { NextRequest } from 'next/server';

interface YahooQuoteResult {
    symbol: string;
    regularMarketPrice: number;
    regularMarketChange: number;
    regularMarketChangePercent: number;
    regularMarketPreviousClose: number;
    shortName: string;
    regularMarketOpen: number;
    regularMarketDayHigh: number;
    regularMarketDayLow: number;
    regularMarketVolume: number;
}

interface StockQuote {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    previousClose: number;
    open: number;
    dayHigh: number;
    dayLow: number;
    volume: number;
}

// Fetch current stock quotes from Yahoo Finance
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbols = searchParams.get('symbols') || 'AAPL,GOOGL,MSFT,AMZN,TSLA';
    
    try {
        const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
        const symbolsParam = symbolList.join(',');
        
        // Yahoo Finance API endpoint (same as yfinance uses)
        const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsParam}`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            next: { revalidate: 30 }, // Cache for 30 seconds
        });

        if (!response.ok) {
            throw new Error(`Yahoo Finance API error: ${response.status}`);
        }

        const data = await response.json();
        const results: YahooQuoteResult[] = data.quoteResponse?.result || [];

        const quotes: StockQuote[] = results.map((quote) => ({
            symbol: quote.symbol,
            name: quote.shortName || quote.symbol,
            price: quote.regularMarketPrice || 0,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            previousClose: quote.regularMarketPreviousClose || 0,
            open: quote.regularMarketOpen || 0,
            dayHigh: quote.regularMarketDayHigh || 0,
            dayLow: quote.regularMarketDayLow || 0,
            volume: quote.regularMarketVolume || 0,
        }));

        return Response.json({ quotes, timestamp: new Date().toISOString() });
    } catch (error: any) {
        console.error('Stock API error:', error);
        return Response.json(
            { error: error.message, quotes: [] },
            { status: 500 }
        );
    }
}

