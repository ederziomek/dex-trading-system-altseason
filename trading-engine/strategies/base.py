"""
Base Strategy Class for Trading Engine
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from datetime import datetime
import asyncio

from utils.logger import setup_logger

logger = setup_logger(__name__)

class BaseStrategy(ABC):
    """
    Classe base abstrata para todas as estratégias de trading
    """
    
    def __init__(self, name: str, settings: Any):
        self.name = name
        self.settings = settings
        self.active = False
        self.performance_metrics = {
            "total_signals": 0,
            "successful_signals": 0,
            "win_rate": 0.0,
            "total_pnl": 0.0,
            "avg_pnl_per_trade": 0.0
        }
        
        logger.info(f"Strategy {self.name} initialized")

    @abstractmethod
    async def analyze(self, market_data: Dict[str, Dict]) -> List[Dict]:
        """
        Analisa dados de mercado e retorna sinais de trading
        
        Args:
            market_data: Dados de mercado por token
            
        Returns:
            Lista de sinais de trading
        """
        pass

    @abstractmethod
    def validate_signal(self, signal: Dict) -> bool:
        """
        Valida se um sinal é válido para execução
        
        Args:
            signal: Sinal de trading
            
        Returns:
            True se válido, False caso contrário
        """
        pass

    def update_performance(self, trade_result: Dict):
        """
        Atualiza métricas de performance da estratégia
        
        Args:
            trade_result: Resultado do trade executado
        """
        try:
            self.performance_metrics["total_signals"] += 1
            
            pnl = trade_result.get("pnl", 0)
            self.performance_metrics["total_pnl"] += pnl
            
            if pnl > 0:
                self.performance_metrics["successful_signals"] += 1
            
            # Calcula win rate
            total = self.performance_metrics["total_signals"]
            successful = self.performance_metrics["successful_signals"]
            self.performance_metrics["win_rate"] = (successful / total) * 100 if total > 0 else 0
            
            # Calcula PnL médio
            self.performance_metrics["avg_pnl_per_trade"] = (
                self.performance_metrics["total_pnl"] / total if total > 0 else 0
            )
            
            logger.info(f"Strategy {self.name} performance updated", 
                       win_rate=self.performance_metrics["win_rate"],
                       total_pnl=self.performance_metrics["total_pnl"])
            
        except Exception as e:
            logger.error(f"Error updating performance for {self.name}: {e}")

    def get_performance_metrics(self) -> Dict:
        """
        Retorna métricas de performance da estratégia
        """
        return self.performance_metrics.copy()

    def reset_performance(self):
        """
        Reseta métricas de performance
        """
        self.performance_metrics = {
            "total_signals": 0,
            "successful_signals": 0,
            "win_rate": 0.0,
            "total_pnl": 0.0,
            "avg_pnl_per_trade": 0.0
        }
        logger.info(f"Strategy {self.name} performance metrics reset")

    def activate(self):
        """Ativa a estratégia"""
        self.active = True
        logger.info(f"Strategy {self.name} activated")

    def deactivate(self):
        """Desativa a estratégia"""
        self.active = False
        logger.info(f"Strategy {self.name} deactivated")

    def is_active(self) -> bool:
        """Verifica se a estratégia está ativa"""
        return self.active

    def get_strategy_info(self) -> Dict:
        """
        Retorna informações da estratégia
        """
        return {
            "name": self.name,
            "active": self.active,
            "performance": self.performance_metrics,
            "last_updated": datetime.now().isoformat()
        }

