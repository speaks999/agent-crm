import { NextRequest } from 'next/server';

interface ChartPoint {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

// Base prices for demo data generation
const BASE_PRICES: Record<string, number> = {
    'AAPL': 178.50,
    'GOOGL': 141.80,
    'MSFT': 378.90,
    'AMZN': 178.25,
    'TSLA': 248.50,
    'META': 505.75,
    'NVDA': 495.20,
    'JPM': 195.30,
};

// Generate realistic historical demo data
function generateDemoHistory(symbol: string, range: string): ChartPoint[] {
    const basePrice = BASE_PRICES[symbol] || 100;
    const history: ChartPoint[] = [];
    const now = new Date();
    
    // Determine number of points and interval based on range
    let numPoints: number;
    let intervalMs: number;
    
    switch (range) {
        case '1d':
            numPoints = 78; // 6.5 hours of trading, every 5 min
            intervalMs = 5 * 60 * 1000;
            break;
        case '5d':
            numPoints = 5 * 26; // 5 days, every 15 min during trading
            intervalMs = 15 * 60 * 1000;
            break;
        case '1mo':
            numPoints = 22; // ~22 trading days
            intervalMs = 24 * 60 * 60 * 1000;
            break;
        case '3mo':
            numPoints = 66;
            intervalMs = 24 * 60 * 60 * 1000;
            break;
        case '6mo':
            numPoints = 130;
            intervalMs = 24 * 60 * 60 * 1000;
            break;
        case '1y':
            numPoints = 252;
            intervalMs = 24 * 60 * 60 * 1000;
            break;
        default:
            numPoints = 22;
            intervalMs = 24 * 60 * 60 * 1000;
    }
    
    // Generate price movement using random walk
    let price = basePrice * 0.95; // Start slightly lower
    const symbolSeed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    
    for (let i = 0; i < numPoints; i++) {
        const date = new Date(now.getTime() - (numPoints - i) * intervalMs);
        
        // Random walk with slight upward bias
        const random = Math.sin(symbolSeed + i * 0.1) * 0.5 + Math.random() * 0.5;
        const dailyChange = (random - 0.48) * basePrice * 0.02; // Slight upward bias
        price = Math.max(price + dailyChange, basePrice * 0.8); // Floor at 80% of base
        price = Math.min(price, basePrice * 1.2); // Cap at 120% of base
        
        const dayVariation = basePrice * 0.01;
        const open = price + (Math.random() - 0.5) * dayVariation;
        const close = price;
        const high = Math.max(open, close) + Math.random() * dayVariation;
        const low = Math.min(open, close) - Math.random() * dayVariation;
        
        history.push({
            date: date.toISOString(),
            open: Math.round(open * 100) / 100,
            high: Math.round(high * 100) / 100,
            low: Math.round(low * 100) / 100,
            close: Math.round(close * 100) / 100,
            volume: Math.floor(5000000 + Math.random() * 20000000),
        });
    }
    
    return history;
}

// Try to fetch from Finnhub API
async function fetchFromFinnhub(symbol: string, range: string, apiKey: string): Promise<ChartPoint[] | null> {
    try {
        // Calculate resolution and time range
        let resolution: string;
        let fromTime: number;
        const toTime = Math.floor(Date.now() / 1000);
        
        switch (range) {
            case '1d':
                resolution = '5';
                fromTime = toTime - 24 * 60 * 60;
                break;
            case '5d':
                resolution = '15';
                fromTime = toTime - 5 * 24 * 60 * 60;
                break;
            case '1mo':
                resolution = 'D';
                fromTime = toTime - 30 * 24 * 60 * 60;
                break;
            case '3mo':
                resolution = 'D';
                fromTime = toTime - 90 * 24 * 60 * 60;
                break;
            case '6mo':
                resolution = 'D';
                fromTime = toTime - 180 * 24 * 60 * 60;
                break;
            case '1y':
                resolution = 'D';
                fromTime = toTime - 365 * 24 * 60 * 60;
                break;
            default:
                resolution = 'D';
                fromTime = toTime - 30 * 24 * 60 * 60;
        }
        
        const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${fromTime}&to=${toTime}&token=${apiKey}`;
        const response = await fetch(url, { cache: 'no-store' });
        
        if (!response.ok) return null;
        
        const data = await response.json();
        
        if (data.s !== 'ok' || !data.c || data.c.length === 0) return null;
        
        const history: ChartPoint[] = data.t.map((timestamp: number, i: number) => ({
            date: new Date(timestamp * 1000).toISOString(),
            open: data.o[i],
            high: data.h[i],
            low: data.l[i],
            close: data.c[i],
            volume: data.v[i],
        }));
        
        return history;
    } catch (err) {
        console.error(`Finnhub history error for ${symbol}:`, err);
        return null;
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbol = (searchParams.get('symbol') || 'AAPL').toUpperCase();
    const range = searchParams.get('range') || '1mo';
    const finnhubKey = process.env.FINNHUB_API_KEY;
    
    let history: ChartPoint[] = [];
    let isDemo = true;
    
    // Try Finnhub if API key is configured
    if (finnhubKey) {
        const finnhubHistory = await fetchFromFinnhub(symbol, range, finnhubKey);
        if (finnhubHistory && finnhubHistory.length > 0) {
            history = finnhubHistory;
            isDemo = false;
        }
    }
    
    // Fall back to demo data
    if (history.length === 0) {
        history = generateDemoHistory(symbol, range);
    }
    
    return Response.json({
        symbol,
        currency: 'USD',
        range,
        history,
        timestamp: new Date().toISOString(),
        isDemo,
        message: isDemo ? 'Using demo data. Add FINNHUB_API_KEY to .env.local for live data.' : undefined,
    });
}
