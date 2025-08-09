#!/usr/bin/env python3
"""
Trading Engine Main Entry Point
DEX Trading System - Altseason Edition
"""

import asyncio
import sys
import signal
from config.settings import load_settings
from core.engine import TradingEngine
from utils.logger import setup_logger

logger = setup_logger(__name__)

class TradingEngineApp:
    def __init__(self):
        self.engine = None
        self.running = False

    async def start(self):
        """Inicia a aplicação do Trading Engine"""
        try:
            # Carrega configurações do .env
            settings = load_settings()
            logger.info("Settings loaded successfully")
            logger.info(f"Capital: ${settings.capital_usdt} USDT")
            logger.info(f"Max position size: {settings.max_position_size_percent}%")

            # Inicializa o Trading Engine
            self.engine = TradingEngine(settings)
            await self.engine.start()
            
            self.running = True
            logger.info("🚀 Trading Engine started successfully!")
            logger.info("Press Ctrl+C to stop...")

            # Mantém o engine rodando
            while self.running:
                await asyncio.sleep(1)

        except KeyboardInterrupt:
            logger.info("Received shutdown signal...")
            await self.stop()
        except Exception as e:
            logger.error(f"Fatal error: {str(e)}")
            await self.stop()
            sys.exit(1)

    async def stop(self):
        """Para a aplicação de forma segura"""
        self.running = False
        if self.engine:
            logger.info("Stopping Trading Engine...")
            await self.engine.stop()
        logger.info("✅ Trading Engine stopped successfully")

def signal_handler(signum, frame):
    """Handler para sinais do sistema"""
    logger.info(f"Received signal {signum}")
    # O loop principal vai capturar KeyboardInterrupt

async def main():
    """Função principal"""
    # Configura handlers de sinal
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Inicia aplicação
    app = TradingEngineApp()
    await app.start()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        logger.error(f"Application error: {e}")
        sys.exit(1)

