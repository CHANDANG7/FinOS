from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import os
import requests
import json
import yfinance as yf
from datetime import datetime
import pytz
import pandas as pd
import io
import difflib
from typing import List, Dict, Optional

# Create FastAPI app
app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

# Configuration
HF_TOKEN = os.getenv("HF_TOKEN")
HF_API_URL = "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-1.5B-Instruct"

# Request models
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    context: Optional[Dict] = {}
    stream: bool = True
    max_tokens: int = 1024
    temperature: float = 0.7

class QuoteRequest(BaseModel):
    symbol: str

# Cache
market_cache = {"data": "", "timestamp": 0}

# Helper Functions
def get_market_context():
    global market_cache
    import time
    current_time = time.time()
    if current_time - market_cache["timestamp"] < 300 and market_cache["data"]:
        return market_cache["data"]

    try:
        tickers = {"^NSEI": "Nifty 50", "^NSEBANK": "Bank Nifty", "INR=X": "USD/INR"}
        data_text = [f"Date: {datetime.now(pytz.timezone('Asia/Kolkata')).strftime('%d-%b %H:%M')}"]
        
        for ticker, name in tickers.items():
            try:
                hist = yf.Ticker(ticker).history(period="2d")
                if len(hist) >= 1:
                    current = hist['Close'].iloc[-1]
                    if len(hist) >= 2:
                        change = ((current - hist['Close'].iloc[-2]) / hist['Close'].iloc[-2]) * 100
                        data_text.append(f"{name}: {current:,.0f} ({change:+.2f}%)")
                    else:
                        data_text.append(f"{name}: {current:,.0f}")
            except: continue
                
        result = " | ".join(data_text)
        market_cache["data"] = result
        market_cache["timestamp"] = current_time
        return result
    except: return market_cache["data"]

# Static Fallback Map (Top Stocks & Crypto)
STATIC_TICKER_MAP = {
    # US Tech
    "APPLE": "AAPL", "MICROSOFT": "MSFT", "GOOGLE": "GOOGL", "AMAZON": "AMZN",
    "TESLA": "TSLA", "META": "META", "NETFLIX": "NFLX", "NVIDIA": "NVDA",
    "AMD": "AMD", "INTEL": "INTC", "COINBASE": "COIN",
    
    # Crypto
    "BITCOIN": "BTC-USD", "BTC": "BTC-USD",
    "ETHEREUM": "ETH-USD", "ETH": "ETH-USD",
    "SOLANA": "SOL-USD", "SOL": "SOL-USD",
    "DOGECOIN": "DOGE-USD", "DOGE": "DOGE-USD",
    "RIPPLE": "XRP-USD", "XRP": "XRP-USD",
    "CARDANO": "ADA-USD", "ADA": "ADA-USD",
    "SHIBA": "SHIB-USD", "SHIB": "SHIB-USD",
    "MATIC": "MATIC-USD", "POLYGON": "MATIC-USD",
    
    # NSE Top 50 (Common Names)
    "RELIANCE": "RELIANCE.NS", "RIL": "RELIANCE.NS",
    "TCS": "TCS.NS", "TATA CONSULTANCY": "TCS.NS",
    "HDFC BANK": "HDFCBANK.NS", "HDFC": "HDFCBANK.NS",
    "INFOSYS": "INFY.NS", "INFY": "INFY.NS",
    "ICICI": "ICICIBANK.NS", "ICICI BANK": "ICICIBANK.NS",
    "SBI": "SBIN.NS", "STATE BANK": "SBIN.NS",
    "BHARTI AIRTEL": "BHARTIARTL.NS", "AIRTEL": "BHARTIARTL.NS",
    "ITC": "ITC.NS",
    "KOTAK": "KOTAKBANK.NS", "KOTAK BANK": "KOTAKBANK.NS",
    "L&T": "LT.NS", "LARSEN": "LT.NS",
    "AXIS BANK": "AXISBANK.NS", "AXIS": "AXISBANK.NS",
    "HUL": "HINDUNILVR.NS", "HINDUSTAN UNILEVER": "HINDUNILVR.NS",
    "TATA MOTORS": "TATAMOTORS.NS",
    "MARUTI": "MARUTI.NS",
    "SUN PHARMA": "SUNPHARMA.NS",
    "ASIAN PAINTS": "ASIANPAINT.NS",
    "TITAN": "TITAN.NS",
    "BAJAJ FINANCE": "BAJFINANCE.NS",
    "ULTRATECH": "ULTRACEMCO.NS",
    "WIPRO": "WIPRO.NS",
    "NESTLE": "NESTLEIND.NS",
    "ZOMATO": "ZOMATO.NS",
    "PAYTM": "PAYTM.NS",
    "JIO": "JIOFIN.NS", "JIO FINANCIAL": "JIOFIN.NS",
    "OLA": "OLAELEC.NS", "OLA ELECTRIC": "OLAELEC.NS"
}

# Ticker Map
TICKER_MAP = STATIC_TICKER_MAP.copy()
TICKER_NAMES = list(TICKER_MAP.keys())

def load_ticker_map():
    global TICKER_MAP, TICKER_NAMES
    # If we already have more than static map, skip
    if len(TICKER_MAP) > len(STATIC_TICKER_MAP): return
    
    try:
        url = "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv"
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            df = pd.read_csv(io.StringIO(response.text))
            for _, row in df.iterrows():
                symbol = f"{row['SYMBOL']}.NS"
                name = row['NAME OF COMPANY'].upper()
                # Add exact symbol
                TICKER_MAP[row['SYMBOL'].upper()] = symbol
                # Add company name
                TICKER_MAP[name] = symbol
                # Add first word of company name (often the common name)
                first_word = name.split()[0]
                if len(first_word) > 2 and first_word not in TICKER_MAP:
                    TICKER_MAP[first_word] = symbol
                    
            TICKER_NAMES = list(TICKER_MAP.keys())
    except: pass

@app.post("/api/py/quote")
async def get_quote(request: QuoteRequest):
    load_ticker_map()
    try:
        query = request.symbol.upper().strip()
        symbol = query
        
        # 1. Check Static/Loaded Map (Exact Match)
        if query in TICKER_MAP:
            symbol = TICKER_MAP[query]
            
        # 2. Fuzzy/Substring Search
        else:
            # Try finding a key that STARTS with query (e.g. "RELI" -> "RELIANCE")
            # This is faster and often better than fuzzy for partial typing
            matches = [k for k in TICKER_NAMES if k.startswith(query)]
            if matches:
                # Sort by length to get shortest match (likely the most relevant)
                matches.sort(key=len)
                symbol = TICKER_MAP[matches[0]]
            elif len(query) > 2:
                # Fallback to fuzzy
                close_matches = difflib.get_close_matches(query, TICKER_NAMES, n=1, cutoff=0.5)
                if close_matches: symbol = TICKER_MAP[close_matches[0]]

        # 3. Suffix Logic (if not resolved to a .NS/.BO/etc yet)
        if not any(x in symbol for x in [".NS", ".BO", "^", "-", "="]):
            # If it's a known US ticker pattern (1-4 letters), assume US
            # But if it was meant to be Indian and not found, try .NS
            if len(symbol) <= 5 and symbol.isalpha():
                # Ambiguous. Try US first (no suffix)
                try:
                    test_us = yf.Ticker(symbol)
                    if test_us.fast_info.last_price:
                        pass # It's valid US
                    else:
                        symbol += ".NS" # Fallback to NS
                except:
                     symbol += ".NS"
            else:
                symbol += ".NS"
            
        info = yf.Ticker(symbol).fast_info
        price = info.last_price
        if price is None: raise ValueError("No price data found")
        
        return {
            "symbol": symbol,
            "price": price,
            "change": price - info.previous_close,
            "change_percent": ((price - info.previous_close) / info.previous_close) * 100,
            "day_high": info.day_high,
            "day_low": info.day_low,
            "volume": info.last_volume,
            "previous_close": info.previous_close,
            "currency": info.currency
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Stock not found: {str(e)}")

@app.post("/api/py/chat")
async def chat(request: ChatRequest):
    try:
        market_context = get_market_context()
        
        system_prompt = f"""Role: Chief Investment Officer (CIO).
Context: {market_context}
Objective: Provide institutional-grade financial analysis.
Rules:
1. Bottom Line First.
2. Data-Backed Claims.
3. Indian Context (NSE/BSE).
"""
        
        formatted_prompt = f"<|im_start|>system\n{system_prompt}<|im_end|>\n"
        for m in request.messages:
            if m.role != "system":
                formatted_prompt += f"<|im_start|>{m.role}\n{m.content}<|im_end|>\n"
        formatted_prompt += "<|im_start|>assistant\n"

        if request.stream:
            return StreamingResponse(stream_hf_response(formatted_prompt), media_type="text/plain")
        else:
            response = await query_hf_api(formatted_prompt)
            return {"response": response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def query_hf_api(prompt):
    payload = {"inputs": prompt, "parameters": {"max_new_tokens": 1024, "return_full_text": False}}
    response = requests.post(HF_API_URL, headers={"Authorization": f"Bearer {HF_TOKEN}"}, json=payload)
    return response.json()[0]["generated_text"]

async def stream_hf_response(prompt):
    payload = {"inputs": prompt, "parameters": {"max_new_tokens": 1024, "return_full_text": False}, "stream": True}
    try:
        with requests.post(HF_API_URL, headers={"Authorization": f"Bearer {HF_TOKEN}"}, json=payload, stream=True) as r:
            for line in r.iter_lines():
                if line:
                    decoded_line = line.decode('utf-8')
                    if decoded_line.startswith("data:"):
                        try:
                            json_data = json.loads(decoded_line[5:])
                            if "token" in json_data:
                                yield json_data["token"]["text"].encode()
                        except: pass
    except Exception as e:
        yield f"Error: {str(e)}".encode()
