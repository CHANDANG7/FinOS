"""
Tenali LLM FastAPI Deployment
REST API server for production deployment
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TextIteratorStreamer
from threading import Thread
import asyncio
from typing import List, Dict, Optional

app = FastAPI(
    title="Tenali LLM API",
    description="Financial AI Assistant API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model and tokenizer
model = None
tokenizer = None
device = "cuda" if torch.cuda.is_available() else "cpu"

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

class PortfolioRequest(BaseModel):
    holdings: List[Dict]

class ChartRequest(BaseModel):
    image_url: str
    query: Optional[str] = ""

@app.on_event("startup")
async def load_model():
    """Load model on startup"""
    global model, tokenizer
    
    print("Loading Tenali model...")
    # Use absolute path or relative to project root
    import os
    model_path = os.path.abspath("./checkpoints/instruction/final")
    
    # Configure 4-bit quantization for inference
    from transformers import BitsAndBytesConfig
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
        bnb_4bit_use_double_quant=True,
    )
    
    # 1. Load Base Model
    base_model_id = "Qwen/Qwen2.5-1.5B-Instruct"
    print(f"Loading base model: {base_model_id}...")
    
    tokenizer = AutoTokenizer.from_pretrained(model_path) # Tokenizer from checkpoint is fine
    
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_id,
        quantization_config=bnb_config,
        device_map={"": 0},
    )
    
    # 2. Load Adapters (Fine-Tuning)
    from peft import PeftModel
    print(f"Loading LoRA adapters from: {model_path}")
    
    model = PeftModel.from_pretrained(base_model, model_path)
    # model.eval()
    
    print(f"Model loaded on {device}")

@app.get("/")
async def root():
    return {
        "name": "Tenali LLM API",
        "status": "running",
        "model": "loaded" if model is not None else "not loaded"
    }

# ... imports
import yfinance as yf
from datetime import datetime
import pytz

# ... (existing code)

# Global cache for market data
market_cache = {
    "data": "",
    "timestamp": 0
}

def get_market_context():
    """Fetch live market data with caching (5 min TTL)"""
    global market_cache
    import time
    
    current_time = time.time()
    # Return cached data if less than 300 seconds (5 mins) old
    if current_time - market_cache["timestamp"] < 300 and market_cache["data"]:
        return market_cache["data"]

    try:
        print("Fetching live market data...")
        tickers = {
            "^NSEI": "Nifty 50",
            "^NSEBANK": "Bank Nifty",
            "^INDIAVIX": "India VIX",
            "INR=X": "USD/INR"
        }
        
        data_text = []
        data_text.append(f"Date: {datetime.now(pytz.timezone('Asia/Kolkata')).strftime('%d-%b %H:%M')}")
        
        for ticker, name in tickers.items():
            try:
                ticker_obj = yf.Ticker(ticker)
                # Fast fetch using fast_info if available or history with minimal overhead
                hist = ticker_obj.history(period="2d")
                
                if len(hist) >= 1:
                    current = hist['Close'].iloc[-1]
                    # Calculate change if 2 days available
                    if len(hist) >= 2:
                        prev = hist['Close'].iloc[-2]
                        change = ((current - prev) / prev) * 100
                        data_text.append(f"{name}: {current:,.0f} ({change:+.2f}%)")
                    else:
                        data_text.append(f"{name}: {current:,.0f}")
            except Exception:
                continue
                
        result = " | ".join(data_text)
        
        # Update cache
        market_cache["data"] = result
        market_cache["timestamp"] = current_time
        
        return result
    except Exception as e:
        print(f"Error fetching market data: {e}")
        return market_cache["data"] # Return stale data if fetch fails

# Common NSE Stock Mapping (Expand as needed)
NSE_MAP = {
    "reliance": "RELIANCE.NS", "tcs": "TCS.NS", "hdfc": "HDFCBANK.NS",
    "infosys": "INFY.NS", "infy": "INFY.NS", "icici": "ICICIBANK.NS",
    "sbi": "SBIN.NS", "tatamotors": "TATAMOTORS.NS", "itc": "ITC.NS",
    "colgate": "COLPAL.NS", "palmolive": "COLPAL.NS", "hul": "HINDUNILVR.NS",
    "bajaj": "BAJFINANCE.NS", "asianpaint": "ASIANPAINT.NS", "maruti": "MARUTI.NS",
    "titan": "TITAN.NS", "axis": "AXISBANK.NS", "kotak": "KOTAKBANK.NS",
    "wipro": "WIPRO.NS", "hcl": "HCLTECH.NS", "zomato": "ZOMATO.NS",
    "paytm": "PAYTM.NS", "lic": "LICI.NS", "jio": "JIOFIN.NS"
}

def get_stock_context(message: str) -> str:
    """Detect stocks in message and fetch live data"""
    found_context = []
    message_lower = message.lower()
    
    # Check for mapped stocks
    for name, ticker in NSE_MAP.items():
        if name in message_lower:
            try:
                stock = yf.Ticker(ticker)
                info = stock.fast_info
                price = info.last_price
                prev_close = info.previous_close
                change_pct = ((price - prev_close) / prev_close) * 100
                
                # Get valuation metrics if available
                pe = "N/A"
                try:
                    # Note: yfinance info dict can be slow, using fast_info where possible
                    # but PE requires full info fetch which is slow. 
                    # For speed, we stick to price action or use cached info if we had a DB.
                    # We'll just provide price context which solves the "2300" ambiguity.
                    pass 
                except:
                    pass

                found_context.append(
                    f"STOCK: {ticker} ({name.upper()})\n"
                    f"Current Price: ₹{price:,.2f}\n"
                    f"Day Change: {change_pct:+.2f}%\n"
                    f"52W High: ₹{info.year_high:,.2f} | 52W Low: ₹{info.year_low:,.2f}"
                )
            except Exception as e:
                print(f"Error fetching {ticker}: {e}")
                
    if found_context:
        return "\n\nRELEVANT STOCK DATA:\n" + "\n".join(found_context)
    return ""

import pandas as pd
import io
import requests
import difflib

# Global Ticker Map
TICKER_MAP = {}
TICKER_NAMES = []

def load_ticker_map():
    """Load NSE equity list for name-to-ticker resolution"""
    global TICKER_MAP, TICKER_NAMES
    try:
        print("Loading NSE Ticker Map...")
        url = "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv"
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            df = pd.read_csv(io.StringIO(response.text))
            # Create Name -> Symbol mapping
            for _, row in df.iterrows():
                symbol = f"{row['SYMBOL']}.NS"
                name = row['NAME OF COMPANY'].upper()
                TICKER_MAP[name] = symbol
                TICKER_MAP[row['SYMBOL'].upper()] = symbol # Map symbol to itself with .NS
            
            TICKER_NAMES = list(TICKER_MAP.keys())
            print(f"Loaded {len(TICKER_MAP)} tickers.")
        else:
            print("Failed to load NSE list, using fallbacks.")
    except Exception as e:
        print(f"Error loading ticker map: {e}")

# Load on startup (or call this in a lifespan event)
load_ticker_map()

class QuoteRequest(BaseModel):
    symbol: str

@app.post("/quote")
async def get_quote(request: QuoteRequest):
    """Fetch real-time stock quote with smart name resolution"""
    try:
        query = request.symbol.upper().strip()
        symbol = query
        
        # 1. Crypto Handling
        if query in ["BTC", "ETH", "SOL", "ADA", "XRP", "DOGE"]:
            symbol = f"{query}-USD"
        
        # 2. Direct Ticker Check (if user typed "RELIANCE" or exact company name)
        elif query in TICKER_MAP:
            symbol = TICKER_MAP[query]
            
        # 3. Fuzzy Name Search (if user typed "infosys", "Reliance Ind", etc.)
        elif len(query) > 2 and TICKER_NAMES:
            # Try fuzzy matching with lower cutoff for better results
            matches = difflib.get_close_matches(query, TICKER_NAMES, n=3, cutoff=0.4)
            if matches:
                # Pick the best match (first one is closest)
                best_match = matches[0]
                symbol = TICKER_MAP[best_match]
                print(f"Resolved '{request.symbol}' -> '{query}' -> '{symbol}' (matched: {best_match})")
        
        # 4. Fallback Heuristics (if nothing matched, assume it's a ticker)
        if not symbol.endswith(".NS") and not symbol.endswith(".BO") and "^" not in symbol and "-" not in symbol:
             if len(symbol) < 10: 
                symbol += ".NS"
        
        stock = yf.Ticker(symbol)
        info = stock.fast_info
        
        # Check if data exists
        price = info.last_price
        if price is None:
             raise ValueError("No price data found")

        prev_close = info.previous_close
        change = price - prev_close
        change_pct = (change / prev_close) * 100
        
        return {
            "symbol": symbol,
            "price": price,
            "change": change,
            "change_percent": change_pct,
            "previous_close": prev_close,
            "day_high": info.day_high,
            "day_low": info.day_low,
            "year_high": info.year_high,
            "year_low": info.year_low,
            "volume": info.last_volume,
            "currency": info.currency
        }
    except Exception as e:
        # print(f"Error fetching {symbol}: {e}") # Optional logging
        raise HTTPException(status_code=404, detail=f"Stock not found: {str(e)}")

def get_oi_analysis(ticker_symbol):
    """Fetch Option Chain and calculate PCR/Max Pain"""
    try:
        stock = yf.Ticker(ticker_symbol)
        expirations = stock.options
        if not expirations:
            return "No Option Chain data available."
            
        # Get nearest expiry
        chain = stock.option_chain(expirations[0])
        calls = chain.calls
        puts = chain.puts
        
        # Calculate PCR (Volume based)
        total_call_vol = calls['volume'].sum()
        total_put_vol = puts['volume'].sum()
        pcr = total_put_vol / total_call_vol if total_call_vol > 0 else 0
        
        # Find Max OI Strikes (Support/Resistance)
        # Resistance = Highest Call OI
        res_strike = calls.loc[calls['openInterest'].idxmax()]['strike']
        # Support = Highest Put OI
        sup_strike = puts.loc[puts['openInterest'].idxmax()]['strike']
        
        return (f"OPTION CHAIN ({expirations[0]}):\n"
                f"- PCR: {pcr:.2f} ({'Bullish' if pcr>1 else 'Bearish' if pcr<0.7 else 'Neutral'})\n"
                f"- Max Call OI (Resistance): {res_strike:,.0f}\n"
                f"- Max Put OI (Support): {sup_strike:,.0f}")
    except Exception as e:
        return f"OI Data Unavailable: {str(e)}"

@app.post("/chat")
async def chat(request: ChatRequest):
    """Chat endpoint with streaming support"""
    try:
        # 1. Fetch Live Market Context (Indices)
        market_context = get_market_context()
        
        # 2. Fetch Specific Stock Context (if user asked)
        user_message = next((m.content for m in request.messages if m.role == "user"), "")
        stock_context = get_stock_context(user_message)
        
        # 3. Fetch OI Data for Indices if mentioned
        oi_context = ""
        if "nifty" in user_message.lower() and "bank" not in user_message.lower():
            oi_context = get_oi_analysis("^NSEI")
        elif "bank" in user_message.lower() and "nifty" in user_message.lower():
            oi_context = get_oi_analysis("^NSEBANK")
            
        # 4. Inject Context into System Prompt
        messages = request.messages.copy()
        
        full_context = f"{market_context}\n{stock_context}\n{oi_context}"
        
        system_prompt = f"""Role: Chief Investment Officer (CIO) & Quant Strategist.
Context: {full_context}

OBJECTIVE:
Provide institutional-grade, actionable financial analysis. Your goal is to help the user make money or manage risk.

STRICT RULES:
1. **No Fluff**: Never say "Certainly", "Here is a breakdown", or "As an AI". Start directly with the insight.
2. **Data-First**: Use the provided Context (Price, OI, PCR) to justify every claim.
3. **Indian Context**: Default to NSE/BSE. Prices are in INR.
4. **Technical Logic**:
   - Price < Level = RESISTANCE.
   - Price > Level = SUPPORT.
   - High Call OI = RESISTANCE.
   - High Put OI = SUPPORT.

RESPONSE FORMAT (Follow this exactly):

**1. THE BOTTOM LINE**
(One sentence verdict: Bullish/Bearish/Neutral + Key Target)
*Example: "Bullish bias above 22,500; targeting 22,800 with trailing stop at 22,400."*

**2. KEY DATA POINTS**
- **Price Action**: [Current Price] vs [VWAP/EMA]
- **Option Chain**: PCR [Value] indicates [Sentiment]. Max Pain at [Strike].
- **Institutional Flow**: [FII/DII Activity if known, else Price Volume action]

**3. STRATEGIC PLAN**
- **Aggressive**: [Buy/Sell Level]
- **Conservative**: [Wait for X]
- **Invalidation**: [Stop Loss Level]

**4. RISKS**
(One bullet point on what could go wrong)

---
FEW-SHOT EXAMPLES (Mimic this style):

User: "View on Reliance?"
You:
**1. THE BOTTOM LINE**
Neutral to Bullish; stock is consolidating at ₹2,900 support, looking for a breakout above ₹2,950.

**2. KEY DATA POINTS**
- **Price**: ₹2,910 (Trading above 200 EMA).
- **OI Data**: Max Call OI at 3,000 (Strong Resistance). PCR at 0.85 (Neutral).
- **Volume**: Declining on pullbacks (Bullish sign).

**3. STRATEGIC PLAN**
- **Buy**: Above ₹2,950 for target ₹3,050.
- **Accumulate**: Near ₹2,880-2,900 zone.
- **Stop Loss**: Close below ₹2,850.

**4. RISKS**
Oil price volatility could impact refining margins.
---
"""

        if messages and messages[0].role == "system":
            messages[0].content = system_prompt
        else:
            messages.insert(0, Message(role="system", content=system_prompt))

        # Format prompt
        prompt = format_chat_prompt(messages)
        
        # Generate response
        if request.stream:
            return StreamingResponse(
                generate_stream(prompt, request.max_tokens, request.temperature),
                media_type="text/plain"
            )
        else:
            response = generate_response(prompt, request.max_tokens, request.temperature)
            return {"response": response}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/portfolio")
async def analyze_portfolio(request: PortfolioRequest):
    """Portfolio analysis endpoint"""
    try:
        # Create analysis prompt
        holdings_text = "\n".join([
            f"- {h['symbol']}: {h['quantity']} shares @ ${h['avg_buy_price']}"
            for h in request.holdings
        ])
        
        prompt = f"""Analyze this portfolio:

{holdings_text}

Provide comprehensive analysis including:
1. Diversification assessment
2. Risk evaluation
3. Sector allocation
4. Recommendations for improvement

Remember to follow your structured response format."""
        
        response = generate_response(prompt, max_tokens=1024)
        
        return {"analysis": response}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/chart")
async def analyze_chart(request: ChartRequest):
    """Chart analysis endpoint (requires vision model)"""
    # For now, return placeholder
    # In production, integrate with vision model (LLaVA, GPT-4V)
    return {
        "message": "Chart analysis requires vision model integration",
        "image_url": request.image_url,
        "query": request.query
    }

def format_chat_prompt(messages: List[Message]) -> str:
    """Format messages using the model's chat template"""
    # Convert Pydantic models to dicts
    chat_messages = [{"role": m.role, "content": m.content} for m in messages]
    
    # Apply chat template
    prompt = tokenizer.apply_chat_template(
        chat_messages,
        tokenize=False,
        add_generation_prompt=True
    )
    return prompt

def generate_response(prompt: str, max_tokens: int = 1024, temperature: float = 0.7) -> str:
    """Generate non-streaming response"""
    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_tokens,
            temperature=temperature,
            do_sample=True,
            top_p=0.9,
            repetition_penalty=1.1,
        )
    
    # Extract only the new tokens
    new_tokens = outputs[0][inputs.input_ids.shape[1]:]
    response = tokenizer.decode(new_tokens, skip_special_tokens=True)
    
    return response.strip()

async def generate_stream(prompt: str, max_tokens: int = 1024, temperature: float = 0.7):
    """Generate streaming response"""
    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    
    # skip_prompt=True ensures we don't stream back the input prompt
    streamer = TextIteratorStreamer(tokenizer, skip_special_tokens=True, skip_prompt=True)
    
    generation_kwargs = {
        **inputs,
        "max_new_tokens": max_tokens,
        "temperature": temperature,
        "do_sample": True,
        "top_p": 0.9,
        "repetition_penalty": 1.1,
        "streamer": streamer,
    }
    
    # Start generation in separate thread
    thread = Thread(target=model.generate, kwargs=generation_kwargs)
    thread.start()
    
    # Stream tokens
    for text in streamer:
        yield text.encode()
        await asyncio.sleep(0.01)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
