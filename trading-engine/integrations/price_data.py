"""
Price Data Client for Market Analysis
"""

import aiohttp
import asyncio
from typing import Dict, List, Optional, Any
import json
from datetime import datetime, timedelta
import random

from config.settings import TradingSettings
from utils.logger import setup_logger

logger = setup_logger(__name__)

class PriceDataClient:
    """
    Cliente para obter dados de preços de criptomoedas
    """
    
    def __init__(self, settings: TradingSettings):
        self.settings = settings
        self.coingecko_url = settings.coingecko_api_url
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Cache de dados
        self.price_cache: Dict[str, Dict] = {}
        self.last_update: Dict[str, datetime] = {}
        
        # Tokens para monitoramento (top altcoins para altseason)
        self.monitored_tokens = [
            "ethereum", "cardano", "solana", "polkadot", "chainlink",
            "avalanche-2", "polygon", "uniswap", "aave", "compound",
            "maker", "the-graph", "synthetix", "yearn-finance", "1inch"
        ]
        
        logger.info("Price Data Client initialized", 
                   tokens_count=len(self.monitored_tokens))

    async def initialize(self, session: aiohttp.ClientSession):
        """Inicializa o cliente com sessão HTTP"""
        self.session = session
        logger.info("Price Data Client session initialized")

    async def health_check(self) -> bool:
        """Verifica se a API está funcionando"""
        try:
            url = f"{self.coingecko_url}/ping"
            async with self.session.get(url) as response:
                return response.status == 200
        except Exception as e:
            logger.error(f"Price data health check failed: {e}")
            return False

    async def get_market_data(self) -> Dict[str, Dict]:
        """
        Obtém dados de mercado para todos os tokens monitorados
        """
        try:
            market_data = {}
            
            # Obtém dados para cada token
            for token_id in self.monitored_tokens:
                token_data = await self.get_token_data(token_id)
                if token_data:
                    market_data[token_id] = token_data
            
            logger.info(f"Market data retrieved for {len(market_data)} tokens")
            return market_data
            
        except Exception as e:
            logger.error(f"Error getting market data: {e}")
            return {}

    async def get_token_data(self, token_id: str) -> Optional[Dict]:
        """
        Obtém dados detalhados de um token específico
        """
        try:
            # Verifica cache
            if self._is_cache_valid(token_id):
                return self.price_cache[token_id]
            
            # Busca dados da API
            url = f"{self.coingecko_url}/coins/{token_id}"
            params = {
                "localization": "false",
                "tickers": "false",
                "market_data": "true",
                "community_data": "false",
                "developer_data": "false",
                "sparkline": "true"
            }
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    processed_data = self._process_token_data(data)
                    
                    # Atualiza cache
                    self.price_cache[token_id] = processed_data
                    self.last_update[token_id] = datetime.now()
                    
                    return processed_data
                else:
                    logger.error(f"Failed to get data for {token_id}: {response.status}")
                    return self._get_simulated_data(token_id)
                    
        except Exception as e:
            logger.error(f"Error getting token data for {token_id}: {e}")
            return self._get_simulated_data(token_id)

    async def get_current_price(self, symbol: str) -> Optional[float]:
        """
        Obtém preço atual de um token pelo símbolo
        """
        try:
            # Mapeia símbolo para ID do CoinGecko
            token_id = self._symbol_to_id(symbol)
            if not token_id:
                return None
            
            token_data = await self.get_token_data(token_id)
            return token_data.get("price") if token_data else None
            
        except Exception as e:
            logger.error(f"Error getting current price for {symbol}: {e}")
            return None

    async def get_price_history(self, token_id: str, days: int = 7) -> List[Dict]:
        """
        Obtém histórico de preços
        """
        try:
            url = f"{self.coingecko_url}/coins/{token_id}/market_chart"
            params = {
                "vs_currency": "usd",
                "days": str(days),
                "interval": "hourly" if days <= 7 else "daily"
            }
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return self._process_price_history(data)
                else:
                    logger.error(f"Failed to get price history for {token_id}")
                    return self._get_simulated_history(token_id, days)
                    
        except Exception as e:
            logger.error(f"Error getting price history: {e}")
            return self._get_simulated_history(token_id, days)

    async def get_trending_tokens(self) -> List[Dict]:
        """
        Obtém tokens em tendência
        """
        try:
            url = f"{self.coingecko_url}/search/trending"
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    return self._process_trending_data(data)
                else:
                    logger.error("Failed to get trending tokens")
                    return []
                    
        except Exception as e:
            logger.error(f"Error getting trending tokens: {e}")
            return []

    async def get_market_overview(self) -> Dict:
        """
        Obtém visão geral do mercado
        """
        try:
            url = f"{self.coingecko_url}/global"
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    return self._process_market_overview(data)
                else:
                    logger.error("Failed to get market overview")
                    return self._get_simulated_market_overview()
                    
        except Exception as e:
            logger.error(f"Error getting market overview: {e}")
            return self._get_simulated_market_overview()

    def _process_token_data(self, raw_data: Dict) -> Dict:
        """
        Processa dados brutos do token
        """
        try:
            market_data = raw_data.get("market_data", {})
            
            return {
                "id": raw_data.get("id"),
                "symbol": raw_data.get("symbol", "").upper(),
                "name": raw_data.get("name"),
                "price": market_data.get("current_price", {}).get("usd", 0),
                "market_cap": market_data.get("market_cap", {}).get("usd", 0),
                "volume_24h": market_data.get("total_volume", {}).get("usd", 0),
                "price_change_24h": market_data.get("price_change_percentage_24h", 0),
                "price_change_7d": market_data.get("price_change_percentage_7d", 0),
                "market_cap_rank": market_data.get("market_cap_rank", 0),
                "circulating_supply": market_data.get("circulating_supply", 0),
                "total_supply": market_data.get("total_supply", 0),
                "ath": market_data.get("ath", {}).get("usd", 0),
                "atl": market_data.get("atl", {}).get("usd", 0),
                "sparkline": market_data.get("sparkline_7d", {}).get("price", []),
                "last_updated": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error processing token data: {e}")
            return {}

    def _process_price_history(self, raw_data: Dict) -> List[Dict]:
        """
        Processa histórico de preços
        """
        try:
            prices = raw_data.get("prices", [])
            volumes = raw_data.get("total_volumes", [])
            
            history = []
            for i, (timestamp, price) in enumerate(prices):
                volume = volumes[i][1] if i < len(volumes) else 0
                
                history.append({
                    "timestamp": datetime.fromtimestamp(timestamp / 1000),
                    "price": price,
                    "volume": volume
                })
            
            return history
        except Exception as e:
            logger.error(f"Error processing price history: {e}")
            return []

    def _process_trending_data(self, raw_data: Dict) -> List[Dict]:
        """
        Processa dados de tokens em tendência
        """
        try:
            trending = []
            coins = raw_data.get("coins", [])
            
            for coin_data in coins:
                coin = coin_data.get("item", {})
                trending.append({
                    "id": coin.get("id"),
                    "symbol": coin.get("symbol"),
                    "name": coin.get("name"),
                    "market_cap_rank": coin.get("market_cap_rank"),
                    "score": coin.get("score", 0)
                })
            
            return trending
        except Exception as e:
            logger.error(f"Error processing trending data: {e}")
            return []

    def _process_market_overview(self, raw_data: Dict) -> Dict:
        """
        Processa visão geral do mercado
        """
        try:
            data = raw_data.get("data", {})
            
            return {
                "total_market_cap": data.get("total_market_cap", {}).get("usd", 0),
                "total_volume": data.get("total_volume", {}).get("usd", 0),
                "market_cap_percentage": data.get("market_cap_percentage", {}),
                "active_cryptocurrencies": data.get("active_cryptocurrencies", 0),
                "markets": data.get("markets", 0),
                "market_cap_change_24h": data.get("market_cap_change_percentage_24h_usd", 0)
            }
        except Exception as e:
            logger.error(f"Error processing market overview: {e}")
            return {}

    def _is_cache_valid(self, token_id: str) -> bool:
        """
        Verifica se o cache é válido
        """
        if token_id not in self.price_cache or token_id not in self.last_update:
            return False
        
        cache_age = datetime.now() - self.last_update[token_id]
        return cache_age.total_seconds() < self.settings.price_update_interval

    def _symbol_to_id(self, symbol: str) -> Optional[str]:
        """
        Mapeia símbolo para ID do CoinGecko
        """
        symbol_map = {
            "ETH": "ethereum",
            "BTC": "bitcoin",
            "ADA": "cardano",
            "SOL": "solana",
            "DOT": "polkadot",
            "LINK": "chainlink",
            "AVAX": "avalanche-2",
            "MATIC": "polygon",
            "UNI": "uniswap",
            "AAVE": "aave",
            "COMP": "compound",
            "MKR": "maker",
            "GRT": "the-graph",
            "SNX": "synthetix",
            "YFI": "yearn-finance",
            "1INCH": "1inch"
        }
        
        return symbol_map.get(symbol.upper())

    def _get_simulated_data(self, token_id: str) -> Dict:
        """
        Gera dados simulados para desenvolvimento
        """
        base_price = random.uniform(0.1, 100)
        
        return {
            "id": token_id,
            "symbol": token_id.upper()[:4],
            "name": token_id.replace("-", " ").title(),
            "price": base_price,
            "market_cap": base_price * random.uniform(1000000, 10000000),
            "volume_24h": base_price * random.uniform(100000, 1000000),
            "price_change_24h": random.uniform(-10, 10),
            "price_change_7d": random.uniform(-20, 20),
            "market_cap_rank": random.randint(1, 100),
            "circulating_supply": random.uniform(1000000, 1000000000),
            "total_supply": random.uniform(1000000, 1000000000),
            "ath": base_price * random.uniform(1.5, 5),
            "atl": base_price * random.uniform(0.1, 0.8),
            "sparkline": [base_price * random.uniform(0.9, 1.1) for _ in range(168)],
            "last_updated": datetime.now().isoformat()
        }

    def _get_simulated_history(self, token_id: str, days: int) -> List[Dict]:
        """
        Gera histórico simulado
        """
        history = []
        base_price = random.uniform(1, 100)
        
        for i in range(days * 24):  # Dados horários
            timestamp = datetime.now() - timedelta(hours=i)
            price = base_price * random.uniform(0.95, 1.05)
            volume = random.uniform(100000, 1000000)
            
            history.append({
                "timestamp": timestamp,
                "price": price,
                "volume": volume
            })
        
        return list(reversed(history))

    def _get_simulated_market_overview(self) -> Dict:
        """
        Gera visão geral simulada do mercado
        """
        return {
            "total_market_cap": random.uniform(1000000000000, 3000000000000),
            "total_volume": random.uniform(50000000000, 200000000000),
            "market_cap_percentage": {
                "btc": random.uniform(40, 50),
                "eth": random.uniform(15, 25)
            },
            "active_cryptocurrencies": random.randint(8000, 12000),
            "markets": random.randint(500, 800),
            "market_cap_change_24h": random.uniform(-5, 5)
        }

    async def get_fear_greed_index(self) -> Dict:
        """
        Obtém índice de medo e ganância (simulado)
        """
        return {
            "value": random.randint(10, 90),
            "classification": random.choice(["Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed"]),
            "timestamp": datetime.now().isoformat()
        }

    def calculate_volatility(self, prices: List[float]) -> float:
        """
        Calcula volatilidade baseada em lista de preços
        """
        if len(prices) < 2:
            return 0.0
        
        import numpy as np
        returns = np.diff(prices) / prices[:-1]
        return float(np.std(returns) * 100)  # Volatilidade em %

    def detect_price_anomalies(self, token_data: Dict) -> List[str]:
        """
        Detecta anomalias nos dados de preços
        """
        anomalies = []
        
        # Verifica mudanças extremas
        if abs(token_data.get("price_change_24h", 0)) > 50:
            anomalies.append("extreme_price_change")
        
        # Verifica volume anômalo
        volume_24h = token_data.get("volume_24h", 0)
        market_cap = token_data.get("market_cap", 1)
        volume_ratio = volume_24h / market_cap if market_cap > 0 else 0
        
        if volume_ratio > 1:  # Volume > Market Cap
            anomalies.append("unusual_volume")
        
        return anomalies

