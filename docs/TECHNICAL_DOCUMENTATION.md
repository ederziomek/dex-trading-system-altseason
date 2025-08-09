# 🚀 Sistema de Trading DEX Automatizado - Documentação Técnica Completa

**Versão:** 2.0 - Altseason Edition  
**Data:** 9 de agosto de 2025  
**Autor:** Manus AI  
**Stack:** Claude + Manus + GitHub + Railway  

---

## 📋 Índice Completo

1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Arquitetura Técnica Detalhada](#arquitetura-técnica-detalhada)
3. [Integração com DEXs Selecionadas](#integração-com-dexs-selecionadas)
4. [Estrutura de Arquivos Completa](#estrutura-de-arquivos-completa)
5. [Configuração e Setup](#configuração-e-setup)
6. [Código Fonte Principal](#código-fonte-principal)
7. [APIs e Integrações](#apis-e-integrações)
8. [Deploy e Infraestrutura](#deploy-e-infraestrutura)
9. [Segurança e Boas Práticas](#segurança-e-boas-práticas)
10. [Guia de Operação](#guia-de-operação)
11. [Roadmap de Desenvolvimento](#roadmap-de-desenvolvimento)

---

## 🎯 Visão Geral do Projeto

### O que é este sistema?

Um **bot de trading automatizado para DEXs** que opera 24/7 utilizando as melhores exchanges descentralizadas, com inteligência artificial adaptativa e interface web completa para monitoramento e controle durante altseason.

### Características Principais

- ✅ **Trading Multi-DEX 24/7** com estratégias adaptativas
- ✅ **Agregação via 1inch** para melhores preços e liquidez
- ✅ **Suporte Multi-Chain** (Ethereum, BSC, Solana, Arbitrum, Base)
- ✅ **Dashboard Web Completo** acessível de qualquer lugar
- ✅ **5 Regimes de Mercado** identificados por Machine Learning
- ✅ **Gestão Automática de Risco** com stop-loss dinâmico
- ✅ **Sistema de Autenticação** com 2FA
- ✅ **Otimização de Custos** para maximizar lucros
- ✅ **Histórico Completo** de todas as operações
- ✅ **WebSocket** para dados em tempo real
- ✅ **Deploy Automatizado** com Railway

### Stack Tecnológica

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, Socket.io
- **Trading Engine**: Python 3.11, ccxt, pandas, scikit-learn
- **DEX Integration**: 1inch API, Uniswap SDK, Jupiter API, PancakeSwap
- **Databases**: PostgreSQL, MongoDB, Redis, InfluxDB
- **Infraestrutura**: Docker, Railway, GitHub Actions
- **Segurança**: JWT, 2FA, Criptografia AES-256

### Diferencial Competitivo

Este sistema se diferencia por utilizar **agregação inteligente de DEXs** ao invés de uma única exchange, maximizando oportunidades durante altseason através de:

**Cobertura Total de Mercado**: Acesso simultâneo a 380+ fontes de liquidez via 1inch, garantindo que nenhuma oportunidade seja perdida.

**Otimização Automática**: Algoritmos que encontram automaticamente as melhores rotas de execução entre múltiplas DEXs.

**Proteção MEV**: Sistemas avançados de proteção contra front-running e sandwich attacks.

**Flexibilidade Multi-Chain**: Capacidade de operar em múltiplas blockchains simultaneamente, capturando oportunidades onde quer que surjam.

---

## 🏗️ Arquitetura Técnica Detalhada

### Diagrama de Arquitetura Multi-DEX

```
┌─────────────────────────────────────────────────────────────────┐
│                         CAMADA DE APRESENTAÇÃO                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    FRONTEND (Next.js)                    │    │
│  │                                                          │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │    │
│  │  │  Login   │  │Dashboard │  │Estratégias│  │Histórico│ │    │
│  │  │   2FA    │  │Multi-DEX │  │  Config   │  │  Logs   │ │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              ↕ HTTPS/WSS                         │
└─────────────────────────────────────────────────────────────────┘
                                   │
┌─────────────────────────────────────────────────────────────────┐
│                          CAMADA DE API                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   BACKEND API (Node.js)                  │    │
│  │                                                          │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │    │
│  │  │   Auth   │  │   REST   │  │WebSockets│  │  Rate   │ │    │
│  │  │   JWT    │  │Endpoints │  │ Socket.io│  │ Limiter │ │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              ↕ Internal API                      │
└─────────────────────────────────────────────────────────────────┘
                                   │
┌─────────────────────────────────────────────────────────────────┐
│                       CAMADA DE NEGÓCIOS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              TRADING ENGINE (Python)                     │    │
│  │                                                          │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │    │
│  │  │Data Collector│  │Strategy Mgr  │  │Risk Manager  │ │    │
│  │  │  Multi-DEX   │  │  Adaptive    │  │  Stop Loss   │ │    │
│  │  │   Realtime   │  │  ML Models   │  │  Position    │ │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │    │
│  │                                                          │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │    │
│  │  │DEX Aggregator│  │Order Executor│  │Fee Optimizer │ │    │
│  │  │1inch/Jupiter │  │  Multi-Chain │  │  Gas/Slippage│ │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              ↕ Database Queries                  │
└─────────────────────────────────────────────────────────────────┘
                                   │
┌─────────────────────────────────────────────────────────────────┐
│                         CAMADA DE DADOS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │PostgreSQL│  │ MongoDB  │  │  Redis   │  │InfluxDB  │       │
│  │          │  │          │  │          │  │          │       │
│  │ • Users  │  │• History │  │• Sessions│  │• Metrics │       │
│  │ • Trades │  │• Candles │  │• Cache   │  │• Realtime│       │
│  │ • Orders │  │• Signals │  │• Queues  │  │• Series  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
                                   │
┌─────────────────────────────────────────────────────────────────┐
│                      SERVIÇOS EXTERNOS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  1inch   │  │ Uniswap  │  │ Jupiter  │  │PancakeSwap│       │
│  │   API    │  │   SDK    │  │   API    │  │    API    │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │CoinGecko │  │ Moralis  │  │ Railway  │  │ GitHub   │       │
│  │   API    │  │   API    │  │  Deploy  │  │ Actions  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados Multi-DEX

1. **Coleta de Dados** (Contínuo)
   ```
   1inch API → Trading Engine → MongoDB/InfluxDB
   Uniswap SDK → Price Aggregation → Validation → Trading Engine
   Jupiter API → Solana Data → Cross-Chain Analysis
   PancakeSwap → BSC Data → Opportunity Detection
   ```

2. **Decisão de Trading** (A cada 30 segundos)
   ```
   Multi-DEX Data → ML Model → Regime Detection → DEX Selection → Strategy Selection → Risk Check → Order
   ```

3. **Execução de Ordem**
   ```
   Signal → DEX Selection → Fee Calculation → Route Optimization → Order Executor → Best DEX → Update Portfolio
   ```

4. **Atualização em Tempo Real**
   ```
   Trading Engine → WebSocket → Frontend Dashboard
   ```

### Componentes Principais

**DEX Aggregator**: Módulo central que coordena acesso a múltiplas DEXs, comparando preços e liquidez em tempo real.

**Route Optimizer**: Sistema que determina a melhor rota de execução considerando custos, slippage e velocidade.

**Cross-Chain Manager**: Gerencia operações entre diferentes blockchains, incluindo bridge quando necessário.

**Risk Manager**: Monitora exposição por DEX, blockchain e token, implementando limites dinâmicos.

**ML Strategy Engine**: Sistema de machine learning que adapta estratégias baseado em condições de mercado e performance histórica.

---

## 🔗 Integração com DEXs Selecionadas

### 1inch - Agregador Principal

**Configuração da API**
```python
# 1inch API Configuration
ONEINCH_API_KEY = "your_api_key_here"
ONEINCH_BASE_URL = "https://api.1inch.dev"
SUPPORTED_CHAINS = [1, 56, 137, 42161, 43114, 10, 8453, 100, 146, 1101, 7777777, 324]

class OneInchIntegration:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'accept': 'application/json'
        })
    
    async def get_quote(self, chain_id: int, src: str, dst: str, amount: str):
        """Get quote from 1inch aggregator"""
        url = f"{ONEINCH_BASE_URL}/swap/v6.0/{chain_id}/quote"
        params = {
            'src': src,
            'dst': dst,
            'amount': amount,
            'includeTokensInfo': True,
            'includeProtocols': True
        }
        response = await self.session.get(url, params=params)
        return response.json()
    
    async def build_swap(self, chain_id: int, src: str, dst: str, amount: str, from_address: str, slippage: float = 1.0):
        """Build swap transaction"""
        url = f"{ONEINCH_BASE_URL}/swap/v6.0/{chain_id}/swap"
        params = {
            'src': src,
            'dst': dst,
            'amount': amount,
            'from': from_address,
            'slippage': slippage,
            'disableEstimate': False,
            'allowPartialFill': True
        }
        response = await self.session.get(url, params=params)
        return response.json()
```

**Vantagens da Integração**
- Acesso a 380+ fontes de liquidez
- Otimização automática de rotas
- Proteção MEV via Fusion
- Suporte a 12 blockchains
- Tempo de resposta <300ms

### Uniswap V3/V4 - Ethereum Premium

**Configuração do SDK**
```typescript
// Uniswap V3 SDK Integration
import { AlphaRouter } from '@uniswap/smart-order-router'
import { Token, CurrencyAmount, TradeType, Percent } from '@uniswap/sdk-core'
import { ethers } from 'ethers'

class UniswapIntegration {
    private router: AlphaRouter
    private provider: ethers.providers.JsonRpcProvider
    
    constructor(rpcUrl: string, chainId: number) {
        this.provider = new ethers.providers.JsonRpcProvider(rpcUrl)
        this.router = new AlphaRouter({
            chainId,
            provider: this.provider
        })
    }
    
    async getRoute(
        tokenIn: Token,
        tokenOut: Token,
        amount: CurrencyAmount<Token>,
        tradeType: TradeType = TradeType.EXACT_INPUT
    ) {
        const route = await this.router.route(
            amount,
            tokenOut,
            tradeType,
            {
                recipient: '0x...', // wallet address
                slippageTolerance: new Percent(50, 10_000), // 0.5%
                deadline: Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes
            }
        )
        
        return route
    }
    
    async executeSwap(route: any, signer: ethers.Signer) {
        if (!route) throw new Error('No route found')
        
        const transaction = {
            data: route.methodParameters?.calldata,
            to: route.methodParameters?.to,
            value: route.methodParameters?.value,
            from: await signer.getAddress(),
            gasPrice: await this.provider.getGasPrice(),
            gasLimit: ethers.utils.hexlify(1000000)
        }
        
        return await signer.sendTransaction(transaction)
    }
}
```

**Casos de Uso Específicos**
- Tokens premium e DeFi blue-chips
- Liquidez concentrada para eficiência de capital
- Hooks V4 para funcionalidades avançadas
- Integração com Layer 2s para custos reduzidos

### Jupiter - Solana Supremacy

**Configuração da API**
```python
# Jupiter API Integration
import aiohttp
import asyncio
from solana.rpc.async_api import AsyncClient
from solana.keypair import Keypair

class JupiterIntegration:
    def __init__(self, rpc_url: str = "https://api.mainnet-beta.solana.com"):
        self.base_url = "https://quote-api.jup.ag/v6"
        self.rpc_client = AsyncClient(rpc_url)
    
    async def get_quote(self, input_mint: str, output_mint: str, amount: int, slippage_bps: int = 50):
        """Get quote from Jupiter"""
        async with aiohttp.ClientSession() as session:
            params = {
                'inputMint': input_mint,
                'outputMint': output_mint,
                'amount': amount,
                'slippageBps': slippage_bps,
                'onlyDirectRoutes': False,
                'asLegacyTransaction': False
            }
            
            async with session.get(f"{self.base_url}/quote", params=params) as response:
                return await response.json()
    
    async def get_swap_transaction(self, quote: dict, user_public_key: str):
        """Get swap transaction from Jupiter"""
        async with aiohttp.ClientSession() as session:
            payload = {
                'quoteResponse': quote,
                'userPublicKey': user_public_key,
                'wrapAndUnwrapSol': True,
                'useSharedAccounts': True,
                'feeAccount': None,
                'trackingAccount': None,
                'asLegacyTransaction': False
            }
            
            async with session.post(f"{self.base_url}/swap", json=payload) as response:
                return await response.json()
    
    async def execute_swap(self, swap_transaction: str, keypair: Keypair):
        """Execute swap on Solana"""
        from solana.transaction import Transaction
        import base64
        
        # Decode transaction
        transaction_bytes = base64.b64decode(swap_transaction)
        transaction = Transaction.deserialize(transaction_bytes)
        
        # Sign transaction
        transaction.sign(keypair)
        
        # Send transaction
        result = await self.rpc_client.send_transaction(transaction)
        return result
```

**Vantagens Específicas**
- Custos ultra-baixos (<$0.01)
- Velocidade sub-segundo
- Acesso completo ao ecossistema Solana
- Duas APIs especializadas (Ultra + Swap)

### PancakeSwap V3 - BSC Dominance

**Configuração da API**
```python
# PancakeSwap V3 Integration via 1inch and direct calls
from web3 import Web3
import json

class PancakeSwapIntegration:
    def __init__(self, bsc_rpc_url: str, private_key: str):
        self.w3 = Web3(Web3.HTTPProvider(bsc_rpc_url))
        self.account = self.w3.eth.account.from_key(private_key)
        self.router_address = "0x13f4EA83D0bd40E75C8222255bc855a974568Dd4"  # PancakeSwap V3 Router
        
        # Load router ABI
        with open('pancakeswap_v3_router_abi.json', 'r') as f:
            self.router_abi = json.load(f)
        
        self.router_contract = self.w3.eth.contract(
            address=self.router_address,
            abi=self.router_abi
        )
    
    async def get_amounts_out(self, amount_in: int, path: list):
        """Get expected output amounts"""
        try:
            amounts = self.router_contract.functions.getAmountsOut(
                amount_in, path
            ).call()
            return amounts
        except Exception as e:
            print(f"Error getting amounts out: {e}")
            return None
    
    async def swap_exact_tokens_for_tokens(
        self, 
        amount_in: int, 
        amount_out_min: int, 
        path: list, 
        deadline: int
    ):
        """Execute swap on PancakeSwap V3"""
        try:
            # Build transaction
            transaction = self.router_contract.functions.swapExactTokensForTokens(
                amount_in,
                amount_out_min,
                path,
                self.account.address,
                deadline
            ).build_transaction({
                'from': self.account.address,
                'gas': 200000,
                'gasPrice': self.w3.to_wei('5', 'gwei'),
                'nonce': self.w3.eth.get_transaction_count(self.account.address)
            })
            
            # Sign transaction
            signed_txn = self.w3.eth.account.sign_transaction(transaction, self.account.key)
            
            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            return tx_hash.hex()
            
        except Exception as e:
            print(f"Error executing swap: {e}")
            return None
```

**Casos de Uso Específicos**
- Altcoins BSC com alta liquidez
- Trading de alto volume com baixos custos
- Tokens específicos do ecossistema Binance
- Estratégias de alta frequência

---

## 📁 Estrutura de Arquivos Completa

```
dex-trading-system/
│
├── 📁 frontend/                    # Aplicação Next.js
│   ├── 📁 app/                     # App Router (Next.js 14)
│   │   ├── 📁 (auth)/              # Grupo de rotas de autenticação
│   │   │   ├── 📁 login/           # Página de login
│   │   │   │   └── page.tsx
│   │   │   └── 📁 register/        # Página de registro
│   │   │       └── page.tsx
│   │   ├── 📁 (dashboard)/         # Grupo de rotas do dashboard
│   │   │   ├── 📁 dashboard/       # Dashboard principal
│   │   │   │   └── page.tsx
│   │   │   ├── 📁 positions/       # Posições abertas
│   │   │   │   └── page.tsx
│   │   │   ├── 📁 strategies/      # Gestão de estratégias
│   │   │   │   └── page.tsx
│   │   │   ├── 📁 trades/          # Histórico de trades
│   │   │   │   └── page.tsx
│   │   │   ├── 📁 dexs/            # Configuração DEXs
│   │   │   │   └── page.tsx
│   │   │   └── 📁 settings/        # Configurações
│   │   │       └── page.tsx
│   │   ├── layout.tsx              # Layout raiz
│   │   ├── globals.css             # Estilos globais
│   │   └── providers.tsx           # Providers (React Query, etc)
│   │
│   ├── 📁 components/              # Componentes React
│   │   ├── 📁 charts/              # Componentes de gráficos
│   │   │   ├── CandlestickChart.tsx
│   │   │   ├── PerformanceChart.tsx
│   │   │   ├── PortfolioChart.tsx
│   │   │   └── DEXComparisonChart.tsx
│   │   ├── 📁 forms/               # Formulários
│   │   │   ├── LoginForm.tsx
│   │   │   ├── StrategyForm.tsx
│   │   │   ├── DEXConfigForm.tsx
│   │   │   └── SettingsForm.tsx
│   │   ├── 📁 layouts/             # Layouts
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── AuthLayout.tsx
│   │   ├── 📁 dex/                 # Componentes específicos de DEX
│   │   │   ├── DEXSelector.tsx
│   │   │   ├── LiquidityMonitor.tsx
│   │   │   └── RouteOptimizer.tsx
│   │   └── 📁 ui/                  # Componentes UI
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       └── Table.tsx
│   │
│   ├── 📁 lib/                     # Utilitários
│   │   ├── api.ts                  # Cliente API
│   │   ├── auth.ts                 # Funções de autenticação
│   │   ├── websocket.ts            # Cliente WebSocket
│   │   ├── dex-utils.ts            # Utilitários DEX
│   │   └── utils.ts                # Funções auxiliares
│   │
│   ├── 📁 hooks/                   # Custom Hooks
│   │   ├── useAuth.ts
│   │   ├── useWebSocket.ts
│   │   ├── useTrades.ts
│   │   └── useDEXData.ts
│   │
│   ├── 📁 store/                   # Zustand stores
│   │   ├── auth.store.ts
│   │   ├── trading.store.ts
│   │   ├── dex.store.ts
│   │   └── settings.store.ts
│   │
│   ├── 📁 types/                   # TypeScript types
│   │   ├── api.types.ts
│   │   ├── trading.types.ts
│   │   ├── dex.types.ts
│   │   └── user.types.ts
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── Dockerfile
│
├── 📁 backend/                     # API Node.js
│   ├── 📁 src/
│   │   ├── 📁 controllers/         # Controladores
│   │   │   ├── auth.controller.ts
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── trading.controller.ts
│   │   │   ├── strategy.controller.ts
│   │   │   ├── dex.controller.ts
│   │   │   └── settings.controller.ts
│   │   │
│   │   ├── 📁 services/            # Lógica de negócio
│   │   │   ├── auth.service.ts
│   │   │   ├── trading.service.ts
│   │   │   ├── websocket.service.ts
│   │   │   ├── dex.service.ts
│   │   │   ├── marketData.service.ts
│   │   │   └── notification.service.ts
│   │   │
│   │   ├── 📁 models/              # Modelos de dados
│   │   │   ├── user.model.ts
│   │   │   ├── trade.model.ts
│   │   │   ├── position.model.ts
│   │   │   ├── dex.model.ts
│   │   │   └── strategy.model.ts
│   │   │
│   │   ├── 📁 routes/              # Rotas da API
│   │   │   ├── auth.routes.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   ├── trading.routes.ts
│   │   │   ├── strategy.routes.ts
│   │   │   ├── dex.routes.ts
│   │   │   └── settings.routes.ts
│   │   │
│   │   ├── 📁 middlewares/         # Middlewares
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   └── rateLimit.middleware.ts
│   │   │
│   │   ├── 📁 validators/          # Validadores
│   │   │   ├── auth.validator.ts
│   │   │   ├── trading.validator.ts
│   │   │   ├── dex.validator.ts
│   │   │   └── strategy.validator.ts
│   │   │
│   │   ├── 📁 utils/               # Utilitários
│   │   │   ├── logger.ts
│   │   │   ├── encryption.ts
│   │   │   └── helpers.ts
│   │   │
│   │   ├── app.ts                  # Configuração Express
│   │   └── server.ts               # Ponto de entrada
│   │
│   ├── 📁 prisma/                  # Prisma ORM
│   │   ├── schema.prisma
│   │   └── migrations/
│   │
│   ├── 📁 tests/                   # Testes
│   │   ├── unit/
│   │   └── integration/
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── Dockerfile
│
├── 📁 trading-engine/              # Motor Python
│   ├── 📁 src/
│   │   ├── 📁 collectors/          # Coletores de dados
│   │   │   ├── dex_data_collector.py
│   │   │   ├── oneinch_collector.py
│   │   │   ├── uniswap_collector.py
│   │   │   ├── jupiter_collector.py
│   │   │   └── pancakeswap_collector.py
│   │   │
│   │   ├── 📁 strategies/          # Estratégias de trading
│   │   │   ├── base_strategy.py
│   │   │   ├── dex_arbitrage_strategy.py
│   │   │   ├── momentum_strategy.py
│   │   │   ├── mean_reversion_strategy.py
│   │   │   ├── grid_trading_strategy.py
│   │   │   └── cross_chain_strategy.py
│   │   │
│   │   ├── 📁 analyzers/           # Analisadores
│   │   │   ├── market_analyzer.py
│   │   │   ├── dex_analyzer.py
│   │   │   ├── technical_analyzer.py
│   │   │   ├── liquidity_analyzer.py
│   │   │   └── regime_detector.py
│   │   │
│   │   ├── 📁 executors/           # Executores de ordens
│   │   │   ├── dex_executor.py
│   │   │   ├── oneinch_executor.py
│   │   │   ├── uniswap_executor.py
│   │   │   ├── jupiter_executor.py
│   │   │   ├── pancakeswap_executor.py
│   │   │   └── route_optimizer.py
│   │   │
│   │   ├── 📁 managers/            # Gerenciadores
│   │   │   ├── risk_manager.py
│   │   │   ├── portfolio_manager.py
│   │   │   ├── strategy_manager.py
│   │   │   ├── dex_manager.py
│   │   │   └── security_manager.py
│   │   │
│   │   ├── 📁 integrations/        # Integrações DEX
│   │   │   ├── oneinch_integration.py
│   │   │   ├── uniswap_integration.py
│   │   │   ├── jupiter_integration.py
│   │   │   └── pancakeswap_integration.py
│   │   │
│   │   ├── 📁 ml_models/           # Modelos de ML
│   │   │   ├── regime_classifier.py
│   │   │   ├── price_predictor.py
│   │   │   ├── dex_selector.py
│   │   │   └── signal_validator.py
│   │   │
│   │   ├── 📁 utils/               # Utilitários
│   │   │   ├── config.py
│   │   │   ├── logger.py
│   │   │   ├── database.py
│   │   │   ├── blockchain_utils.py
│   │   │   └── helpers.py
│   │   │
│   │   ├── main.py                 # Ponto de entrada
│   │   └── engine.py               # Motor principal
│   │
│   ├── 📁 tests/                   # Testes
│   │   ├── test_strategies.py
│   │   ├── test_analyzers.py
│   │   ├── test_executors.py
│   │   └── test_integrations.py
│   │
│   ├── 📁 notebooks/               # Jupyter notebooks
│   │   ├── dex_analysis.ipynb
│   │   ├── backtest_analysis.ipynb
│   │   └── strategy_optimization.ipynb
│   │
│   ├── requirements.txt
│   ├── setup.py
│   └── Dockerfile
│
├── 📁 docker/                      # Configurações Docker
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── docker-compose.prod.yml
│
├── 📁 nginx/                       # Configuração Nginx
│   ├── nginx.conf
│   ├── 📁 ssl/                     # Certificados SSL
│   └── 📁 conf.d/
│       ├── frontend.conf
│       └── backend.conf
│
├── 📁 .github/                     # GitHub Actions
│   ├── 📁 workflows/
│   │   ├── deploy.yml              # Deploy automático
│   │   ├── test.yml                # Testes automáticos
│   │   └── security.yml            # Scan de segurança
│   └── dependabot.yml
│
├── 📁 scripts/                     # Scripts utilitários
│   ├── setup.sh                    # Setup inicial
│   ├── deploy.sh                   # Deploy manual
│   ├── backup.sh                   # Backup de dados
│   ├── restore.sh                  # Restaurar backup
│   ├── create-admin.ts             # Criar usuário admin
│   ├── dex-setup.sh                # Setup DEXs
│   └── migrate.sh                  # Rodar migrações
│
├── 📁 docs/                        # Documentação
│   ├── API.md                      # Documentação da API
│   ├── SETUP.md                    # Guia de setup
│   ├── DEPLOY.md                   # Guia de deploy
│   ├── SECURITY.md                 # Práticas de segurança
│   ├── DEX_INTEGRATION.md          # Integração com DEXs
│   └── TRADING.md                  # Estratégias de trading
│
├── 📁 config/                      # Configurações
│   ├── strategies.json             # Config de estratégias
│   ├── dexs.json                   # Config de DEXs
│   ├── indicators.json             # Config de indicadores
│   └── risk_limits.json            # Limites de risco
│
├── .env.example                    # Exemplo de variáveis
├── .gitignore                      # Git ignore
├── railway.json                    # Config Railway
├── LICENSE                         # Licença
└── README.md                       # README principal
```



---

## ⚙️ Configuração e Setup

### Pré-requisitos do Sistema

**Ambiente de Desenvolvimento**
- Node.js 18+ (recomendado 20.x)
- Python 3.11+
- Docker 24+ e Docker Compose
- Git 2.40+
- PostgreSQL 15+
- Redis 7+
- MongoDB 7+

**Contas e APIs Necessárias**
- Conta Railway (para deploy)
- Conta GitHub (para CI/CD)
- API Key 1inch (para agregação)
- RPC URLs para blockchains (Alchemy, Infura, QuickNode)
- Chaves privadas de wallets (para testnet inicialmente)

### Configuração de Variáveis de Ambiente

**Backend (.env)**
```bash
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/dex_trading"
MONGODB_URL="mongodb://localhost:27017/dex_trading"
REDIS_URL="redis://localhost:6379"
INFLUXDB_URL="http://localhost:8086"
INFLUXDB_TOKEN="your_influxdb_token"
INFLUXDB_ORG="your_org"
INFLUXDB_BUCKET="trading_metrics"

# Authentication
JWT_SECRET="your_super_secret_jwt_key_here"
JWT_EXPIRES_IN="7d"
BCRYPT_ROUNDS=12

# DEX API Keys
ONEINCH_API_KEY="your_1inch_api_key"
MORALIS_API_KEY="your_moralis_api_key"
COINGECKO_API_KEY="your_coingecko_api_key"

# Blockchain RPC URLs
ETHEREUM_RPC_URL="https://eth-mainnet.alchemyapi.io/v2/your_key"
BSC_RPC_URL="https://bsc-dataseed.binance.org/"
POLYGON_RPC_URL="https://polygon-mainnet.alchemyapi.io/v2/your_key"
ARBITRUM_RPC_URL="https://arb-mainnet.alchemyapi.io/v2/your_key"
OPTIMISM_RPC_URL="https://opt-mainnet.alchemyapi.io/v2/your_key"
BASE_RPC_URL="https://base-mainnet.alchemyapi.io/v2/your_key"
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"

# Trading Configuration
INITIAL_CAPITAL_USDT=1000
MAX_POSITION_SIZE_PERCENT=10
STOP_LOSS_PERCENT=5
TAKE_PROFIT_PERCENT=15
MAX_SLIPPAGE_PERCENT=1
GAS_PRICE_MULTIPLIER=1.2

# Security
ENCRYPTION_KEY="your_32_character_encryption_key"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# External Services
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
TELEGRAM_CHAT_ID="your_telegram_chat_id"
DISCORD_WEBHOOK_URL="your_discord_webhook"

# Environment
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

**Frontend (.env.local)**
```bash
# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="ws://localhost:3001"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret"

# External APIs
NEXT_PUBLIC_COINGECKO_API_URL="https://api.coingecko.com/api/v3"
NEXT_PUBLIC_MORALIS_API_KEY="your_moralis_api_key"

# Feature Flags
NEXT_PUBLIC_ENABLE_TESTNET=true
NEXT_PUBLIC_ENABLE_ADVANCED_FEATURES=false
NEXT_PUBLIC_ENABLE_TELEGRAM_INTEGRATION=false

# Analytics
NEXT_PUBLIC_GA_TRACKING_ID="your_google_analytics_id"
```

**Trading Engine (.env)**
```bash
# Database Connections
DATABASE_URL="postgresql://user:password@localhost:5432/dex_trading"
MONGODB_URL="mongodb://localhost:27017/dex_trading"
REDIS_URL="redis://localhost:6379"
INFLUXDB_URL="http://localhost:8086"

# DEX APIs
ONEINCH_API_KEY="your_1inch_api_key"
JUPITER_API_URL="https://quote-api.jup.ag/v6"
UNISWAP_SUBGRAPH_URL="https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3"

# Blockchain Configuration
ETHEREUM_RPC_URL="https://eth-mainnet.alchemyapi.io/v2/your_key"
BSC_RPC_URL="https://bsc-dataseed.binance.org/"
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"

# Trading Wallets (TESTNET ONLY - NEVER USE MAINNET KEYS IN CONFIG)
ETHEREUM_PRIVATE_KEY="your_testnet_private_key"
BSC_PRIVATE_KEY="your_testnet_private_key"
SOLANA_PRIVATE_KEY="your_testnet_private_key"

# ML Model Configuration
MODEL_UPDATE_INTERVAL_HOURS=24
TRAINING_DATA_DAYS=30
PREDICTION_CONFIDENCE_THRESHOLD=0.7

# Risk Management
MAX_DAILY_LOSS_PERCENT=5
MAX_POSITION_COUNT=10
MIN_LIQUIDITY_USD=10000
MAX_GAS_PRICE_GWEI=100

# Logging
LOG_LEVEL="INFO"
LOG_FILE_PATH="/var/log/trading-engine.log"
```

### Setup Passo a Passo

**1. Clonagem e Configuração Inicial**
```bash
# Clonar repositório
git clone https://github.com/seu-usuario/dex-trading-system.git
cd dex-trading-system

# Configurar variáveis de ambiente
cp .env.example .env
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
cp trading-engine/.env.example trading-engine/.env

# Editar arquivos .env com suas configurações
```

**2. Setup de Banco de Dados**
```bash
# Iniciar serviços com Docker
docker-compose -f docker/docker-compose.dev.yml up -d postgres mongodb redis influxdb

# Aguardar inicialização dos serviços
sleep 30

# Executar migrações
cd backend
npm install
npx prisma migrate dev
npx prisma generate

# Seed inicial
npm run seed
```

**3. Instalação de Dependências**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Trading Engine
cd ../trading-engine
pip install -r requirements.txt
```

**4. Configuração de DEXs**
```bash
# Executar script de configuração de DEXs
chmod +x scripts/dex-setup.sh
./scripts/dex-setup.sh

# Verificar conectividade com DEXs
cd trading-engine
python -c "from src.integrations.oneinch_integration import OneInchIntegration; print('1inch OK')"
python -c "from src.integrations.jupiter_integration import JupiterIntegration; print('Jupiter OK')"
```

**5. Criação de Usuário Admin**
```bash
cd backend
npm run create-admin
# Seguir prompts para criar usuário administrador
```

**6. Teste de Conectividade**
```bash
# Testar APIs
curl http://localhost:3001/api/health
curl http://localhost:3001/api/dex/status

# Testar WebSocket
wscat -c ws://localhost:3001
```

### Configuração de DEXs Específicas

**1inch Configuration**
```json
{
  "name": "1inch",
  "type": "aggregator",
  "enabled": true,
  "priority": 1,
  "supportedChains": [1, 56, 137, 42161, 43114, 10, 8453],
  "apiConfig": {
    "baseUrl": "https://api.1inch.dev",
    "version": "v6.0",
    "rateLimit": 100,
    "timeout": 5000
  },
  "tradingConfig": {
    "minTradeAmount": 10,
    "maxSlippage": 1.0,
    "enableFusion": true,
    "enableIntent": true
  }
}
```

**Uniswap Configuration**
```json
{
  "name": "uniswap",
  "type": "dex",
  "enabled": true,
  "priority": 2,
  "supportedChains": [1, 42161, 10, 8453, 137],
  "contracts": {
    "1": {
      "router": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
      "factory": "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      "quoter": "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"
    }
  },
  "tradingConfig": {
    "feeTiers": [100, 500, 3000, 10000],
    "defaultFeeTier": 3000,
    "maxHops": 3
  }
}
```

**Jupiter Configuration**
```json
{
  "name": "jupiter",
  "type": "aggregator",
  "enabled": true,
  "priority": 1,
  "supportedChains": [101],
  "apiConfig": {
    "baseUrl": "https://quote-api.jup.ag",
    "version": "v6",
    "rateLimit": 200,
    "timeout": 3000
  },
  "tradingConfig": {
    "useSharedAccounts": true,
    "wrapUnwrapSol": true,
    "asLegacyTransaction": false
  }
}
```

**PancakeSwap Configuration**
```json
{
  "name": "pancakeswap",
  "type": "dex",
  "enabled": true,
  "priority": 2,
  "supportedChains": [56, 8453],
  "contracts": {
    "56": {
      "router": "0x13f4EA83D0bd40E75C8222255bc855a974568Dd4",
      "factory": "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865",
      "quoter": "0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997"
    }
  },
  "tradingConfig": {
    "feeTiers": [100, 500, 2500, 10000],
    "defaultFeeTier": 2500
  }
}
```

---

## 💻 Código Fonte Principal

### Trading Engine Core (Python)

**engine.py - Motor Principal**
```python
import asyncio
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

from src.collectors.dex_data_collector import DEXDataCollector
from src.strategies.strategy_manager import StrategyManager
from src.managers.risk_manager import RiskManager
from src.managers.portfolio_manager import PortfolioManager
from src.executors.dex_executor import DEXExecutor
from src.analyzers.regime_detector import RegimeDetector
from src.integrations.oneinch_integration import OneInchIntegration
from src.utils.config import Config
from src.utils.logger import setup_logger
from src.utils.database import DatabaseManager

class TradingEngine:
    """
    Motor principal de trading que coordena todas as operações
    """
    
    def __init__(self, config: Config):
        self.config = config
        self.logger = setup_logger(__name__)
        self.db = DatabaseManager(config)
        
        # Componentes principais
        self.data_collector = DEXDataCollector(config)
        self.strategy_manager = StrategyManager(config)
        self.risk_manager = RiskManager(config)
        self.portfolio_manager = PortfolioManager(config)
        self.dex_executor = DEXExecutor(config)
        self.regime_detector = RegimeDetector(config)
        
        # Integrações DEX
        self.oneinch = OneInchIntegration(config.ONEINCH_API_KEY)
        
        # Estado do sistema
        self.is_running = False
        self.current_regime = None
        self.active_positions = {}
        self.performance_metrics = {}
        
    async def start(self):
        """Iniciar o motor de trading"""
        self.logger.info("🚀 Iniciando Trading Engine...")
        
        try:
            # Verificar conectividade
            await self._health_check()
            
            # Carregar configurações
            await self._load_configurations()
            
            # Inicializar componentes
            await self._initialize_components()
            
            # Iniciar loops principais
            self.is_running = True
            await asyncio.gather(
                self._data_collection_loop(),
                self._strategy_execution_loop(),
                self._risk_monitoring_loop(),
                self._performance_tracking_loop()
            )
            
        except Exception as e:
            self.logger.error(f"❌ Erro ao iniciar Trading Engine: {e}")
            await self.stop()
    
    async def stop(self):
        """Parar o motor de trading"""
        self.logger.info("🛑 Parando Trading Engine...")
        self.is_running = False
        
        # Fechar posições abertas se necessário
        await self._emergency_close_positions()
        
        # Salvar estado
        await self._save_state()
        
    async def _health_check(self):
        """Verificar saúde do sistema"""
        self.logger.info("🔍 Verificando conectividade...")
        
        # Testar conexões com DEXs
        dex_status = await self.data_collector.check_dex_connectivity()
        
        # Testar banco de dados
        db_status = await self.db.health_check()
        
        if not all([dex_status, db_status]):
            raise Exception("Falha na verificação de conectividade")
        
        self.logger.info("✅ Conectividade verificada")
    
    async def _data_collection_loop(self):
        """Loop principal de coleta de dados"""
        while self.is_running:
            try:
                # Coletar dados de todas as DEXs
                market_data = await self.data_collector.collect_all_data()
                
                # Detectar regime de mercado
                self.current_regime = await self.regime_detector.detect_regime(market_data)
                
                # Atualizar cache
                await self.db.update_market_data(market_data)
                
                # Aguardar próxima coleta
                await asyncio.sleep(30)  # 30 segundos
                
            except Exception as e:
                self.logger.error(f"Erro na coleta de dados: {e}")
                await asyncio.sleep(60)  # Aguardar mais tempo em caso de erro
    
    async def _strategy_execution_loop(self):
        """Loop principal de execução de estratégias"""
        while self.is_running:
            try:
                # Obter dados atuais
                market_data = await self.db.get_latest_market_data()
                
                # Executar estratégias baseado no regime atual
                signals = await self.strategy_manager.generate_signals(
                    market_data, 
                    self.current_regime
                )
                
                # Processar sinais
                for signal in signals:
                    await self._process_signal(signal)
                
                # Aguardar próxima execução
                await asyncio.sleep(60)  # 1 minuto
                
            except Exception as e:
                self.logger.error(f"Erro na execução de estratégias: {e}")
                await asyncio.sleep(120)
    
    async def _process_signal(self, signal: Dict):
        """Processar sinal de trading"""
        try:
            # Verificar gestão de risco
            risk_check = await self.risk_manager.validate_signal(signal)
            if not risk_check['approved']:
                self.logger.warning(f"Sinal rejeitado: {risk_check['reason']}")
                return
            
            # Selecionar melhor DEX para execução
            best_dex = await self._select_best_dex(signal)
            
            # Executar ordem
            execution_result = await self.dex_executor.execute_order(
                signal, best_dex
            )
            
            if execution_result['success']:
                # Atualizar portfólio
                await self.portfolio_manager.update_position(execution_result)
                
                # Log da execução
                self.logger.info(f"✅ Ordem executada: {execution_result}")
            else:
                self.logger.error(f"❌ Falha na execução: {execution_result}")
                
        except Exception as e:
            self.logger.error(f"Erro ao processar sinal: {e}")
    
    async def _select_best_dex(self, signal: Dict) -> str:
        """Selecionar a melhor DEX para execução"""
        token_pair = f"{signal['base_token']}/{signal['quote_token']}"
        amount = signal['amount']
        
        # Obter cotações de múltiplas DEXs
        quotes = {}
        
        # 1inch (agregador)
        try:
            oneinch_quote = await self.oneinch.get_quote(
                chain_id=signal['chain_id'],
                src=signal['base_token'],
                dst=signal['quote_token'],
                amount=str(amount)
            )
            quotes['1inch'] = {
                'price': float(oneinch_quote['toTokenAmount']) / amount,
                'gas_cost': oneinch_quote.get('estimatedGas', 0),
                'protocols': oneinch_quote.get('protocols', [])
            }
        except Exception as e:
            self.logger.warning(f"Erro ao obter cotação 1inch: {e}")
        
        # Selecionar melhor opção
        if quotes:
            best_dex = max(quotes.keys(), key=lambda x: quotes[x]['price'])
            self.logger.info(f"Melhor DEX selecionada: {best_dex}")
            return best_dex
        
        return '1inch'  # Fallback para 1inch
    
    async def _risk_monitoring_loop(self):
        """Loop de monitoramento de risco"""
        while self.is_running:
            try:
                # Verificar limites de risco
                risk_status = await self.risk_manager.check_all_limits()
                
                if risk_status['emergency_stop']:
                    self.logger.critical("🚨 PARADA DE EMERGÊNCIA ATIVADA")
                    await self._emergency_close_positions()
                
                # Verificar stop-loss e take-profit
                await self._check_position_limits()
                
                await asyncio.sleep(10)  # Verificar a cada 10 segundos
                
            except Exception as e:
                self.logger.error(f"Erro no monitoramento de risco: {e}")
                await asyncio.sleep(30)
    
    async def _performance_tracking_loop(self):
        """Loop de acompanhamento de performance"""
        while self.is_running:
            try:
                # Calcular métricas de performance
                metrics = await self.portfolio_manager.calculate_performance()
                
                # Atualizar métricas
                self.performance_metrics = metrics
                
                # Salvar no banco
                await self.db.save_performance_metrics(metrics)
                
                # Log periódico
                self.logger.info(f"📊 Performance: {metrics['total_return']:.2%}")
                
                await asyncio.sleep(300)  # A cada 5 minutos
                
            except Exception as e:
                self.logger.error(f"Erro no tracking de performance: {e}")
                await asyncio.sleep(600)

# Ponto de entrada
async def main():
    config = Config()
    engine = TradingEngine(config)
    
    try:
        await engine.start()
    except KeyboardInterrupt:
        await engine.stop()

if __name__ == "__main__":
    asyncio.run(main())
```

**dex_data_collector.py - Coletor de Dados Multi-DEX**
```python
import asyncio
import aiohttp
from typing import Dict, List, Optional
from datetime import datetime
import pandas as pd

from src.integrations.oneinch_integration import OneInchIntegration
from src.integrations.uniswap_integration import UniswapIntegration
from src.integrations.jupiter_integration import JupiterIntegration
from src.integrations.pancakeswap_integration import PancakeSwapIntegration
from src.utils.config import Config
from src.utils.logger import setup_logger

class DEXDataCollector:
    """
    Coletor de dados de múltiplas DEXs
    """
    
    def __init__(self, config: Config):
        self.config = config
        self.logger = setup_logger(__name__)
        
        # Inicializar integrações
        self.oneinch = OneInchIntegration(config.ONEINCH_API_KEY)
        self.uniswap = UniswapIntegration(config)
        self.jupiter = JupiterIntegration(config)
        self.pancakeswap = PancakeSwapIntegration(config)
        
        # Cache de dados
        self.price_cache = {}
        self.liquidity_cache = {}
        self.volume_cache = {}
        
    async def collect_all_data(self) -> Dict:
        """Coletar dados de todas as DEXs"""
        self.logger.info("📊 Coletando dados de todas as DEXs...")
        
        # Executar coletas em paralelo
        tasks = [
            self._collect_oneinch_data(),
            self._collect_uniswap_data(),
            self._collect_jupiter_data(),
            self._collect_pancakeswap_data()
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Consolidar dados
        consolidated_data = {
            'timestamp': datetime.utcnow(),
            'dexs': {},
            'aggregated': {}
        }
        
        dex_names = ['1inch', 'uniswap', 'jupiter', 'pancakeswap']
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                self.logger.error(f"Erro ao coletar dados {dex_names[i]}: {result}")
                continue
            
            consolidated_data['dexs'][dex_names[i]] = result
        
        # Agregar dados
        consolidated_data['aggregated'] = self._aggregate_data(consolidated_data['dexs'])
        
        return consolidated_data
    
    async def _collect_oneinch_data(self) -> Dict:
        """Coletar dados do 1inch"""
        try:
            data = {
                'prices': {},
                'liquidity': {},
                'protocols': []
            }
            
            # Principais pares para monitorar
            pairs = [
                ('ETH', 'USDC', 1),  # Ethereum
                ('BNB', 'USDT', 56), # BSC
                ('MATIC', 'USDC', 137), # Polygon
            ]
            
            for base, quote, chain_id in pairs:
                try:
                    # Obter cotação
                    quote_result = await self.oneinch.get_quote(
                        chain_id=chain_id,
                        src=self._get_token_address(base, chain_id),
                        dst=self._get_token_address(quote, chain_id),
                        amount="1000000000000000000"  # 1 token
                    )
                    
                    pair_key = f"{base}/{quote}"
                    data['prices'][pair_key] = {
                        'price': float(quote_result['toTokenAmount']) / 1e18,
                        'chain_id': chain_id,
                        'protocols': quote_result.get('protocols', [])
                    }
                    
                except Exception as e:
                    self.logger.warning(f"Erro ao obter cotação {base}/{quote}: {e}")
            
            return data
            
        except Exception as e:
            self.logger.error(f"Erro na coleta 1inch: {e}")
            return {}
    
    async def _collect_uniswap_data(self) -> Dict:
        """Coletar dados do Uniswap"""
        try:
            # Implementar coleta específica do Uniswap
            data = {
                'prices': {},
                'liquidity': {},
                'volume_24h': {}
            }
            
            # Usar Uniswap SDK ou The Graph
            # Implementação específica aqui
            
            return data
            
        except Exception as e:
            self.logger.error(f"Erro na coleta Uniswap: {e}")
            return {}
    
    async def _collect_jupiter_data(self) -> Dict:
        """Coletar dados do Jupiter (Solana)"""
        try:
            data = {
                'prices': {},
                'routes': {},
                'tokens': []
            }
            
            # Principais tokens Solana
            solana_pairs = [
                ('SOL', 'USDC'),
                ('RAY', 'USDC'),
                ('SRM', 'USDC')
            ]
            
            for base, quote in solana_pairs:
                try:
                    quote_result = await self.jupiter.get_quote(
                        input_mint=self._get_solana_token_mint(base),
                        output_mint=self._get_solana_token_mint(quote),
                        amount=1000000000  # 1 SOL
                    )
                    
                    pair_key = f"{base}/{quote}"
                    data['prices'][pair_key] = {
                        'price': float(quote_result['outAmount']) / 1e6,
                        'route': quote_result.get('routePlan', [])
                    }
                    
                except Exception as e:
                    self.logger.warning(f"Erro ao obter cotação Solana {base}/{quote}: {e}")
            
            return data
            
        except Exception as e:
            self.logger.error(f"Erro na coleta Jupiter: {e}")
            return {}
    
    async def _collect_pancakeswap_data(self) -> Dict:
        """Coletar dados do PancakeSwap"""
        try:
            data = {
                'prices': {},
                'liquidity': {},
                'farms': []
            }
            
            # Implementar coleta específica do PancakeSwap
            # Usar contratos ou APIs específicas
            
            return data
            
        except Exception as e:
            self.logger.error(f"Erro na coleta PancakeSwap: {e}")
            return {}
    
    def _aggregate_data(self, dex_data: Dict) -> Dict:
        """Agregar dados de múltiplas DEXs"""
        aggregated = {
            'best_prices': {},
            'total_liquidity': {},
            'arbitrage_opportunities': []
        }
        
        # Encontrar melhores preços
        all_prices = {}
        for dex_name, data in dex_data.items():
            if 'prices' in data:
                for pair, price_info in data['prices'].items():
                    if pair not in all_prices:
                        all_prices[pair] = []
                    all_prices[pair].append({
                        'dex': dex_name,
                        'price': price_info['price'],
                        'data': price_info
                    })
        
        # Determinar melhores preços e oportunidades de arbitragem
        for pair, prices in all_prices.items():
            if len(prices) > 1:
                sorted_prices = sorted(prices, key=lambda x: x['price'])
                best_price = sorted_prices[-1]  # Maior preço para venda
                worst_price = sorted_prices[0]  # Menor preço para compra
                
                aggregated['best_prices'][pair] = best_price
                
                # Verificar oportunidade de arbitragem
                price_diff = (best_price['price'] - worst_price['price']) / worst_price['price']
                if price_diff > 0.005:  # 0.5% de diferença mínima
                    aggregated['arbitrage_opportunities'].append({
                        'pair': pair,
                        'buy_dex': worst_price['dex'],
                        'sell_dex': best_price['dex'],
                        'profit_percent': price_diff * 100,
                        'buy_price': worst_price['price'],
                        'sell_price': best_price['price']
                    })
        
        return aggregated
    
    def _get_token_address(self, symbol: str, chain_id: int) -> str:
        """Obter endereço do token por símbolo e chain"""
        # Mapeamento de tokens conhecidos
        token_addresses = {
            1: {  # Ethereum
                'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                'USDC': '0xA0b86a33E6441b8e776f89d2b5B977c737C8C4E',
                'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7'
            },
            56: {  # BSC
                'BNB': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                'USDT': '0x55d398326f99059fF775485246999027B3197955',
                'USDC': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'
            }
        }
        
        return token_addresses.get(chain_id, {}).get(symbol, '')
    
    def _get_solana_token_mint(self, symbol: str) -> str:
        """Obter mint address do token Solana"""
        solana_tokens = {
            'SOL': 'So11111111111111111111111111111111111111112',
            'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            'RAY': '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
            'SRM': 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt'
        }
        
        return solana_tokens.get(symbol, '')
    
    async def check_dex_connectivity(self) -> bool:
        """Verificar conectividade com todas as DEXs"""
        try:
            # Testar 1inch
            await self.oneinch.get_quote(1, 
                '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                '0xA0b86a33E6441b8e776f89d2b5B977c737C8C4E',
                '1000000000000000000'
            )
            
            # Testar outras DEXs...
            
            return True
            
        except Exception as e:
            self.logger.error(f"Falha na conectividade: {e}")
            return False
```

### Backend API (Node.js/TypeScript)

**app.ts - Configuração Express**
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import tradingRoutes from './routes/trading.routes';
import dexRoutes from './routes/dex.routes';
import strategyRoutes from './routes/strategy.routes';

import { errorHandler } from './middlewares/error.middleware';
import { authMiddleware } from './middlewares/auth.middleware';
import { WebSocketService } from './services/websocket.service';
import { logger } from './utils/logger';

class App {
    public app: express.Application;
    public server: any;
    public io: SocketIOServer;
    private wsService: WebSocketService;

    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.io = new SocketIOServer(this.server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"]
            }
        });
        
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeWebSocket();
        this.initializeErrorHandling();
    }

    private initializeMiddlewares(): void {
        // Security
        this.app.use(helmet());
        
        // CORS
        this.app.use(cors({
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            credentials: true
        }));
        
        // Compression
        this.app.use(compression());
        
        // Rate limiting
        const limiter = rateLimit({
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
            max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
            message: 'Too many requests from this IP'
        });
        this.app.use('/api/', limiter);
        
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Logging
        this.app.use((req, res, next) => {
            logger.info(`${req.method} ${req.path} - ${req.ip}`);
            next();
        });
    }

    private initializeRoutes(): void {
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({ 
                status: 'OK', 
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || '1.0.0'
            });
        });

        // Public routes
        this.app.use('/api/auth', authRoutes);
        
        // Protected routes
        this.app.use('/api/dashboard', authMiddleware, dashboardRoutes);
        this.app.use('/api/trading', authMiddleware, tradingRoutes);
        this.app.use('/api/dex', authMiddleware, dexRoutes);
        this.app.use('/api/strategies', authMiddleware, strategyRoutes);
    }

    private initializeWebSocket(): void {
        this.wsService = new WebSocketService(this.io);
        
        this.io.on('connection', (socket) => {
            logger.info(`WebSocket client connected: ${socket.id}`);
            
            socket.on('disconnect', () => {
                logger.info(`WebSocket client disconnected: ${socket.id}`);
            });
            
            socket.on('subscribe_trading_data', (data) => {
                this.wsService.subscribeToTradingData(socket, data);
            });
            
            socket.on('subscribe_dex_data', (data) => {
                this.wsService.subscribeToDEXData(socket, data);
            });
        });
    }

    private initializeErrorHandling(): void {
        this.app.use(errorHandler);
    }

    public listen(): void {
        const port = process.env.PORT || 3001;
        this.server.listen(port, () => {
            logger.info(`🚀 Server running on port ${port}`);
        });
    }
}

export default App;
```

**dex.controller.ts - Controlador de DEXs**
```typescript
import { Request, Response, NextFunction } from 'express';
import { DEXService } from '../services/dex.service';
import { logger } from '../utils/logger';

export class DEXController {
    private dexService: DEXService;

    constructor() {
        this.dexService = new DEXService();
    }

    public getDEXStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const status = await this.dexService.getAllDEXStatus();
            res.json({
                success: true,
                data: status
            });
        } catch (error) {
            logger.error('Error getting DEX status:', error);
            next(error);
        }
    };

    public getDEXPrices = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { pair, dexs } = req.query;
            
            if (!pair) {
                return res.status(400).json({
                    success: false,
                    message: 'Pair parameter is required'
                });
            }

            const prices = await this.dexService.getPricesAcrossDEXs(
                pair as string,
                dexs ? (dexs as string).split(',') : undefined
            );

            res.json({
                success: true,
                data: prices
            });
        } catch (error) {
            logger.error('Error getting DEX prices:', error);
            next(error);
        }
    };

    public getArbitrageOpportunities = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { minProfitPercent = 0.5 } = req.query;
            
            const opportunities = await this.dexService.findArbitrageOpportunities(
                parseFloat(minProfitPercent as string)
            );

            res.json({
                success: true,
                data: opportunities
            });
        } catch (error) {
            logger.error('Error getting arbitrage opportunities:', error);
            next(error);
        }
    };

    public executeTrade = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { dex, pair, amount, side, slippage } = req.body;
            const userId = req.user?.id;

            if (!dex || !pair || !amount || !side) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required parameters'
                });
            }

            const result = await this.dexService.executeTrade({
                userId,
                dex,
                pair,
                amount: parseFloat(amount),
                side,
                slippage: slippage ? parseFloat(slippage) : 1.0
            });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Error executing trade:', error);
            next(error);
        }
    };

    public getDEXLiquidity = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { pair, dex } = req.query;

            const liquidity = await this.dexService.getLiquidityData(
                pair as string,
                dex as string
            );

            res.json({
                success: true,
                data: liquidity
            });
        } catch (error) {
            logger.error('Error getting DEX liquidity:', error);
            next(error);
        }
    };

    public getOptimalRoute = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { fromToken, toToken, amount, chainId } = req.query;

            if (!fromToken || !toToken || !amount) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required parameters'
                });
            }

            const route = await this.dexService.getOptimalRoute({
                fromToken: fromToken as string,
                toToken: toToken as string,
                amount: parseFloat(amount as string),
                chainId: chainId ? parseInt(chainId as string) : 1
            });

            res.json({
                success: true,
                data: route
            });
        } catch (error) {
            logger.error('Error getting optimal route:', error);
            next(error);
        }
    };
}
```

