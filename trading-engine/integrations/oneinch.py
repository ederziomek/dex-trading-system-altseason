"""
1inch API Client for DEX Trading
"""

import aiohttp
import asyncio
from typing import Dict, Optional, Any
import json
from datetime import datetime

from config.settings import TradingSettings
from utils.logger import setup_logger, TradingLogger

logger = setup_logger(__name__)
trading_logger = TradingLogger(__name__)

class OneInchClient:
    """
    Cliente para integração com 1inch API
    """
    
    def __init__(self, settings: TradingSettings):
        self.settings = settings
        self.api_key = settings.oneinch_api_key
        self.base_url = "https://api.1inch.dev"
        self.chain_id = settings.chain_id
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Token addresses (Ethereum mainnet)
        self.tokens = {
            "USDT": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            "USDC": "0xA0b86a33E6441b8C0C5C95b4F3f8E7C4C6e8e8e8",
            "WETH": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
            "DAI": "0x6B175474E89094C44Da98b954EedeAC495271d0F"
        }
        
        logger.info("1inch Client initialized", chain_id=self.chain_id)

    async def initialize(self, session: aiohttp.ClientSession):
        """Inicializa o cliente com sessão HTTP"""
        self.session = session
        logger.info("1inch Client session initialized")

    async def health_check(self) -> bool:
        """Verifica se a API está funcionando"""
        try:
            url = f"{self.base_url}/healthcheck"
            headers = {"Authorization": f"Bearer {self.api_key}"}
            
            async with self.session.get(url, headers=headers) as response:
                return response.status == 200
                
        except Exception as e:
            logger.error(f"1inch health check failed: {e}")
            return False

    async def get_quote(self, from_token: str, to_token: str, amount: float) -> Optional[Dict]:
        """
        Obtém cotação para um swap
        """
        try:
            from_token_address = self._get_token_address(from_token)
            to_token_address = self._get_token_address(to_token)
            
            if not from_token_address or not to_token_address:
                logger.error(f"Invalid tokens: {from_token} -> {to_token}")
                return None
            
            # Converte amount para wei (assumindo 18 decimais)
            amount_wei = int(amount * 10**18)
            
            url = f"{self.base_url}/swap/v6.0/{self.chain_id}/quote"
            params = {
                "src": from_token_address,
                "dst": to_token_address,
                "amount": str(amount_wei)
            }
            headers = {"Authorization": f"Bearer {self.api_key}"}
            
            async with self.session.get(url, params=params, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return self._parse_quote_response(data)
                else:
                    error_text = await response.text()
                    logger.error(f"Quote request failed: {response.status} - {error_text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error getting quote: {e}")
            return None

    async def execute_swap(self, from_token: str, to_token: str, amount: float, slippage: float = 1.0) -> Dict:
        """
        Executa um swap via 1inch
        """
        try:
            # Primeiro obtém a cotação
            quote = await self.get_quote(from_token, to_token, amount)
            if not quote:
                return {"success": False, "error": "Failed to get quote"}
            
            # Para desenvolvimento, simula execução
            # Em produção, executaria transação real na blockchain
            simulated_result = self._simulate_swap_execution(quote, from_token, to_token, amount)
            
            # Log da execução
            trading_logger.trade_execution(
                trade_id=simulated_result["tx_hash"],
                symbol=f"{from_token}/{to_token}",
                side="swap",
                amount=amount,
                price=simulated_result["execution_price"]
            )
            
            logger.info(f"Swap executed: {amount} {from_token} -> {simulated_result['amount_out']} {to_token}")
            
            return simulated_result
            
        except Exception as e:
            logger.error(f"Error executing swap: {e}")
            return {"success": False, "error": str(e)}

    def _simulate_swap_execution(self, quote: Dict, from_token: str, to_token: str, amount: float) -> Dict:
        """
        Simula execução de swap para desenvolvimento
        """
        # Simula slippage de 0.1-0.5%
        import random
        slippage = random.uniform(0.001, 0.005)
        
        expected_out = quote["to_amount"]
        actual_out = expected_out * (1 - slippage)
        
        return {
            "success": True,
            "tx_hash": f"0x{datetime.now().strftime('%Y%m%d%H%M%S')}{''.join([str(random.randint(0,9)) for _ in range(10)])}",
            "amount_out": actual_out,
            "execution_price": actual_out / amount if amount > 0 else 0,
            "gas_used": random.randint(150000, 300000),
            "gas_price": random.randint(20, 50),
            "slippage": slippage,
            "timestamp": datetime.now().isoformat()
        }

    async def get_supported_tokens(self) -> Dict[str, str]:
        """
        Obtém lista de tokens suportados
        """
        try:
            url = f"{self.base_url}/swap/v6.0/{self.chain_id}/tokens"
            headers = {"Authorization": f"Bearer {self.api_key}"}
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("tokens", {})
                else:
                    logger.error(f"Failed to get tokens: {response.status}")
                    return self.tokens  # Fallback para tokens hardcoded
                    
        except Exception as e:
            logger.error(f"Error getting supported tokens: {e}")
            return self.tokens

    async def get_liquidity_sources(self) -> Dict:
        """
        Obtém fontes de liquidez disponíveis
        """
        try:
            url = f"{self.base_url}/swap/v6.0/{self.chain_id}/liquidity-sources"
            headers = {"Authorization": f"Bearer {self.api_key}"}
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.error(f"Failed to get liquidity sources: {response.status}")
                    return {}
                    
        except Exception as e:
            logger.error(f"Error getting liquidity sources: {e}")
            return {}

    def _get_token_address(self, symbol: str) -> Optional[str]:
        """
        Obtém endereço do token pelo símbolo
        """
        return self.tokens.get(symbol.upper())

    def _parse_quote_response(self, data: Dict) -> Dict:
        """
        Processa resposta da cotação
        """
        try:
            return {
                "from_token": data.get("fromToken", {}),
                "to_token": data.get("toToken", {}),
                "from_amount": float(data.get("fromTokenAmount", 0)) / 10**18,
                "to_amount": float(data.get("toTokenAmount", 0)) / 10**18,
                "estimated_gas": int(data.get("estimatedGas", 200000)),
                "protocols": data.get("protocols", []),
                "price_impact": self._calculate_price_impact(data)
            }
        except Exception as e:
            logger.error(f"Error parsing quote response: {e}")
            return {}

    def _calculate_price_impact(self, quote_data: Dict) -> float:
        """
        Calcula impacto no preço
        """
        try:
            # Implementação simplificada
            # Em produção, compararia com preço de mercado
            return 0.001  # 0.1% de impacto estimado
        except:
            return 0.0

    async def get_gas_price(self) -> Dict:
        """
        Obtém preço atual do gas
        """
        try:
            # Para desenvolvimento, retorna valores simulados
            import random
            return {
                "standard": random.randint(20, 40),
                "fast": random.randint(40, 60),
                "instant": random.randint(60, 100)
            }
        except Exception as e:
            logger.error(f"Error getting gas price: {e}")
            return {"standard": 30, "fast": 50, "instant": 80}

    async def estimate_swap_gas(self, from_token: str, to_token: str, amount: float) -> int:
        """
        Estima gas necessário para swap
        """
        try:
            # Estimativa baseada no tipo de swap
            base_gas = 150000
            
            # Swaps com tokens ERC20 custam mais
            if from_token != "ETH" and to_token != "ETH":
                base_gas += 50000
            
            # Adiciona margem de segurança
            return int(base_gas * 1.2)
            
        except Exception as e:
            logger.error(f"Error estimating gas: {e}")
            return 200000  # Valor conservador

    def get_swap_history(self) -> list:
        """
        Retorna histórico de swaps (simulado para desenvolvimento)
        """
        # Em produção, consultaria blockchain ou banco de dados
        return []

    async def cancel_transaction(self, tx_hash: str) -> bool:
        """
        Cancela transação pendente (se possível)
        """
        try:
            # Em produção, tentaria cancelar com gas price maior
            logger.info(f"Transaction cancellation requested: {tx_hash}")
            return True
        except Exception as e:
            logger.error(f"Error cancelling transaction: {e}")
            return False

    def validate_swap_parameters(self, from_token: str, to_token: str, amount: float) -> Dict:
        """
        Valida parâmetros do swap
        """
        errors = []
        
        if not self._get_token_address(from_token):
            errors.append(f"Unsupported from_token: {from_token}")
        
        if not self._get_token_address(to_token):
            errors.append(f"Unsupported to_token: {to_token}")
        
        if amount <= 0:
            errors.append("Amount must be positive")
        
        if from_token == to_token:
            errors.append("From and to tokens cannot be the same")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }

    async def get_token_balance(self, token: str, wallet_address: str) -> float:
        """
        Obtém saldo de token (simulado para desenvolvimento)
        """
        try:
            # Em produção, consultaria blockchain
            import random
            return random.uniform(100, 1000)  # Saldo simulado
        except Exception as e:
            logger.error(f"Error getting token balance: {e}")
            return 0.0

