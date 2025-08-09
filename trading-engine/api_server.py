#!/usr/bin/env python3
"""
Trading Engine API Server
DEX Trading System - Altseason Edition
"""

import asyncio
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import json
from datetime import datetime

from config.settings import load_settings
from core.engine import TradingEngine
from utils.logger import setup_logger

logger = setup_logger(__name__)

# Pydantic models for API
class TradeRequest(BaseModel):
    pair: str
    side: str  # 'buy' or 'sell'
    amount: float
    price: Optional[float] = None
    dex: str = '1inch'
    chain_id: int = 1
    slippage: float = 1.0

class EngineStatus(BaseModel):
    active: bool
    capital_usdt: float
    active_trades: int
    daily_pnl: float
    total_trades: int
    win_rate: float
    last_updated: str

class TradingEngineAPI:
    def __init__(self):
        self.app = FastAPI(
            title="DEX Trading Engine API",
            description="API for DEX Trading System - Altseason Edition",
            version="1.0.0"
        )
        self.engine = None
        self.settings = None
        self.setup_middleware()
        self.setup_routes()

    def setup_middleware(self):
        """Configure CORS and other middleware"""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # In production, specify exact origins
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    def setup_routes(self):
        """Setup API routes"""
        
        @self.app.get("/")
        async def root():
            return {
                "message": "DEX Trading Engine API",
                "version": "1.0.0",
                "status": "running",
                "endpoints": {
                    "health": "/health",
                    "status": "/status",
                    "start": "/start",
                    "stop": "/stop",
                    "execute": "/execute",
                    "portfolio": "/portfolio"
                }
            }

        @self.app.get("/health")
        async def health_check():
            return {
                "status": "OK",
                "timestamp": datetime.now().isoformat(),
                "engine_active": self.engine is not None and getattr(self.engine, 'active', False)
            }

        @self.app.get("/status")
        async def get_status():
            if not self.engine:
                return EngineStatus(
                    active=False,
                    capital_usdt=0,
                    active_trades=0,
                    daily_pnl=0.0,
                    total_trades=0,
                    win_rate=0.0,
                    last_updated=datetime.now().isoformat()
                )
            
            status = await self.engine.get_status()
            return EngineStatus(
                active=status.get('active', False),
                capital_usdt=status.get('capital_usdt', 0),
                active_trades=status.get('active_trades', 0),
                daily_pnl=status.get('daily_pnl', 0.0),
                total_trades=status.get('total_trades', 0),
                win_rate=status.get('win_rate', 0.0),
                last_updated=datetime.now().isoformat()
            )

        @self.app.post("/start")
        async def start_engine():
            try:
                if self.engine and getattr(self.engine, 'active', False):
                    return {"message": "Engine already running", "status": "active"}
                
                # Load settings
                self.settings = load_settings()
                logger.info("Settings loaded successfully")
                
                # Initialize engine
                self.engine = TradingEngine(self.settings)
                await self.engine.start()
                
                logger.info("🚀 Trading Engine started via API")
                return {
                    "message": "Trading Engine started successfully",
                    "status": "active",
                    "capital": self.settings.capital_usdt
                }
            except Exception as e:
                logger.error(f"Error starting engine: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/stop")
        async def stop_engine():
            try:
                if self.engine:
                    await self.engine.stop()
                    self.engine = None
                    logger.info("Trading Engine stopped via API")
                
                return {"message": "Trading Engine stopped successfully", "status": "inactive"}
            except Exception as e:
                logger.error(f"Error stopping engine: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/execute")
        async def execute_trade(trade_request: TradeRequest):
            try:
                if not self.engine:
                    raise HTTPException(status_code=400, detail="Trading Engine not started")
                
                # Execute trade through engine
                result = await self.engine.execute_trade(
                    pair=trade_request.pair,
                    side=trade_request.side,
                    amount=trade_request.amount,
                    price=trade_request.price,
                    dex=trade_request.dex,
                    chain_id=trade_request.chain_id,
                    slippage=trade_request.slippage
                )
                
                logger.info(f"Trade executed via API: {trade_request.pair} {trade_request.side} {trade_request.amount}")
                return {
                    "message": "Trade executed successfully",
                    "trade_id": result.get('trade_id'),
                    "status": result.get('status', 'pending'),
                    "result": result
                }
            except Exception as e:
                logger.error(f"Error executing trade: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/portfolio")
        async def get_portfolio():
            try:
                if not self.engine:
                    return {
                        "total_value": 0,
                        "positions": [],
                        "pnl": 0.0,
                        "active": False
                    }
                
                portfolio = await self.engine.get_portfolio()
                return portfolio
            except Exception as e:
                logger.error(f"Error getting portfolio: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/logs")
        async def get_recent_logs():
            """Get recent trading logs"""
            try:
                # This would read from log files in a real implementation
                return {
                    "logs": [
                        {
                            "timestamp": datetime.now().isoformat(),
                            "level": "info",
                            "message": "Trading Engine API is running"
                        }
                    ]
                }
            except Exception as e:
                logger.error(f"Error getting logs: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))

    async def startup(self):
        """Startup tasks"""
        logger.info("🚀 Trading Engine API Server starting...")
        
    async def shutdown(self):
        """Shutdown tasks"""
        if self.engine:
            await self.engine.stop()
        logger.info("👋 Trading Engine API Server stopped")

def create_app():
    """Create FastAPI application"""
    api = TradingEngineAPI()
    
    @api.app.on_event("startup")
    async def startup_event():
        await api.startup()
    
    @api.app.on_event("shutdown")
    async def shutdown_event():
        await api.shutdown()
    
    return api.app

if __name__ == "__main__":
    app = create_app()
    
    # Run with uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )

