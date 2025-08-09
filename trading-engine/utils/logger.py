"""
Logging System for Trading Engine
"""

import logging
import sys
from datetime import datetime
from pathlib import Path
import structlog

def setup_logger(name: str) -> structlog.stdlib.BoundLogger:
    """
    Configura e retorna um logger estruturado
    """
    # Cria diretório de logs se não existir
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Configuração do logging padrão
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(
                log_dir / f"trading_engine_{datetime.now().strftime('%Y%m%d')}.log"
            )
        ]
    )
    
    # Configuração do structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="ISO"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    return structlog.get_logger(name)

class TradingLogger:
    """Logger especializado para eventos de trading"""
    
    def __init__(self, name: str):
        self.logger = setup_logger(name)
    
    def trade_signal(self, symbol: str, signal_type: str, price: float, confidence: float):
        """Log de sinal de trading"""
        self.logger.info(
            "Trading signal generated",
            symbol=symbol,
            signal_type=signal_type,
            price=price,
            confidence=confidence,
            event_type="signal"
        )
    
    def trade_execution(self, trade_id: str, symbol: str, side: str, amount: float, price: float):
        """Log de execução de trade"""
        self.logger.info(
            "Trade executed",
            trade_id=trade_id,
            symbol=symbol,
            side=side,
            amount=amount,
            price=price,
            event_type="execution"
        )
    
    def trade_closed(self, trade_id: str, symbol: str, pnl: float, reason: str):
        """Log de fechamento de trade"""
        self.logger.info(
            "Trade closed",
            trade_id=trade_id,
            symbol=symbol,
            pnl=pnl,
            reason=reason,
            event_type="close"
        )
    
    def risk_event(self, event_type: str, details: dict):
        """Log de eventos de risco"""
        self.logger.warning(
            "Risk management event",
            risk_event_type=event_type,
            details=details,
            event_type="risk"
        )
    
    def api_error(self, api_name: str, error: str, retry_count: int = 0):
        """Log de erros de API"""
        self.logger.error(
            "API error",
            api_name=api_name,
            error=error,
            retry_count=retry_count,
            event_type="api_error"
        )
    
    def performance_metric(self, metric_name: str, value: float, period: str):
        """Log de métricas de performance"""
        self.logger.info(
            "Performance metric",
            metric_name=metric_name,
            value=value,
            period=period,
            event_type="performance"
        )

