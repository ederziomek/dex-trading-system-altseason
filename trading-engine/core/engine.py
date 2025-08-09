"""
Trading Engine Core - Main Engine Class
"""

import asyncio
import aiohttp
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import uuid

from config.settings import TradingSettings
from strategies.momentum import MomentumStrategy
from integrations.oneinch import OneInchClient
from integrations.price_data import PriceDataClient
from integrations.backend_api import BackendAPIClient
from core.risk_manager import RiskManager
from utils.logger import setup_logger, TradingLogger

logger = setup_logger(__name__)
trading_logger = TradingLogger(__name__)

class TradingEngine:
    """
    Trading Engine principal que coordena todas as operações
    """
    
    def __init__(self, settings: TradingSettings):
        self.settings = settings
        self.active = False
        self.session: Optional[aiohttp.ClientSession] = None
        self.tasks: List[asyncio.Task] = []
        
        # Estado do engine
        self.active_trades: Dict[str, dict] = {}
        self.daily_pnl = 0.0
        self.consecutive_losses = 0
        self.last_trade_time = None
        
        # Inicializa componentes
        self.risk_manager = RiskManager(settings)
        self.strategy = MomentumStrategy(settings)
        self.oneinch_client = OneInchClient(settings)
        self.price_data_client = PriceDataClient(settings)
        self.backend_client = BackendAPIClient(settings)
        
        logger.info("Trading Engine initialized", 
                   capital=settings.capital_usdt,
                   max_trades=settings.max_simultaneous_trades)

    async def start(self):
        """Inicia o Trading Engine e todos os seus componentes"""
        try:
            self.active = True
            self.session = aiohttp.ClientSession()
            
            # Inicializa clientes
            await self.oneinch_client.initialize(self.session)
            await self.price_data_client.initialize(self.session)
            await self.backend_client.initialize(self.session)
            
            # Inicia tasks assíncronas
            self.tasks = [
                asyncio.create_task(self._market_analysis_loop()),
                asyncio.create_task(self._trade_monitoring_loop()),
                asyncio.create_task(self._health_check_loop()),
                asyncio.create_task(self._performance_reporting_loop())
            ]
            
            logger.info("Trading Engine started successfully")
            
        except Exception as e:
            logger.error(f"Failed to start Trading Engine: {e}")
            await self.stop()
            raise

    async def stop(self):
        """Para o Trading Engine de forma segura"""
        logger.info("Stopping Trading Engine...")
        self.active = False
        
        # Cancela todas as tasks
        for task in self.tasks:
            if not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
        
        # Fecha todas as posições ativas
        await self._close_all_positions("engine_shutdown")
        
        # Fecha conexões
        if self.session and not self.session.closed:
            await self.session.close()
            
        logger.info("Trading Engine stopped")

    async def _market_analysis_loop(self):
        """Loop principal de análise de mercado"""
        logger.info("Market analysis loop started")
        
        while self.active:
            try:
                # Obtém dados de mercado
                market_data = await self.price_data_client.get_market_data()
                
                if not market_data:
                    await asyncio.sleep(5)
                    continue
                
                # Analisa oportunidades usando estratégia
                signals = await self.strategy.analyze(market_data)
                
                # Processa cada sinal
                for signal in signals:
                    await self._process_trading_signal(signal)
                
            except Exception as e:
                logger.error(f"Error in market analysis loop: {e}")
            
            await asyncio.sleep(self.settings.price_update_interval)

    async def _process_trading_signal(self, signal: dict):
        """Processa um sinal de trading"""
        try:
            # Log do sinal
            trading_logger.trade_signal(
                symbol=signal['symbol'],
                signal_type=signal['type'],
                price=signal['price'],
                confidence=signal['confidence']
            )
            
            # Valida com risk manager
            if not await self.risk_manager.validate_trade(signal, self.active_trades):
                logger.info(f"Trade rejected by risk manager: {signal['symbol']}")
                return
            
            # Executa o trade
            await self._execute_trade(signal)
            
        except Exception as e:
            logger.error(f"Error processing signal: {e}")

    async def _execute_trade(self, signal: dict):
        """Executa um trade baseado no sinal"""
        try:
            # Calcula tamanho da posição
            position_size = self.risk_manager.calculate_position_size(
                signal['price'], 
                self.settings.capital_usdt
            )
            
            # Executa via 1inch
            trade_result = await self.oneinch_client.execute_swap(
                from_token="USDT",
                to_token=signal['symbol'],
                amount=position_size,
                slippage=1.0  # 1% slippage tolerance
            )
            
            if trade_result['success']:
                # Registra trade ativo
                trade_id = str(uuid.uuid4())
                self.active_trades[trade_id] = {
                    'id': trade_id,
                    'symbol': signal['symbol'],
                    'entry_price': trade_result['execution_price'],
                    'amount': trade_result['amount_out'],
                    'stop_loss': signal['price'] * (1 - self.settings.stop_loss_percent / 100),
                    'take_profit': signal['price'] * (1 + self.settings.take_profit_percent / 100),
                    'timestamp': datetime.now(),
                    'tx_hash': trade_result['tx_hash']
                }
                
                # Log da execução
                trading_logger.trade_execution(
                    trade_id=trade_id,
                    symbol=signal['symbol'],
                    side="buy",
                    amount=trade_result['amount_out'],
                    price=trade_result['execution_price']
                )
                
                # Notifica backend
                await self.backend_client.report_trade_execution(self.active_trades[trade_id])
                
                logger.info(f"Trade executed successfully: {trade_id}")
                
            else:
                logger.error(f"Trade execution failed: {trade_result['error']}")
                
        except Exception as e:
            logger.error(f"Error executing trade: {e}")

    async def _trade_monitoring_loop(self):
        """Loop de monitoramento de trades ativos"""
        logger.info("Trade monitoring loop started")
        
        while self.active:
            try:
                if not self.active_trades:
                    await asyncio.sleep(1)
                    continue
                
                # Monitora cada trade ativo
                trades_to_close = []
                
                for trade_id, trade in self.active_trades.items():
                    # Obtém preço atual
                    current_price = await self.price_data_client.get_current_price(trade['symbol'])
                    
                    if current_price is None:
                        continue
                    
                    # Verifica condições de fechamento
                    close_reason = None
                    
                    if current_price <= trade['stop_loss']:
                        close_reason = "stop_loss"
                    elif current_price >= trade['take_profit']:
                        close_reason = "take_profit"
                    elif self._should_close_by_time(trade):
                        close_reason = "time_limit"
                    
                    if close_reason:
                        trades_to_close.append((trade_id, close_reason))
                
                # Fecha trades que atingiram condições
                for trade_id, reason in trades_to_close:
                    await self._close_trade(trade_id, reason)
                
            except Exception as e:
                logger.error(f"Error in trade monitoring loop: {e}")
            
            await asyncio.sleep(1)

    async def _close_trade(self, trade_id: str, reason: str):
        """Fecha um trade específico"""
        try:
            trade = self.active_trades[trade_id]
            
            # Executa venda via 1inch
            close_result = await self.oneinch_client.execute_swap(
                from_token=trade['symbol'],
                to_token="USDT",
                amount=trade['amount'],
                slippage=1.0
            )
            
            if close_result['success']:
                # Calcula P&L
                pnl = close_result['amount_out'] - (trade['amount'] * trade['entry_price'])
                
                # Atualiza estatísticas
                self.daily_pnl += pnl
                if pnl < 0:
                    self.consecutive_losses += 1
                else:
                    self.consecutive_losses = 0
                
                # Log do fechamento
                trading_logger.trade_closed(
                    trade_id=trade_id,
                    symbol=trade['symbol'],
                    pnl=pnl,
                    reason=reason
                )
                
                # Remove da lista de trades ativos
                del self.active_trades[trade_id]
                
                # Notifica backend
                await self.backend_client.report_trade_close(trade_id, pnl, reason)
                
                logger.info(f"Trade closed: {trade_id}, P&L: ${pnl:.2f}, reason: {reason}")
                
            else:
                logger.error(f"Failed to close trade {trade_id}: {close_result['error']}")
                
        except Exception as e:
            logger.error(f"Error closing trade {trade_id}: {e}")

    async def _close_all_positions(self, reason: str):
        """Fecha todas as posições ativas"""
        if not self.active_trades:
            return
        
        logger.info(f"Closing all positions, reason: {reason}")
        
        close_tasks = []
        for trade_id in list(self.active_trades.keys()):
            close_tasks.append(self._close_trade(trade_id, reason))
        
        await asyncio.gather(*close_tasks, return_exceptions=True)

    def _should_close_by_time(self, trade: dict) -> bool:
        """Verifica se deve fechar trade por limite de tempo"""
        # Fecha trades após 4 horas (para evitar exposição prolongada)
        time_limit = timedelta(hours=4)
        return datetime.now() - trade['timestamp'] > time_limit

    async def _health_check_loop(self):
        """Loop de verificação de saúde do sistema"""
        logger.info("Health check loop started")
        
        while self.active:
            try:
                # Verifica APIs
                api_health = await self._check_apis_health()
                
                # Verifica limites de risco
                risk_status = self._check_risk_limits()
                
                # Para engine se necessário
                if not api_health['all_healthy'] or not risk_status['safe']:
                    await self._handle_emergency_stop(api_health, risk_status)
                
            except Exception as e:
                logger.error(f"Error in health check: {e}")
            
            await asyncio.sleep(30)

    async def _check_apis_health(self) -> dict:
        """Verifica saúde das APIs"""
        health = {
            'oneinch': False,
            'price_data': False,
            'backend': False,
            'all_healthy': False
        }
        
        try:
            # Testa 1inch
            health['oneinch'] = await self.oneinch_client.health_check()
            
            # Testa price data
            health['price_data'] = await self.price_data_client.health_check()
            
            # Testa backend
            health['backend'] = await self.backend_client.health_check()
            
            health['all_healthy'] = all([
                health['oneinch'],
                health['price_data'],
                health['backend']
            ])
            
        except Exception as e:
            logger.error(f"Error checking API health: {e}")
        
        return health

    def _check_risk_limits(self) -> dict:
        """Verifica limites de risco"""
        status = {
            'daily_loss_ok': True,
            'consecutive_losses_ok': True,
            'position_count_ok': True,
            'safe': True
        }
        
        # Verifica perda diária
        daily_loss_limit = self.settings.capital_usdt * (self.settings.max_daily_loss_percent / 100)
        if abs(self.daily_pnl) > daily_loss_limit:
            status['daily_loss_ok'] = False
        
        # Verifica perdas consecutivas
        if self.consecutive_losses >= self.settings.consecutive_loss_limit:
            status['consecutive_losses_ok'] = False
        
        # Verifica número de posições
        if len(self.active_trades) > self.settings.max_simultaneous_trades:
            status['position_count_ok'] = False
        
        status['safe'] = all([
            status['daily_loss_ok'],
            status['consecutive_losses_ok'],
            status['position_count_ok']
        ])
        
        return status

    async def _handle_emergency_stop(self, api_health: dict, risk_status: dict):
        """Lida com parada de emergência"""
        logger.warning("Emergency stop triggered", 
                      api_health=api_health, 
                      risk_status=risk_status)
        
        # Fecha todas as posições
        await self._close_all_positions("emergency_stop")
        
        # Para o engine temporariamente
        self.active = False
        
        # Log do evento de risco
        trading_logger.risk_event("emergency_stop", {
            'api_health': api_health,
            'risk_status': risk_status,
            'active_trades': len(self.active_trades),
            'daily_pnl': self.daily_pnl
        })

    async def _performance_reporting_loop(self):
        """Loop de relatório de performance"""
        logger.info("Performance reporting loop started")
        
        while self.active:
            try:
                # Calcula métricas de performance
                metrics = self._calculate_performance_metrics()
                
                # Reporta métricas
                for metric_name, value in metrics.items():
                    trading_logger.performance_metric(metric_name, value, "real_time")
                
                # Envia para backend
                await self.backend_client.report_performance(metrics)
                
            except Exception as e:
                logger.error(f"Error in performance reporting: {e}")
            
            await asyncio.sleep(60)  # Reporta a cada minuto

    def _calculate_performance_metrics(self) -> dict:
        """Calcula métricas de performance"""
        return {
            'daily_pnl': self.daily_pnl,
            'active_trades_count': len(self.active_trades),
            'consecutive_losses': self.consecutive_losses,
            'capital_utilization': len(self.active_trades) / self.settings.max_simultaneous_trades,
            'uptime_hours': (datetime.now() - self.last_trade_time).total_seconds() / 3600 if self.last_trade_time else 0
        }

    # Métodos públicos para controle externo
    
    async def pause_trading(self):
        """Pausa o trading (mantém monitoramento)"""
        logger.info("Trading paused")
        # Implementar lógica de pausa
    
    async def resume_trading(self):
        """Retoma o trading"""
        logger.info("Trading resumed")
        # Implementar lógica de retomada
    
    def get_status(self) -> dict:
        """Retorna status atual do engine"""
        return {
            'active': self.active,
            'active_trades': len(self.active_trades),
            'daily_pnl': self.daily_pnl,
            'consecutive_losses': self.consecutive_losses,
            'capital_usdt': self.settings.capital_usdt
        }

