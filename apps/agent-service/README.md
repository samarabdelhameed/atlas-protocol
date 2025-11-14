# Atlas Protocol Agent Service

Backend service for Atlas Protocol that handles CVS monitoring, loan management, licensing, and cross-chain operations.

## Features

- ✅ **CVS Engine**: Real-time Collateral Value Score calculation and monitoring
- ✅ **Loan Manager**: Issue, repay, and liquidate loans with Owlto Finance cross-chain support
- ✅ **Licensing Agent**: Sell licenses for IP assets via abv.dev
- ✅ **Contract Monitor**: Real-time event monitoring from ADLV and IDO contracts
- ✅ **Subgraph Integration**: Query Goldsky subgraph for protocol data

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

## Testing

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
├── index.ts                 # Main service entry
└── README.md               # This file
```

### Adding New Features

1. Create service in `src/services/`
2. Import in `index.ts`
3. Initialize in `AgentService` constructor
4. Add to startup sequence
5. Update this README

## License

MIT
