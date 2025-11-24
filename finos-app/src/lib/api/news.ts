// News API Integration for FinOS
// Provides real-time financial news with auto-refresh

const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY || '';
const NEWS_API_BASE = 'https://newsapi.org/v2';

export interface NewsArticle {
    title: string;
    description: string;
    url: string;
    source: string;
    publishedAt: string;
    image: string | null;
    sentiment?: 'bullish' | 'bearish' | 'neutral';
}

// Cache for news articles
const newsCache = new Map<string, { data: NewsArticle[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCached(key: string) {
    const cached = newsCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
}

function setCache(key: string, data: NewsArticle[]) {
    newsCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Fetch top financial news headlines
 */
export async function fetchFinancialNews(
    category: 'business' | 'technology' = 'business',
    country: 'us' | 'in' = 'us'
): Promise<NewsArticle[]> {
    const cacheKey = `news_${category}_${country}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const url = `${NEWS_API_BASE}/top-headlines?category=${category}&country=${country}&apiKey=${NEWS_API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('NewsAPI request failed');
        }

        const data = await response.json();

        const articles: NewsArticle[] = data.articles.map((article: any) => ({
            title: article.title,
            description: article.description || '',
            url: article.url,
            source: article.source.name,
            publishedAt: article.publishedAt,
            image: article.urlToImage,
        }));

        setCache(cacheKey, articles);
        return articles;

    } catch (error) {
        console.error('Error fetching news:', error);
        return getMockNews(); // Fallback to mock data
    }
}

/**
 * Search financial news by keyword
 */
export async function searchFinancialNews(query: string): Promise<NewsArticle[]> {
    const cacheKey = `search_${query}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const url = `${NEWS_API_BASE}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&apiKey=${NEWS_API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('NewsAPI search failed');
        }

        const data = await response.json();

        const articles: NewsArticle[] = data.articles.slice(0, 20).map((article: any) => ({
            title: article.title,
            description: article.description || '',
            url: article.url,
            source: article.source.name,
            publishedAt: article.publishedAt,
            image: article.urlToImage,
        }));

        setCache(cacheKey, articles);
        return articles;

    } catch (error) {
        console.error('Error searching news:', error);
        return [];
    }
}

/**
 * Get market-specific news
 */
export async function getMarketNews(market: 'stocks' | 'crypto' | 'forex' | 'commodities'): Promise<NewsArticle[]> {
    const queries = {
        stocks: 'stock market OR equity OR shares',
        crypto: 'cryptocurrency OR bitcoin OR ethereum',
        forex: 'forex OR currency OR exchange rate',
        commodities: 'gold OR oil OR commodities',
    };

    return searchFinancialNews(queries[market]);
}

/**
 * Analyze news sentiment with Tenali
 */
export async function analyzeNewsSentiment(article: NewsArticle): Promise<'bullish' | 'bearish' | 'neutral'> {
    try {
        const TENALI_URL = process.env.NEXT_PUBLIC_TENALI_API_URL;

        if (!TENALI_URL) {
            return getMockSentiment(article.title);
        }

        const response = await fetch(`${TENALI_URL}/analyze/news`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: article.title,
                description: article.description,
            }),
        });

        const { sentiment } = await response.json();
        return sentiment;

    } catch (error) {
        console.error('Error analyzing sentiment:', error);
        return getMockSentiment(article.title);
    }
}

/**
 * Get news with sentiment analysis
 */
export async function getNewsWithSentiment(category: 'business' | 'technology' = 'business'): Promise<NewsArticle[]> {
    const articles = await fetchFinancialNews(category);

    // Analyze sentiment for each article
    const articlesWithSentiment = await Promise.all(
        articles.map(async (article) => ({
            ...article,
            sentiment: await analyzeNewsSentiment(article),
        }))
    );

    return articlesWithSentiment;
}

// Mock data fallback
function getMockNews(): NewsArticle[] {
    return [
        {
            title: 'Markets Rally on Strong Economic Data',
            description: 'Global equity markets rose as economic indicators showed continued strength.',
            url: '#',
            source: 'Financial Times',
            publishedAt: new Date().toISOString(),
            image: null,
            sentiment: 'bullish',
        },
        {
            title: 'Fed Signals Potential Rate Cuts',
            description: 'Federal Reserve officials hint at possible interest rate reductions in coming months.',
            url: '#',
            source: 'Bloomberg',
            publishedAt: new Date().toISOString(),
            image: null,
            sentiment: 'bullish',
        },
        {
            title: 'Tech Stocks Face Headwinds',
            description: 'Technology sector experiences volatility amid regulatory concerns.',
            url: '#',
            source: 'Reuters',
            publishedAt: new Date().toISOString(),
            image: null,
            sentiment: 'bearish',
        },
    ];
}

function getMockSentiment(title: string): 'bullish' | 'bearish' | 'neutral' {
    const bullishWords = ['rally', 'surge', 'gain', 'rise', 'growth', 'strong'];
    const bearishWords = ['fall', 'drop', 'decline', 'weak', 'concern', 'risk'];

    const lowerTitle = title.toLowerCase();

    const bullishCount = bullishWords.filter(word => lowerTitle.includes(word)).length;
    const bearishCount = bearishWords.filter(word => lowerTitle.includes(word)).length;

    if (bullishCount > bearishCount) return 'bullish';
    if (bearishCount > bullishCount) return 'bearish';
    return 'neutral';
}
