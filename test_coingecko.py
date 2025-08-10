#!/usr/bin/env python3
"""
Teste da integração real com CoinGecko API
"""

import asyncio
import sys
import os
sys.path.append('./trading-engine')

from integrations.price_data_real import RealPriceDataClient
import aiohttp
import json

async def test_coingecko():
    print("🦎 Testing CoinGecko API integration...")
    
    client = RealPriceDataClient()
    
    async with aiohttp.ClientSession() as session:
        await client.initialize(session)
        
        # Test 1: Health check
        print("\n1. Health Check:")
        health = await client.health_check()
        print(f"   Status: {'✅ OK' if health else '❌ Failed'}")
        
        # Test 2: Get real prices
        print("\n2. Real Prices:")
        test_tokens = ['ethereum', 'cardano', 'solana']
        prices = await client.get_real_prices(test_tokens)
        
        if prices:
            print(f"   Fetched prices for {len(prices)} tokens:")
            for token, data in prices.items():
                price = data.get('price', 0)
                change = data.get('change_24h', 0)
                print(f"   {token}: ${price:.2f} (24h: {change:+.2f}%)")
        else:
            print("   ❌ No prices fetched")
        
        # Test 3: Get price by symbol
        print("\n3. Price by Symbol:")
        eth_price = await client.get_price_by_symbol('ETH')
        if eth_price:
            print(f"   ETH: ${eth_price:.2f}")
        else:
            print("   ❌ Failed to get ETH price")
        
        # Test 4: Global market data
        print("\n4. Global Market Data:")
        global_data = await client.get_global_market_data()
        if global_data:
            total_cap = global_data.get('total_market_cap_usd', 0)
            print(f"   Total Market Cap: ${total_cap:,.0f}")
            print(f"   Active Cryptocurrencies: {global_data.get('active_cryptocurrencies', 0)}")
        else:
            print("   ❌ Failed to get global data")
        
        # Test 5: Trending tokens
        print("\n5. Trending Tokens:")
        trending = await client.get_trending_tokens()
        if trending:
            print(f"   Top {len(trending)} trending tokens:")
            for i, token in enumerate(trending[:5], 1):
                print(f"   {i}. {token.get('name')} ({token.get('symbol')})")
        else:
            print("   ❌ Failed to get trending tokens")

if __name__ == "__main__":
    asyncio.run(test_coingecko())

