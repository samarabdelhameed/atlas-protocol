# Atlas Protocol Subgraph

Goldsky/The Graph indexer for Atlas Protocol that indexes on-chain events and provides GraphQL API for querying protocol data.

## Overview

This subgraph indexes data from Atlas Protocol smart contracts including:
- **IP Asset Registry** - IP assets, licenses, and usage events
- **ADLV (Liquidity Vault)** - Loans, deposits, and vault statistics
- **IDO Contracts** - Token pools and participations
- **Bridge Contracts** - Cross-chain transactions
- **World ID Verifier** - Identity verifications

## Setup

### Prerequisites

- Node.js >= 18
- The Graph CLI

```bash
npm install -g @graphprotocol/graph-cli
```

### Installation

```bash
# Install dependencies
npm install

# Or with bun
bun install
```

## Configuration

Before deploying, update the following in `subgraph.yaml`:

1. **Network** - Change `mainnet` to your target network (e.g., `story-testnet`)
2. **Contract Addresses** - Replace placeholder addresses with actual deployed contract addresses
3. **Start Blocks** - Set the block numbers where contracts were deployed

## Development

### Generate Types

```bash
npm run codegen
```

This generates TypeScript types from the GraphQL schema and ABIs.

### Build Subgraph

```bash
npm run build
```

### Deploy to Goldsky

```bash
# First time setup
goldsky login

# Deploy
npm run deploy
```

Or use The Graph Studio:

```bash
graph auth --studio <DEPLOY_KEY>
npm run deploy
```

## Core Entities for CVS (Collateral Value Score)

### 🎯 Primary Entities

#### 1. IPAssetUsage
**Purpose:** تتبع كل عملية استخدام أو ترخيص أو Remix للـ IP

Tracks every usage, license, or remix event of an IP asset. Each event contributes to the CVS calculation.

**Key Fields:**
- `usageType`: license, remix, commercial, derivative
- `revenueGenerated`: Revenue from this usage
- `cvsImpact`: How much this event increased CVS

#### 2. IDOVault  
**Purpose:** تتبع حالات خزائن ADLV مع CVS الحالية

Tracks ADLV vault state including CVS metrics that determine lending terms.

**Key Fields:**
- `currentCVS`: Real-time CVS score
- `maxLoanAmount`: Maximum loan based on CVS (CVS × 0.5)
- `interestRate`: Dynamic rate based on CVS (20% - CVS/100)
- `totalLicenseRevenue`: Revenue from all license sales

#### 3. DataLicenseSale
**Purpose:** تتبع كل عملية بيع لترخيص بيانات عبر ADLV

Tracks every data license sale through ADLV, which significantly impacts CVS.

**Key Fields:**
- `salePrice`: License sale price
- `licenseType`: exclusive, commercial, derivative
- `cvsIncrement`: CVS increase from this sale (2-10% of price)
- `creatorShare`, `vaultShare`, `protocolFee`: Revenue distribution

### 📊 Supporting Entities

- `IPAsset` - IP assets with CVS metrics
- `Loan` - Loans issued based on CVS
- `LoanPayment` - Loan repayment tracking
- `Deposit` - Vault liquidity deposits
- `GlobalStats` - Protocol-wide statistics

See [CVS_CALCULATION.md](./CVS_CALCULATION.md) for detailed CVS calculation logic.

## Querying

Once deployed, you can query the subgraph using GraphQL:

### Query CVS Metrics for an IP Asset
```graphql
{
  ipAsset(id: "0x123...") {
    name
    creator
    cvsScore
    totalUsageCount
    totalLicenseRevenue
    totalRemixes
    
    usageEvents(first: 10) {
      usageType
      revenueGenerated
      cvsImpact
    }
    
    vault {
      currentCVS
      maxLoanAmount
      interestRate
    }
  }
}
```

### Query Vault with Lending Terms
```graphql
{
  idoVault(id: "0xabc...") {
    currentCVS
    maxLoanAmount
    interestRate
    collateralRatio
    totalLicenseRevenue
    activeLoansCount
    
    ipAsset {
      name
      totalUsageCount
    }
    
    loans(where: { status: Active }) {
      borrower
      loanAmount
      cvsAtIssuance
      outstandingAmount
    }
    
    licenseSales(first: 5) {
      salePrice
      licenseType
      cvsIncrement
    }
  }
}
```

### Query High-Impact License Sales
```graphql
{
  dataLicenseSales(
    first: 10
    orderBy: cvsIncrement
    orderDirection: desc
  ) {
    salePrice
    licenseType
    cvsIncrement
    ipAsset {
      name
      creator
    }
    vault {
      currentCVS
      maxLoanAmount
    }
  }
}
```

## ABI Files

Place your contract ABI files in the `abis/` directory:
- `abis/StoryProtocol.json` - Story Protocol IP Registry
- `abis/AtlasADLV.json` - Atlas ADLV Contract
- `abis/IDOContract.json` - IDO Token Sale Contract (optional)
- `abis/BridgeContract.json` - Cross-chain Bridge (optional)
- `abis/WorldIDVerifier.json` - World ID Verification (optional)

**Required Events in ABIs:**

**StoryProtocol.json:**
```solidity
event IPRegistered(bytes32 indexed ipId, address indexed creator, string name, string description, string ipHash);
event IPUsed(bytes32 indexed ipId, address indexed user, string usageType, uint256 revenue);
event IPRemixed(bytes32 indexed originalIPId, bytes32 indexed newIPId, address indexed remixer);
```

**AtlasADLV.json:**
```solidity
event VaultCreated(address indexed vaultAddress, bytes32 indexed ipId, uint256 initialCVS);
event LicenseSold(address indexed vaultAddress, bytes32 indexed ipId, address indexed licensee, uint256 price, string licenseType);
event LoanIssued(address indexed vaultAddress, address indexed borrower, uint256 loanId, uint256 amount, uint256 collateral, uint256 duration);
event CVSUpdated(address indexed vaultAddress, uint256 oldCVS, uint256 newCVS);
event LoanRepaid(address indexed vaultAddress, address indexed borrower, uint256 loanId, uint256 amount);
event LoanDefaulted(address indexed vaultAddress, address indexed borrower, uint256 loanId);
event Deposited(address indexed vaultAddress, address indexed depositor, uint256 amount, uint256 shares);
event Withdrawn(address indexed vaultAddress, address indexed withdrawer, uint256 amount, uint256 shares);
```

## Goldsky Integration

To deploy on Goldsky:

1. Create account at [goldsky.com](https://goldsky.com)
2. Install Goldsky CLI
3. Deploy subgraph:

```bash
goldsky subgraph deploy atlas-protocol/v1.0.0 --path .
```

## Local Development

To test locally with a Graph Node:

```bash
# Start Graph Node
docker-compose up

# Create and deploy
npm run create-local
npm run deploy-local
```

## Resources

- [The Graph Docs](https://thegraph.com/docs)
- [Goldsky Docs](https://docs.goldsky.com)
- [AssemblyScript API](https://thegraph.com/docs/en/developing/assemblyscript-api/)

