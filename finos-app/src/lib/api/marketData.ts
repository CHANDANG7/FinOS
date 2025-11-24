// Market Data API Integration (Free Tier)
// Alpha Vantage + CoinGecko + Yahoo Finance

const ALPHA_VANTAGE_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || 'demo';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// Cache to avoid rate limits
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute

function getCached(key: string) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
}

function setCache(key: string, data: any) {
    cache.set(key, { data, timestamp: Date.now() });
}

// Stock Price (Alpha Vantage)
export async function fetchStockPrice(symbol: string) {
    const cacheKey = `stock_${symbol}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data['Global Quote']) {
            const quote = data['Global Quote'];
            const result = {
                symbol: quote['01. symbol'],
                price: parseFloat(quote['05. price']),
                change: parseFloat(quote['09. change']),
                changePercent: quote['10. change percent'],
                volume: parseInt(quote['06. volume']),
                lastUpdate: quote['07. latest trading day'],
            };
            setCache(cacheKey, result);
            return result;
        }

        // Fallback to mock data if API fails
        return getMockStockData(symbol);
    } catch (error) {
        console.error('Error fetching stock price:', error);
        return getMockStockData(symbol);
    }
}

// Crypto Price (CoinGecko - Free, Unlimited)
export async function fetchCryptoPrice(coinId: string) {
    const cacheKey = `crypto_${coinId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const url = `${COINGECKO_BASE}/simple/price?ids=${coinId}&vs_currencies=usd,inr&include_24hr_change=true&include_24hr_vol=true`;
        const response = await fetch(url);
        const data = await response.json();

        if (data[coinId]) {
            const result = {
                symbol: coinId.toUpperCase(),
                priceUSD: data[coinId].usd,
                priceINR: data[coinId].inr,
                change24h: data[coinId].usd_24h_change,
                volume24h: data[coinId].usd_24h_vol,
            };
            setCache(cacheKey, result);
            return result;
        }

        return getMockCryptoData(coinId);
    } catch (error) {
        console.error('Error fetching crypto price:', error);
        return getMockCryptoData(coinId);
    }
}

// Multiple Cryptos
export async function fetchMultipleCryptos(coinIds: string[]) {
    const promises = coinIds.map(id => fetchCryptoPrice(id));
    return Promise.all(promises);
}

// Forex Rates (Alpha Vantage)
export async function fetchForexRate(fromCurrency: string, toCurrency: string) {
    const cacheKey = `forex_${fromCurrency}_${toCurrency}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${ALPHA_VANTAGE_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data['Realtime Currency Exchange Rate']) {
            const rate = data['Realtime Currency Exchange Rate'];
            const result = {
                from: rate['1. From_Currency Code'],
                to: rate['3. To_Currency Code'],
                rate: parseFloat(rate['5. Exchange Rate']),
                lastUpdate: rate['6. Last Refreshed'],
            };
            setCache(cacheKey, result);
            return result;
        }

        return getMockForexData(fromCurrency, toCurrency);
    } catch (error) {
        console.error('Error fetching forex rate:', error);
        return getMockForexData(fromCurrency, toCurrency);
    }
}

// World Indices (Mock for now - Yahoo Finance unofficial API can be added)
export async function fetchIndices() {
    const cacheKey = 'indices';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    // TODO: Integrate Yahoo Finance unofficial API
    const indices = [
        { symbol: '^NSEI', name: 'Nifty 50', price: 22150.50, change: 125.30, changePercent: '+0.57%' },
        { symbol: '^BSESN', name: 'Sensex', price: 73250.25, change: 320.75, changePercent: '+0.44%' },
        { symbol: '^GSPC', name: 'S&P 500', price: 4850.20, change: -15.40, changePercent: '-0.32%' },
        { symbol: '^DJI', name: 'Dow Jones', price: 38200.50, change: 85.20, changePercent: '+0.22%' },
        { symbol: '^IXIC', name: 'Nasdaq', price: 15350.75, change: -45.30, changePercent: '-0.29%' },
    ];

    setCache(cacheKey, indices);
    return indices;
}

// Commodities (Alpha Vantage or Mock)
export async function fetchCommodities() {
    const cacheKey = 'commodities';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    // Mock data for now
    const commodities = [
        { symbol: 'GOLD', name: 'Gold', price: 2050.50, change: 12.30, changePercent: '+0.60%', unit: 'USD/oz' },
        { symbol: 'SILVER', name: 'Silver', price: 24.75, change: -0.15, changePercent: '-0.60%', unit: 'USD/oz' },
        { symbol: 'CRUDE', name: 'Crude Oil', price: 78.20, change: 1.50, changePercent: '+1.95%', unit: 'USD/bbl' },
        { symbol: 'NATGAS', name: 'Natural Gas', price: 2.85, change: -0.05, changePercent: '-1.72%', unit: 'USD/MMBtu' },
    ];

    setCache(cacheKey, commodities);
    return commodities;
}

// Mock Data Fallbacks
function getMockStockData(symbol: string) {
    const mockPrices: Record<string, any> = {
        'RELIANCE': { symbol: 'RELIANCE', price: 2850.50, change: 25.30, changePercent: '+0.90%', volume: 5234567 },
        'TCS': { symbol: 'TCS', price: 3650.75, change: -15.20, changePercent: '-0.41%', volume: 2345678 },
        'INFY': { symbol: 'INFY', price: 1450.25, change: 10.50, changePercent: '+0.73%', volume: 3456789 },
        'HDFCBANK': { symbol: 'HDFCBANK', price: 1650.80, change: 8.30, changePercent: '+0.51%', volume: 4567890 },
    };

    return mockPrices[symbol] || {
        symbol,
        price: 1000 + Math.random() * 1000,
        change: (Math.random() - 0.5) * 50,
        changePercent: `${((Math.random() - 0.5) * 5).toFixed(2)}%`,
        volume: Math.floor(Math.random() * 10000000),
    };
}

function getMockCryptoData(coinId: string) {
    const mockPrices: Record<string, any> = {
        'bitcoin': { symbol: 'BTC', priceUSD: 65000, priceINR: 5400000, change24h: 2.5, volume24h: 35000000000 },
        'ethereum': { symbol: 'ETH', priceUSD: 3500, priceINR: 290000, change24h: 1.8, volume24h: 18000000000 },
        'cardano': { symbol: 'ADA', priceUSD: 0.65, priceINR: 54, change24h: -0.5, volume24h: 500000000 },
    };

    return mockPrices[coinId] || {
        symbol: coinId.toUpperCase(),
        priceUSD: Math.random() * 100,
        priceINR: Math.random() * 8000,
        change24h: (Math.random() - 0.5) * 10,
        volume24h: Math.random() * 1000000000,
    };
}

function getMockForexData(from: string, to: string) {
    const mockRates: Record<string, number> = {
        'USD_INR': 83.25,
        'EUR_USD': 1.08,
        'GBP_USD': 1.27,
        'USD_JPY': 150.50,
    };

    const key = `${from}_${to}`;
    return {
        from,
        to,
        rate: mockRates[key] || 1.0,
        lastUpdate: new Date().toISOString(),
    };
}

// Helper to fetch all market data at once
export async function fetchAllMarketData() {
    const [indices, forex, crypto, commodities] = await Promise.all([
        fetchIndices(),
        Promise.all([
            fetchForexRate('USD', 'INR'),
            fetchForexRate('EUR', 'USD'),
            fetchForexRate('GBP', 'USD'),
        ]),
        fetchMultipleCryptos(['bitcoin', 'ethereum', 'cardano', 'solana']),
        fetchCommodities(),
    ]);

    return {
        indices,
        forex,
        crypto,
        commodities,
        lastUpdate: new Date().toISOString(),
    };
}
// Real-time Quote from Python Backend (yfinance)
export async function fetchRealTimeQuote(symbol: string) {
    // Use the same URL as Tenali API
    const API_URL = process.env.NEXT_PUBLIC_TENALI_API_URL || 'http://127.0.0.1:8000';

    try {
        const response = await fetch(`${API_URL}/quote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol }),
        });

        if (!response.ok) {
            // Suppress error for 404s (common when searching)
            throw new Error('Stock not found');
        }

        return await response.json();
    } catch (error) {
        // console.error('Error fetching real-time quote:', error);
        throw error;
    }
}
