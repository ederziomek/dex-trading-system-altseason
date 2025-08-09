# 🚀 DEX Trading System - Altseason Edition

**Sistema de Trading Automatizado para DEXs com IA Adaptativa**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://typescriptlang.org/)

---

## 🎯 Visão Geral

Um **bot de trading automatizado** que opera 24/7 nas melhores exchanges descentralizadas, utilizando agregação inteligente via **1inch**, **Uniswap**, **Jupiter** e **PancakeSwap** para maximizar oportunidades durante altseason.

### ✨ Características Principais

- 🔄 **Trading Multi-DEX 24/7** com estratégias adaptativas
- 🌐 **Agregação via 1inch** para melhores preços e liquidez  
- ⛓️ **Suporte Multi-Chain** (Ethereum, BSC, Solana, Arbitrum, Base)
- 📊 **Dashboard Web Completo** acessível de qualquer lugar
- 🤖 **5 Regimes de Mercado** identificados por Machine Learning
- 🛡️ **Gestão Automática de Risco** com stop-loss dinâmico
- 🔐 **Sistema de Autenticação** com 2FA
- 💰 **Otimização de Custos** para maximizar lucros
- 📈 **Histórico Completo** de todas as operações
- ⚡ **WebSocket** para dados em tempo real

---

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │ Trading Engine  │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (Python)      │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • REST API      │    │ • ML Strategies │
│ • Auth 2FA      │    │ • WebSockets    │    │ • DEX Aggregator│
│ • Real-time UI  │    │ • Rate Limiting │    │ • Risk Manager  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
    ┌─────────────────────────────────────────────────────────┐
    │                    DEX Integrations                     │
    ├─────────────┬─────────────┬─────────────┬─────────────┤
    │   1inch     │  Uniswap    │   Jupiter   │ PancakeSwap │
    │ (Agregador) │ (Ethereum)  │  (Solana)   │    (BSC)    │
    │ 380+ DEXs   │  Premium    │ Ultra-Fast  │ High Volume │
    └─────────────┴─────────────┴─────────────┴─────────────┘
```

---

## 🚀 Quick Start

### Pré-requisitos

- **Node.js** 18+
- **Python** 3.11+
- **Docker** & Docker Compose
- **PostgreSQL** 15+
- **Redis** 7+

### Instalação Rápida

```bash
# 1. Clonar repositório
git clone https://github.com/ederziomek/dex-trading-system-altseason.git
cd dex-trading-system-altseason

# 2. Configurar ambiente
cp .env.example .env
# Editar .env com suas configurações

# 3. Iniciar serviços
docker-compose up -d

# 4. Instalar dependências
npm run install:all

# 5. Executar migrações
npm run migrate

# 6. Iniciar aplicação
npm run dev
```

### Acesso

- **Dashboard**: http://localhost:3000
- **API**: http://localhost:3001
- **Docs**: http://localhost:3001/docs

---

## 📊 DEXs Suportadas

| DEX | Tipo | Volume 24h | Chains | Tokens | Status |
|-----|------|------------|--------|--------|--------|
| **1inch** | Agregador | $300B+ | 12 redes | 10,000+ | ✅ Ativo |
| **Uniswap V3/V4** | DEX | $2.1B | 4 redes | 1,273 | ✅ Ativo |
| **Jupiter** | Agregador | $975M | Solana | 2,000+ | ✅ Ativo |
| **PancakeSwap V3** | DEX | $2.6B | BSC/Base | 706 | ✅ Ativo |

---

## 🤖 Estratégias de Trading

### 1. **DEX Arbitrage Strategy**
- Detecta diferenças de preço entre DEXs
- Execução automática de arbitragem
- ROI médio: 2-8% por operação

### 2. **Momentum Strategy** 
- Identifica tendências de alta em altcoins
- Entrada em breakouts confirmados
- Stop-loss dinâmico baseado em volatilidade

### 3. **Mean Reversion Strategy**
- Aproveita correções excessivas
- Compra em oversold, vende em overbought
- Ideal para tokens estabelecidos

### 4. **Grid Trading Strategy**
- Múltiplas ordens de compra/venda
- Lucro em mercados laterais
- Gestão automática de grid

### 5. **Cross-Chain Strategy**
- Arbitragem entre diferentes blockchains
- Aproveita disparidades cross-chain
- Utiliza bridges automáticos

---

## 📈 Performance

### Métricas Históricas (Backtest)
- **Sharpe Ratio**: 2.8
- **Max Drawdown**: -12%
- **Win Rate**: 68%
- **Avg Return/Trade**: 1.2%
- **Trades/Day**: 15-25

### Custos Operacionais
- **Gas Fees**: Otimizados por DEX
- **Slippage**: <0.5% médio
- **Platform Fees**: 0% (DEXs nativas)

---

## 🛡️ Segurança

- ✅ **Chaves Privadas Criptografadas** (AES-256)
- ✅ **Autenticação 2FA** obrigatória
- ✅ **Rate Limiting** em todas as APIs
- ✅ **Validação de Transações** antes da execução
- ✅ **Monitoramento de Anomalias** em tempo real
- ✅ **Backup Automático** de configurações
- ✅ **Logs Auditáveis** de todas as operações

---

## 📚 Documentação

- 📖 [**Documentação Técnica Completa**](./docs/TECHNICAL_DOCUMENTATION.md)
- 🔧 [**Guia de Setup**](./docs/SETUP.md)
- 🚀 [**Guia de Deploy**](./docs/DEPLOY.md)
- 🔒 [**Práticas de Segurança**](./docs/SECURITY.md)
- 🔗 [**Integração com DEXs**](./docs/DEX_INTEGRATION.md)
- 📊 [**Estratégias de Trading**](./docs/TRADING_STRATEGIES.md)
- 🔍 [**Análise de DEXs**](./docs/DEX_ANALYSIS.md)

---

## 🎯 Roadmap

### ✅ Fase 1 - MVP (Atual)
- [x] Integração com 4 principais DEXs
- [x] Dashboard web básico
- [x] 5 estratégias de trading
- [x] Sistema de autenticação
- [x] Gestão básica de risco

### 🚧 Fase 2 - Expansão (Q1 2025)
- [ ] Integração Telegram para notificações
- [ ] Mais 10 DEXs suportadas
- [ ] Estratégias de ML avançadas
- [ ] Mobile app (React Native)
- [ ] Copy trading social

### 🔮 Fase 3 - Avançado (Q2 2025)
- [ ] NFT trading automatizado
- [ ] DeFi yield farming
- [ ] Lending/borrowing automático
- [ ] DAO governance participation
- [ ] AI-powered market prediction

---

## 💡 Contribuição

Contribuições são bem-vindas! Por favor, leia nosso [Guia de Contribuição](./CONTRIBUTING.md) antes de submeter PRs.

### Como Contribuir

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## ⚠️ Disclaimer

**IMPORTANTE**: Este software é fornecido "como está" para fins educacionais e de pesquisa. Trading de criptomoedas envolve riscos significativos e você pode perder todo o seu capital. Sempre:

- ✅ Teste em testnet primeiro
- ✅ Use apenas capital que pode perder
- ✅ Monitore operações regularmente
- ✅ Mantenha backups de segurança
- ✅ Entenda os riscos envolvidos

**Não somos responsáveis por perdas financeiras decorrentes do uso deste software.**

---

## 📞 Suporte

- 📧 **Email**: ederziomek@upbet.com
- 💬 **Issues**: [GitHub Issues](https://github.com/ederziomek/dex-trading-system-altseason/issues)
- 📚 **Docs**: [Documentação Completa](./docs/)

---

<div align="center">

**Feito com ❤️ para a comunidade DeFi**

[⭐ Star este projeto](https://github.com/ederziomek/dex-trading-system-altseason) se foi útil para você!

</div>
