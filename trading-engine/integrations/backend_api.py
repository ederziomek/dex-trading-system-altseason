"""
Backend API Client for Trading Engine Communication
"""

import aiohttp
import asyncio
from typing import Dict, List, Optional, Any
import json
from datetime import datetime

from config.settings import TradingSettings
from utils.logger import setup_logger

logger = setup_logger(__name__)

class BackendAPIClient:
    """
    Cliente para comunicação com o backend Node.js
    """
    
    def __init__(self, settings: TradingSettings):
        self.settings = settings
        self.base_url = settings.backend_api_url
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Headers padrão
        self.headers = {
            "Content-Type": "application/json",
            "User-Agent": "TradingEngine/1.0"
        }
        
        logger.info("Backend API Client initialized", base_url=self.base_url)

    async def initialize(self, session: aiohttp.ClientSession):
        """Inicializa o cliente com sessão HTTP"""
        self.session = session
        logger.info("Backend API Client session initialized")

    async def health_check(self) -> bool:
        """Verifica se o backend está funcionando"""
        try:
            url = f"{self.base_url}/api/health"
            async with self.session.get(url, headers=self.headers) as response:
                return response.status == 200
        except Exception as e:
            logger.error(f"Backend health check failed: {e}")
            return False

    async def report_trade_signal(self, signal: Dict) -> bool:
        """
        Reporta sinal de trading para o backend
        """
        try:
            url = f"{self.base_url}/api/trading/signal"
            
            payload = {
                "symbol": signal.get("symbol"),
                "type": signal.get("type"),
                "price": signal.get("price"),
                "confidence": signal.get("confidence"),
                "timestamp": datetime.now().isoformat(),
                "strategy": "momentum",
                "metadata": signal.get("metadata", {})
            }
            
            async with self.session.post(url, json=payload, headers=self.headers) as response:
                if response.status == 200:
                    logger.info(f"Signal reported: {signal['symbol']}")
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"Failed to report signal: {response.status} - {error_text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error reporting signal: {e}")
            return False

    async def report_trade_execution(self, trade: Dict) -> bool:
        """
        Reporta execução de trade para o backend
        """
        try:
            url = f"{self.base_url}/api/trading/execution"
            
            payload = {
                "trade_id": trade.get("id"),
                "symbol": trade.get("symbol"),
                "side": "buy",  # Assumindo compra para momentum
                "amount": trade.get("amount"),
                "entry_price": trade.get("entry_price"),
                "stop_loss": trade.get("stop_loss"),
                "take_profit": trade.get("take_profit"),
                "timestamp": trade.get("timestamp", datetime.now()).isoformat(),
                "tx_hash": trade.get("tx_hash"),
                "status": "active"
            }
            
            async with self.session.post(url, json=payload, headers=self.headers) as response:
                if response.status == 200:
                    logger.info(f"Trade execution reported: {trade['id']}")
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"Failed to report execution: {response.status} - {error_text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error reporting execution: {e}")
            return False

    async def report_trade_close(self, trade_id: str, pnl: float, reason: str) -> bool:
        """
        Reporta fechamento de trade para o backend
        """
        try:
            url = f"{self.base_url}/api/trading/close"
            
            payload = {
                "trade_id": trade_id,
                "pnl": pnl,
                "close_reason": reason,
                "close_timestamp": datetime.now().isoformat(),
                "status": "closed"
            }
            
            async with self.session.post(url, json=payload, headers=self.headers) as response:
                if response.status == 200:
                    logger.info(f"Trade close reported: {trade_id}")
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"Failed to report close: {response.status} - {error_text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error reporting close: {e}")
            return False

    async def report_performance(self, metrics: Dict) -> bool:
        """
        Reporta métricas de performance para o backend
        """
        try:
            url = f"{self.base_url}/api/trading/performance"
            
            payload = {
                "timestamp": datetime.now().isoformat(),
                "metrics": metrics,
                "engine_status": "active"
            }
            
            async with self.session.post(url, json=payload, headers=self.headers) as response:
                if response.status == 200:
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"Failed to report performance: {response.status} - {error_text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error reporting performance: {e}")
            return False

    async def get_trading_config(self) -> Optional[Dict]:
        """
        Obtém configurações de trading do backend
        """
        try:
            url = f"{self.base_url}/api/trading/config"
            
            async with self.session.get(url, headers=self.headers) as response:
                if response.status == 200:
                    config = await response.json()
                    logger.info("Trading config retrieved from backend")
                    return config
                else:
                    logger.error(f"Failed to get config: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error getting config: {e}")
            return None

    async def update_engine_status(self, status: str, details: Dict = None) -> bool:
        """
        Atualiza status do engine no backend
        """
        try:
            url = f"{self.base_url}/api/trading/status"
            
            payload = {
                "status": status,
                "timestamp": datetime.now().isoformat(),
                "details": details or {}
            }
            
            async with self.session.post(url, json=payload, headers=self.headers) as response:
                if response.status == 200:
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"Failed to update status: {response.status} - {error_text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error updating status: {e}")
            return False

    async def send_alert(self, alert_type: str, message: str, severity: str = "info") -> bool:
        """
        Envia alerta para o backend
        """
        try:
            url = f"{self.base_url}/api/trading/alert"
            
            payload = {
                "type": alert_type,
                "message": message,
                "severity": severity,
                "timestamp": datetime.now().isoformat(),
                "source": "trading_engine"
            }
            
            async with self.session.post(url, json=payload, headers=self.headers) as response:
                if response.status == 200:
                    logger.info(f"Alert sent: {alert_type}")
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"Failed to send alert: {response.status} - {error_text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error sending alert: {e}")
            return False

    async def get_market_sentiment(self) -> Optional[Dict]:
        """
        Obtém sentimento de mercado do backend
        """
        try:
            url = f"{self.base_url}/api/market/sentiment"
            
            async with self.session.get(url, headers=self.headers) as response:
                if response.status == 200:
                    sentiment = await response.json()
                    return sentiment
                else:
                    logger.error(f"Failed to get sentiment: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error getting sentiment: {e}")
            return None

    async def log_error(self, error_type: str, error_message: str, context: Dict = None) -> bool:
        """
        Registra erro no backend
        """
        try:
            url = f"{self.base_url}/api/trading/error"
            
            payload = {
                "error_type": error_type,
                "message": error_message,
                "context": context or {},
                "timestamp": datetime.now().isoformat(),
                "source": "trading_engine"
            }
            
            async with self.session.post(url, json=payload, headers=self.headers) as response:
                return response.status == 200
                    
        except Exception as e:
            logger.error(f"Error logging error: {e}")
            return False

    async def get_active_trades(self) -> List[Dict]:
        """
        Obtém lista de trades ativos do backend
        """
        try:
            url = f"{self.base_url}/api/trading/active"
            
            async with self.session.get(url, headers=self.headers) as response:
                if response.status == 200:
                    trades = await response.json()
                    return trades.get("trades", [])
                else:
                    logger.error(f"Failed to get active trades: {response.status}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error getting active trades: {e}")
            return []

    async def sync_portfolio(self, portfolio_data: Dict) -> bool:
        """
        Sincroniza dados do portfolio com o backend
        """
        try:
            url = f"{self.base_url}/api/trading/portfolio"
            
            payload = {
                "timestamp": datetime.now().isoformat(),
                "portfolio": portfolio_data
            }
            
            async with self.session.post(url, json=payload, headers=self.headers) as response:
                if response.status == 200:
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"Failed to sync portfolio: {response.status} - {error_text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error syncing portfolio: {e}")
            return False

    async def request_emergency_stop(self, reason: str) -> bool:
        """
        Solicita parada de emergência via backend
        """
        try:
            url = f"{self.base_url}/api/trading/emergency-stop"
            
            payload = {
                "reason": reason,
                "timestamp": datetime.now().isoformat(),
                "requested_by": "trading_engine"
            }
            
            async with self.session.post(url, json=payload, headers=self.headers) as response:
                if response.status == 200:
                    logger.warning(f"Emergency stop requested: {reason}")
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"Failed to request emergency stop: {response.status} - {error_text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error requesting emergency stop: {e}")
            return False

    async def heartbeat(self) -> bool:
        """
        Envia heartbeat para o backend
        """
        try:
            url = f"{self.base_url}/api/trading/heartbeat"
            
            payload = {
                "timestamp": datetime.now().isoformat(),
                "status": "alive"
            }
            
            async with self.session.post(url, json=payload, headers=self.headers) as response:
                return response.status == 200
                    
        except Exception as e:
            logger.error(f"Error sending heartbeat: {e}")
            return False

    def _handle_api_error(self, response_status: int, error_text: str, endpoint: str):
        """
        Trata erros de API de forma centralizada
        """
        if response_status == 401:
            logger.error(f"Authentication failed for {endpoint}")
        elif response_status == 403:
            logger.error(f"Access forbidden for {endpoint}")
        elif response_status == 404:
            logger.error(f"Endpoint not found: {endpoint}")
        elif response_status >= 500:
            logger.error(f"Server error for {endpoint}: {error_text}")
        else:
            logger.error(f"API error for {endpoint}: {response_status} - {error_text}")

    async def batch_report(self, reports: List[Dict]) -> Dict[str, bool]:
        """
        Envia múltiplos relatórios em batch
        """
        results = {}
        
        for report in reports:
            report_type = report.get("type")
            
            if report_type == "signal":
                results[f"signal_{report.get('id')}"] = await self.report_trade_signal(report)
            elif report_type == "execution":
                results[f"execution_{report.get('id')}"] = await self.report_trade_execution(report)
            elif report_type == "close":
                results[f"close_{report.get('id')}"] = await self.report_trade_close(
                    report.get('trade_id'), report.get('pnl'), report.get('reason')
                )
        
        return results

