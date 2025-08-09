"""
Risk Management System for Trading Engine
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
import math

from config.settings import TradingSettings
from utils.logger import setup_logger, TradingLogger

logger = setup_logger(__name__)
trading_logger = TradingLogger(__name__)

class RiskManager:
    """
    Sistema de gestão de risco para o Trading Engine
    """
    
    def __init__(self, settings: TradingSettings):
        self.settings = settings
        self.daily_trades = []
        self.daily_pnl = 0.0
        self.consecutive_losses = 0
        self.last_reset_date = datetime.now().date()
        
        logger.info("Risk Manager initialized",
                   max_position_size=settings.max_position_size_percent,
                   stop_loss=settings.stop_loss_percent,
                   max_trades=settings.max_simultaneous_trades)

    async def validate_trade(self, signal: dict, active_trades: Dict[str, dict]) -> bool:
        """
        Valida se um trade pode ser executado baseado nas regras de risco
        """
        try:
            # Reset diário se necessário
            self._check_daily_reset()
            
            # Verificações de risco
            checks = [
                self._check_max_simultaneous_trades(active_trades),
                self._check_daily_loss_limit(),
                self._check_consecutive_losses(),
                self._check_position_size_limit(signal),
                self._check_symbol_exposure(signal, active_trades),
                self._check_market_conditions(signal),
                self._check_time_restrictions()
            ]
            
            # Log das verificações
            failed_checks = [check['name'] for check in checks if not check['passed']]
            
            if failed_checks:
                trading_logger.risk_event("trade_rejected", {
                    'symbol': signal['symbol'],
                    'failed_checks': failed_checks,
                    'signal_confidence': signal.get('confidence', 0)
                })
                logger.info(f"Trade rejected: {signal['symbol']}, failed checks: {failed_checks}")
                return False
            
            logger.info(f"Trade approved: {signal['symbol']}")
            return True
            
        except Exception as e:
            logger.error(f"Error in trade validation: {e}")
            return False

    def _check_max_simultaneous_trades(self, active_trades: Dict[str, dict]) -> dict:
        """Verifica limite de trades simultâneos"""
        current_count = len(active_trades)
        max_allowed = self.settings.max_simultaneous_trades
        
        return {
            'name': 'max_simultaneous_trades',
            'passed': current_count < max_allowed,
            'current': current_count,
            'limit': max_allowed
        }

    def _check_daily_loss_limit(self) -> dict:
        """Verifica limite de perda diária"""
        daily_loss_limit = self.settings.capital_usdt * (self.settings.max_daily_loss_percent / 100)
        current_loss = abs(min(0, self.daily_pnl))
        
        return {
            'name': 'daily_loss_limit',
            'passed': current_loss < daily_loss_limit,
            'current_loss': current_loss,
            'limit': daily_loss_limit
        }

    def _check_consecutive_losses(self) -> dict:
        """Verifica limite de perdas consecutivas"""
        return {
            'name': 'consecutive_losses',
            'passed': self.consecutive_losses < self.settings.consecutive_loss_limit,
            'current': self.consecutive_losses,
            'limit': self.settings.consecutive_loss_limit
        }

    def _check_position_size_limit(self, signal: dict) -> dict:
        """Verifica se o tamanho da posição está dentro do limite"""
        position_size = self.calculate_position_size(signal['price'], self.settings.capital_usdt)
        max_position = self.settings.capital_usdt * (self.settings.max_position_size_percent / 100)
        
        return {
            'name': 'position_size_limit',
            'passed': position_size <= max_position,
            'position_size': position_size,
            'limit': max_position
        }

    def _check_symbol_exposure(self, signal: dict, active_trades: Dict[str, dict]) -> dict:
        """Verifica exposição por símbolo (máximo 1 trade por token)"""
        symbol_trades = [trade for trade in active_trades.values() 
                        if trade['symbol'] == signal['symbol']]
        
        return {
            'name': 'symbol_exposure',
            'passed': len(symbol_trades) == 0,
            'current_trades': len(symbol_trades),
            'symbol': signal['symbol']
        }

    def _check_market_conditions(self, signal: dict) -> dict:
        """Verifica condições de mercado"""
        # Verifica se a confiança do sinal é suficiente
        min_confidence = 0.7  # 70% de confiança mínima
        confidence = signal.get('confidence', 0)
        
        return {
            'name': 'market_conditions',
            'passed': confidence >= min_confidence,
            'confidence': confidence,
            'min_confidence': min_confidence
        }

    def _check_time_restrictions(self) -> dict:
        """Verifica restrições de horário"""
        current_hour = datetime.now().hour
        
        # Evita trading durante horários de baixa liquidez (2-6 AM UTC)
        restricted_hours = list(range(2, 6))
        
        return {
            'name': 'time_restrictions',
            'passed': current_hour not in restricted_hours,
            'current_hour': current_hour,
            'restricted_hours': restricted_hours
        }

    def calculate_position_size(self, price: float, available_capital: float) -> float:
        """
        Calcula o tamanho da posição baseado no capital disponível e regras de risco
        """
        try:
            # Tamanho base baseado na porcentagem configurada
            base_size = available_capital * (self.settings.max_position_size_percent / 100)
            
            # Ajusta baseado na volatilidade (implementação simplificada)
            volatility_adjustment = self._calculate_volatility_adjustment()
            adjusted_size = base_size * volatility_adjustment
            
            # Garante que não excede limites
            max_size = available_capital * 0.1  # Máximo 10% do capital por trade
            final_size = min(adjusted_size, max_size)
            
            logger.info(f"Position size calculated: ${final_size:.2f}")
            return final_size
            
        except Exception as e:
            logger.error(f"Error calculating position size: {e}")
            # Retorna tamanho conservador em caso de erro
            return available_capital * 0.02  # 2% do capital

    def _calculate_volatility_adjustment(self) -> float:
        """
        Calcula ajuste baseado na volatilidade do mercado
        """
        # Implementação simplificada - em produção usaria dados históricos
        # Por enquanto retorna 1.0 (sem ajuste)
        return 1.0

    def calculate_stop_loss(self, entry_price: float, side: str = "buy") -> float:
        """
        Calcula preço de stop-loss
        """
        stop_loss_percent = self.settings.stop_loss_percent / 100
        
        if side == "buy":
            return entry_price * (1 - stop_loss_percent)
        else:  # sell
            return entry_price * (1 + stop_loss_percent)

    def calculate_take_profit(self, entry_price: float, side: str = "buy") -> float:
        """
        Calcula preço de take-profit
        """
        take_profit_percent = self.settings.take_profit_percent / 100
        
        if side == "buy":
            return entry_price * (1 + take_profit_percent)
        else:  # sell
            return entry_price * (1 - take_profit_percent)

    def update_trade_result(self, pnl: float, was_profitable: bool):
        """
        Atualiza estatísticas após fechamento de trade
        """
        try:
            self._check_daily_reset()
            
            # Atualiza P&L diário
            self.daily_pnl += pnl
            
            # Atualiza contador de perdas consecutivas
            if was_profitable:
                self.consecutive_losses = 0
            else:
                self.consecutive_losses += 1
            
            # Registra trade do dia
            self.daily_trades.append({
                'timestamp': datetime.now(),
                'pnl': pnl,
                'profitable': was_profitable
            })
            
            # Log de métricas de risco
            trading_logger.performance_metric("daily_pnl", self.daily_pnl, "daily")
            trading_logger.performance_metric("consecutive_losses", self.consecutive_losses, "current")
            
            logger.info(f"Trade result updated: P&L=${pnl:.2f}, consecutive_losses={self.consecutive_losses}")
            
        except Exception as e:
            logger.error(f"Error updating trade result: {e}")

    def _check_daily_reset(self):
        """
        Verifica se precisa resetar estatísticas diárias
        """
        current_date = datetime.now().date()
        
        if current_date > self.last_reset_date:
            logger.info("Resetting daily statistics")
            self.daily_trades = []
            self.daily_pnl = 0.0
            self.last_reset_date = current_date

    def get_risk_metrics(self) -> dict:
        """
        Retorna métricas atuais de risco
        """
        self._check_daily_reset()
        
        # Calcula win rate diário
        profitable_trades = sum(1 for trade in self.daily_trades if trade['profitable'])
        total_trades = len(self.daily_trades)
        win_rate = (profitable_trades / total_trades * 100) if total_trades > 0 else 0
        
        # Calcula drawdown atual
        daily_loss_limit = self.settings.capital_usdt * (self.settings.max_daily_loss_percent / 100)
        current_drawdown = abs(min(0, self.daily_pnl)) / daily_loss_limit * 100
        
        return {
            'daily_pnl': self.daily_pnl,
            'daily_trades_count': total_trades,
            'daily_win_rate': win_rate,
            'consecutive_losses': self.consecutive_losses,
            'current_drawdown_percent': current_drawdown,
            'risk_level': self._assess_risk_level()
        }

    def _assess_risk_level(self) -> str:
        """
        Avalia o nível de risco atual
        """
        risk_factors = 0
        
        # Fatores de risco
        if self.consecutive_losses >= self.settings.consecutive_loss_limit * 0.7:
            risk_factors += 1
        
        daily_loss_limit = self.settings.capital_usdt * (self.settings.max_daily_loss_percent / 100)
        if abs(min(0, self.daily_pnl)) >= daily_loss_limit * 0.7:
            risk_factors += 1
        
        if len(self.daily_trades) > 10:  # Muitos trades em um dia
            risk_factors += 1
        
        # Determina nível
        if risk_factors == 0:
            return "LOW"
        elif risk_factors == 1:
            return "MEDIUM"
        else:
            return "HIGH"

    def should_pause_trading(self) -> bool:
        """
        Determina se o trading deve ser pausado por questões de risco
        """
        risk_level = self._assess_risk_level()
        
        # Pausa se risco alto ou limites atingidos
        return (
            risk_level == "HIGH" or
            self.consecutive_losses >= self.settings.consecutive_loss_limit or
            abs(min(0, self.daily_pnl)) >= self.settings.capital_usdt * (self.settings.max_daily_loss_percent / 100)
        )

    def get_recommended_position_size(self, signal: dict, available_capital: float) -> float:
        """
        Retorna tamanho de posição recomendado baseado no risco atual
        """
        base_size = self.calculate_position_size(signal['price'], available_capital)
        
        # Ajusta baseado no nível de risco
        risk_level = self._assess_risk_level()
        
        if risk_level == "HIGH":
            return base_size * 0.5  # Reduz 50%
        elif risk_level == "MEDIUM":
            return base_size * 0.75  # Reduz 25%
        else:
            return base_size  # Tamanho normal

