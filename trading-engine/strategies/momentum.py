"""
Momentum Trading Strategy for Altseason
"""

import numpy as np
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import asyncio

from strategies.base import BaseStrategy
from config.settings import TradingSettings
from utils.logger import setup_logger, TradingLogger

logger = setup_logger(__name__)
trading_logger = TradingLogger(__name__)

class MomentumStrategy(BaseStrategy):
    """
    Estratégia de momentum otimizada para altseason
    
    Detecta breakouts de preço com confirmação de volume
    e executa trades na direção da tendência forte
    """
    
    def __init__(self, settings: TradingSettings):
        super().__init__("Momentum", settings)
        
        # Parâmetros da estratégia
        self.price_change_threshold = 0.02  # 2% de mudança mínima
        self.volume_multiplier = 1.5        # 150% do volume médio
        self.lookback_period = 5            # Períodos para análise
        self.confidence_threshold = 0.7     # Confiança mínima para sinal
        
        # Histórico de dados para análise
        self.price_history: Dict[str, List[float]] = {}
        self.volume_history: Dict[str, List[float]] = {}
        self.signal_history: Dict[str, List[Dict]] = {}
        
        # Filtros de qualidade
        self.min_market_cap = 10000000      # $10M mínimo
        self.max_price_impact = 0.05        # 5% máximo de impacto
        
        self.activate()  # Ativa por padrão
        logger.info("Momentum Strategy initialized with altseason parameters")

    async def analyze(self, market_data: Dict[str, Dict]) -> List[Dict]:
        """
        Analisa dados de mercado e identifica oportunidades de momentum
        """
        signals = []
        
        try:
            for token_id, data in market_data.items():
                # Atualiza histórico
                self._update_history(token_id, data)
                
                # Verifica se há dados suficientes
                if not self._has_sufficient_data(token_id):
                    continue
                
                # Analisa momentum
                momentum_signal = await self._analyze_momentum(token_id, data)
                
                if momentum_signal and self.validate_signal(momentum_signal):
                    signals.append(momentum_signal)
                    
                    # Log do sinal
                    trading_logger.trade_signal(
                        symbol=momentum_signal['symbol'],
                        signal_type=momentum_signal['type'],
                        price=momentum_signal['price'],
                        confidence=momentum_signal['confidence']
                    )
            
            logger.info(f"Momentum analysis completed: {len(signals)} signals generated")
            return signals
            
        except Exception as e:
            logger.error(f"Error in momentum analysis: {e}")
            return []

    async def _analyze_momentum(self, token_id: str, data: Dict) -> Optional[Dict]:
        """
        Analisa momentum para um token específico
        """
        try:
            # Obtém dados históricos
            prices = np.array(self.price_history[token_id])
            volumes = np.array(self.volume_history[token_id])
            
            # Calcula indicadores
            price_momentum = self._calculate_price_momentum(prices)
            volume_confirmation = self._calculate_volume_confirmation(volumes)
            trend_strength = self._calculate_trend_strength(prices)
            
            # Verifica condições de breakout
            is_breakout = self._detect_breakout(prices, volumes)
            
            if not is_breakout:
                return None
            
            # Calcula confiança do sinal
            confidence = self._calculate_signal_confidence(
                price_momentum, volume_confirmation, trend_strength, data
            )
            
            if confidence < self.confidence_threshold:
                return None
            
            # Gera sinal
            signal = self._generate_momentum_signal(token_id, data, confidence)
            
            # Adiciona metadados de análise
            signal['metadata'] = {
                'price_momentum': price_momentum,
                'volume_confirmation': volume_confirmation,
                'trend_strength': trend_strength,
                'breakout_type': 'bullish_momentum',
                'analysis_timestamp': datetime.now().isoformat()
            }
            
            return signal
            
        except Exception as e:
            logger.error(f"Error analyzing momentum for {token_id}: {e}")
            return None

    def _calculate_price_momentum(self, prices: np.ndarray) -> float:
        """
        Calcula momentum de preço
        """
        if len(prices) < 2:
            return 0.0
        
        # Momentum baseado na mudança percentual
        price_change = (prices[-1] - prices[0]) / prices[0]
        
        # Normaliza para 0-1
        momentum = min(abs(price_change) / 0.1, 1.0)  # 10% = momentum máximo
        
        return momentum if price_change > 0 else 0.0

    def _calculate_volume_confirmation(self, volumes: np.ndarray) -> float:
        """
        Calcula confirmação de volume
        """
        if len(volumes) < 2:
            return 0.0
        
        # Volume atual vs média histórica
        current_volume = volumes[-1]
        avg_volume = np.mean(volumes[:-1])
        
        if avg_volume == 0:
            return 0.0
        
        volume_ratio = current_volume / avg_volume
        
        # Normaliza para 0-1 (1.5x = confirmação máxima)
        confirmation = min(volume_ratio / self.volume_multiplier, 1.0)
        
        return confirmation

    def _calculate_trend_strength(self, prices: np.ndarray) -> float:
        """
        Calcula força da tendência
        """
        if len(prices) < 3:
            return 0.0
        
        # Conta quantos períodos consecutivos de alta
        consecutive_ups = 0
        for i in range(1, len(prices)):
            if prices[i] > prices[i-1]:
                consecutive_ups += 1
            else:
                break
        
        # Normaliza pela janela de análise
        strength = consecutive_ups / (len(prices) - 1)
        
        return strength

    def _detect_breakout(self, prices: np.ndarray, volumes: np.ndarray) -> bool:
        """
        Detecta breakout baseado em preço e volume
        """
        if len(prices) < self.lookback_period:
            return False
        
        # Verifica mudança de preço
        price_change = (prices[-1] - prices[0]) / prices[0]
        price_breakout = price_change > self.price_change_threshold
        
        # Verifica confirmação de volume
        current_volume = volumes[-1]
        avg_volume = np.mean(volumes[:-1])
        volume_breakout = current_volume > (avg_volume * self.volume_multiplier)
        
        return price_breakout and volume_breakout

    def _calculate_signal_confidence(self, price_momentum: float, volume_confirmation: float, 
                                   trend_strength: float, market_data: Dict) -> float:
        """
        Calcula confiança do sinal baseado em múltiplos fatores
        """
        # Pesos dos fatores
        weights = {
            'price_momentum': 0.3,
            'volume_confirmation': 0.3,
            'trend_strength': 0.2,
            'market_conditions': 0.2
        }
        
        # Avalia condições de mercado
        market_score = self._evaluate_market_conditions(market_data)
        
        # Calcula confiança ponderada
        confidence = (
            price_momentum * weights['price_momentum'] +
            volume_confirmation * weights['volume_confirmation'] +
            trend_strength * weights['trend_strength'] +
            market_score * weights['market_conditions']
        )
        
        return min(confidence, 1.0)

    def _evaluate_market_conditions(self, market_data: Dict) -> float:
        """
        Avalia condições gerais de mercado
        """
        score = 0.5  # Score neutro
        
        try:
            # Verifica market cap
            market_cap = market_data.get('market_cap', 0)
            if market_cap > self.min_market_cap:
                score += 0.2
            
            # Verifica ranking
            rank = market_data.get('market_cap_rank', 1000)
            if rank <= 100:  # Top 100
                score += 0.2
            elif rank <= 300:  # Top 300
                score += 0.1
            
            # Verifica volatilidade (favorável para momentum)
            price_change_24h = abs(market_data.get('price_change_24h', 0))
            if 2 <= price_change_24h <= 15:  # Volatilidade ideal
                score += 0.1
            
        except Exception as e:
            logger.error(f"Error evaluating market conditions: {e}")
        
        return min(score, 1.0)

    def _generate_momentum_signal(self, token_id: str, data: Dict, confidence: float) -> Dict:
        """
        Gera sinal de momentum
        """
        current_price = data.get('price', 0)
        
        # Calcula níveis de stop-loss e take-profit
        stop_loss = current_price * (1 - self.settings.stop_loss_percent / 100)
        take_profit = current_price * (1 + self.settings.take_profit_percent / 100)
        
        signal = {
            'strategy': self.name,
            'symbol': data.get('symbol', token_id.upper()),
            'token_id': token_id,
            'type': 'buy',
            'price': current_price,
            'confidence': confidence,
            'stop_loss': stop_loss,
            'take_profit': take_profit,
            'timestamp': datetime.now(),
            'expiry': datetime.now() + timedelta(minutes=30),  # Sinal expira em 30min
            'reason': 'bullish_momentum_breakout'
        }
        
        return signal

    def validate_signal(self, signal: Dict) -> bool:
        """
        Valida se um sinal é válido para execução
        """
        try:
            # Verificações básicas
            required_fields = ['symbol', 'type', 'price', 'confidence']
            if not all(field in signal for field in required_fields):
                return False
            
            # Verifica confiança mínima
            if signal['confidence'] < self.confidence_threshold:
                return False
            
            # Verifica se não é sinal duplicado recente
            if self._is_duplicate_signal(signal):
                return False
            
            # Verifica expiração
            if signal.get('expiry') and datetime.now() > signal['expiry']:
                return False
            
            # Verifica preço válido
            if signal['price'] <= 0:
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating signal: {e}")
            return False

    def _is_duplicate_signal(self, signal: Dict) -> bool:
        """
        Verifica se é um sinal duplicado recente
        """
        symbol = signal['symbol']
        
        if symbol not in self.signal_history:
            self.signal_history[symbol] = []
            return False
        
        # Verifica sinais dos últimos 30 minutos
        cutoff_time = datetime.now() - timedelta(minutes=30)
        recent_signals = [
            s for s in self.signal_history[symbol] 
            if s['timestamp'] > cutoff_time
        ]
        
        # Se já há sinal recente para este símbolo, é duplicado
        return len(recent_signals) > 0

    def _update_history(self, token_id: str, data: Dict):
        """
        Atualiza histórico de preços e volume
        """
        try:
            # Inicializa histórico se necessário
            if token_id not in self.price_history:
                self.price_history[token_id] = []
                self.volume_history[token_id] = []
            
            # Adiciona dados atuais
            price = data.get('price', 0)
            volume = data.get('volume_24h', 0)
            
            self.price_history[token_id].append(price)
            self.volume_history[token_id].append(volume)
            
            # Mantém apenas o período de lookback
            max_length = self.lookback_period * 2  # Mantém dados extras para análise
            self.price_history[token_id] = self.price_history[token_id][-max_length:]
            self.volume_history[token_id] = self.volume_history[token_id][-max_length:]
            
        except Exception as e:
            logger.error(f"Error updating history for {token_id}: {e}")

    def _has_sufficient_data(self, token_id: str) -> bool:
        """
        Verifica se há dados suficientes para análise
        """
        return (
            token_id in self.price_history and
            len(self.price_history[token_id]) >= self.lookback_period and
            token_id in self.volume_history and
            len(self.volume_history[token_id]) >= self.lookback_period
        )

    def update_parameters(self, new_params: Dict):
        """
        Atualiza parâmetros da estratégia
        """
        try:
            if 'price_change_threshold' in new_params:
                self.price_change_threshold = new_params['price_change_threshold']
            
            if 'volume_multiplier' in new_params:
                self.volume_multiplier = new_params['volume_multiplier']
            
            if 'confidence_threshold' in new_params:
                self.confidence_threshold = new_params['confidence_threshold']
            
            if 'lookback_period' in new_params:
                self.lookback_period = new_params['lookback_period']
            
            logger.info(f"Momentum strategy parameters updated: {new_params}")
            
        except Exception as e:
            logger.error(f"Error updating parameters: {e}")

    def get_strategy_status(self) -> Dict:
        """
        Retorna status detalhado da estratégia
        """
        return {
            'name': self.name,
            'active': self.active,
            'parameters': {
                'price_change_threshold': self.price_change_threshold,
                'volume_multiplier': self.volume_multiplier,
                'confidence_threshold': self.confidence_threshold,
                'lookback_period': self.lookback_period
            },
            'performance': self.get_performance_metrics(),
            'monitored_tokens': len(self.price_history),
            'last_analysis': datetime.now().isoformat()
        }

    def clear_history(self):
        """
        Limpa histórico de dados (útil para reset)
        """
        self.price_history.clear()
        self.volume_history.clear()
        self.signal_history.clear()
        logger.info("Momentum strategy history cleared")

