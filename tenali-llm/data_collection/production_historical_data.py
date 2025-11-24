"""
Tenali Production Data Engine
-----------------------------
A robust, resumable pipeline to harvest 40+ years of financial data for the entire
US and Indian stock universe (NSE + BSE).

Features:
- Dynamic Ticker Discovery (NSE, BSE, NYSE, NASDAQ)
- Resumable Execution (saves progress)
- Deep History Extraction (Max available)
- LLM-Ready Formatting (Instruction tuning)
- Error Handling & Rate Limiting

Usage:
    python production_historical_data.py
"""

import yfinance as yf
import pandas as pd
import numpy as np
import json
import os
import time
import random
from datetime import datetime
from tqdm import tqdm
import requests
import io

# Configuration
DATA_DIR = "./data/production_historical"
PROGRESS_FILE = "collection_progress.json"
OUTPUT_FILE = "tenali_market_corpus.jsonl"
BATCH_SIZE = 100  # Save every 100 stocks
MIN_YEARS_HISTORY = 3 # Skip stocks with less than this history

class TenaliDataEngine:
    def __init__(self):
        self.setup_directories()
        self.processed_symbols = self.load_progress()
        
    def setup_directories(self):
        if not os.path.exists(DATA_DIR):
            os.makedirs(DATA_DIR)
            
    def load_progress(self):
        if os.path.exists(PROGRESS_FILE):
            with open(PROGRESS_FILE, 'r') as f:
                return set(json.load(f))
        return set()

    def save_progress(self):
        with open(PROGRESS_FILE, 'w') as f:
            json.dump(list(self.processed_symbols), f)

    def get_indian_tickers(self):
        """Fetch all active NSE equity symbols"""
        print("Fetching Indian (NSE) ticker list...")
        tickers = []
        
        # 1. Official NSE Source
        try:
            print("Downloading official NSE equity list...")
            # Official NSE Archives - List of active equities
            url = "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                df = pd.read_csv(io.StringIO(response.text))
                # NSE symbols need .NS suffix for yfinance
                nse_tickers = [f"{x}.NS" for x in df['SYMBOL'].tolist()]
                tickers.extend(nse_tickers)
                print(f"Successfully loaded {len(nse_tickers)} NSE tickers from official source.")
        except Exception as e:
            print(f"Official NSE source failed: {e}")

        # 2. Backup Source (GitHub) if official fails or returns few
        if len(tickers) < 100:
            try:
                print("Attempting backup NSE source...")
                # A reliable maintained list of NSE stocks
                url = "https://raw.githubusercontent.com/shaktids/stock_market_data/master/nse-listed.csv"
                df = pd.read_csv(url)
                if 'Symbol' in df.columns:
                    backup_tickers = [f"{x}.NS" for x in df['Symbol'].tolist()]
                    tickers.extend(backup_tickers)
                    print(f"Loaded {len(backup_tickers)} NSE tickers from backup source.")
            except Exception as e:
                print(f"Backup source failed: {e}")

        # 3. Hardcoded Fallback (Top 50) just in case everything fails
        if len(tickers) == 0:
            print("All sources failed. Using hardcoded Nifty 50 list.")
            tickers = [
                "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "ICICIBANK.NS", "INFY.NS", "BHARTIARTL.NS",
                "ITC.NS", "SBIN.NS", "LICI.NS", "HINDUNILVR.NS", "LT.NS", "BAJFINANCE.NS",
                "HCLTECH.NS", "MARUTI.NS", "SUNPHARMA.NS", "ADANIENT.NS", "TATAMOTORS.NS",
                "KOTAKBANK.NS", "AXISBANK.NS", "NTPC.NS", "ULTRACEMCO.NS", "ONGC.NS",
                "TITAN.NS", "POWERGRID.NS", "ADANIGREEN.NS", "ADANIPORTS.NS", "WIPRO.NS",
                "M&M.NS", "BAJAJFINSV.NS", "HAL.NS", "DLF.NS", "LTIM.NS", "SIEMENS.NS",
                "SBILIFE.NS", "PIDILITIND.NS", "GRASIM.NS", "TECHM.NS", "BEL.NS",
                "HINDALCO.NS", "IOC.NS", "TATASTEEL.NS", "VBL.NS", "ZOMATO.NS",
                "JIOFIN.NS", "GAIL.NS", "RECLTD.NS", "BRITANNIA.NS", "BANKBARODA.NS",
                "INDIGO.NS", "GODREJCP.NS", "TRENT.NS", "PFC.NS", "TATAPOWER.NS"
            ]

        # Deduplicate
        tickers = list(set(tickers))
        print(f"Total Unique NSE Tickers Loaded: {len(tickers)}")
        return tickers

    def get_us_tickers(self):
        """Fetch all active US equity symbols (NYSE/NASDAQ)"""
        print("Fetching US ticker list...")
        try:
            # Download NASDAQ traded symbols
            url = "http://www.nasdaqtrader.com/dynamic/SymDir/nasdaqtraded.txt"
            df = pd.read_csv(url, sep='|')
            # Filter for stocks only (exclude tests, ETFs if desired, but we want all market data)
            # We'll keep it broad.
            us_tickers = df[df['Test Issue'] == 'N']['Symbol'].tolist()
            print(f"Loaded {len(us_tickers)} US tickers.")
            return us_tickers
        except Exception as e:
            print(f"Error fetching US tickers: {e}")
            # Fallback list
            return ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "BRK-B", "LLY", "V"]

    def fetch_history(self, symbol):
        """Fetch max history for a symbol with error handling"""
        try:
            ticker = yf.Ticker(symbol)
            # Fetch max history
            hist = ticker.history(period="max")
            
            if hist.empty:
                return None, None # FIXED: Return tuple
                
            # Basic cleaning
            hist = hist.reset_index()
            hist['Date'] = pd.to_datetime(hist['Date']).dt.date
            return hist, ticker.info
        except Exception as e:
            # print(f"Failed to fetch {symbol}: {e}") # Optional logging
            return None, None # FIXED: Return tuple

    def generate_llm_narrative(self, symbol, info, hist):
        """Convert raw data into the Tenali Persona narrative"""
        if len(hist) < 252 * MIN_YEARS_HISTORY:
            return None # Skip stocks with too little history for "long term" analysis
            
        start_date = hist['Date'].iloc[0]
        end_date = hist['Date'].iloc[-1]
        years = (end_date - start_date).days / 365.25
        
        # Calculate key stats
        all_time_high = hist['High'].max()
        all_time_low = hist['Low'].min()
        current_price = hist['Close'].iloc[-1]
        
        # Calculate CAGR
        start_price = hist['Close'].iloc[0]
        if start_price > 0:
            cagr = (current_price / start_price) ** (1/years) - 1
        else:
            cagr = 0

        # Sector/Industry
        sector = info.get('sector', 'Unknown')
        industry = info.get('industry', 'Unknown')
        name = info.get('longName', symbol)

        # Narrative Construction
        narrative = f"""## {name} ({symbol}) - Comprehensive Market Analysis

### Executive Summary
{name} is a key player in the {industry} industry ({sector}). 
Data covers the period from {start_date} to {end_date} ({years:.1f} years).
The stock has delivered a Compound Annual Growth Rate (CAGR) of {cagr*100:.2f}% over this period.

### Historical Price Action
- **All-Time High**: ${all_time_high:.2f}
- **All-Time Low**: ${all_time_low:.2f}
- **Current Level**: ${current_price:.2f} (as of {end_date})

### Decade Performance Analysis
"""
        # Decade Loop
        hist['Year'] = pd.to_datetime(hist['Date']).dt.year
        decades = hist['Year'].unique() // 10 * 10
        unique_decades = sorted(list(set(decades)))
        
        for decade in unique_decades:
            decade_data = hist[hist['Year'] // 10 * 10 == decade]
            if not decade_data.empty:
                d_start = decade_data['Close'].iloc[0]
                d_end = decade_data['Close'].iloc[-1]
                d_return = ((d_end - d_start) / d_start) * 100
                narrative += f"- **{decade}s**: {d_return:+.2f}% return (Open: {d_start:.2f}, Close: {d_end:.2f})\n"

        narrative += """
### Volatility & Risk Profile
"""
        # Calculate Volatility (Annualized Std Dev of daily returns)
        hist['Returns'] = hist['Close'].pct_change()
        volatility = hist['Returns'].std() * np.sqrt(252) * 100
        narrative += f"- **Annualized Volatility**: {volatility:.2f}%\n"
        
        # Max Drawdown
        rolling_max = hist['Close'].cummax()
        drawdown = hist['Close'] / rolling_max - 1.0
        max_drawdown = drawdown.min() * 100
        narrative += f"- **Max Drawdown**: {max_drawdown:.2f}% (Historical worst decline)\n"

        narrative += """
### Technical Structure (Long Term)
"""
        # Simple Moving Averages
        sma200 = hist['Close'].rolling(window=200).mean().iloc[-1]
        sma50 = hist['Close'].rolling(window=50).mean().iloc[-1]
        
        trend = "Bullish" if current_price > sma200 else "Bearish"
        narrative += f"- **Primary Trend**: {trend} (Price vs 200 SMA)\n"
        narrative += f"- **200-Day SMA**: {sma200:.2f}\n"
        narrative += f"- **50-Day SMA**: {sma50:.2f}\n"

        narrative += "\n*Data generated for Tenali LLM Training. Educational use only.*"
        
        return {
            "instruction": f"Analyze the long-term historical performance and market structure of {name} ({symbol}).",
            "input": f"Sector: {sector}, Industry: {industry}, Data Range: {start_date} to {end_date}",
            "output": narrative,
            "system": "You are Tenali, an advanced AI financial analyst."
        }

    def run(self):
        print("Starting Tenali Production Data Engine...")
        
        # 1. Gather Universe
        us_tickers = self.get_us_tickers()
        ind_tickers = self.get_indian_tickers()
        all_tickers = list(set(us_tickers + ind_tickers))
        
        # Filter out already processed
        to_process = [t for t in all_tickers if t not in self.processed_symbols]
        random.shuffle(to_process) # Shuffle to mix US/India data in batches
        
        print(f"Total Universe: {len(all_tickers)}")
        print(f"Already Processed: {len(self.processed_symbols)}")
        print(f"Remaining: {len(to_process)}")
        
        batch_data = []
        
        # 2. Processing Loop
        pbar = tqdm(to_process, desc="Harvesting Data")
        for symbol in pbar:
            # Rate limit protection (yfinance is lenient but let's be safe)
            time.sleep(0.1) 
            
            hist, info = self.fetch_history(symbol)
            
            if hist is not None and info is not None:
                training_example = self.generate_llm_narrative(symbol, info, hist)
                
                if training_example:
                    batch_data.append(training_example)
            
            self.processed_symbols.add(symbol)
            
            # Batch Save
            if len(batch_data) >= BATCH_SIZE:
                self.save_batch(batch_data)
                self.save_progress()
                batch_data = []
                pbar.set_postfix({"Saved": len(self.processed_symbols)})
        
        # Final Save
        if batch_data:
            self.save_batch(batch_data)
            self.save_progress()
            
        print("Data Collection Complete!")

    def save_batch(self, data):
        with open(os.path.join(DATA_DIR, OUTPUT_FILE), 'a') as f:
            for item in data:
                f.write(json.dumps(item) + '\n')

if __name__ == "__main__":
    engine = TenaliDataEngine()
    engine.run()
