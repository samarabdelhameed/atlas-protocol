# Atlas Protocol Agent Service

Backend service for Atlas Protocol that handles CVS monitoring, loan management, licensing, and cross-chain operations.

## Features

- ✅ **CVS Engine**: Real-time Collateral Value Score calculation and monitoring
- ✅ **Loan Manager**: Issue, repay, and liquidate loans with Owlto Finance cross-chain support
- ✅ **Licensing Agent**: Sell licenses for IP assets via abv.dev
- ✅ **Contract Monitor**: Real-time event monitoring from ADLV and IDO contracts
- ✅ **Subgraph Integration**: Query Goldsky subgraph for protocol data
- ✅ **Goldsky Client**: Fetch real-time data from deployed subgraph

## Setup

### 1. Install Dependencies

```bash
bun install
```

### 2. Environment Variables

Create a `.env` file:

```bash
# RPC Configuration
RPC_URL=https://mainnet.base.org
CHAIN_ID=8453
CHAIN_NAME=Base

# Contract Addresses (after deployment)
ADLV_ADDRESS=0x...
IDO_ADDRESS=0x...

# Private Key (for signing transactions)
PRIVATE_KEY=0x...

# Owlto Finance (for cross-chain loans)
OWLTO_API_KEY=your_owlto_api_key
OWLTO_BRIDGE_URL=https://api.owlto.finance/api/v2/bridge
OWLTO_SLIPPAGE=0.5
OWLTO_REFERRAL_CODE=your_referral_code

# ABV.dev (for GenAI licensing)
ABV_API_KEY=your_abv_api_key

# Story Protocol
STORY_PROTOCOL_API_KEY=your_story_api_key
STORY_PROTOCOL_RPC=your_story_rpc_url

# Goldsky Subgraph (after deployment)
SUBGRAPH_URL=https://api.goldsky.com/api/public/project_xxxxx/subgraphs/atlas-protocol/1.0.0/gn

# World ID
WORLD_ID_APP_ID=your_world_id_app_id
WORLD_ID_ACTION=atlas-verification

# Loan Token (USDC on Base)
LOAN_TOKEN_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### 3. Deploy Contracts

```bash
cd ../../contracts
forge script script/Deploy.s.sol:DeployScript --rpc-url $RPC_URL --broadcast
```

Update `.env` with deployed contract addresses.

## Usage

### Start the Service

```bash
bun run dev
```

The service will:
1. Initialize all contract integrations
2. Start CVS monitoring
3. Start loan event monitoring (with Owlto Finance integration)
4. Start contract event monitoring
5. Display protocol statistics

### Services

#### Loan Manager

Handles loan operations with automatic cross-chain transfers via Owlto Finance.

```typescript
import { LoanManager } from './src/services/loan-manager.js';

const loanManager = new LoanManager(ADLV_ADDRESS, IDO_ADDRESS, RPC_URL);

// Start monitoring (automatically handles cross-chain transfers)
loanManager.startMonitoring();

// Check eligibility
const eligibility = await loanManager.checkLoanEligibility(vaultAddress, loanAmount);

// Issue loan
const loan = await loanManager.issueLoan({
  vaultAddress,
  loanAmount: BigInt('1000000000000000000'), // 1 ETH
  duration: 30 * 24 * 60 * 60, // 30 days
});

// Repay loan
await loanManager.repayLoan(loanId);

// Liquidate loan
await loanManager.liquidateLoan(loanId);
```

**Owlto Finance Integration**: When a `LoanIssued` event is detected, the service automatically bridges funds to the borrower's target chain.

#### Licensing Agent

Handles IP asset licensing via abv.dev.

```typescript
import { LicensingAgent } from './src/services/licensing-agent.js';

const licensingAgent = new LicensingAgent(ADLV_ADDRESS, IDO_ADDRESS, CHAIN_ID);

// Sell a license
const result = await licensingAgent.sellLicense({
  vaultAddress,
  licenseType: 'commercial',
  price: BigInt('1000000000000000000'), // 1 ETH
  duration: 365 * 24 * 60 * 60, // 1 year
});

// Update CVS after license sale
await licensingAgent.updateCVSAfterLicenseSale(ipId, salePrice, licenseType);
```

#### Contract Monitor

Monitors contract events in real-time.

```typescript
import { ContractMonitor } from './src/services/contract-monitor.js';

const monitor = new ContractMonitor(ADLV_ADDRESS, IDO_ADDRESS);

// Start monitoring
monitor.startMonitoring();

// Get recent events
const events = await monitor.getRecentEvents(1000);
```

**Monitored Events**:
- `VaultCreated` - New vaults
- `LicenseSold` - License sales
- `LoanIssued` - New loans
- `LoanRepaid` - Loan repayments
- `LoanLiquidated` - Loan liquidations
- `CVSUpdated` - CVS updates
- `RevenueCollected` - Revenue events

#### Goldsky Client

Fetches real-time data from the Goldsky subgraph.

```typescript
import {
  fetchLatestIPAssets,
  fetchLatestLicenseSales,
  testGoldskyConnection,
} from './src/clients/goldskyClient.js';

// Test connection
await testGoldskyConnection();

// Fetch latest IP Assets
const ipAssets = await fetchLatestIPAssets();
console.log('IP Assets:', ipAssets);

// Fetch latest License Sales
const licenseSales = await fetchLatestLicenseSales();
console.log('License Sales:', licenseSales);
```

**Available Functions**:
- `fetchLatestIPAssets()` - Get latest 5 IP Assets
- `fetchLatestLicenseSales()` - Get latest 5 License Sales (minted licenses)
- `testGoldskyConnection()` - Test subgraph connection

**Testing**:
```bash
bun run test-goldsky.ts
```

This will:
1. Test connection to Goldsky subgraph
2. Fetch latest IP Assets
3. Fetch latest License Sales
4. Display formatted results

**Example Output**:
```
✅ Connection successful!
📊 Current block: 11429754
✅ Found 2 License Sales:

1. License Sale #0xb771193656043536ad...
   Licensee: 0xdafee25f98ff62504c1086eacbb406190f3110d5
   License Type: commercial
   Sale Price: 1.0000 ETH
   CVS Increment: 0.0500 ETH
   Creator Share: 0.7000 ETH (70%)
   Vault Share: 0.2500 ETH (25%)
   Protocol Fee: 0.0500 ETH (5%)
```

#### CVS Engine

Calculates and monitors Collateral Value Scores.

```typescript
import { cvsEngine } from './src/services/cvs-engine.js';

// Calculate CVS for an IP asset
const cvs = await cvsEngine.calculateCVS(ipAssetId);

// Check loan eligibility
const eligibility = await cvsEngine.checkLoanEligibility(vaultAddress, loanAmount);

// Monitor loans
cvsEngine.startMonitoring((result) => {
  console.log('At risk:', result.atRisk);
  console.log('Liquidatable:', result.liquidatable);
});

// Get vault stats
const stats = await cvsEngine.getVaultStats(vaultAddress);
```

## Architecture

### Loan Flow with Owlto Finance

```
1. User requests loan via Frontend
   ↓
2. Frontend calls ADLV.issueLoan()
   ↓
3. ADLV emits LoanIssued event
   ↓
4. LoanManager.handleLoanIssuedEvent() catches event
   ↓
5. LoanManager.executeCrossChainTransfer() calls Owlto API
   ↓
6. Owlto bridges funds to borrower's wallet
   ↓
7. Borrower receives funds on target chain
```

### License Sale Flow

```
1. User purchases license via Frontend
   ↓
2. Frontend calls ADLV.sellLicense()
   ↓
3. ADLV distributes revenue (protocol, creator, vault)
   ↓
4. ADLV records revenue in IDO
   ↓
5. LicensingAgent updates CVS based on license type
   ↓
6. CVS Engine recalculates scores
```

## CVS Calculation

CVS increments by license type:
- **Exclusive**: 10% of sale price
- **Commercial**: 5% of sale price
- **Derivative**: 4% of sale price
- **Standard**: 2% of sale price

## Error Handling

All services include comprehensive error handling:

```typescript
try {
  const loan = await loanManager.issueLoan(request);
} catch (error) {
  if (error.message.includes('Insufficient CVS')) {
    // Handle CVS requirement
  } else if (error.message.includes('Insufficient liquidity')) {
    // Handle liquidity issue
  }
}
```

## Goldsky Subgraph Integration

### Step 1: Deploy Subgraph to Goldsky

1. **Install Goldsky CLI**:
   ```bash
   npm install -g @goldskycom/cli
   ```

2. **Login to Goldsky**:
   ```bash
   goldsky login
   ```

3. **Deploy Subgraph**:
   ```bash
   cd ../../subgraph
   ./deploy-goldsky.sh
   ```

4. **Get Endpoint**:
   After deployment, get the GraphQL endpoint from Goldsky dashboard:
   ```
   https://api.goldsky.com/api/public/project_xxxxx/subgraphs/atlas-protocol/1.0.0/gn
   ```

5. **Update Environment**:
   Add to `apps/agent-service/.env`:
   ```env
   SUBGRAPH_URL=https://api.goldsky.com/api/public/project_xxxxx/subgraphs/atlas-protocol/1.0.0/gn
   ```

### Step 2: Test Goldsky Client

```bash
cd apps/agent-service
bun run test-goldsky.ts
```

**Expected Output**:
- ✅ Connection successful
- ✅ Latest IP Assets (if available)
- ✅ Latest License Sales with real data

### Step 3: Verify Data

The subgraph indexes:
- **Vaults** (`idovaults`) - ADLV vaults with CVS metrics
- **License Sales** (`dataLicenseSales`) - All license sales with revenue distribution
- **Loans** (`loans`) - Active and completed loans
- **Deposits** (`deposits`) - Vault liquidity deposits

**Query Examples**:
```graphql
# Get latest license sales
{
  dataLicenseSales(
    first: 5
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    salePrice
    licenseType
    cvsIncrement
    creatorShare
    vaultShare
    protocolFee
    timestamp
  }
}

# Get vaults
{
  idovaults(
    first: 5
    orderBy: createdAt
    orderDirection: desc
  ) {
    id
    vaultAddress
    currentCVS
    totalLicenseRevenue
    totalLoansIssued
  }
}
```

### Current Status

✅ **Subgraph Deployed**: `atlas-protocol/1.0.0`
- **Endpoint**: `https://api.goldsky.com/api/public/project_cmi7kxx96f83a01ywgmfpdfs6/subgraphs/atlas-protocol/1.0.0/gn`
- **Status**: Healthy (Active)
- **Synced**: 100%
- **Network**: Story Aeneid Testnet
- **Blocks Indexed**: 11122611 → 11429754+

✅ **Data Retrieved**:
- Latest License Sales: 2 sales found
  - Sale 1: 1.0 ETH (Commercial) - CVS Increment: 0.05 ETH
  - Sale 2: 0.3 ETH (Commercial) - CVS Increment: 0.015 ETH

## Testing

### Test Goldsky Client

```bash
bun run test-goldsky.ts
```

### Test Loan Issuance

1. Ensure contracts are deployed
2. Set contract addresses in `.env`
3. Set `PRIVATE_KEY` for signing
4. Start service: `bun run dev`
5. Issue a test loan from frontend
6. Verify cross-chain transfer via Owlto

### Test License Sale

1. Ensure contracts are deployed
2. Set `ABV_API_KEY` if using abv.dev
3. Start service: `bun run dev`
4. Sell a license from frontend
5. Verify CVS update

## Troubleshooting

### Loan Transfer Not Initiated

- Check `OWLTO_API_KEY` is set
- Verify contract addresses are correct
- Check RPC URL is accessible
- Review event logs for errors

### CVS Not Updating

- Verify IDO contract ownership
- Check event logs
- Verify subgraph is syncing
- Review CVS calculation logic

### Service Not Starting

- Check all required env variables
- Verify contract addresses are valid
- Check RPC connection
- Review error logs

## Development

### Project Structure

```
apps/agent-service/
├── src/
│   ├── clients/
│   │   └── goldskyClient.ts # Goldsky subgraph client
│   ├── config/
│   │   └── index.ts          # Configuration
│   └── services/
│       ├── cvs-engine.ts     # CVS calculation
│       ├── loan-manager.ts   # Loan operations + Owlto
│       ├── licensing-agent.ts # License sales + abv.dev
│       └── contract-monitor.ts # Event monitoring
├── contracts/
│   ├── ADLV.json            # ADLV ABI
│   └── IDO.json             # IDO ABI
├── test-goldsky.ts          # Goldsky client test script
├── index.ts                 # Main service entry
└── README.md               # This file
```

### Adding New Features

1. Create service in `src/services/`
2. Import in `index.ts`
3. Initialize in `AgentService` constructor
4. Add to startup sequence
5. Update this README

## Goldsky Integration - Complete Guide

### Overview

The Goldsky client allows the agent service to fetch real-time data from the deployed subgraph, including:
- Latest IP Assets
- Latest License Sales (minted licenses)
- Vault information
- CVS metrics

### Implementation Steps

#### Step 1: Create Goldsky Client

Created `src/clients/goldskyClient.ts` with the following functions:

```typescript
// Test connection to Goldsky
export async function testGoldskyConnection(): Promise<void>

// Fetch latest 5 IP Assets
export async function fetchLatestIPAssets(): Promise<IPAsset[]>

// Fetch latest 5 License Sales
export async function fetchLatestLicenseSales(): Promise<LicenseSale[]>
```

#### Step 2: Deploy Subgraph

1. **Navigate to subgraph directory**:
   ```bash
   cd ../../subgraph
   ```

2. **Check Goldsky CLI**:
   ```bash
   goldsky --version
   # Should show: 13.0.2 or higher
   ```

3. **Login to Goldsky**:
   ```bash
   goldsky login
   ```

4. **Deploy subgraph**:
   ```bash
   ./deploy-goldsky.sh
   ```

5. **Verify deployment**:
   ```bash
   goldsky subgraph list
   ```

   Expected output:
   ```
   Subgraphs
   * atlas-protocol/1.0.0
       GraphQL API: https://api.goldsky.com/api/public/project_xxxxx/subgraphs/atlas-protocol/1.0.0/gn
       Status: healthy (Active)
       Synced: 100%
   ```

#### Step 3: Configure Environment

1. **Get the GraphQL endpoint** from Goldsky dashboard or CLI output

2. **Add to `.env`**:
   ```env
   SUBGRAPH_URL=https://api.goldsky.com/api/public/project_xxxxx/subgraphs/atlas-protocol/1.0.0/gn
   ```

#### Step 4: Test Integration

1. **Run test script**:
   ```bash
   bun run test-goldsky.ts
   ```

2. **Expected output**:
   ```
   ✅ Connection successful!
   📊 Current block: 11429754
   ✅ Found 2 License Sales:
   
   1. License Sale #0xb771193656043536ad...
      Licensee: 0xdafee25f98ff62504c1086eacbb406190f3110d5
      License Type: commercial
      Sale Price: 1.0000 ETH
      CVS Increment: 0.0500 ETH
      Creator Share: 0.7000 ETH (70%)
      Vault Share: 0.2500 ETH (25%)
      Protocol Fee: 0.0500 ETH (5%)
   ```

### Current Deployment Status

✅ **Subgraph**: `atlas-protocol/1.0.0`
- **Endpoint**: `https://api.goldsky.com/api/public/project_cmi7kxx96f83a01ywgmfpdfs6/subgraphs/atlas-protocol/1.0.0/gn`
- **Network**: Story Aeneid Testnet (Chain ID: 1315)
- **Status**: Healthy (Active)
- **Sync Status**: 100%
- **Blocks Indexed**: 11,122,611 → 11,429,754+

### Data Retrieved

✅ **License Sales**: 2 sales found
- **Sale 1**: 
  - Price: 1.0 ETH
  - Type: Commercial
  - CVS Increment: 0.05 ETH (5%)
  - Revenue Split: 70% Creator, 25% Vault, 5% Protocol

- **Sale 2**:
  - Price: 0.3 ETH
  - Type: Commercial
  - CVS Increment: 0.015 ETH (5%)
  - Revenue Split: 70% Creator, 25% Vault, 5% Protocol

### GraphQL Schema

The subgraph exposes the following entities:

- `ipassets` - IP Assets with CVS metrics
- `idovaults` - ADLV vaults with lending terms
- `dataLicenseSales` - License sales with revenue distribution
- `loans` - Active and completed loans
- `deposits` - Vault liquidity deposits

### Usage in Code

```typescript
import {
  fetchLatestIPAssets,
  fetchLatestLicenseSales,
} from './src/clients/goldskyClient.js';

// Fetch latest IP Assets
const ipAssets = await fetchLatestIPAssets();
console.log(`Found ${ipAssets.length} IP Assets`);

// Fetch latest License Sales
const licenseSales = await fetchLatestLicenseSales();
console.log(`Found ${licenseSales.length} License Sales`);

// Process license sales
for (const sale of licenseSales) {
  console.log(`Sale: ${sale.salePrice} ETH`);
  console.log(`CVS Increment: ${sale.cvsIncrement} ETH`);
  console.log(`Licensee: ${sale.licensee}`);
}
```

### Troubleshooting

**Connection Failed (404)**:
- Verify subgraph is deployed: `goldsky subgraph list`
- Check `SUBGRAPH_URL` in `.env` matches the endpoint from Goldsky dashboard
- Ensure subgraph is fully synced (100%)

**No Data Returned**:
- Check if contracts have emitted events
- Verify start block in `subgraph.yaml` is correct
- Check subgraph sync status in Goldsky dashboard

**Schema Mismatch**:
- The subgraph uses lowercase field names (`ipassets`, `idovaults`)
- Update queries to match the actual schema
- Check `subgraph/schema.graphql` for correct field names

## License

MIT
