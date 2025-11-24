# Tenali Production Data Pipeline 🏭

This directory contains the **production-grade data engine** designed to harvest the entire universe of US and Indian stocks for Tenali LLM training.

## Features

- **Full Universe**: Automatically fetches thousands of active tickers from NYSE, NASDAQ, and NSE.
- **Deep History**: Pulls maximum available history (up to 40+ years).
- **Resumable**: Saves progress to `collection_progress.json`. If interrupted, just run it again and it resumes instantly.
- **LLM-Ready**: Automatically formats data into the "Tenali Persona" instruction format.
- **Robust**: Handles rate limits, errors, and missing data gracefully.

## How to Run

1. **Install Dependencies** (if not already done):
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the Engine**:
   ```bash
   python data_collection/production_historical_data.py
   ```

   *The script will start fetching data. This process may take several hours depending on your internet connection and rate limits.*

3. **Monitor Progress**:
   - You will see a progress bar with estimated time remaining.
   - Data is saved in batches to `data/production_historical/tenali_market_corpus.jsonl`.

4. **Prepare for Training**:
   Once collection is complete (or whenever you want to train on collected data), run:
   ```bash
   python training/prepare_dataset.py
   ```
   This will convert the raw JSONL into a HuggingFace dataset ready for `train_continued.py`.

## Configuration

You can modify `data_collection/production_historical_data.py` to adjust:
- `BATCH_SIZE`: How often to save to disk (default: 100 stocks).
- `MIN_YEARS_HISTORY`: Minimum years of data required to include a stock (default: 5).

## Output Format

The engine produces high-quality instruction-tuning data:

```json
{
  "instruction": "Analyze the long-term historical performance and market structure of Apple Inc. (AAPL).",
  "input": "Sector: Technology, Industry: Consumer Electronics, Data Range: 1980-12-12 to 2024-11-22",
  "output": "## Apple Inc. (AAPL) - Comprehensive Market Analysis\n\n### Executive Summary\nApple Inc. is a key player in the Consumer Electronics industry...",
  "system": "You are Tenali, an advanced AI financial analyst."
}
```
