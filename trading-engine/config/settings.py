"""
Trading Engine Configuration Settings
"""

import os
from dataclasses import dataclass
from typing import Optional
from dotenv import load_dotenv

@dataclass
class TradingSettings:
    """Configurações do Trading Engine"""
    # Trading Configuration
    capital_usdt: float
    max_position_size_percent: float
    stop_loss_percent: float
    take_profit_percent: float
    max_simultaneous_trades: int
    
    # API Keys
    oneinch_api_key: str
    backend_api_url: str
    claude_api_key: str
    
    # Network Configuration
    chain_id: int
    rpc_url: str
    
    # Price Data
    coingecko_api_url: str
    price_update_interval: int
    
    # Risk Management
    max_daily_loss_percent: float
    consecutive_loss_limit: int

def load_settings() -> TradingSettings:
    """Carrega configurações do arquivo .env"""
    load_dotenv()
    
    # Validação de variáveis obrigatórias
    required_vars = [
        'ONEINCH_API_KEY',
        'BACKEND_API_URL',
        'CLAUDE_API_KEY'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
    
    return TradingSettings(
        # Trading Configuration
        capital_usdt=float(os.getenv('CAPITAL_USDT', 100)),
        max_position_size_percent=float(os.getenv('MAX_POSITION_SIZE_PERCENT', 5)),
        stop_loss_percent=float(os.getenv('STOP_LOSS_PERCENT', 3)),
        take_profit_percent=float(os.getenv('TAKE_PROFIT_PERCENT', 10)),
        max_simultaneous_trades=int(os.getenv('MAX_SIMULTANEOUS_TRADES', 3)),
        
        # API Keys
        oneinch_api_key=os.getenv('ONEINCH_API_KEY'),
        backend_api_url=os.getenv('BACKEND_API_URL'),
        claude_api_key=os.getenv('CLAUDE_API_KEY'),
        
        # Network Configuration
        chain_id=int(os.getenv('CHAIN_ID', 1)),
        rpc_url=os.getenv('RPC_URL', 'https://eth.llamarpc.com'),
        
        # Price Data
        coingecko_api_url=os.getenv('COINGECKO_API_URL', 'https://api.coingecko.com/api/v3'),
        price_update_interval=int(os.getenv('PRICE_UPDATE_INTERVAL', 5)),
        
        # Risk Management
        max_daily_loss_percent=float(os.getenv('MAX_DAILY_LOSS_PERCENT', 10)),
        consecutive_loss_limit=int(os.getenv('CONSECUTIVE_LOSS_LIMIT', 3))
    )

def validate_settings(settings: TradingSettings) -> bool:
    """Valida se as configurações são válidas"""
    validations = [
        (settings.capital_usdt > 0, "Capital must be positive"),
        (0 < settings.max_position_size_percent <= 100, "Position size must be between 0-100%"),
        (0 < settings.stop_loss_percent <= 50, "Stop loss must be between 0-50%"),
        (settings.take_profit_percent > 0, "Take profit must be positive"),
        (settings.max_simultaneous_trades > 0, "Max trades must be positive"),
        (settings.chain_id > 0, "Chain ID must be positive"),
        (settings.price_update_interval > 0, "Price update interval must be positive"),
        (0 < settings.max_daily_loss_percent <= 100, "Daily loss limit must be between 0-100%"),
        (settings.consecutive_loss_limit > 0, "Consecutive loss limit must be positive")
    ]
    
    for is_valid, error_msg in validations:
        if not is_valid:
            raise ValueError(f"Invalid configuration: {error_msg}")
    
    return True

