# Atlas Protocol

**IP-Backed Lending & GenAI Licensing Protocol**

Atlas Protocol enables creators to monetize their IP assets through collateralized lending (IPFi) and GenAI licensing, powered by dynamic CVS (Collateral Value Score) calculations.

## 🎯 Overview

Atlas Protocol combines:
- **IPFi (IP Finance)**: Collateralized lending based on IP asset value
- **GenAI Licensing**: Automated licensing for Generative AI models
- **Cross-Chain Support**: Seamless asset transfers via Owlto Finance
- **Dynamic CVS**: Real-time Collateral Value Score calculation

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │ (Next.js + React)
└────────┬────────┘
         │
┌────────▼────────┐
│  Agent Service  │ (Node.js + TypeScript)
│  - Loan Manager │
│  - Licensing    │
│  - CVS Engine   │
└────────┬────────┘
         │
┌────────▼────────┐
│ Smart Contracts │ (Solidity + Foundry)
│  - IDO (Oracle) │
│  - ADLV (Vault) │
└────────┬────────┘
         │
┌────────▼────────┐
│   Subgraph      │ (The Graph + Goldsky)
└─────────────────┘
```

## 📦 Project Structure

```
atlas-protocol/
├── contracts/          # Smart contracts (Foundry)
│   ├── src/
│   │   ├── IDO.sol    # IP Data Oracle
│   │   └── ADLV.sol   # Automated Data Licensing Vault
│   ├── test/          # Foundry tests (26 tests)
│   ├── script/        # Deployment scripts
│   └── DEPLOYMENT.md  # Deployment guide
│
├── apps/
│   ├── agent-service/ # Backend service
│   │   ├── src/services/
│   │   │   ├── loan-manager.ts      # Loan operations + Owlto
│   │   │   ├── licensing-agent.ts   # GenAI licensing + abv.dev
│   │   │   ├── contract-monitor.ts  # Event monitoring
│   │   │   └── cvs-engine.ts        # CVS calculation
│   │   └── README.md
│   │
│   ├── frontend/      # React frontend
│   └── web/           # Next.js web app
│
├── subgraph/          # The Graph subgraph
└── DEPLOYMENT_GUIDE.md # Complete deployment guide
```

## 🚀 Quick Start

### 1. Deploy Contracts

```bash
cd contracts
cp .env.example .env
# Edit .env with your PRIVATE_KEY and STORY_PROTOCOL_RPC

# Deploy to Story Protocol
./scripts/deploy-story.sh
```

### 2. Setup Agent Service

```bash
cd apps/agent-service
cp .env.example .env

# Update with contract addresses
./scripts/update-env.sh

# Test integration
./scripts/test-integration.sh

# Start service
bun run dev
```

### 3. Start Frontend

```bash
cd apps/frontend
bun install
bun run dev
```

## 📚 Documentation

- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[Contracts Documentation](./contracts/DEPLOYMENT.md)** - Smart contract details
- **[Agent Service README](./apps/agent-service/README.md)** - Backend service guide

## 🧪 Testing

### Smart Contracts

```bash
cd contracts
forge test
```

**Results**: 26 tests, all passing ✅

### Agent Service

```bash
cd apps/agent-service
./scripts/test-integration.sh
```

## 🔧 Configuration

### Required Environment Variables

**Contracts:**
- `PRIVATE_KEY` - Deployer private key
- `STORY_PROTOCOL_RPC` - Story Protocol RPC URL

**Agent Service:**
- `ADLV_ADDRESS` - Deployed ADLV contract address
- `IDO_ADDRESS` - Deployed IDO contract address
- `RPC_URL` - RPC endpoint
- `PRIVATE_KEY` - For signing transactions

**Optional:**
- `OWLTO_API_KEY` - For cross-chain loans
- `ABV_API_KEY` - For GenAI licensing
- `STORY_PROTOCOL_API_KEY` - Story Protocol API

## 🎯 Features

### ✅ Implemented

- [x] Smart contracts (IDO, ADLV)
- [x] Comprehensive test suite (26 tests)
- [x] Agent Service with event monitoring
- [x] Loan Manager with Owlto Finance integration
- [x] Licensing Agent with abv.dev integration
- [x] CVS Engine for score calculation
- [x] Contract event monitoring
- [x] Deployment scripts
- [x] Frontend components

### 🚧 In Progress

- [ ] World ID integration in frontend
- [ ] Full frontend-backend integration
- [ ] Production deployment

## 📊 Protocol Flow

### Loan Issuance (IPFi)

1. Creator requests loan via frontend
2. ADLV contract validates CVS requirements
3. Loan issued on-chain
4. Agent Service detects `LoanIssued` event
5. Owlto Finance bridges funds to borrower's chain
6. Borrower receives funds

### License Sale (GenAI)

1. User purchases license via frontend
2. ADLV contract distributes revenue
3. Agent Service detects `LicenseSold` event
4. CVS updated automatically
5. License registered with abv.dev
6. GenAI model access granted

## 🔐 Security

- ✅ OpenZeppelin Ownable for access control
- ✅ Comprehensive input validation
- ✅ Reentrancy protection
- ✅ Test coverage for critical functions

## 📝 License

MIT

## 🤝 Contributing

This is a private project. For questions or issues, please contact the maintainers.

---

**Built with ❤️ for the Atlas Protocol team**
