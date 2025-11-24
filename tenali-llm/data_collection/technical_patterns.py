"""
Technical Analysis & Smart Money Concepts Data Collection
Generates training data for TA patterns, indicators, and SMC concepts
"""

import yfinance as yf
import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta
import json
from tqdm import tqdm

class TechnicalPatternsCollector:
    def __init__(self, output_dir='./data/technical'):
        self.output_dir = output_dir
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
    def collect_technical_data(self, symbols, years=5):
        """Collect price data and generate TA/SMC training examples"""
        print(f"Generating technical analysis data for {len(symbols)} symbols...")
        
        all_data = []
        
        for symbol in tqdm(symbols):
            try:
                # Get historical data
                ticker = yf.Ticker(symbol)
                end_date = datetime.now()
                start_date = end_date - timedelta(days=years*365)
                df = ticker.history(start=start_date, end=end_date)
                
                if len(df) < 200:
                    continue
                
                # Generate TA examples
                ta_examples = self._generate_ta_examples(symbol, df)
                
                # Generate SMC examples
                smc_examples = self._generate_smc_examples(symbol, df)
                
                # Generate Fundamental examples
                fund_examples = self._generate_fundamental_examples(symbol, ticker.info)
                
                all_data.extend(ta_examples)
                all_data.extend(smc_examples)
                all_data.extend(fund_examples)
                
            except Exception as e:
                print(f"Error processing {symbol}: {e}")
                continue
        
        return all_data
    
    def _generate_ta_examples(self, symbol, df):
        """Generate technical analysis training examples using pure Pandas"""
        examples = []
        
        # Calculate indicators using Pandas
        close = df['Close']
        
        # SMA
        df['SMA_50'] = close.rolling(window=50).mean()
        df['SMA_200'] = close.rolling(window=200).mean()
        
        # RSI
        delta = close.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))
        
        # MACD
        exp1 = close.ewm(span=12, adjust=False).mean()
        exp2 = close.ewm(span=26, adjust=False).mean()
        df['MACD'] = exp1 - exp2
        df['MACD_signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
        df['MACD_hist'] = df['MACD'] - df['MACD_signal']
        
        # Bollinger Bands
        df['BB_middle'] = close.rolling(window=20).mean()
        df['BB_std'] = close.rolling(window=20).std()
        df['BB_upper'] = df['BB_middle'] + (df['BB_std'] * 2)
        df['BB_lower'] = df['BB_middle'] - (df['BB_std'] * 2)
        
        # Get latest values
        latest = df.iloc[-1]
        
        # Example 1: Trend Analysis
        trend_text = f"""## Technical Analysis: {symbol}

### Trend Analysis
- **Current Price**: ${latest['Close']:.2f}
- **50-Day SMA**: ${latest['SMA_50']:.2f}
- **200-Day SMA**: ${latest['SMA_200']:.2f}
- **Trend**: {'Bullish' if latest['Close'] > latest['SMA_200'] else 'Bearish'}
- **Golden Cross**: {'Yes' if latest['SMA_50'] > latest['SMA_200'] else 'No'}

### Momentum Indicators
- **RSI (14)**: {latest['RSI']:.2f} - {'Overbought' if latest['RSI'] > 70 else 'Oversold' if latest['RSI'] < 30 else 'Neutral'}
- **MACD**: {latest['MACD']:.2f}
- **MACD Signal**: {latest['MACD_signal']:.2f}
- **MACD Histogram**: {latest['MACD_hist']:.2f} - {'Bullish' if latest['MACD_hist'] > 0 else 'Bearish'}

### Bollinger Bands
- **Upper Band**: ${latest['BB_upper']:.2f}
- **Middle Band**: ${latest['BB_middle']:.2f}
- **Lower Band**: ${latest['BB_lower']:.2f}
- **Position**: {'Near upper band (overbought)' if latest['Close'] > latest['BB_upper'] * 0.98 else 'Near lower band (oversold)' if latest['Close'] < latest['BB_lower'] * 1.02 else 'Within bands'}

### Key Levels
- **52-Week High**: ${df['High'].tail(252).max():.2f}
- **52-Week Low**: ${df['Low'].tail(252).min():.2f}
- **Support**: ${df['Low'].tail(20).min():.2f}
- **Resistance**: ${df['High'].tail(20).max():.2f}

*This analysis is for educational purposes only and not investment advice.*
"""
        
        examples.append({
            'symbol': symbol,
            'type': 'technical_analysis',
            'text': trend_text,
        })
        
        # Example 2: Candlestick Patterns
        patterns = self._identify_candlestick_patterns(df)
        if patterns:
            pattern_text = f"""## Candlestick Patterns: {symbol}

### Detected Patterns
{chr(10).join([f"- **{p['name']}**: {p['description']}" for p in patterns])}

### Interpretation
Candlestick patterns provide insights into market psychology and potential reversals.
Traders often use these patterns in conjunction with other technical indicators for confirmation.

*This analysis is for educational purposes only and not investment advice.*
"""
            examples.append({
                'symbol': symbol,
                'type': 'candlestick_patterns',
                'text': pattern_text,
            })
        
        return examples
    
    def _generate_smc_examples(self, symbol, df):
        """Generate Smart Money Concepts training examples"""
        examples = []
        
        # Identify Order Blocks
        order_blocks = self._identify_order_blocks(df)
        
        # Identify Fair Value Gaps
        fvgs = self._identify_fair_value_gaps(df)
        
        # Identify BOS/CHOCH
        structure_breaks = self._identify_structure_breaks(df)
        
        smc_text = f"""## Smart Money Concepts (SMC) Analysis: {symbol}

### Order Blocks (OB)
Order blocks are areas where institutional traders (smart money) have placed significant orders.

**Bullish Order Blocks:**
{chr(10).join([f"- ${ob['low']:.2f} - ${ob['high']:.2f} (Date: {ob['date']})" for ob in order_blocks['bullish'][:3]]) if order_blocks['bullish'] else '- None detected'}

**Bearish Order Blocks:**
{chr(10).join([f"- ${ob['low']:.2f} - ${ob['high']:.2f} (Date: {ob['date']})" for ob in order_blocks['bearish'][:3]]) if order_blocks['bearish'] else '- None detected'}

### Fair Value Gaps (FVG)
FVGs are imbalances in price action where the market moves quickly, leaving gaps to be filled.

**Identified FVGs:**
{chr(10).join([f"- ${fvg['low']:.2f} - ${fvg['high']:.2f} ({'Filled' if fvg['filled'] else 'Unfilled'})" for fvg in fvgs[:5]]) if fvgs else '- None detected'}

### Market Structure
**Break of Structure (BOS):** {structure_breaks['bos_count']} detected
**Change of Character (CHOCH):** {structure_breaks['choch_count']} detected

**Current Trend:** {structure_breaks['trend']}

### Liquidity Zones
- **Buy-Side Liquidity**: Above ${df['High'].tail(20).max():.2f}
- **Sell-Side Liquidity**: Below ${df['Low'].tail(20).min():.2f}

### Premium/Discount Zones
- **Premium Zone**: Above ${df['Close'].tail(50).mean():.2f} (selling opportunity)
- **Discount Zone**: Below ${df['Close'].tail(50).mean():.2f} (buying opportunity)

*This analysis is for educational purposes only and not investment advice.*
"""
        
        examples.append({
            'symbol': symbol,
            'type': 'smc_analysis',
            'text': smc_text,
        })
        
        return examples
    
    def _identify_candlestick_patterns(self, df):
        """Identify candlestick patterns using pure Python (simplified)"""
        patterns = []
        
        # Get last candle
        curr = df.iloc[-1]
        prev = df.iloc[-2]
        
        # Calculate candle properties
        body_size = abs(curr['Close'] - curr['Open'])
        upper_shadow = curr['High'] - max(curr['Close'], curr['Open'])
        lower_shadow = min(curr['Close'], curr['Open']) - curr['Low']
        
        # 1. Doji (Body is very small)
        if body_size <= (curr['High'] - curr['Low']) * 0.1:
            patterns.append({'name': 'Doji', 'description': 'Indecision in the market'})
            
        # 2. Hammer (Small body, long lower shadow)
        if lower_shadow > body_size * 2 and upper_shadow < body_size * 0.5:
            patterns.append({'name': 'Hammer', 'description': 'Potential bullish reversal'})
            
        # 3. Shooting Star (Small body, long upper shadow)
        if upper_shadow > body_size * 2 and lower_shadow < body_size * 0.5:
            patterns.append({'name': 'Shooting Star', 'description': 'Potential bearish reversal'})
            
        # 4. Bullish Engulfing
        if (curr['Close'] > curr['Open'] and prev['Close'] < prev['Open'] and
            curr['Close'] > prev['Open'] and curr['Open'] < prev['Close']):
            patterns.append({'name': 'Bullish Engulfing', 'description': 'Strong bullish reversal signal'})
            
        # 5. Bearish Engulfing
        if (curr['Close'] < curr['Open'] and prev['Close'] > prev['Open'] and
            curr['Close'] < prev['Open'] and curr['Open'] > prev['Close']):
            patterns.append({'name': 'Bearish Engulfing', 'description': 'Strong bearish reversal signal'})
            
        return patterns
    
    def _identify_order_blocks(self, df):
        """Identify order blocks (simplified logic)"""
        bullish_obs = []
        bearish_obs = []
        
        # Look for strong moves preceded by consolidation
        for i in range(20, len(df) - 1):
            # Bullish OB: Strong up move after down candle
            if (df['Close'].iloc[i] > df['Open'].iloc[i] and
                df['Close'].iloc[i] - df['Open'].iloc[i] > df['Close'].iloc[i] * 0.02 and
                df['Close'].iloc[i-1] < df['Open'].iloc[i-1]):
                
                bullish_obs.append({
                    'low': df['Low'].iloc[i-1],
                    'high': df['High'].iloc[i-1],
                    'date': df.index[i-1].strftime('%Y-%m-%d'),
                })
            
            # Bearish OB: Strong down move after up candle
            if (df['Close'].iloc[i] < df['Open'].iloc[i] and
                df['Open'].iloc[i] - df['Close'].iloc[i] > df['Close'].iloc[i] * 0.02 and
                df['Close'].iloc[i-1] > df['Open'].iloc[i-1]):
                
                bearish_obs.append({
                    'low': df['Low'].iloc[i-1],
                    'high': df['High'].iloc[i-1],
                    'date': df.index[i-1].strftime('%Y-%m-%d'),
                })
        
        return {'bullish': bullish_obs[-10:], 'bearish': bearish_obs[-10:]}
    
    def _identify_fair_value_gaps(self, df):
        """Identify fair value gaps"""
        fvgs = []
        
        for i in range(2, len(df)):
            # Bullish FVG: Gap between candle 1 high and candle 3 low
            if df['Low'].iloc[i] > df['High'].iloc[i-2]:
                fvgs.append({
                    'low': df['High'].iloc[i-2],
                    'high': df['Low'].iloc[i],
                    'type': 'bullish',
                    'filled': df['Low'].iloc[i:].min() <= df['High'].iloc[i-2],
                })
            
            # Bearish FVG: Gap between candle 1 low and candle 3 high
            if df['High'].iloc[i] < df['Low'].iloc[i-2]:
                fvgs.append({
                    'low': df['High'].iloc[i],
                    'high': df['Low'].iloc[i-2],
                    'type': 'bearish',
                    'filled': df['High'].iloc[i:].max() >= df['Low'].iloc[i-2],
                })
        
        return fvgs[-20:]
    
    def _identify_structure_breaks(self, df):
        """Identify BOS and CHOCH (simplified)"""
        highs = df['High'].rolling(20).max()
        lows = df['Low'].rolling(20).min()
        
        bos_count = 0
        choch_count = 0
        
        for i in range(20, len(df)):
            # BOS: Price breaks previous high/low in trend direction
            if df['Close'].iloc[i] > highs.iloc[i-1]:
                bos_count += 1
            elif df['Close'].iloc[i] < lows.iloc[i-1]:
                bos_count += 1
        
        # Determine trend
        if df['Close'].iloc[-1] > df['Close'].iloc[-50]:
            trend = 'Bullish'
        else:
            trend = 'Bearish'
        
        return {
            'bos_count': bos_count,
            'choch_count': choch_count,
            'trend': trend,
        }
    
    def save_data(self, data, filename):
        """Save collected data as JSONL"""
        filepath = f"{self.output_dir}/{filename}"
        with open(filepath, 'w') as f:
            for item in data:
                f.write(json.dumps(item) + '\n')
        print(f"Saved {len(data)} items to {filepath}")

    def get_nse_tickers(self):
        """Fetch all active NSE equity symbols"""
        print("Fetching NSE ticker list...")
        tickers = []
        try:
            # Official NSE Archives
            url = "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv"
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                df = pd.read_csv(io.StringIO(response.text))
                tickers = [f"{x}.NS" for x in df['SYMBOL'].tolist()]
        except Exception as e:
            print(f"Error fetching NSE list: {e}")
            # Fallback
            tickers = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS"]
            
        return list(set(tickers))

    def _generate_fundamental_examples(self, symbol, info):
        """Generate fundamental analysis training examples"""
        if not info:
            return []
            
        examples = []
        
        # Extract metrics with safe defaults
        pe = info.get('trailingPE', 'N/A')
        forward_pe = info.get('forwardPE', 'N/A')
        pb = info.get('priceToBook', 'N/A')
        roe = info.get('returnOnEquity', 'N/A')
        debt_equity = info.get('debtToEquity', 'N/A')
        profit_margin = info.get('profitMargins', 'N/A')
        sector = info.get('sector', 'Unknown')
        industry = info.get('industry', 'Unknown')
        market_cap = info.get('marketCap', 0)
        
        # Format values
        roe_str = f"{roe*100:.2f}%" if isinstance(roe, (int, float)) else roe
        margin_str = f"{profit_margin*100:.2f}%" if isinstance(profit_margin, (int, float)) else profit_margin
        mcap_str = f"${market_cap/1e9:.2f}B" if isinstance(market_cap, (int, float)) else "N/A"

        text = f"""## Fundamental Analysis: {symbol}

### Company Profile
- **Sector**: {sector}
- **Industry**: {industry}
- **Market Cap**: {mcap_str}

### Valuation Metrics
- **P/E Ratio**: {pe} (Forward: {forward_pe})
- **P/B Ratio**: {pb}
- **Valuation Status**: {'Undervalued' if isinstance(pe, (int, float)) and pe < 15 else 'Overvalued' if isinstance(pe, (int, float)) and pe > 30 else 'Fairly Valued'}

### Profitability & Health
- **ROE**: {roe_str}
- **Profit Margin**: {margin_str}
- **Debt/Equity**: {debt_equity}

### Investment Thesis
Based on current metrics, {symbol} shows {'strong' if isinstance(roe, (int, float)) and roe > 0.15 else 'moderate'} profitability.
The company operates in the {industry} industry.

*This analysis is based on historical data and is not investment advice.*
"""
        examples.append({
            'symbol': symbol,
            'type': 'fundamental_analysis',
            'text': text
        })
        
        return examples

if __name__ == "__main__":
    import requests
    import io
    
    collector = TechnicalPatternsCollector()
    
    # Get full NSE list
    print("Fetching full NSE ticker list...")
    nse_tickers = collector.get_nse_tickers()
    print(f"Found {len(nse_tickers)} NSE stocks.")
    
    # Also add some US tech giants for variety
    us_tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META']
    all_tickers = nse_tickers + us_tickers
    
    print(f"Starting analysis for {len(all_tickers)} companies...")
    print("Note: This will take time. Progress is saved automatically.")
    
    technical_data = collector.collect_technical_data(all_tickers)
    collector.save_data(technical_data, 'technical_fundamental_smc.jsonl')
    
    print("Data collection complete!")
