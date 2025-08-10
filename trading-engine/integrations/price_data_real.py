"""
Real Price Data Client for Market Analysis - CoinGecko Integration
"""

import aiohttp
import asyncio
from typing import Dict, List, Optional, Any
import json
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class RealPriceDataClient:
    """
    Cliente real para obter dados de preços de criptomoedas via CoinGecko API
    """
    
    def __init__(self, settings=None):
        self.coingecko_url = "https://api.coingecko.com/api/v3"
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Cache de dados com TTL de 60 segundos (rate limit da API gratuita)
        self.price_cache: Dict[str, Dict] = {}
        self.last_update: Dict[str, datetime] = {}
        self.cache_ttl = 60  # segundos
        
        # Tokens para monitoramento (altcoins para altseason)
        self.monitored_tokens = [
            "ethereum", "cardano", "solana", "polkadot", "chainlink",
            "avalanche-2", "polygon", "uniswap", "aave", "compound-governance-token",
            "maker", "the-graph", "synthetix-network-token", "yearn-finance", "1inch"
        ]
        
        # Mapeamento símbolo -> ID do CoinGecko
        self.symbol_to_id_map = {
            "ETH": "ethereum",
            "ADA": "cardano", 
            "SOL": "solana",
            "DOT": "polkadot",
            "LINK": "chainlink",
            "AVAX": "avalanche-2",
            "MATIC": "polygon",
            "UNI": "uniswap",
            "AAVE": "aave",
            "COMP": "compound-governance-token",
            "MKR": "maker",
            "GRT": "the-graph",
            "SNX": "synthetix-network-token",
            "YFI": "yearn-finance",
            "1INCH": "1inch"
        }
        
        logger.info(f"Real Price Data Client initialized with {len(self.monitored_tokens)} tokens")

    async def initialize(self, session: aiohttp.ClientSession):
        """Inicializa o cliente com sessão HTTP"""
        self.session = session
        logger.info("Real Price Data Client session initialized")

    async def health_check(self) -> bool:
        """Verifica se a API está funcionando"""
        try:
            url = f"{self.coingecko_url}/ping"
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("gecko_says") == "(V3) To the Moon!"
                return False
        except Exception as e:
            logger.error(f"Price data health check failed: {e}")
            return False

    async def get_real_prices(self, token_ids: List[str] = None) -> Dict[str, Dict]:
        """
        Obtém preços reais para uma lista de tokens
        """
        if not token_ids:
            token_ids = self.monitored_tokens
            
        try:
            # Verifica cache primeiro
            cached_data = {}
            tokens_to_fetch = []
            
            for token_id in token_ids:
                if self._is_cache_valid(token_id):
                    cached_data[token_id] = self.price_cache[token_id]
                else:
                    tokens_to_fetch.append(token_id)
            
            # Se todos os dados estão em cache, retorna
            if not tokens_to_fetch:
                return cached_data
            
            # Busca dados da API para tokens não em cache
            ids_param = ",".join(tokens_to_fetch)
            url = f"{self.coingecko_url}/simple/price"
            params = {
                "ids": ids_param,
                "vs_currencies": "usd",
                "include_market_cap": "true",
                "include_24hr_vol": "true", 
                "include_24hr_change": "true",
                "include_last_updated_at": "true"
            }
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    api_data = await response.json()
                    
                    # Processa e armazena em cache
                    for token_id, data in api_data.items():
                        processed_data = self._process_price_data(token_id, data)
                        self.price_cache[token_id] = processed_data
                        self.last_update[token_id] = datetime.now()
                        cached_data[token_id] = processed_data
                    
                    logger.info(f"Fetched real prices for {len(api_data)} tokens")
                    return cached_data
                    
                elif response.status == 429:
                    logger.warning("Rate limit exceeded, using cached data")
                    return cached_data
                else:
                    logger.error(f"API error: {response.status}")
                    return cached_data
                    
        except Exception as e:
            logger.error(f"Error getting real prices: {e}")
            return cached_data

    async def get_token_price(self, token_id: str) -> Optional[Dict]:
        """
        Obtém preço de um token específico
        """
        try:
            prices = await self.get_real_prices([token_id])
            return prices.get(token_id)
        except Exception as e:
            logger.error(f"Error getting token price for {token_id}: {e}")
            return None

    async def get_price_by_symbol(self, symbol: str) -> Optional[float]:
        """
        Obtém preço atual por símbolo (ETH, BTC, etc.)
        """
        try:
            token_id = self.symbol_to_id_map.get(symbol.upper())
            if not token_id:
                logger.warning(f"Symbol {symbol} not found in mapping")
                return None
                
            token_data = await self.get_token_price(token_id)
            return token_data.get("price") if token_data else None
            
        except Exception as e:
            logger.error(f"Error getting price for symbol {symbol}: {e}")
            return None

    async def get_market_data(self) -> Dict[str, Dict]:
        """
        Obtém dados de mercado para todos os tokens monitorados
        """
        return await self.get_real_prices()

    async def get_trending_tokens(self) -> List[Dict]:
        """
        Obtém tokens em tendência
        """
        try:
            url = f"{self.coingecko_url}/search/trending"
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    trending = []
                    
                    for coin in data.get("coins", [])[:10]:  # Top 10
                        coin_data = coin.get("item", {})
                        trending.append({
                            "id": coin_data.get("id"),
                            "name": coin_data.get("name"),
                            "symbol": coin_data.get("symbol"),
                            "market_cap_rank": coin_data.get("market_cap_rank"),
                            "price_btc": coin_data.get("price_btc")
                        })
                    
                    logger.info(f"Fetched {len(trending)} trending tokens")
                    return trending
                else:
                    logger.error(f"Failed to get trending tokens: {response.status}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error getting trending tokens: {e}")
            return []

    async def get_global_market_data(self) -> Dict:
        """
        Obtém dados globais do mercado
        """
        try:
            url = f"{self.coingecko_url}/global"
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    global_data = data.get("data", {})
                    
                    return {
                        "total_market_cap_usd": global_data.get("total_market_cap", {}).get("usd", 0),
                        "total_volume_usd": global_data.get("total_volume", {}).get("usd", 0),
                        "market_cap_percentage": global_data.get("market_cap_percentage", {}),
                        "active_cryptocurrencies": global_data.get("active_cryptocurrencies", 0),
                        "markets": global_data.get("markets", 0),
                        "market_cap_change_24h": global_data.get("market_cap_change_percentage_24h_usd", 0)
                    }
                else:
                    logger.error(f"Failed to get global market data: {response.status}")
                    return {}
                    
        except Exception as e:
            logger.error(f"Error getting global market data: {e}")
            return {}

    def _process_price_data(self, token_id: str, raw_data: Dict) -> Dict:
        """
        Processa dados brutos da API
        """
        return {
            "id": token_id,
            "price": raw_data.get("usd", 0),
            "market_cap": raw_data.get("usd_market_cap", 0),
            "volume_24h": raw_data.get("usd_24h_vol", 0),
            "change_24h": raw_data.get("usd_24h_change", 0),
            "last_updated": raw_data.get("last_updated_at", 0),
            "timestamp": datetime.now().isoformat()
        }

    def _is_cache_valid(self, token_id: str) -> bool:
        """
        Verifica se o cache é válido (dentro do TTL)
        """
        if token_id not in self.last_update:
            return False
            
        time_diff = datetime.now() - self.last_update[token_id]
        return time_diff.total_seconds() < self.cache_ttl

    async def get_portfolio_value(self, holdings: Dict[str, float]) -> Dict:
        """
        Calcula valor do portfolio baseado em holdings reais
        holdings: {"ethereum": 1.5, "bitcoin": 0.1, ...}
        """
        try:
            token_ids = list(holdings.keys())
            prices = await self.get_real_prices(token_ids)
            
            total_value = 0
            portfolio_breakdown = {}
            
            for token_id, amount in holdings.items():
                token_data = prices.get(token_id, {})
                price = token_data.get("price", 0)
                value = price * amount
                
                total_value += value
                portfolio_breakdown[token_id] = {
                    "amount": amount,
                    "price": price,
                    "value": value,
                    "change_24h": token_data.get("change_24h", 0)
                }
            
            return {
                "total_value": total_value,
                "breakdown": portfolio_breakdown,
                "last_updated": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error calculating portfolio value: {e}")
            return {"total_value": 0, "breakdown": {}, "last_updated": datetime.now().isoformat()}

# Função de conveniência para uso direto
async def get_current_prices(token_symbols: List[str] = None) -> Dict[str, float]:
    """
    Função utilitária para obter preços atuais rapidamente
    """
    client = RealPriceDataClient()
    
    async with aiohttp.ClientSession() as session:
        await client.initialize(session)
        
        if not token_symbols:
            token_symbols = ["ETH", "ADA", "SOL", "DOT", "LINK"]
        
        prices = {}
        for symbol in token_symbols:
            price = await client.get_price_by_symbol(symbol)
            if price:
                prices[symbol] = price
        
        return prices

# Exemplo de uso
if __name__ == "__main__":
    async def test_client():
        client = RealPriceDataClient()
        
        async with aiohttp.ClientSession() as session:
            await client.initialize(session)
            
            # Teste health check
            health = await client.health_check()
            print(f"Health check: {health}")
            
            # Teste preços
            prices = await client.get_real_prices(["ethereum", "cardano", "solana"])
            print(f"Prices: {json.dumps(prices, indent=2)}")
            
            # Teste trending
            trending = await client.get_trending_tokens()
            print(f"Trending: {json.dumps(trending[:3], indent=2)}")
    
    asyncio.run(test_client())

