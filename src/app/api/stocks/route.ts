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
    isDemo?: boolean;
}

// Stock name and base price mapping for demo data
const STOCK_INFO: Record<string, { name: string; basePrice: number }> = {
    'AAPL': { name: 'Apple Inc.', basePrice: 178.50 },
    'GOOGL': { name: 'Alphabet Inc.', basePrice: 141.80 },
    'MSFT': { name: 'Microsoft Corp.', basePrice: 378.90 },
    'AMZN': { name: 'Amazon.com Inc.', basePrice: 178.25 },
    'TSLA': { name: 'Tesla Inc.', basePrice: 248.50 },
    'META': { name: 'Meta Platforms', basePrice: 505.75 },
    'NVDA': { name: 'NVIDIA Corp.', basePrice: 495.20 },
    'JPM': { name: 'JPMorgan Chase', basePrice: 195.30 },
};

// Generate realistic demo data with small random variations
function generateDemoQuote(symbol: string): StockQuote {
    const info = STOCK_INFO[symbol] || { name: symbol, basePrice: 100 };
    
    // Add some randomness based on current time (changes every few minutes)
    const seed = Math.floor(Date.now() / 300000); // Changes every 5 minutes
    const random = Math.sin(seed + symbol.charCodeAt(0)) * 0.5 + 0.5;
    const variation = (random - 0.5) * 0.04; // ±2% variation
    
    const price = info.basePrice * (1 + variation);
    const previousClose = info.basePrice * (1 + (random - 0.5) * 0.02);
    const change = price - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    return {
        symbol,
        name: info.name,
        price: Math.round(price * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        previousClose: Math.round(previousClose * 100) / 100,
        open: Math.round((previousClose + (random - 0.5) * 2) * 100) / 100,
        dayHigh: Math.round((price * 1.01) * 100) / 100,
        dayLow: Math.round((price * 0.99) * 100) / 100,
        volume: Math.floor(10000000 + random * 50000000),
        isDemo: true,
    };
}

// Try to fetch from Finnhub API (free tier: 60 calls/minute)
async function fetchFromFinnhub(symbol: string, apiKey: string): Promise<StockQuote | null> {
    try {
        const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
        const response = await fetch(url, { cache: 'no-store' });
        
        if (!response.ok) return null;
        
        const data = await response.json();
        
        if (!data.c || data.c === 0) return null;
        
        const info = STOCK_INFO[symbol] || { name: symbol, basePrice: 100 };
        
        return {
            symbol,
            name: info.name,
            price: data.c, // Current price
            change: data.d, // Change
            changePercent: data.dp, // Change percent
            previousClose: data.pc, // Previous close
            open: data.o, // Open
            dayHigh: data.h, // High
            dayLow: data.l, // Low
            volume: 0, // Not provided in basic quote
            isDemo: false,
        };
    } catch (err) {
        console.error(`Finnhub error for ${symbol}:`, err);
        return null;
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbols = searchParams.get('symbols') || 'AAPL,GOOGL,MSFT,AMZN,TSLA';
    const finnhubKey = process.env.FINNHUB_API_KEY;
    
    const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
    
    let quotes: StockQuote[] = [];
    let isDemo = true;
    
    // Try Finnhub if API key is configured
    if (finnhubKey) {
        const finnhubQuotes = await Promise.all(
            symbolList.map(symbol => fetchFromFinnhub(symbol, finnhubKey))
        );
        
        const validQuotes = finnhubQuotes.filter((q): q is StockQuote => q !== null);
        
        if (validQuotes.length > 0) {
            quotes = validQuotes;
            isDemo = false;
        }
    }
    
    // Fall back to demo data
    if (quotes.length === 0) {
        quotes = symbolList.map(symbol => generateDemoQuote(symbol));
    }
    
    return Response.json({ 
        quotes, 
        timestamp: new Date().toISOString(),
        isDemo,
        message: isDemo ? 'Using demo data. Add FINNHUB_API_KEY to .env.local for live data.' : undefined,
    });
}
