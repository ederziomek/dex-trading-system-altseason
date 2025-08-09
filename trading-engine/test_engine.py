#!/usr/bin/env python3
"""
Test script for Trading Engine
"""

import sys
import asyncio
from datetime import datetime

# Adiciona o diretório atual ao path
sys.path.append('.')

async def test_settings():
    """Testa configurações"""
    print("🔧 Testing Settings...")
    try:
        from config.settings import load_settings, validate_settings
        
        settings = load_settings()
        validate_settings(settings)
        
        print("✅ Settings loaded and validated successfully")
        print(f"   Capital: ${settings.capital_usdt}")
        print(f"   1inch API: {settings.oneinch_api_key[:10]}...")
        print(f"   Backend URL: {settings.backend_api_url}")
        return True
        
    except Exception as e:
        print(f"❌ Settings error: {e}")
        return False

async def test_logger():
    """Testa sistema de logging"""
    print("\n📝 Testing Logger...")
    try:
        from utils.logger import setup_logger, TradingLogger
        
        logger = setup_logger("test")
        trading_logger = TradingLogger("test")
        
        logger.info("Test log message")
        trading_logger.trade_signal("BTC", "buy", 50000, 0.8)
        
        print("✅ Logger working correctly")
        return True
        
    except Exception as e:
        print(f"❌ Logger error: {e}")
        return False

async def test_strategy():
    """Testa estratégia de momentum"""
    print("\n🎯 Testing Momentum Strategy...")
    try:
        from strategies.momentum import MomentumStrategy
        from config.settings import load_settings
        
        settings = load_settings()
        strategy = MomentumStrategy(settings)
        
        # Dados simulados de mercado
        market_data = {
            "ethereum": {
                "symbol": "ETH",
                "price": 2500,
                "volume_24h": 1000000,
                "market_cap": 300000000000,
                "market_cap_rank": 2,
                "price_change_24h": 5.2
            }
        }
        
        signals = await strategy.analyze(market_data)
        
        print(f"✅ Strategy analysis completed: {len(signals)} signals")
        if signals:
            print(f"   Sample signal: {signals[0]['symbol']} - {signals[0]['type']} - confidence: {signals[0]['confidence']:.2f}")
        
        return True
        
    except Exception as e:
        print(f"❌ Strategy error: {e}")
        return False

async def test_integrations():
    """Testa integrações"""
    print("\n🔗 Testing Integrations...")
    try:
        from integrations.oneinch import OneInchClient
        from integrations.price_data import PriceDataClient
        from integrations.backend_api import BackendAPIClient
        from config.settings import load_settings
        import aiohttp
        
        settings = load_settings()
        
        # Testa clientes (sem fazer chamadas reais)
        async with aiohttp.ClientSession() as session:
            oneinch = OneInchClient(settings)
            price_client = PriceDataClient(settings)
            backend_client = BackendAPIClient(settings)
            
            await oneinch.initialize(session)
            await price_client.initialize(session)
            await backend_client.initialize(session)
            
            print("✅ Integration clients initialized successfully")
            
            # Testa validação de parâmetros
            validation = oneinch.validate_swap_parameters("USDT", "ETH", 100)
            print(f"   Swap validation: {validation['valid']}")
            
        return True
        
    except Exception as e:
        print(f"❌ Integration error: {e}")
        return False

async def test_risk_manager():
    """Testa gestão de risco"""
    print("\n🛡️ Testing Risk Manager...")
    try:
        from core.risk_manager import RiskManager
        from config.settings import load_settings
        
        settings = load_settings()
        risk_manager = RiskManager(settings)
        
        # Testa cálculo de posição
        position_size = risk_manager.calculate_position_size(2500, 1000)
        print(f"✅ Position size calculated: ${position_size:.2f}")
        
        # Testa métricas de risco
        metrics = risk_manager.get_risk_metrics()
        print(f"   Risk level: {risk_manager._assess_risk_level()}")
        
        return True
        
    except Exception as e:
        print(f"❌ Risk Manager error: {e}")
        return False

async def test_full_engine():
    """Testa engine completo (sem executar)"""
    print("\n🚀 Testing Full Engine...")
    try:
        from core.engine import TradingEngine
        from config.settings import load_settings
        
        settings = load_settings()
        engine = TradingEngine(settings)
        
        # Testa status
        status = engine.get_status()
        print(f"✅ Engine initialized successfully")
        print(f"   Status: {status}")
        
        return True
        
    except Exception as e:
        print(f"❌ Engine error: {e}")
        return False

async def main():
    """Executa todos os testes"""
    print("🧪 TRADING ENGINE TEST SUITE")
    print("=" * 50)
    
    tests = [
        test_settings,
        test_logger,
        test_strategy,
        test_integrations,
        test_risk_manager,
        test_full_engine
    ]
    
    results = []
    for test in tests:
        result = await test()
        results.append(result)
    
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS:")
    
    passed = sum(results)
    total = len(results)
    
    print(f"✅ Passed: {passed}/{total}")
    if passed == total:
        print("🎉 ALL TESTS PASSED! Trading Engine is ready!")
    else:
        print("⚠️  Some tests failed. Check errors above.")
    
    print(f"\n⏰ Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    asyncio.run(main())

