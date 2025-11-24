"""
Enhanced Historical Data Collection (40+ Years)
Collects comprehensive market and economic data dating back to 1980s
"""

import yfinance as yf
import pandas as pd
from fredapi import Fred
from datetime import datetime, timedelta
import json
from tqdm import tqdm
import time

class HistoricalDataCollector:
    def __init__(self, fred_api_key, output_dir='./data/historical'):
        self.fred = Fred(api_key=fred_api_key)
        self.output_dir = output_dir
        
    def collect_40_years_stock_data(self):
        """Collect 40+ years of stock market data"""
        print("Collecting 40+ years of stock market data...")
        
        # Calculate date range (40 years)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=40*365)
        
        symbols_with_history = {
            # US Indices (90+ years available)
            '^GSPC': 'S&P 500',
            '^DJI': 'Dow Jones Industrial Average',
            '^IXIC': 'Nasdaq Composite',
            
            # Indian Indices
            '^NSEI': 'Nifty 50',
            '^BSESN': 'Sensex',
            
            # Major US Stocks (40+ years)
            'AAPL': 'Apple Inc.',
            'MSFT': 'Microsoft Corporation',
            'IBM': 'IBM',
            'GE': 'General Electric',
            'JNJ': 'Johnson & Johnson',
            'PG': 'Procter & Gamble',
            'KO': 'Coca-Cola',
            'XOM': 'Exxon Mobil',
            'JPM': 'JPMorgan Chase',
            'WMT': 'Walmart',
            
            # Indian Stocks (30+ years)
            'RELIANCE.NS': 'Reliance Industries',
            'TCS.NS': 'Tata Consultancy Services',
            'HDFCBANK.NS': 'HDFC Bank',
            'INFY.NS': 'Infosys',
            'ITC.NS': 'ITC Limited',
        }
        
        all_data = []
        
        for symbol, name in tqdm(symbols_with_history.items()):
            try:
                ticker = yf.Ticker(symbol)
                
                # Get maximum available history
                hist = ticker.history(start=start_date, end=end_date)
                
                if len(hist) == 0:
                    print(f"No data for {symbol}")
                    continue
                
                # Create comprehensive training text
                text = self._create_historical_text(symbol, name, hist)
                
                all_data.append({
                    'symbol': symbol,
                    'name': name,
                    'text': text,
                    'years_of_data': len(hist) / 252,  # Trading days per year
                    'start_date': hist.index[0].strftime('%Y-%m-%d'),
                    'end_date': hist.index[-1].strftime('%Y-%m-%d'),
                })
                
                time.sleep(0.5)  # Rate limiting
                
            except Exception as e:
                print(f"Error collecting {symbol}: {e}")
                continue
        
        return all_data
    
    def collect_40_years_economic_data(self):
        """Collect 40+ years of economic indicators"""
        print("Collecting 40+ years of economic data...")
        
        # Start from 1980 (44 years ago)
        start_date = '1980-01-01'
        
        indicators = {
            # US Economic Data
            'GDP': ('GDP', 'Gross Domestic Product'),
            'CPIAUCSL': ('CPI', 'Consumer Price Index (Inflation)'),
            'UNRATE': ('Unemployment', 'Unemployment Rate'),
            'DFF': ('Fed Funds Rate', 'Federal Funds Effective Rate'),
            'DGS10': ('10Y Treasury', '10-Year Treasury Constant Maturity Rate'),
            'DGS2': ('2Y Treasury', '2-Year Treasury Constant Maturity Rate'),
            'DEXUSEU': ('USD/EUR', 'US Dollar to Euro Exchange Rate'),
            'DEXJPUS': ('USD/JPY', 'US Dollar to Japanese Yen'),
            'DEXINUS': ('USD/INR', 'US Dollar to Indian Rupee'),
            'GOLDAMGBD228NLBM': ('Gold Price', 'Gold Fixing Price'),
            'DCOILWTICO': ('Oil Price', 'Crude Oil Prices: West Texas Intermediate'),
            'UMCSENT': ('Consumer Sentiment', 'University of Michigan Consumer Sentiment'),
            'HOUST': ('Housing Starts', 'Housing Starts'),
            'INDPRO': ('Industrial Production', 'Industrial Production Index'),
            'PAYEMS': ('Nonfarm Payrolls', 'All Employees: Total Nonfarm'),
        }
        
        all_data = []
        
        for series_id, (short_name, full_name) in tqdm(indicators.items()):
            try:
                # Get data from 1980
                data = self.fred.get_series(series_id, observation_start=start_date)
                
                if len(data) == 0:
                    print(f"No data for {series_id}")
                    continue
                
                # Create training text
                text = self._create_economic_historical_text(
                    series_id, short_name, full_name, data
                )
                
                all_data.append({
                    'series_id': series_id,
                    'name': short_name,
                    'full_name': full_name,
                    'text': text,
                    'years_of_data': (data.index[-1] - data.index[0]).days / 365,
                    'start_date': data.index[0].strftime('%Y-%m-%d'),
                    'end_date': data.index[-1].strftime('%Y-%m-%d'),
                })
                
                time.sleep(0.5)
                
            except Exception as e:
                print(f"Error collecting {series_id}: {e}")
                continue
        
        return all_data
    
    def _create_historical_text(self, symbol, name, hist):
        """Create comprehensive historical analysis text"""
        
        text_parts = []
        
        # Overview
        text_parts.append(f"## {name} ({symbol}) - Historical Analysis")
        text_parts.append(f"\n**Data Range**: {hist.index[0].strftime('%Y-%m-%d')} to {hist.index[-1].strftime('%Y-%m-%d')}")
        text_parts.append(f"**Years of Data**: {len(hist) / 252:.1f} years")
        
        # Decade-by-decade analysis
        text_parts.append(f"\n### Decade-by-Decade Performance")
        
        decades = [
            ('1980s', '1980-01-01', '1989-12-31'),
            ('1990s', '1990-01-01', '1999-12-31'),
            ('2000s', '2000-01-01', '2009-12-31'),
            ('2010s', '2010-01-01', '2019-12-31'),
            ('2020s', '2020-01-01', '2029-12-31'),
        ]
        
        for decade_name, start, end in decades:
            decade_data = hist[(hist.index >= start) & (hist.index <= end)]
            if len(decade_data) > 0:
                start_price = decade_data['Close'].iloc[0]
                end_price = decade_data['Close'].iloc[-1]
                return_pct = ((end_price - start_price) / start_price * 100)
                
                text_parts.append(f"\n**{decade_name}**:")
                text_parts.append(f"- Start: ${start_price:.2f}")
                text_parts.append(f"- End: ${end_price:.2f}")
                text_parts.append(f"- Return: {return_pct:+.2f}%")
        
        # Major events and crashes
        text_parts.append(f"\n### Major Market Events")
        
        events = self._identify_major_events(hist)
        for event in events:
            text_parts.append(f"- **{event['date']}**: {event['description']}")
        
        # Long-term statistics
        text_parts.append(f"\n### Long-term Statistics")
        text_parts.append(f"- **All-Time High**: ${hist['High'].max():.2f} ({hist['High'].idxmax().strftime('%Y-%m-%d')})")
        text_parts.append(f"- **All-Time Low**: ${hist['Low'].min():.2f} ({hist['Low'].idxmin().strftime('%Y-%m-%d')})")
        text_parts.append(f"- **Average Price (40Y)**: ${hist['Close'].mean():.2f}")
        text_parts.append(f"- **Total Return**: {((hist['Close'].iloc[-1] - hist['Close'].iloc[0]) / hist['Close'].iloc[0] * 100):+.2f}%")
        text_parts.append(f"- **Annualized Return**: {(((hist['Close'].iloc[-1] / hist['Close'].iloc[0]) ** (1 / (len(hist) / 252))) - 1) * 100:.2f}%")
        
        return "\n".join(text_parts)
    
    def _create_economic_historical_text(self, series_id, short_name, full_name, data):
        """Create economic indicator historical text"""
        
        text_parts = []
        
        text_parts.append(f"## {full_name} ({short_name})")
        text_parts.append(f"\n**Series ID**: {series_id}")
        text_parts.append(f"**Data Range**: {data.index[0].strftime('%Y-%m-%d')} to {data.index[-1].strftime('%Y-%m-%d')}")
        text_parts.append(f"**Years of Data**: {(data.index[-1] - data.index[0]).days / 365:.1f} years")
        
        # Current vs Historical
        text_parts.append(f"\n### Current vs Historical")
        text_parts.append(f"- **Latest Value**: {data.iloc[-1]:.2f}")
        text_parts.append(f"- **40-Year Average**: {data.mean():.2f}")
        text_parts.append(f"- **40-Year High**: {data.max():.2f} ({data.idxmax().strftime('%Y-%m-%d')})")
        text_parts.append(f"- **40-Year Low**: {data.min():.2f} ({data.idxmin().strftime('%Y-%m-%d')})")
        
        # Decade averages
        text_parts.append(f"\n### Decade Averages")
        
        decades = [
            ('1980s', '1980-01-01', '1989-12-31'),
            ('1990s', '1990-01-01', '1999-12-31'),
            ('2000s', '2000-01-01', '2009-12-31'),
            ('2010s', '2010-01-01', '2019-12-31'),
            ('2020s', '2020-01-01', '2029-12-31'),
        ]
        
        for decade_name, start, end in decades:
            decade_data = data[(data.index >= start) & (data.index <= end)]
            if len(decade_data) > 0:
                text_parts.append(f"- **{decade_name}**: {decade_data.mean():.2f}")
        
        return "\n".join(text_parts)
    
    def _identify_major_events(self, hist):
        """Identify major market events (crashes, rallies)"""
        events = []
        
        # Calculate daily returns
        returns = hist['Close'].pct_change()
        
        # Find largest single-day drops
        largest_drops = returns.nsmallest(5)
        for date, ret in largest_drops.items():
            if ret < -0.05:  # More than 5% drop
                events.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'description': f"Major decline of {ret*100:.2f}%"
                })
        
        # Find largest single-day gains
        largest_gains = returns.nlargest(5)
        for date, ret in largest_gains.items():
            if ret > 0.05:  # More than 5% gain
                events.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'description': f"Major rally of {ret*100:.2f}%"
                })
        
        return sorted(events, key=lambda x: x['date'])
    
    def save_data(self, data, filename):
        """Save collected data as JSONL"""
        filepath = f"{self.output_dir}/{filename}"
        with open(filepath, 'w') as f:
            for item in data:
                f.write(json.dumps(item) + '\n')
        print(f"Saved {len(data)} items to {filepath}")

if __name__ == "__main__":
    # Get FRED API key
    fred_api_key = "your_fred_api_key_here"  # Replace with your key
    
    collector = HistoricalDataCollector(fred_api_key)
    
    # Collect 40+ years of stock data
    print("Collecting 40+ years of stock market data...")
    stock_data = collector.collect_40_years_stock_data()
    collector.save_data(stock_data, 'historical_stocks_40y.jsonl')
    
    # Collect 40+ years of economic data
    print("Collecting 40+ years of economic data...")
    economic_data = collector.collect_40_years_economic_data()
    collector.save_data(economic_data, 'historical_economic_40y.jsonl')
    
    print("Historical data collection complete!")
    print(f"Total stock datasets: {len(stock_data)}")
    print(f"Total economic datasets: {len(economic_data)}")
