# Atlas Protocol Agent Service

Backend service for Atlas Protocol that handles CVS monitoring, loan management, licensing, and cross-chain operations.

## Features

- ✅ **CVS Engine**: Real-time Collateral Value Score calculation and monitoring
- ✅ **Loan Manager**: Issue, repay, and liquidate loans with Owlto Finance cross-chain support
- ✅ **Licensing Agent**: Sell licenses for IP assets via abv.dev
- ✅ **Contract Monitor**: Real-time event monitoring from ADLV and IDO contracts
- ✅ **Subgraph Integration**: Query Goldsky subgraph for protocol data
- ✅ **Goldsky Client**: Fetch real-time data from deployed subgraph
- ✅ **Yakoa Client**: Fetch originality scores for IP assets
- ✅ **CVS Calculator**: Calculate CVS from Goldsky + Yakoa data
- ✅ **CVS Updater**: Update CVS on-chain via updateCVS()
- ✅ **ABV.dev Client**: Generate license content and register as IP assets
- ✅ **ABV + Story Integration**: Register generated content on Story Protocol
- ✅ **Owlto Client**: Cross-chain bridge between Story Network and other chains

## Setup

### 1. Install Dependencies

```bash
bun install
```

### 2. Environment Variables

Create a `.env` file:

```bash
# RPC Configuration (Story Protocol Testnet)
RPC_URL=https://rpc-storyevm-testnet.aldebaranode.xyz
CHAIN_ID=1315
CHAIN_NAME=Story Protocol Testnet

# Contract Addresses (v3 - Latest)
ADLV_ADDRESS=0x793402b59d2ca4c501EDBa328347bbaF69a59f7b
IDO_ADDRESS=0xeF83DB9b011261Ad3a76ccE8B7E54B2c055300D8

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
STORY_PROTOCOL_RPC=https://rpc-storyevm-testnet.aldebaranode.xyz
STORY_SPG_ADDRESS=0x69415CE984A79a3Cfbe3F51024C63b6C107331e3
STORY_IP_ASSET_REGISTRY=0x292639452A975630802C17c9267169D93BD5a793

# Goldsky Subgraph (after deployment)
SUBGRAPH_URL=https://api.goldsky.com/api/public/project_xxxxx/subgraphs/atlas-protocol/1.0.0/gn

# Yakoa (for originality scores)
YAKOA_API_KEY=your_yakoa_api_key
YAKOA_API_URL=https://api.yakoa.com/v1/verify

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

### Test CVS Calculation and Update

```bash
bun run test-cvs-update.ts <ipAssetId>
```

This tests:
1. Fetching Yakoa originality score
2. Fetching license sales from Goldsky
3. Calculating CVS
4. Updating CVS on-chain

### Test Real Data Flow

```bash
bun run test-real-data.ts
```

Tests the complete flow with real data from Goldsky subgraph.

### Test ABV Agent

```bash
bun run test-abv-agent.ts
```

Tests license registration with ABV.dev using real license sales.

### Test Owlto Bridge

```bash
bun run test-owlto-bridge.ts
```

Tests cross-chain bridge between Story Network and Base.

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
│   │   ├── goldskyClient.ts    # Goldsky subgraph client
│   │   ├── yakoaClient.ts      # Yakoa originality score client
│   │   ├── abvClient.ts        # ABV.dev GenAI client
│   │   └── owltoClient.ts      # Owlto cross-chain bridge client
│   ├── config/
│   │   └── index.ts             # Configuration
│   └── services/
│       ├── cvs-engine.ts        # CVS calculation
│       ├── cvs-calculator.ts   # CVS calculation from Goldsky + Yakoa
│       ├── cvs-updater.ts      # CVS on-chain updater
│       ├── loan-manager.ts     # Loan operations + Owlto
│       ├── licensing-agent.ts # License sales + abv.dev
│       ├── abv-agent.ts       # ABV.dev agent service
│       ├── abv-story-integration.ts # ABV + Story Protocol integration
│       └── contract-monitor.ts # Event monitoring
├── contracts/
│   ├── ADLV.json              # ADLV ABI
│   └── IDO.json               # IDO ABI
├── test-goldsky.ts            # Goldsky client test
├── test-cvs-update.ts         # CVS update flow test
├── test-real-data.ts          # Real data flow test
├── test-abv-agent.ts          # ABV agent test
├── test-owlto-bridge.ts       # Owlto bridge test
├── index.ts                   # Main service entry
└── README.md                  # This file
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

## Yakoa Originality Score Integration

### Overview

Yakoa provides originality verification for IP assets. The Yakoa client fetches originality scores (0-100) which are used in CVS calculation.

### Implementation

**File**: `src/clients/yakoaClient.ts`

**Functions**:
- `fetchOriginalityScore(ipAssetId)` - Fetch originality score for an IP asset
- `fetchOriginalityScores(ipAssetIds[])` - Batch fetch scores for multiple IP assets

**Usage**:
```typescript
import { fetchOriginalityScore } from './src/clients/yakoaClient.js';

const score = await fetchOriginalityScore('0x123...abc');
console.log(`Originality Score: ${score.score}/100`);
```

**Environment Variables**:
```env
YAKOA_API_KEY=your_yakoa_api_key
YAKOA_API_URL=https://api.yakoa.com/v1/verify
```

**Testing**:
```bash
# Test is included in CVS update flow
bun run test-cvs-update.ts <ipAssetId>
```

## CVS Calculation and Update

### Overview

CVS (Collateral Value Score) is calculated based on:
1. License Sales (from Goldsky)
2. Revenue (from Goldsky)
3. Originality Score (from Yakoa)

### CVS Formula

```
CVS = 1000 + (Revenue/10) + (Originality×50) + (Sales×100)

Where:
- Base = 1000 (minimum CVS)
- Revenue Component = Total Revenue / 10
- Originality Component = Originality Score × 50
- License Sales Component = Number of Sales × 100
```

### Implementation

**Files**:
- `src/services/cvs-calculator.ts` - CVS calculation service
- `src/services/cvs-updater.ts` - On-chain CVS updater

**Usage**:
```typescript
import { cvsCalculator } from './src/services/cvs-calculator.js';
import { cvsUpdater } from './src/services/cvs-updater.js';

// Calculate CVS
const calculation = await cvsCalculator.calculateCVS(ipAssetId);
console.log(`CVS: ${calculation.calculatedCVS}`);

// Update on-chain
const result = await cvsUpdater.updateCVSOnChain(ipAssetId);
console.log(`Transaction: ${result.transactionHash}`);
```

**Testing**:
```bash
bun run test-cvs-update.ts <ipAssetId>
```

**Expected Output**:
```
✅ Yakoa Score: 85/100
✅ CVS Calculated: 5250
✅ CVS Updated on-chain: tx 0xabc123... ✅
```

## ABV.dev + Story Protocol Integration

### Overview

ABV.dev provides GenAI license content generation. This integration:
1. Generates license content using ABV.dev GenAI
2. Registers the generated content as a new IP Asset on Story Protocol
3. Links the new IP Asset to the original IP Asset

### Implementation

**Files**:
- `src/clients/abvClient.ts` - ABV.dev client (updated with `generateLicenseContent()`)
- `src/services/abv-story-integration.ts` - ABV + Story Protocol integration service

**Functions**:
- `generateLicenseContent(prompt, licenseType)` - Generate license content with ABV.dev
- `generateAndRegisterIPAsset()` - Generate and register as IP Asset on Story Protocol
- `generateLicenseForSale()` - Generate license for existing license sale

**Usage**:
```typescript
import { abvStoryIntegration } from './src/services/abv-story-integration.js';

const result = await abvStoryIntegration.generateLicenseForSale(
  originalIPId,
  licensee,
  'commercial',
  '1000000000000000000' // 1 ETH
);

console.log(`Story IP ID: ${result.storyIPId}`);
console.log(`Linked to: ${result.linkedToOriginalIP}`);
```

**Environment Variables**:
```env
ABV_API_KEY=your_abv_api_key
ABV_API_URL=https://api.abv.dev/v1/generate
STORY_PROTOCOL_API_KEY=your_story_api_key
```

**Testing**:
```bash
bun run test-abv-agent.ts
```

**Expected Output**:
```
✅ License Content Generated
✅ IP Asset Registered on Story: tx 0xabc... ✅
✅ License linked to original IP: 0x123... ✅
```

## Owlto Cross-Chain Bridge

### Overview

Owlto Finance provides cross-chain bridging services. This client handles bridging funds between chains (e.g., Story Network ↔ Base).

### Implementation

**File**: `src/clients/owltoClient.ts`

**Functions**:
- `bridgeFunds(params)` - Bridge funds between chains
- `getBridgeStatus(bridgeId)` - Check bridge transaction status
- `getSupportedChains()` - Get list of supported chains

**Usage**:
```typescript
import { bridgeFunds } from './src/clients/owltoClient.js';

const result = await bridgeFunds({
  fromChain: 1315, // Story Network
  toChain: 8453,  // Base
  amount: '100000000000000000', // 0.1 ETH
  token: '0x0000000000000000000000000000000000000000', // Native token
  recipient: '0x...',
});

console.log(`Bridge ID: ${result.bridgeId}`);
console.log(`TX Hash: ${result.transactionHash}`);
```

**Environment Variables**:
```env
OWLTO_API_KEY=your_owlto_api_key
OWLTO_API_URL=https://api.owlto.finance/api/v2/bridge
OWLTO_SLIPPAGE=0.5
OWLTO_REFERRAL_CODE=your_referral_code
```

**Supported Chains**:
- Story Aeneid Testnet (1315)
- Base (8453)
- Ethereum (1)
- Polygon (137)

**Testing**:
```bash
bun run test-owlto-bridge.ts
```

**Expected Output**:
```
✅ Bridge Request Sent
✅ Funds Bridged: 0.1 ETH from Story → Base
✅ Bridge TX: 0xxyz... ✅
```

## Complete Data Flow

### Step 4.3: Yakoa + CVS Calculation

1. Fetch Yakoa originality score for IP asset
2. Fetch license sales from Goldsky
3. Calculate CVS: `CVS = 1000 + (Revenue/10) + (Originality×50) + (Sales×100)`
4. Update CVS on-chain via `updateCVS()`

### Step 4.4: ABV.dev + Story Protocol

1. Generate license content using ABV.dev GenAI
2. Register generated content as IP Asset on Story Protocol
3. Link new IP Asset to original IP Asset

### Step 4.5: Owlto Cross-Chain Bridge

1. Initiate bridge request via Owlto API
2. Monitor bridge status
3. Funds arrive on target chain

## License

MIT
