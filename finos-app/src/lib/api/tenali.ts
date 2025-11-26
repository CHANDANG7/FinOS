// Tenali LLM API Client
// This will connect to your custom-trained Tenali model when deployed

const TENALI_API_URL = process.env.NEXT_PUBLIC_TENALI_API_URL || '/api/py';

export interface TenaliMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface TenaliContext {
    portfolio?: any;
    market_data?: any;
    user_preferences?: any;
}

const TENALI_SYSTEM_PROMPT = "You are Tenali, a wise and witty financial advisor. You provide accurate, data-backed financial insights with a touch of humor. Always prioritize the user's financial well-being.";

// Chat with Tenali (Streaming)
export async function chatWithTenali(
    messages: TenaliMessage[],
    context?: TenaliContext
): Promise<ReadableStream> {
    try {
        const response = await fetch(`${TENALI_API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: TENALI_SYSTEM_PROMPT },
                    ...messages,
                ],
                context,
                stream: true,
            }),
        });

        if (!response.ok) {
            throw new Error(`Tenali API Error: ${response.statusText}`);
        }

        if (!response.body) {
            throw new Error('No response body received');
        }

        return response.body;
    } catch (error) {
        console.error('Tenali API error:', error);

        // Return a stream with the error message so the user sees it in the UI
        const errorMessage = `⚠️ **Connection Error**: Could not connect to Tenali API at ${TENALI_API_URL}.\n\nPlease ensure the backend server is running via \`run_api.bat\`.`;

        return new ReadableStream({
            start(controller) {
                controller.enqueue(new TextEncoder().encode(errorMessage));
                controller.close();
            }
        });
    }
}

// Analyze Portfolio
export async function analyzePortfolio(holdings: any[]) {
    try {
        const response = await fetch(`${TENALI_API_URL}/analyze/portfolio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ holdings }),
        });

        if (!response.ok) {
            throw new Error('Tenali API unavailable');
        }

        return await response.json();
    } catch (error) {
        console.error('Tenali API error:', error);
        return getMockPortfolioAnalysis(holdings);
    }
}

// Analyze Chart (Technical Analysis)
export async function analyzeChart(imageUrl: string, query?: string) {
    try {
        const response = await fetch(`${TENALI_API_URL}/analyze/chart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_url: imageUrl, query }),
        });

        if (!response.ok) {
            throw new Error('Tenali API unavailable');
        }

        return await response.json();
    } catch (error) {
        console.error('Tenali API error:', error);
        return getMockChartAnalysis();
    }
}

// Analyze Trade
export async function analyzeTrade(tradeData: any) {
    try {
        const response = await fetch(`${TENALI_API_URL}/analyze/trade`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trade_data: tradeData }),
        });

        if (!response.ok) {
            throw new Error('Tenali API unavailable');
        }

        return await response.json();
    } catch (error) {
        console.error('Tenali API error:', error);
        return getMockTradeAnalysis(tradeData);
    }
}

// ============================================================================
// MOCK RESPONSES (Until your Tenali model is deployed)
// ============================================================================

function getMockStreamingResponse(userQuery: string): ReadableStream {
    const mockResponse = generateMockResponse(userQuery);

    return new ReadableStream({
        start(controller) {
            let index = 0;
            const interval = setInterval(() => {
                if (index < mockResponse.length) {
                    const chunk = mockResponse.slice(index, index + 5);
                    controller.enqueue(new TextEncoder().encode(chunk));
                    index += 5;
                } else {
                    clearInterval(interval);
                    controller.close();
                }
            }, 30); // Simulate streaming
        },
    });
}

function generateMockResponse(query: string): string {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('nifty') || lowerQuery.includes('sensex') || lowerQuery.includes('market')) {
        return `## Executive Summary
Indian markets are showing resilience with Nifty 50 trading near 22,150 levels. Current macro environment suggests cautious optimism with FII flows stabilizing and domestic institutional support remaining strong.

## Deep Analysis

### Macro Context
- **Global Factors**: US Fed rate trajectory remains key driver
- **Domestic Factors**: Strong GDP growth (6.7%), stable inflation (5.2%)
- **FII Activity**: Net buying of ₹2,500 Cr in last week

### Technical Analysis
- **Nifty 50**: Trading above 21,800 support, resistance at 22,500
- **Trend**: Short-term bullish, medium-term consolidation
- **Key Levels**: Support: 21,800, 21,500 | Resistance: 22,350, 22,500

### Sectoral View
- **Outperformers**: IT, Pharma showing strength
- **Underperformers**: Metal, PSU Banks under pressure
- **Rotation**: Defensive to growth sectors observed

## Actionable Insights
Traders often watch the 21,800-22,500 range for breakout opportunities. Investors typically evaluate sector rotation patterns and earnings quality in this environment.

## Data & Sources
- Market data as of ${new Date().toLocaleString()}
- Based on NSE official data and technical indicators

*This analysis is for educational purposes only and not investment advice.*`;
    }

    if (lowerQuery.includes('portfolio') || lowerQuery.includes('holding')) {
        return `## Executive Summary
Your portfolio shows moderate diversification across sectors with a tilt towards large-cap stocks. Overall risk profile appears balanced with room for optimization.

## Deep Analysis

### Portfolio Composition
- **Large Cap**: 65% (Good foundation)
- **Mid Cap**: 25% (Adequate growth exposure)
- **Small Cap**: 10% (Controlled risk)

### Sector Allocation
- **Technology**: 30% (Concentrated - consider rebalancing)
- **Banking**: 25% (Appropriate)
- **Pharma**: 15% (Defensive allocation)
- **Others**: 30% (Diversified)

### Risk Metrics
- **Beta**: ~1.1 (Slightly more volatile than market)
- **Concentration Risk**: Top 3 holdings = 45% (Moderate)
- **Sector Concentration**: IT sector overweight

## Actionable Insights
Investors with similar profiles often consider:
1. Reducing IT concentration below 25%
2. Adding defensive sectors (FMCG, Utilities)
3. Maintaining 10-15% cash for opportunities

## Recommendations
- Review sector allocation quarterly
- Monitor individual stock weightage (max 15% per stock)
- Consider adding international exposure for diversification

*This analysis is for educational purposes only and not investment advice. Consult a licensed financial advisor for personalized recommendations.*`;
    }

    if (lowerQuery.includes('crypto') || lowerQuery.includes('bitcoin')) {
        return `## Executive Summary
Bitcoin is trading around $65,000 with consolidation pattern forming. On-chain metrics suggest accumulation phase with long-term holders increasing positions.

## Deep Analysis

### Price Action
- **Current Price**: $65,000
- **Key Support**: $62,000 (strong buying zone)
- **Resistance**: $68,000 (previous high)

### On-Chain Metrics
- **MVRV Ratio**: 2.1 (Neutral zone)
- **Exchange Reserves**: Declining (Bullish signal)
- **Whale Accumulation**: Increasing (Positive)

### Market Structure
- **Trend**: Bullish on higher timeframes
- **Liquidity**: Building above $68K
- **Funding Rates**: Neutral (No extreme leverage)

## Actionable Insights
Traders often watch the $62K-$68K range for breakout signals. Historical patterns suggest consolidation periods often precede significant moves.

*This analysis is for educational purposes only and not investment advice.*`;
    }

    // Default response
    return `## Executive Summary
I'm Tenali, your AI financial analyst. I can help you with market analysis, portfolio insights, technical analysis, and financial education.

## How I Can Help

### Market Analysis
- Global indices, forex, crypto, commodities
- Macro economic trends and indicators
- Sector rotation and market structure

### Portfolio Management
- Holdings analysis and risk assessment
- Diversification recommendations
- Performance attribution

### Technical Analysis
- Chart pattern recognition
- Price action and SMC concepts
- Support/resistance levels

### Trading Insights
- Trade journal analysis
- Risk management strategies
- Behavioral pattern identification

## Ask Me About
- "Analyze Nifty 50 technical levels"
- "Review my portfolio allocation"
- "Explain Smart Money Concepts"
- "What's driving gold prices?"

*I'm here to educate and analyze, not to provide direct trading advice. All insights are for educational purposes only.*`;
}

function getMockPortfolioAnalysis(holdings: any[]) {
    const totalValue = holdings.reduce((sum, h) => sum + (h.quantity * h.current_price || h.avg_buy_price), 0);

    return {
        summary: {
            totalValue,
            totalInvested: holdings.reduce((sum, h) => sum + (h.quantity * h.avg_buy_price), 0),
            unrealizedPnL: 0, // Calculate based on current prices
            diversificationScore: 7.5,
            riskScore: 6.2,
        },
        insights: [
            'Portfolio shows good diversification across sectors',
            'Consider rebalancing if any single stock exceeds 15%',
            'Defensive allocation appears adequate for current market conditions',
        ],
        recommendations: [
            'Monitor sector concentration, especially in Technology',
            'Review holdings quarterly and rebalance as needed',
            'Consider adding international exposure for better diversification',
        ],
    };
}

function getMockChartAnalysis() {
    return {
        trend: 'Bullish',
        patterns: ['Higher Highs', 'Higher Lows', 'Ascending Triangle'],
        keyLevels: {
            support: [21800, 21500, 21200],
            resistance: [22350, 22500, 22800],
        },
        smcAnalysis: {
            orderBlocks: ['Bullish OB at 21,750'],
            fairValueGaps: ['FVG at 22,100-22,150'],
            liquidityPools: ['Liquidity above 22,500'],
        },
        outlook: 'Price action suggests bullish continuation. Watch for breakout above 22,350 with volume confirmation.',
    };
}

function getMockTradeAnalysis(tradeData: any) {
    return {
        quality: tradeData.net_pnl > 0 ? 'Good' : 'Needs Improvement',
        insights: [
            tradeData.net_pnl > 0
                ? 'Trade executed with positive outcome'
                : 'Consider reviewing entry criteria',
            'Risk-reward ratio appears balanced',
            'Emotional state alignment noted',
        ],
        suggestions: [
            'Document key learnings from this trade',
            'Review similar setups in your journal',
            'Consider position sizing optimization',
        ],
    };
}
