"""
Economic Data Collection for Tenali LLM
Collects: Macro indicators, GDP, inflation, interest rates, central bank policies
Sources: FRED, World Bank, RBI, ECB
"""

import pandas as pd
from pandas_datareader import wb
from fredapi import Fred
import requests
from datetime import datetime, timedelta
import json
from tqdm import tqdm
import os
from pathlib import Path
from dotenv import load_dotenv

class EconomicDataCollector:
    def __init__(self, fred_api_key, output_dir='./data/economic'):
        self.fred = None
        if fred_api_key and "your_fred_api_key" not in fred_api_key:
            try:
                self.fred = Fred(api_key=fred_api_key)
            except Exception as e:
                print(f"Error initializing FRED: {e}")
        
        self.output_dir = output_dir
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

    def collect_economic_reforms(self):
        """Collect data on major economic reforms"""
        print("Collecting major economic reforms data...")
        
        reforms = [
            {
                "name": "Indian Economic Liberalization (1991)",
                "country": "India",
                "year": 1991,
                "description": "Dismantling of the 'License Raj', reduction of tariffs, and opening sectors to foreign investment.",
                "impact": "Accelerated GDP growth to 6-8% range, integrated India into global economy."
            },
            {
                "name": "Goods and Services Tax (GST)",
                "country": "India",
                "year": 2017,
                "description": "Unified indirect tax system replacing multiple state and central taxes.",
                "impact": "Streamlined logistics, formalized the economy, increased tax base."
            },
            {
                "name": "Demonetization",
                "country": "India",
                "year": 2016,
                "description": "Withdrawal of ₹500 and ₹1000 banknotes to curb black money.",
                "impact": "Temporary liquidity crunch, push towards digital payments."
            },
            {
                "name": "US New Deal",
                "country": "USA",
                "year": 1933,
                "description": "Series of programs, public work projects, financial reforms, and regulations enacted by President Franklin D. Roosevelt.",
                "impact": "Relief for the unemployed, recovery of the economy, reform of the financial system."
            },
            {
                "name": "Volcker Shock",
                "country": "USA",
                "year": 1980,
                "description": "Fed Chair Paul Volcker raised interest rates to 20% to crush inflation.",
                "impact": "Ended stagflation but caused a recession; established Fed credibility."
            },
            {
                "name": "China's Open Door Policy",
                "country": "China",
                "year": 1978,
                "description": "Deng Xiaoping's reform opening China to foreign investment and market mechanisms.",
                "impact": "Transformed China into the world's manufacturing hub and second-largest economy."
            }
        ]
        
        data = []
        for reform in reforms:
            text = f"""## Economic Reform: {reform['name']}

**Country**: {reform['country']}
**Year**: {reform['year']}

**Description**:
{reform['description']}

**Economic Impact**:
{reform['impact']}

*Studying reforms helps understand structural shifts in an economy.*
"""
            data.append({
                'indicator': f"Reform - {reform['name']}",
                'text': text
            })
            
        return data

    def collect_global_crisis_data(self):
        """Collect historical financial crisis data"""
        print("Collecting global financial crisis data...")
        
        crises = [
            {
                "name": "Great Depression",
                "period": "1929-1939",
                "description": "Severe worldwide economic depression. Stock market crash of 1929.",
                "impact": "Global GDP fell by 15%, unemployment reached 25% in US."
            },
            {
                "name": "Dot-com Bubble",
                "period": "2000-2002",
                "description": "Collapse of technology stock valuations.",
                "impact": "Nasdaq fell 78% from peak."
            },
            {
                "name": "Global Financial Crisis (GFC)",
                "period": "2007-2009",
                "description": "Subprime mortgage crisis leading to banking collapse.",
                "impact": "S&P 500 fell 57%, global recession."
            },
            {
                "name": "COVID-19 Crash",
                "period": "2020",
                "description": "Pandemic-induced market crash.",
                "impact": "Rapid 34% drop in S&P 500, followed by massive stimulus and recovery."
            },
            {
                "name": "Asian Financial Crisis",
                "period": "1997",
                "description": "Currency devaluations in East Asia.",
                "impact": "Market crashes in Thailand, Indonesia, South Korea."
            }
        ]
        
        data = []
        for crisis in crises:
            text = f"""## Historical Crisis: {crisis['name']}
            
**Period**: {crisis['period']}

**Description**:
{crisis['description']}

**Economic Impact**:
{crisis['impact']}

*Understanding historical crises is crucial for risk management and identifying market cycles.*
"""
            data.append({
                'indicator': f"Crisis - {crisis['name']}",
                'text': text
            })
            
        return data

    def collect_us_economic_data(self):
        """Collect US economic indicators from FRED"""
        print("Collecting US economic data...")
        
        if not self.fred:
            print("Skipping US data: FRED API key missing or invalid.")
            return []
            
        indicators = {
            'GDP': 'GDP',
            'Inflation (CPI)': 'CPIAUCSL',
            'Unemployment Rate': 'UNRATE',
            'Federal Funds Rate': 'DFF',
            'Treasury Yield 10Y': 'DGS10',
            'Treasury Yield 2Y': 'DGS2',
            'Consumer Confidence': 'UMCSENT',
            'Retail Sales': 'RSXFS',
            'Industrial Production': 'INDPRO',
            'Housing Starts': 'HOUST',
            'PMI Manufacturing': 'MANEMP',
            'Trade Balance': 'BOPGSTB',
        }
        
        all_data = []
        
        for name, series_id in tqdm(indicators.items()):
            try:
                data = self.fred.get_series(series_id)
                text = self._create_economic_text(name, series_id, data)
                all_data.append({
                    'indicator': name,
                    'series_id': series_id,
                    'text': text,
                })
            except Exception as e:
                print(f"Error collecting {name}: {e}")
                continue
        
        return all_data
    
    def _create_economic_text(self, name, series_id, data):
        """Convert economic data into training text"""
        
        text_parts = []
        
        # Overview
        text_parts.append(f"## {name} ({series_id})")
        text_parts.append(f"\n**Latest Value**: {data.iloc[-1]:.2f}")
        text_parts.append(f"**Date**: {data.index[-1].strftime('%Y-%m-%d')}")
        
        # Historical trends
        text_parts.append(f"\n### Historical Trends")
        
        # Year-over-year change
        yoy_change = ((data.iloc[-1] - data.iloc[-12]) / data.iloc[-12] * 100) if len(data) >= 12 else 0
        text_parts.append(f"- **YoY Change**: {yoy_change:+.2f}%")
        
        # 5-year average
        avg_5y = data.tail(60).mean()
        text_parts.append(f"- **5-Year Average**: {avg_5y:.2f}")
        
        # Recent trend
        recent_trend = "Increasing" if data.iloc[-1] > data.iloc[-6] else "Decreasing"
        text_parts.append(f"- **Recent Trend**: {recent_trend}")
        
        # Key levels
        text_parts.append(f"\n### Key Levels")
        text_parts.append(f"- **All-Time High**: {data.max():.2f} ({data.idxmax().strftime('%Y-%m-%d')})")
        text_parts.append(f"- **All-Time Low**: {data.min():.2f} ({data.idxmin().strftime('%Y-%m-%d')})")
        
        # Economic interpretation
        text_parts.append(f"\n### Economic Interpretation")
        if 'GDP' in name:
            text_parts.append("GDP growth indicates economic expansion. Higher GDP typically supports equity markets.")
        elif 'Inflation' in name or 'CPI' in name:
            text_parts.append("Rising inflation may lead to tighter monetary policy. Central banks monitor this closely.")
        elif 'Unemployment' in name:
            text_parts.append("Lower unemployment indicates a strong labor market. Fed targets maximum employment.")
        elif 'Rate' in name or 'Yield' in name:
            text_parts.append("Interest rates affect borrowing costs and asset valuations. Yield curve shape signals economic outlook.")
        
        return "\n".join(text_parts)
    
    def collect_indian_economic_data(self):
        """Collect Indian economic indicators from World Bank"""
        print("Collecting Indian economic data (World Bank)...")
        
        indicators = {
            'India GDP': 'NY.GDP.MKTP.CD',
            'India Inflation': 'FP.CPI.TOTL.ZG',
            'India Unemployment': 'SL.UEM.TOTL.ZS',
        }
        
        all_data = []
        
        for name, indicator_code in indicators.items():
            try:
                # Correct usage of pandas_datareader for World Bank
                data = wb.download(indicator=indicator_code, country='IND', start=1990, end=2024)
                
                if not data.empty:
                    latest_val = data.iloc[0].values[0]
                    text = f"## {name}\n\nLatest Value: {latest_val:.2f}\n\n"
                    text += f"Historical data from World Bank for {name}.\n"
                    
                    all_data.append({
                        'indicator': name,
                        'text': text,
                    })
            except Exception as e:
                print(f"Error collecting {name}: {e}")
                continue
        
        return all_data
    
    def collect_central_bank_policies(self):
        """Collect central bank policy statements"""
        text = """
## Central Bank Policies

### Federal Reserve (Fed)
The Federal Reserve uses monetary policy tools to achieve maximum employment and price stability.

**Key Tools:**
- Federal Funds Rate: Primary policy rate
- Quantitative Easing (QE): Asset purchases
- Forward Guidance: Communication strategy

**Recent Policy Stance:**
- Inflation targeting: 2% PCE
- Dual mandate: Maximum employment + price stability
- Data-dependent approach

### European Central Bank (ECB)
The ECB aims for price stability in the Eurozone.

**Key Tools:**
- Main Refinancing Rate
- Asset Purchase Programme (APP)
- Targeted Longer-Term Refinancing Operations (TLTROs)

### Reserve Bank of India (RBI)
The RBI maintains price stability while supporting growth.

**Key Tools:**
- Repo Rate: Primary policy rate
- Cash Reserve Ratio (CRR)
- Statutory Liquidity Ratio (SLR)
"""
        
        return [{'indicator': 'Central Bank Policies', 'text': text}]
    
    def save_data(self, data, filename):
        """Save collected data as JSONL"""
        filepath = f"{self.output_dir}/{filename}"
        with open(filepath, 'w') as f:
            for item in data:
                f.write(json.dumps(item) + '\n')
        print(f"Saved {len(data)} items to {filepath}")

if __name__ == "__main__":
    # Load environment variables from multiple locations
    load_dotenv()  # Load from current directory .env
    
    # Also try loading from finos-app/.env.local
    finos_env = Path('../finos-app/.env.local')
    if finos_env.exists():
        print(f"Loading env from {finos_env}")
        load_dotenv(dotenv_path=finos_env)
    
    # Get FRED API key (check both variable names)
    fred_api_key = os.getenv("FRED_API_KEY") or os.getenv("NEXT_PUBLIC_FRED_API_KEY")
    
    if not fred_api_key:
        print("Warning: FRED_API_KEY not found. US economic data will be skipped.")
        print("Please add FRED_API_KEY=your_key to tenali-llm/.env or finos-app/.env.local")
    
    collector = EconomicDataCollector(fred_api_key)
    
    # Run collections
    us_data = collector.collect_us_economic_data()
    if us_data:
        collector.save_data(us_data, 'us_economic.jsonl')
    
    indian_data = collector.collect_indian_economic_data()
    collector.save_data(indian_data, 'indian_economic.jsonl')
    
    cb_data = collector.collect_central_bank_policies()
    collector.save_data(cb_data, 'central_banks.jsonl')
    
    crisis_data = collector.collect_global_crisis_data()
    collector.save_data(crisis_data, 'historical_crises.jsonl')
    
    # Collect economic reforms data
    reforms_data = collector.collect_economic_reforms()
    collector.save_data(reforms_data, 'economic_reforms.jsonl')
    
    print("Economic data collection complete!")
