import { NextRequest } from 'next/server';

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

// Stock name mapping
const STOCK_NAMES: Record<string, string> = {
    'AAPL': 'Apple Inc.',
    'GOOGL': 'Alphabet Inc.',
    'MSFT': 'Microsoft Corp.',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.',
    'META': 'Meta Platforms',
    'NVDA': 'NVIDIA Corp.',
    'JPM': 'JPMorgan Chase',
};

// Fetch current stock quotes from Yahoo Finance
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbols = searchParams.get('symbols') || 'AAPL,GOOGL,MSFT,AMZN,TSLA';
    
    try {
        const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
        
        // Try Yahoo Finance chart API (more reliable than quote API)
        const quotes: StockQuote[] = await Promise.all(
            symbolList.map(async (symbol) => {
                try {
                    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`;
                    
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
                        throw new Error(`API error: ${response.status}`);
                    }

                    const data = await response.json();
                    const result = data.chart?.result?.[0];
                    
                    if (!result) {
                        throw new Error('No data');
                    }

                    const meta = result.meta;
                    const quote = result.indicators?.quote?.[0];
                    const closes = quote?.close?.filter((c: number) => c != null) || [];
                    
                    const currentPrice = meta.regularMarketPrice || closes[closes.length - 1] || 0;
                    const previousClose = meta.previousClose || meta.chartPreviousClose || closes[closes.length - 2] || currentPrice;
                    const change = currentPrice - previousClose;
                    const changePercent = previousClose ? (change / previousClose) * 100 : 0;

                    return {
                        symbol,
                        name: STOCK_NAMES[symbol] || meta.shortName || symbol,
                        price: currentPrice,
                        change,
                        changePercent,
                        previousClose,
                        open: meta.regularMarketOpen || quote?.open?.[quote.open.length - 1] || 0,
                        dayHigh: meta.regularMarketDayHigh || 0,
                        dayLow: meta.regularMarketDayLow || 0,
                        volume: meta.regularMarketVolume || 0,
                    };
                } catch (err) {
                    console.error(`Failed to fetch ${symbol}:`, err);
                    // Return placeholder data if fetch fails
                    return {
                        symbol,
                        name: STOCK_NAMES[symbol] || symbol,
                        price: 0,
                        change: 0,
                        changePercent: 0,
                        previousClose: 0,
                        open: 0,
                        dayHigh: 0,
                        dayLow: 0,
                        volume: 0,
                    };
                }
            })
        );

        // Filter out failed quotes (price = 0)
        const validQuotes = quotes.filter(q => q.price > 0);
        
        if (validQuotes.length === 0) {
            throw new Error('Unable to fetch stock data. Yahoo Finance may be temporarily unavailable.');
        }

        return Response.json({ quotes: validQuotes, timestamp: new Date().toISOString() });
    } catch (error: any) {
        console.error('Stock API error:', error);
        return Response.json(
            { error: error.message, quotes: [] },
            { status: 500 }
        );
    }
}

