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

## Schema Entities

### IP Assets
- `IPAsset` - Registered intellectual property assets
- `License` - Granted licenses
- `IPUsageEvent` - IP usage tracking

### ADLV
- `LiquidityVault` - Vault statistics
- `Loan` - Loan details and status
- `Deposit` - Liquidity deposits

### IDO
- `IDOPool` - Token sale pools
- `IDOParticipation` - User participations

### Bridge
- `BridgeTransaction` - Cross-chain transfers

### World ID
- `WorldIDVerification` - Identity verifications

### Statistics
- `GlobalStats` - Protocol-wide statistics

## Querying

Once deployed, you can query the subgraph using GraphQL:

```graphql
{
  ipAssets(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    name
    creator
    timestamp
    licenses {
      licensee
      fee
    }
  }
  
  loans(where: { status: Active }) {
    borrower
    loanAmount
    interestRate
    endTime
  }
  
  idoPools(where: { isActive: true }) {
    tokenSymbol
    raised
    participantCount
  }
}
```

## ABI Files

Place your contract ABI files in the `abis/` directory:
- `abis/IPAssetRegistry.json`
- `abis/LiquidityVault.json`
- `abis/IDOContract.json`
- `abis/BridgeContract.json`
- `abis/WorldIDVerifier.json`

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

