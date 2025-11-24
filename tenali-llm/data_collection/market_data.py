"""
Market Data Collection for Tenali LLM
Collects: Stock prices, fundamentals, earnings, IPO data
Sources: Yahoo Finance, SEC EDGAR, BSE/NSE
"""

import yfinance as yf
import pandas as pd
import requests
from datetime import datetime, timedelta
from tqdm import tqdm
import json
import time

class MarketDataCollector:
    def __init__(self, output_dir='./data/market'):
        self.output_dir = output_dir
        
    def collect_stock_data(self, symbols, years=10):
        """Collect comprehensive stock data"""
        print(f"Collecting data for {len(symbols)} stocks...")
        
        all_data = []
        
        for symbol in tqdm(symbols):
            try:
                ticker = yf.Ticker(symbol)
                
                # Historical prices
                end_date = datetime.now()
                start_date = end_date - timedelta(days=years*365)
                hist = ticker.history(start=start_date, end=end_date)
                
                # Company info
                info = ticker.info
                
                # Financials
                financials = ticker.financials
                balance_sheet = ticker.balance_sheet
                cashflow = ticker.cashflow
                
                # Earnings
                earnings = ticker.earnings
                quarterly_earnings = ticker.quarterly_earnings
                
                # Create training text
                text = self._create_stock_text(
                    symbol, info, hist, financials, 
                    balance_sheet, cashflow, earnings
                )
                
                all_data.append({
                    'symbol': symbol,
                    'text': text,
                    'metadata': {
                        'sector': info.get('sector', 'Unknown'),
                        'industry': info.get('industry', 'Unknown'),
                        'market_cap': info.get('marketCap', 0),
                    }
                })
                
                time.sleep(0.5)  # Rate limiting
                
            except Exception as e:
                print(f"Error collecting {symbol}: {e}")
                continue
        
        return all_data
    
    def _create_stock_text(self, symbol, info, hist, financials, balance_sheet, cashflow, earnings):
        """Convert stock data into natural language training text"""
        
        text_parts = []
        
        # Company Overview
        text_parts.append(f"## {symbol} - {info.get('longName', symbol)}")
        text_parts.append(f"\n**Sector**: {info.get('sector', 'N/A')}")
        text_parts.append(f"**Industry**: {info.get('industry', 'N/A')}")
        text_parts.append(f"**Market Cap**: ${info.get('marketCap', 0)/1e9:.2f}B")
        text_parts.append(f"\n**Business Summary**: {info.get('longBusinessSummary', 'N/A')}")
        
        # Fundamental Metrics
        text_parts.append(f"\n### Fundamental Analysis")
        text_parts.append(f"- **P/E Ratio**: {info.get('trailingPE', 'N/A')}")
        text_parts.append(f"- **Forward P/E**: {info.get('forwardPE', 'N/A')}")
        text_parts.append(f"- **PEG Ratio**: {info.get('pegRatio', 'N/A')}")
        text_parts.append(f"- **Price to Book**: {info.get('priceToBook', 'N/A')}")
        text_parts.append(f"- **Dividend Yield**: {info.get('dividendYield', 0)*100:.2f}%")
        text_parts.append(f"- **ROE**: {info.get('returnOnEquity', 0)*100:.2f}%")
        text_parts.append(f"- **ROA**: {info.get('returnOnAssets', 0)*100:.2f}%")
        text_parts.append(f"- **Profit Margin**: {info.get('profitMargins', 0)*100:.2f}%")
        text_parts.append(f"- **Operating Margin**: {info.get('operatingMargins', 0)*100:.2f}%")
        
        # Revenue & Earnings Growth
        if not earnings.empty:
            text_parts.append(f"\n### Earnings History")
            for idx, row in earnings.iterrows():
                text_parts.append(f"- **{idx}**: Revenue ${row.get('Revenue', 0)/1e9:.2f}B, Earnings ${row.get('Earnings', 0)/1e9:.2f}B")
        
        # Technical Analysis
        if not hist.empty:
            latest = hist.iloc[-1]
            sma_50 = hist['Close'].rolling(50).mean().iloc[-1]
            sma_200 = hist['Close'].rolling(200).mean().iloc[-1]
            
            text_parts.append(f"\n### Technical Analysis")
            text_parts.append(f"- **Current Price**: ${latest['Close']:.2f}")
            text_parts.append(f"- **52-Week High**: ${hist['High'].tail(252).max():.2f}")
            text_parts.append(f"- **52-Week Low**: ${hist['Low'].tail(252).min():.2f}")
            text_parts.append(f"- **50-Day SMA**: ${sma_50:.2f}")
            text_parts.append(f"- **200-Day SMA**: ${sma_200:.2f}")
            text_parts.append(f"- **Trend**: {'Bullish' if latest['Close'] > sma_200 else 'Bearish'}")
        
        return "\n".join(text_parts)
    
    def collect_indian_stocks(self):
        """Collect Nifty 50 + top 200 Indian stocks"""
        nifty_50 = [
            'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'HINDUNILVR.NS',
            'ICICIBANK.NS', 'KOTAKBANK.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS',
            'AXISBANK.NS', 'LT.NS', 'ASIANPAINT.NS', 'MARUTI.NS', 'HCLTECH.NS',
            'BAJFINANCE.NS', 'WIPRO.NS', 'ULTRACEMCO.NS', 'TITAN.NS', 'NESTLEIND.NS',
            # Add more...
        ]
        
        return self.collect_stock_data(nifty_50)
    
    def collect_us_stocks(self):
        """Collect S&P 500 stocks"""
        # Top 50 S&P 500 stocks
        sp_500_top = [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK-B',
            'UNH', 'JNJ', 'JPM', 'V', 'PG', 'XOM', 'MA', 'HD', 'CVX', 'MRK',
            'ABBV', 'PEP', 'KO', 'AVGO', 'COST', 'WMT', 'MCD', 'CSCO', 'ACN',
            # Add more...
        ]
        
        return self.collect_stock_data(sp_500_top)
    
    def collect_ipo_data(self):
        """Collect IPO data and listing performance"""
        # This would scrape from sources like:
        # - BSE/NSE IPO pages
        # - NASDAQ IPO calendar
        # - IPO databases
        pass
    
    def save_data(self, data, filename):
        """Save collected data as JSONL"""
        filepath = f"{self.output_dir}/{filename}"
        with open(filepath, 'w') as f:
            for item in data:
                f.write(json.dumps(item) + '\n')
        print(f"Saved {len(data)} items to {filepath}")

if __name__ == "__main__":
    collector = MarketDataCollector()
    
    # Collect Indian stocks
    print("Collecting Indian stock data...")
    indian_data = collector.collect_indian_stocks()
    collector.save_data(indian_data, 'indian_stocks.jsonl')
    
    # Collect US stocks
    print("Collecting US stock data...")
    us_data = collector.collect_us_stocks()
    collector.save_data(us_data, 'us_stocks.jsonl')
    
    print("Market data collection complete!")
