"""
News and Financial Filings Collection
Collects: SEC filings, BSE/NSE announcements, financial news
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime, timedelta
import json
from tqdm import tqdm
import time

import os

class NewsFilingsCollector:
    def __init__(self, output_dir='./data/news'):
        self.output_dir = output_dir
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
    def collect_sec_filings(self, ciks, filing_types=['10-K', '10-Q', '8-K']):
        """Collect SEC EDGAR filings"""
        print(f"Collecting SEC filings for {len(ciks)} companies...")
        
        all_filings = []
        
        for cik in tqdm(ciks):
            for filing_type in filing_types:
                try:
                    # SEC EDGAR API
                    url = f"https://www.sec.gov/cgi-bin/browse-edgar"
                    params = {
                        'action': 'getcompany',
                        'CIK': cik,
                        'type': filing_type,
                        'dateb': '',
                        'owner': 'exclude',
                        'count': 10,
                    }
                    
                    headers = {
                        'User-Agent': 'Mozilla/5.0'
                    }
                    
                    response = requests.get(url, params=params, headers=headers)
                    
                    # Parse filing information
                    # (Simplified - in production, download and parse actual filings)
                    
                    filing_text = f"""## SEC Filing: {filing_type} for CIK {cik}

### Filing Type: {filing_type}

**{filing_type} Filings:**
- **10-K**: Annual report with comprehensive financial information
- **10-Q**: Quarterly report with unaudited financial statements
- **8-K**: Current report for material events

### Key Sections:
- Business Overview
- Risk Factors
- Financial Statements
- Management Discussion & Analysis (MD&A)
- Notes to Financial Statements

*SEC filings provide detailed financial and operational information for public companies.*
"""
                    
                    all_filings.append({
                        'cik': cik,
                        'filing_type': filing_type,
                        'text': filing_text,
                    })
                    
                    time.sleep(0.5)  # Rate limiting
                    
                except Exception as e:
                    print(f"Error collecting {filing_type} for {cik}: {e}")
                    continue
        
        return all_filings
    
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
            tickers = ["RELIANCE.NS", "TCS.NS"]
        return list(set(tickers))

    def collect_financial_news(self, symbols):
        """Collect financial news articles using yfinance"""
        print(f"Collecting news for {len(symbols)} companies...")
        
        news_articles = []
        
        for symbol in tqdm(symbols):
            try:
                ticker = yf.Ticker(symbol)
                news = ticker.news
                
                if not news:
                    continue
                    
                for article in news:
                    title = article.get('title', '')
                    link = article.get('link', '')
                    publisher = article.get('publisher', '')
                    pub_date = datetime.fromtimestamp(article.get('providerPublishTime', 0)).strftime('%Y-%m-%d')
                    
                    text = f"""## News: {title}
                    
**Symbol**: {symbol}
**Date**: {pub_date}
**Source**: {publisher}

**Summary**:
{title}

*Read more at: {link}*
"""
                    news_articles.append({
                        'symbol': symbol,
                        'title': title,
                        'date': pub_date,
                        'text': text,
                        'link': link
                    })
                    
            except Exception as e:
                # print(f"Error fetching news for {symbol}: {e}")
                continue
        
        return news_articles
    
    def save_data(self, data, filename):
        """Save collected data as JSONL"""
        filepath = f"{self.output_dir}/{filename}"
        with open(filepath, 'w') as f:
            for item in data:
                f.write(json.dumps(item) + '\n')
        print(f"Saved {len(data)} items to {filepath}")

if __name__ == "__main__":
    import yfinance as yf
    import io
    
    collector = NewsFilingsCollector()
    
    # Get full NSE list
    print("Fetching full NSE ticker list...")
    nse_tickers = collector.get_nse_tickers()
    print(f"Found {len(nse_tickers)} NSE stocks.")
    
    # Collect news
    print("Collecting financial news...")
    news = collector.collect_financial_news(nse_tickers)
    collector.save_data(news, 'financial_news.jsonl')
    
    print("News collection complete!")
