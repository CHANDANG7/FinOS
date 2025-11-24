# Tenali LLM - Training from Scratch

## Project Structure

```
tenali-llm/
├── data_collection/          # Data collection scripts
│   ├── market_data.py       # Stock, indices, commodities
│   ├── economic_data.py     # Macro indicators, GDP, inflation
│   ├── crypto_data.py       # Crypto prices, on-chain metrics
│   ├── news_filings.py      # SEC filings, news articles
│   └── technical_patterns.py # TA patterns, SMC concepts
├── training/                 # Training pipeline
│   ├── prepare_dataset.py   # Convert raw data to training format
│   ├── tokenizer.py         # Custom tokenizer
│   ├── model.py             # Transformer architecture
│   ├── train.py             # Training loop
│   └── config.py            # Model configuration
├── deployment/               # API deployment
│   ├── api.py               # FastAPI server
│   ├── Dockerfile           # Container
│   └── requirements.txt     # Dependencies
└── README.md                # This file
```

## Training from Scratch Overview

### Why Train from Scratch?
- **Complete Control**: Optimize for financial domain
- **No Base Model Limitations**: Custom architecture for finance
- **Proprietary Knowledge**: Your unique financial insights

### Challenges
- **Compute**: Requires 8x A100 GPUs (80GB each)
- **Time**: 2-3 months of continuous training
- **Data**: Need 100B+ tokens of financial text
- **Cost**: $50K-100K in cloud compute

## Quick Start

### 1. Setup Environment

```bash
# Create virtual environment
python -m venv tenali_env
source tenali_env/bin/activate  # Windows: tenali_env\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Collect Data

```bash
# Collect all financial data
python data_collection/market_data.py
python data_collection/economic_data.py
python data_collection/crypto_data.py
python data_collection/news_filings.py
python data_collection/technical_patterns.py
```

### 3. Prepare Training Dataset

```bash
python training/prepare_dataset.py
```

### 4. Train Model

```bash
# Single GPU (for testing)
python training/train.py --config training/config.py

# Multi-GPU (production)
torchrun --nproc_per_node=8 training/train.py --config training/config.py
```

### 5. Deploy API

```bash
# Local
python deployment/api.py

# Docker
docker build -t tenali-api deployment/
docker run -p 8000:8000 tenali-api
```

## Model Architecture

### Transformer Configuration
- **Model Size**: 7B parameters (similar to LLaMA 7B)
- **Layers**: 32 transformer blocks
- **Hidden Size**: 4096
- **Attention Heads**: 32
- **Context Length**: 4096 tokens
- **Vocabulary**: 50,000 tokens (financial-optimized)

### Training Hyperparameters
- **Batch Size**: 4M tokens per batch
- **Learning Rate**: 3e-4 with cosine decay
- **Warmup Steps**: 2000
- **Total Steps**: 500K (100B tokens)
- **Optimizer**: AdamW with weight decay
- **Mixed Precision**: BF16

## Data Collection Strategy

### Target: 100 Billion Tokens

1. **Market Data** (20B tokens)
   - 10 years of daily data for 10,000+ stocks
   - Corporate earnings, balance sheets, cash flows
   - IPO data, listing performance

2. **Economic Data** (15B tokens)
   - Global macro indicators (GDP, inflation, unemployment)
   - Central bank policies, interest rates
   - Sector trends, industry reports

3. **News & Filings** (30B tokens)
   - SEC EDGAR filings (10-K, 10-Q, 8-K)
   - BSE/NSE announcements
   - Financial news articles (Reuters, Bloomberg, ET)

4. **Technical Analysis** (10B tokens)
   - Chart patterns, candlestick formations
   - Indicator signals (RSI, MACD, Bollinger Bands)
   - SMC concepts (Order Blocks, FVG, Liquidity)

5. **Educational Content** (15B tokens)
   - Investment books, research papers
   - Trading strategies, risk management
   - Behavioral finance studies

6. **Crypto & Forex** (10B tokens)
   - On-chain metrics, tokenomics
   - Central bank policies, forex flows
   - DeFi protocols, liquidity analysis

## Training Timeline

### Phase 1: Data Collection (2-4 weeks)
- Set up data pipelines
- Collect and clean 100B tokens
- Validate data quality

### Phase 2: Preprocessing (1-2 weeks)
- Tokenize all data
- Create training/validation splits
- Build data loaders

### Phase 3: Training (8-12 weeks)
- Pre-training on full corpus
- Monitor loss curves, perplexity
- Checkpoint every 10K steps

### Phase 4: Fine-tuning (2-4 weeks)
- Instruction fine-tuning
- RLHF for alignment
- Safety testing

### Phase 5: Deployment (1 week)
- Optimize for inference
- Deploy FastAPI server
- Integration testing

**Total: 3-5 months**

## Hardware Requirements

### Training
- **GPUs**: 8x NVIDIA A100 80GB
- **RAM**: 512GB system RAM
- **Storage**: 10TB NVMe SSD
- **Network**: 100 Gbps for multi-node

### Inference
- **GPU**: 1x A100 40GB or 2x RTX 4090
- **RAM**: 64GB
- **Storage**: 100GB SSD

## Cost Estimation

### Cloud Training (AWS/GCP)
- **Instance**: p4d.24xlarge (8x A100 80GB)
- **Cost**: ~$32/hour
- **Duration**: 2000 hours (3 months)
- **Total**: ~$64,000

### Alternative: Lambda Labs / RunPod
- **Cost**: ~$15/hour for 8x A100
- **Total**: ~$30,000

### One-time Hardware Purchase
- **8x A100 80GB**: ~$80,000
- **Server**: ~$20,000
- **Total**: ~$100,000 (reusable)

## Next Steps

1. **Review Data Collection Scripts** - Customize for your needs
2. **Set Up Cloud Infrastructure** - AWS/GCP with GPU instances
3. **Start Data Collection** - Run scripts to gather 100B tokens
4. **Monitor Progress** - Use Weights & Biases for tracking
5. **Iterate** - Adjust based on validation metrics

## Alternative: Hybrid Approach

If full training from scratch is too resource-intensive:

1. **Start with Pre-trained Base** (LLaMA 3.1 70B)
2. **Continued Pre-training** on your financial corpus
3. **Instruction Fine-tuning** with your specific format
4. **RLHF** for alignment

This reduces:
- **Time**: 2-4 weeks instead of 3 months
- **Cost**: $5K-10K instead of $50K+
- **Complexity**: Easier to manage

Would you like to proceed with full training or consider the hybrid approach?
