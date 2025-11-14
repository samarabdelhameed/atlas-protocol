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
# Edit .env with your PRIVATE_KEY
# STORY_PROTOCOL_RPC is already set to: https://rpc-storyevm-testnet.aldebaranode.xyz

# Deploy to Story Protocol using Deploy.s.sol
./scripts/deploy-to-story.sh
# Or use the main deployment script:
cd .. && ./deploy.sh
```

**Note:** Contracts are already deployed on Story Protocol Testnet. See [Deployed Contracts](#-deployed-contracts) section for addresses and explorer links.

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

## 🌐 Network Configuration

### Story Protocol Testnet
- **RPC URL:** https://rpc-storyevm-testnet.aldebaranode.xyz
- **Explorer:** https://testnet.storyscan.xyz
- **Chain ID:** 1315

## 📍 Deployed Contracts

### ✅ Verified Contracts on Story Protocol Testnet

#### IDO Contract (IP Data Oracle)
- **Address:** [`0xB176c1FA7B3feC56cB23681B6E447A7AE60C5254`](https://testnet.storyscan.xyz/address/0xB176c1FA7B3feC56cB23681B6E447A7AE60C5254)
- **Transaction:** [`0xea8e83b28fb2cdbb8ed3be2cee057e976493541840577149362d49ae02503c9c`](https://testnet.storyscan.xyz/tx/0xea8e83b28fb2cdbb8ed3be2cee057e976493541840577149362d49ae02503c9c)
- **Owner:** ADLV Contract (0x76d81731e26889Be3718BEB4d43e12C3692753b8)
- **Function:** Manages CVS scores and license revenue tracking

#### ADLV Contract (Automated Data Licensing Vault)
- **Address:** [`0x76d81731e26889Be3718BEB4d43e12C3692753b8`](https://testnet.storyscan.xyz/address/0x76d81731e26889Be3718BEB4d43e12C3692753b8)
- **Transaction:** [`0x2418ae25c4831027099d543525f1c0171074e38fc95e3c523007ed05577ed877`](https://testnet.storyscan.xyz/tx/0x2418ae25c4831027099d543525f1c0171074e38fc95e3c523007ed05577ed877)
- **IDO Reference:** IDO Contract (0xB176c1FA7B3feC56cB23681B6E447A7AE60C5254)
- **Function:** Manages vaults, loans, and revenue distribution

### Deployment Information
- **Network:** Story Protocol Testnet
- **Chain ID:** 1315
- **Deployer:** `0xdAFEE25F98Ff62504C1086eAcbb406190F3110D5`
- **RPC URL:** https://rpc-storyevm-testnet.aldebaranode.xyz
- **Explorer Base:** https://testnet.storyscan.xyz
- **Status:** ✅ Verified and working on network
- **Verification:**
  - ✅ IDO Owner = ADLV Contract
  - ✅ ADLV IDO Reference = IDO Contract
  - ✅ Contracts deployed and accessible via RPC

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
- `STORY_PROTOCOL_RPC` - Story Protocol RPC URL (default: https://rpc-storyevm-testnet.aldebaranode.xyz)

**Agent Service:**
- `ADLV_ADDRESS` - Deployed ADLV contract address (`0x76d81731e26889Be3718BEB4d43e12C3692753b8`)
- `IDO_ADDRESS` - Deployed IDO contract address (`0xB176c1FA7B3feC56cB23681B6E447A7AE60C5254`)
- `RPC_URL` - RPC endpoint (https://rpc-storyevm-testnet.aldebaranode.xyz)
- `CHAIN_ID` - Chain ID (1315)
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
