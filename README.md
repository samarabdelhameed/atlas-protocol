# Atlas Protocol

**IP-Backed Lending & GenAI Licensing Protocol**

Atlas Protocol enables creators to monetize their IP assets through collateralized lending (IPFi) and GenAI licensing, powered by dynamic CVS (Collateral Value Score) calculations.

---

## 📋 Project Proposal: Atlas - The IP Data Oracle & Licensing Engine

### Executive Summary

**Project Name:** Atlas - IP Data Oracle & Licensing Engine  

**Buildathon Tracks:** IPFi, Data, GenAI IP Registration, World ID (Primary focus tracks)  

**Sponsor Integration:** Goldsky, abv.dev, Owlto Finance, World ID, Tenderly  

**Core Innovation:** Transforming IP usage data streams into a dynamic, collateralizable, and licensable financial asset on Story Protocol.

---

### 1. The Problem Statement

The AI-driven economy requires massive amounts of rights-cleared, verifiable data for training models. Simultaneously, IP creators suffer from illiquidity and untapped revenue sources. This leads to two critical inefficiencies in the programmable IP ecosystem on Story Protocol:

1. **Untapped Data Value:** Creators generate a high volume of valuable usage and provenance data (remix counts, detection metrics, licensing frequency). This data is currently dormant and not monetized as a financial asset class.

2. **Static Liquidity Constraint:** On-chain IP valuation is static. Creators cannot leverage the dynamic, real-time utility and provenance data of their IP as flexible, verifiable collateral for obtaining immediate DeFi liquidity.

---

### 2. The Solution: Atlas - A Data-Financial Infrastructure

Atlas is a novel, multi-component infrastructure that transforms the IP's usage metadata into a continuous, monetizable yield source and a dynamic collateral asset. Atlas introduces two core components:

#### A. The IP Data Oracle (IDO)

A decentralized, structured data layer designed to aggregate, verify, and output real-time, tamper-proof usage metrics and provenance data related to a specific IP Asset ID on Story Protocol.

#### B. The Automated Data Licensing Vault (ADLV)

A set of specialized ERC-4626 compatible smart contracts responsible for executing autonomous licensing transactions and managing revenue splitting, collateralization, and cross-chain fund movement.

---

### 3. Core Use Cases & Value Proposition

| **Use Case**                      | **Technical Description & Mechanism**                                                                                                   | **Integrated Tracks**             |
|-----------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------|
| **Data Licensing Yield**          | AI training organizations pay a subscription or API fee to the ADLV for access to the verified, structured IDO Data Stream.            | GenAI IP Registration, Data       |
| **Data-Backed DeFi Loans**       | The Collateral Value Score (CVS)—a dynamically weighted score calculated by the IDO—is used as the primary collateral metric.          | IPFi, Cross-Chain                 |
| **Enforcement & Dynamic Valuation**| Data gathered from external sources (like the Yakoa API for high-originality content detection) is fed into the IDO to automatically adjust the IP's CVS. | IP Detection & Enforcement       |
| **Human-Verified Provenance**     | World ID integration mandates creator verification during the $IDOVaultCreation$ process, ensuring the licensed data stream is legitimate. | World ID Challenge                 |

---

### 4. Technical Architecture

```plaintext
┌───────────────────────────────────────────────────┐
│               Atlas Technical Architecture         │
├───────────────────────────────────────────────────┤
│         IP Asset Layer (Story Protocol)           │
│   ┌─────────────────────────────────────────────┐ │
│   │ IP Asset ID (Tokenized Asset) | Royalty Struct.│
│   └─────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
                          ↓
┌───────────────────────────────────────────────────┐
│        Data Acquisition & Verification             │
│     ┌───────────────────────────────────────────┐  │
│     │         IP Data Oracle (IDO) Layer       │  │
│     │ 1. Goldsky Indexer (On-chain usage data) │  │
│     │ 2. Yakoa API Adapter (Off-chain data)    │  │
│     │ 3. World ID Verification Filter           │  │
│     └───────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
                          ↓
┌───────────────────────────────────────────────────┐
│                 Valuation Engine                  │
│     ┌───────────────────────────────────────────┐  │
│     │  Collateral Value Score (CVS) Engine     │  │
│     │ Weighted Calculation: (Usage Data) +      │  │
│     │ (Enforcement Data) / (Risk Factor)        │  │
│     └───────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
                          ↓
┌───────────────────────────────────────────────────┐
│   Monetization & Settlement Layer (Atlas Smart)   │
│     ┌───────────────────────────────────────────┐  │
│     │ Automated Data Licensing Vault (ADLV)    │  │
│     │ 1. Revenue Splitting Logic                │  │
│     │ 2. Licensing Agent (abv.dev)              │  │
│     │ 3. Collateral Management                   │  │
│     └───────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
                          ↓
┌───────────────────────────────────────────────────┐
│            Liquidity & Cross-Chain Execution      │
│     ┌───────────────────────────────────────────┐  │
│     │       Liquidity Module                   │  │
│     │ 1. DeFi Protocol Integration              │  │
│     │ 2. Owlto Finance Bridge API              │  │
│     └───────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
```

---

### 5. Implementation Strategy & Tools

| **Component**                | **Tool / Technology**                | **Implementation Steps**                          |
|------------------------------|--------------------------------------|--------------------------------------------------|
| **On-Chain Data Indexing**   | Goldsky Realtime Data Platform       | Set up a Goldsky subgraph to index events from Story Protocol. |
| **AI Licensing Agent**       | abv.dev Platform                     | Develop a GenAI Agent using abv.dev's integration to automate licensing. |
| **Cross-Chain Liquidity**    | Owlto Finance Bridge API            | Integrate the Owlto API to enable instant, low-cost bridging of loans. |
| **Verification & Security**   | World ID SDK                        | Integrate World ID SDK for creator verification. |
| **Development Workflow**      | Tenderly                            | Use Tenderly for testing and simulating loan logic. |

---

### 6. Conclusion: Atlas as a Surreal World Asset

Atlas is not merely an application; it is a foundational financial layer that recognizes IP usage data as a Surreal World Asset. By leveraging the modularity of Story Protocol and integrating deep technical capabilities from leading Web3 sponsors, Atlas provides a net-new, perpetual revenue stream and immediate liquidity, solving the twin problems of dormant data value and capital illiquidity for IP creators in the AI economy.

---

### Additional Considerations

**Revenue Splitting Mechanism:**  

To ensure fair revenue distribution, when an AI Trainer purchases a license for aggregated data, the ADLV calculates the contribution of each IP Asset ID, ensuring that creators are compensated based on their data's contribution to the licensed dataset.

This proposal positions "Atlas" as an innovative solution that directly addresses the challenges faced by IP creators in the evolving AI landscape, ensuring that their contributions are recognized and monetized effectively.

---

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
│   │   ├── IDO.sol              # IP Data Oracle
│   │   └── ADLVWithStory.sol    # ADLV with Story Protocol integration
│   ├── test/                    # Foundry tests
│   ├── script/                  # Deployment scripts
│   ├── FRONTEND_CONTRACTS_INFO.md  # Integration guide
│   ├── VERIFICATION_GUIDE.md       # Verification instructions
│   └── LIVE_DATA_SUMMARY.md        # Real-time data
│
├── apps/
│   ├── agent-service/           # Backend service
│   │   ├── services/
│   │   │   ├── storyProtocol.ts    # Story Protocol SDK service
│   │   │   ├── loan-manager.ts     # Loan operations
│   │   │   ├── licensing-agent.ts  # GenAI licensing
│   │   │   └── cvs-engine.ts       # CVS calculation
│   │   ├── examples/
│   │   │   ├── storyProtocolExample.ts  # SDK examples
│   │   │   └── integrateWithADLV.ts     # Integration examples
│   │   └── README.md
│   │
│   └── frontend/                # React frontend
│       ├── src/
│       │   ├── services/
│       │   │   └── storyProtocol.ts    # Story Protocol SDK service
│       │   └── hooks/
│       │       └── useStoryProtocol.ts # React hooks for SDK
│       └── README.md
│
├── subgraph/                    # The Graph subgraph (Goldsky)
│   ├── schema.graphql           # GraphQL schema
│   ├── src/mapping.ts           # Event handlers
│   ├── DEPLOYMENT_GUIDE.md      # Deployment guide
│   └── README.md
│
├── STORY_PROTOCOL_SDK_GUIDE.md  # Story Protocol SDK guide
├── INTEGRATION_STATUS.md        # Complete integration status
└── DEPLOYMENT_GUIDE.md          # Complete deployment guide
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

### Smart Contracts
- **[Frontend Integration Guide](./contracts/FRONTEND_CONTRACTS_INFO.md)** - Complete integration guide
- **[Verification Guide](./contracts/VERIFICATION_GUIDE.md)** - Contract verification instructions
- **[Live Data Summary](./contracts/LIVE_DATA_SUMMARY.md)** - Real-time on-chain data
- **[How to Verify](./contracts/HOW_TO_VERIFY.md)** - RPC-based verification

### Story Protocol SDK
- **[Complete Integration Guide](./STORY_PROTOCOL_INTEGRATION_GUIDE.md)** - 🎯 Complete Story Protocol integration guide (NEW)
- **[Implementation Checklist](./IMPLEMENTATION_CHECKLIST.md)** - Detailed implementation checklist (NEW)
- **[Integration Status](./README_STORY_PROTOCOL_INTEGRATION.md)** - Quick status overview (NEW)
- **[SDK Guide](./STORY_PROTOCOL_SDK_GUIDE.md)** - Complete SDK integration guide
- **[Installation Summary](./STORY_SDK_INSTALLATION_SUMMARY.md)** - SDK installation summary
- **[Examples](./apps/agent-service/examples/)** - SDK usage examples

### Subgraph
- **[Subgraph README](./subgraph/README.md)** - Subgraph overview
- **[Deployment Guide](./subgraph/DEPLOYMENT_GUIDE.md)** - Goldsky deployment guide
- **[CVS Calculation](./subgraph/CVS_CALCULATION.md)** - CVS calculation logic

### General
- **[Integration Status](./INTEGRATION_STATUS.md)** - Complete integration status
- **[Hackathon Submission](./contracts/HACKATHON_SUBMISSION.md)** - Hackathon summary
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Complete deployment instructions

## 🔗 Quick Links

### Deployed & Verified Contracts ✅ (v5.0 - CVS Oracle Integrated)
- **IDO Contract:** [`0xFb1EC26171848c330356ff1C9e2a1228066Da324`](https://aeneid.storyscan.io/address/0xFb1EC26171848c330356ff1C9e2a1228066Da324) ✅ Fresh Deployment
- **ADLV Contract:** [`0x9c7cCfB831Ed4D521599a3B97df0174C91bB2AAC`](https://aeneid.storyscan.io/address/0x9c7cCfB831Ed4D521599a3B97df0174C91bB2AAC) ✅ Fresh Deployment
- **CVS Oracle:** [`0x4a875fD309C95DBFBcA6dFC3575517Ea7d5F6eC7`](https://aeneid.storyscan.io/address/0x4a875fD309C95DBFBcA6dFC3575517Ea7d5F6eC7) ✅ NEW!
- **Lending Module:** [`0x3154484F0CdBa14F2A2A3Ba8D2125a5c088a5E4f`](https://aeneid.storyscan.io/address/0x3154484F0CdBa14F2A2A3Ba8D2125a5c088a5E4f)
- **Loan NFT:** [`0x69D6C3E0D2BAE75Cbad6de75e8a367C607Ae8bC1`](https://aeneid.storyscan.io/address/0x69D6C3E0D2BAE75Cbad6de75e8a367C607Ae8bC1)

### Deployment Block
- **Block:** 11797578 (2025-12-03)

### Network & Explorer
- **Network:** Story Aeneid Testnet
- **Chain ID:** 1315
- **RPC URL:** https://rpc-storyevm-testnet.aldebaranode.xyz
- **Explorer:** https://aeneid.storyscan.io
- **Faucet:** https://faucet.story.foundation

### Subgraph
- **Status:** ⚠️ Ready for deployment (see [Subgraph section](#-subgraph-goldsky))
- **Deployment Guide:** [subgraph/DEPLOYMENT_GUIDE.md](./subgraph/DEPLOYMENT_GUIDE.md)

## 🌐 Network Configuration

### Story Protocol Testnet
- **RPC URL:** https://rpc-storyevm-testnet.aldebaranode.xyz
- **Explorer:** https://testnet.storyscan.xyz
- **Chain ID:** 1315

## 📍 Deployed Contracts

### ✅ Verified Contracts on Story Aeneid Testnet

#### IDO Contract (IP Data Oracle) - v5.0
- **Address:** [`0xFb1EC26171848c330356ff1C9e2a1228066Da324`](https://aeneid.storyscan.io/address/0xFb1EC26171848c330356ff1C9e2a1228066Da324)
- **Status:** ✅ **Deployed** (v5.0 - CVS Oracle Integrated)
- **Compiler:** v0.8.30+commit.737f2a01
- **Owner:** ADLV Contract (0x9c7cCfB831Ed4D521599a3B97df0174C91bB2AAC)
- **CVS Oracle:** 0x4a875fD309C95DBFBcA6dFC3575517Ea7d5F6eC7 (Integrated)
- **Function:** Manages CVS scores and license revenue tracking with oracle integration
- **Features:**
  - ✅ Real-time CVS updates from Story Protocol
  - ✅ Oracle-based collateral scoring
  - ✅ Read/Write contract functions available

#### ADLV Contract (Automated Data Licensing Vault) - v5.0
- **Address:** [`0x9c7cCfB831Ed4D521599a3B97df0174C91bB2AAC`](https://aeneid.storyscan.io/address/0x9c7cCfB831Ed4D521599a3B97df0174C91bB2AAC)
- **Status:** ✅ **Deployed** (v5.0 - CVS Oracle Integrated)
- **Compiler:** v0.8.30+commit.737f2a01
- **IDO Reference:** IDO Contract (0xFb1EC26171848c330356ff1C9e2a1228066Da324)
- **Function:** Manages vaults, loans, and revenue distribution with Story Protocol integration
- **Features:**
  - ✅ Contract source code verified
  - ✅ Read/Write contract functions available
  - ✅ Story Protocol SPG integration
  - ✅ IP Asset Registry integration

### Live Statistics
- **Total Vaults:** 4
- **Total Liquidity:** 2.75+ IP
- **Licenses Sold:** 2
- **Total Transactions:** 9+
- **CVS Values:** 4 IPs (1M, 500K, 800K, 600K)

### Deployment Information
- **Network:** Story Aeneid Testnet
- **Chain ID:** 1315
- **Deployer:** `0xdAFEE25F98Ff62504C1086eAcbb406190F3110D5`
- **RPC URL:** https://rpc-storyevm-testnet.aldebaranode.xyz
- **Explorer:** https://aeneid.storyscan.io
- **Status:** ✅ **Deployed, Verified & Operational**
- **Verification:**
  - ✅ IDO Owner = ADLV Contract
  - ✅ ADLV IDO Reference = IDO Contract
  - ✅ Both contracts verified on Explorer
  - ✅ Source code publicly available
  - ✅ All functions accessible via Explorer UI

## 📊 Subgraph (Goldsky)

### Status
- **Network:** Story Protocol Testnet (story-testnet)
- **Status:** ⚠️ Ready for deployment (not deployed yet)
- **Configuration:** ✅ Updated with correct contract addresses

### Contract Addresses in Subgraph
- **IDO Contract:** `0x21aD95c76B71f0adCdD37fB2217Dc9d554437e6F`
- **ADLV Contract:** `0xdd0fF1a826FCAC7e3EBAE6E978A4BB043D27eC13`

### Deployment Steps

1. **Install Goldsky CLI:**
   ```bash
   npm install -g @goldskycom/cli
   ```

2. **Create Goldsky Account:**
   - Go to [Goldsky](https://goldsky.com)
   - Create project and get `GOLDSKY_API_KEY` and `GOLDSKY_PROJECT_ID`

3. **Setup Environment:**
   ```bash
   cd subgraph
   # Create .env file with:
   # GOLDSKY_API_KEY=your_api_key
   # GOLDSKY_PROJECT_ID=your_project_id
   ```

4. **Build and Deploy:**
   ```bash
   npm run codegen
   npm run build
   ./deploy-goldsky.sh
   ```

5. **Update SUBGRAPH_URL:**
   After deployment, update:
   - `apps/agent-service/.env`: `SUBGRAPH_URL=https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1`
   - `apps/frontend/.env`: `VITE_SUBGRAPH_URL=https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1`

**Note:** Subgraph endpoint will be available after deployment from Goldsky dashboard.

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
- `ADLV_ADDRESS` - Deployed ADLV contract address (`0xdd0fF1a826FCAC7e3EBAE6E978A4BB043D27eC13`)
- `IDO_ADDRESS` - Deployed IDO contract address (`0x21aD95c76B71f0adCdD37fB2217Dc9d554437e6F`)
- `RPC_URL` - RPC endpoint (https://rpc-storyevm-testnet.aldebaranode.xyz)
- `CHAIN_ID` - Chain ID (1315)
- `PRIVATE_KEY` - For signing transactions

**Subgraph:**
- `GOLDSKY_API_KEY` - Goldsky API key (for deployment)
- `GOLDSKY_PROJECT_ID` - Goldsky project ID (for deployment)
- `SUBGRAPH_URL` - GraphQL endpoint (after deployment)

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

- [ ] Subgraph deployment on Goldsky
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

## 📖 Complete Documentation

### Smart Contracts
- **[contracts/README.md](./contracts/README.md)** - Complete contracts documentation with step-by-step deployment and testing
- **[contracts/DEPLOYED_CONTRACTS.md](./contracts/DEPLOYED_CONTRACTS.md)** - Organized list of all deployed contracts (Story Protocol style)
- **[contracts/FRONTEND_CONTRACTS_INFO.md](./contracts/FRONTEND_CONTRACTS_INFO.md)** - Frontend integration guide with ABIs and examples
- **[contracts/VIEW_REAL_DATA.md](./contracts/VIEW_REAL_DATA.md)** - How to verify real data on-chain using cast commands

### Frontend Integration
- **[FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md)** - Complete frontend integration guide
- **[FRONTEND_QUICK_REFERENCE.md](./FRONTEND_QUICK_REFERENCE.md)** - Quick reference for frontend developers



---

## ✅ Project Status

### Completed ✅
- ✅ Smart contracts deployed on Story Aeneid Testnet
- ✅ Both contracts verified on Explorer (source code public)
- ✅ 4 test vaults created with real data
- ✅ 9+ transactions confirmed on-chain
- ✅ CVS values set (1M, 500K, 800K, 600K IP)
- ✅ 2 licenses sold with real revenue
- ✅ Complete documentation
- ✅ Frontend integration guides
- ✅ Backend service ready
- ✅ **Story Protocol Integration: 78% Complete** - See [Integration Status](./README_STORY_PROTOCOL_INTEGRATION.md)
  - ✅ IP Registration & IPAccount Logic (100%)
  - ✅ Royalty Module (100%)
  - ✅ Access Controller (100%)
  - ✅ SDK/API Wrapper (100%)
  - ⚠️ Module Registry (70% - Interface ready)
  - ⚠️ PIL Policy Integration (80%)
  - ❌ UI IP Graph Visualization (0%)

### Ready for Use 🚀
- 🚀 Contracts are live and operational
- 🚀 All functions tested and working
- 🚀 Explorer shows all data correctly
- 🚀 Ready for frontend/backend integration
- 🚀 Ready for production deployment

---

## 🤝 Contributing

This is a private project. For questions or issues, please contact the maintainers.

---

**Built with ❤️ for the Atlas Protocol team**

**Last Updated:** November 21, 2024  
**Version:** 1.0.0  
**Status:** ✅ Production Ready (Testnet)  
**Network:** Story Aeneid Testnet (Chain ID: 1315)
