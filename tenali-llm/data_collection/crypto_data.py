"""
Crypto Data Collection for Tenali LLM
Collects: Prices, on-chain metrics, tokenomics, DeFi data
Sources: CoinGecko, CoinMarketCap, Glassnode, The Graph
"""

import ccxt
import requests
import pandas as pd
from datetime import datetime, timedelta
import json
from tqdm import tqdm
import time
import os

class CryptoDataCollector:
    def __init__(self, output_dir='./data/crypto'):
        self.output_dir = output_dir
        self.coingecko_base = 'https://api.coingecko.com/api/v3'
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
    def collect_crypto_prices(self, coin_ids):
        """Collect crypto price data and metrics"""
        print(f"Collecting data for {len(coin_ids)} cryptocurrencies...")
        
        all_data = []
        
        for coin_id in tqdm(coin_ids):
            try:
                # Get coin data
                url = f"{self.coingecko_base}/coins/{coin_id}"
                params = {
                    'localization': 'false',
                    'tickers': 'false',
                    'community_data': 'true',
                    'developer_data': 'true',
                }
                response = requests.get(url, params=params)
                data = response.json()
                
                # Create training text
                text = self._create_crypto_text(coin_id, data)
                
                all_data.append({
                    'coin_id': coin_id,
                    'text': text,
                    'metadata': {
                        'symbol': data.get('symbol', '').upper(),
                        'market_cap_rank': data.get('market_cap_rank', 0),
                    }
                })
                
                time.sleep(1.5)  # Rate limiting
                
            except Exception as e:
                print(f"Error collecting {coin_id}: {e}")
                continue
        
        return all_data
    
    def _create_crypto_text(self, coin_id, data):
        """Convert crypto data into training text"""
        
        text_parts = []
        
        # Overview
        name = data.get('name', coin_id)
        symbol = data.get('symbol', '').upper()
        text_parts.append(f"## {name} ({symbol})")
        
        # Market Data
        market_data = data.get('market_data', {})
        current_price = market_data.get('current_price', {}).get('usd', 0)
        market_cap = market_data.get('market_cap', {}).get('usd', 0)
        volume_24h = market_data.get('total_volume', {}).get('usd', 0)
        
        text_parts.append(f"\n### Market Data")
        text_parts.append(f"- **Price (USD)**: ${current_price:,.2f}")
        text_parts.append(f"- **Market Cap**: ${market_cap/1e9:.2f}B")
        text_parts.append(f"- **24h Volume**: ${volume_24h/1e9:.2f}B")
        text_parts.append(f"- **Market Cap Rank**: #{data.get('market_cap_rank', 'N/A')}")
        
        # Price Changes
        price_change_24h = market_data.get('price_change_percentage_24h', 0)
        price_change_7d = market_data.get('price_change_percentage_7d', 0)
        price_change_30d = market_data.get('price_change_percentage_30d', 0)
        
        text_parts.append(f"\n### Price Performance")
        text_parts.append(f"- **24h Change**: {price_change_24h:+.2f}%")
        text_parts.append(f"- **7d Change**: {price_change_7d:+.2f}%")
        text_parts.append(f"- **30d Change**: {price_change_30d:+.2f}%")
        
        # All-Time High/Low
        ath = market_data.get('ath', {}).get('usd', 0)
        ath_date = market_data.get('ath_date', {}).get('usd', '')
        atl = market_data.get('atl', {}).get('usd', 0)
        
        text_parts.append(f"\n### Historical Levels")
        text_parts.append(f"- **All-Time High**: ${ath:,.2f} ({ath_date[:10] if ath_date else 'N/A'})")
        text_parts.append(f"- **All-Time Low**: ${atl:,.8f}")
        text_parts.append(f"- **From ATH**: {market_data.get('ath_change_percentage', {}).get('usd', 0):.2f}%")
        
        # On-Chain Metrics (if available)
        text_parts.append(f"\n### On-Chain Metrics")
        
        # Circulating Supply
        circulating_supply = market_data.get('circulating_supply', 0)
        total_supply = market_data.get('total_supply', 0)
        max_supply = market_data.get('max_supply', 0)
        
        text_parts.append(f"- **Circulating Supply**: {circulating_supply:,.0f} {symbol}")
        if total_supply:
            text_parts.append(f"- **Total Supply**: {total_supply:,.0f} {symbol}")
        if max_supply:
            text_parts.append(f"- **Max Supply**: {max_supply:,.0f} {symbol}")
            text_parts.append(f"- **Supply Inflation**: {((total_supply - circulating_supply) / total_supply * 100):.2f}%")
        
        # Community & Development
        community = data.get('community_data', {})
        developer = data.get('developer_data', {})
        
        text_parts.append(f"\n### Community & Development")
        text_parts.append(f"- **Twitter Followers**: {community.get('twitter_followers', 0):,}")
        text_parts.append(f"- **Reddit Subscribers**: {community.get('reddit_subscribers', 0):,}")
        text_parts.append(f"- **GitHub Stars**: {developer.get('stars', 0):,}")
        text_parts.append(f"- **GitHub Forks**: {developer.get('forks', 0):,}")
        
        # Description
        description = data.get('description', {}).get('en', '')
        if description:
            text_parts.append(f"\n### Description")
            text_parts.append(description[:500] + "..." if len(description) > 500 else description)
        
        return "\n".join(text_parts)
    
    def collect_defi_data(self):
        """Collect DeFi protocol data"""
        # This would use DeFi Llama API or The Graph
        defi_text = """
## Decentralized Finance (DeFi)

### Key Concepts

**Total Value Locked (TVL)**
- Measures capital locked in DeFi protocols
- Indicator of DeFi ecosystem health
- Top protocols: Aave, Uniswap, Curve, MakerDAO

**Liquidity Pools**
- Automated Market Makers (AMMs)
- Provide liquidity for token swaps
- Earn fees and rewards

**Yield Farming**
- Lending and borrowing protocols
- Liquidity mining incentives
- Risk: Impermanent loss, smart contract risk

**Tokenomics**
- Utility tokens vs governance tokens
- Token distribution and vesting
- Inflation and burn mechanisms
"""
        
        return [{'category': 'DeFi', 'text': defi_text}]
    
    def save_data(self, data, filename):
        """Save collected data as JSONL"""
        filepath = f"{self.output_dir}/{filename}"
        with open(filepath, 'w') as f:
            for item in data:
                f.write(json.dumps(item) + '\n')
        print(f"Saved {len(data)} items to {filepath}")

if __name__ == "__main__":
    collector = CryptoDataCollector()
    
    # Expanded top 50 cryptocurrencies
    top_coins = [
        'bitcoin', 'ethereum', 'tether', 'binancecoin', 'solana', 'ripple', 'usd-coin', 'staked-ether', 'cardano', 'avalanche-2',
        'dogecoin', 'tron', 'polkadot', 'chainlink', 'matic-network', 'wrapped-bitcoin', 'shiba-inu', 'dai', 'litecoin', 'bitcoin-cash',
        'uniswap', 'leo-token', 'okb', 'stellar', 'monero', 'cosmos', 'ethereum-classic', 'internet-computer', 'hedera-hashgraph', 'filecoin',
        'lido-dao', 'aptos', 'cronos', 'quant-network', 'arbitrum', 'vechain', 'near', 'maker', 'aave', 'optimism',
        'the-graph', 'algorand', 'render-token', 'fantom', 'eos', 'tezos', 'axie-infinity', 'sandbox', 'decentraland', 'theta-token'
    ]
    
    # Collect crypto data
    print("Collecting cryptocurrency data...")
    crypto_data = collector.collect_crypto_prices(top_coins)
    collector.save_data(crypto_data, 'crypto_prices.jsonl')
    
    # Collect DeFi data
    print("Collecting DeFi data...")
    defi_data = collector.collect_defi_data()
    collector.save_data(defi_data, 'defi_protocols.jsonl')
    
    print("Crypto data collection complete!")
