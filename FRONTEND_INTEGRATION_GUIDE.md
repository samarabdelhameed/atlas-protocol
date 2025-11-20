# Frontend Integration Guide

This document provides detailed information about each page in the Atlas Protocol frontend, including user journeys, smart contract functions, and backend API endpoints.

---

## Table of Contents

1. [Landing Page](#1-landing-page)
2. [Dashboard](#2-dashboard)
3. [Vault Creation](#3-vault-creation)
4. [Loans](#4-loans)
5. [Licensing](#5-licensing)

---

## 1. Landing Page

### Page Purpose
The landing page is the entry point of the application. It provides an overview of the Atlas Protocol platform, showcasing key metrics, features, and a call-to-action to create a data vault. It's designed to educate users about the platform's capabilities and encourage them to start their journey.

### User Journey

1. **Initial Visit**: User arrives at the landing page and sees the hero section with the main tagline "Tokenize IP Data. Unlock DeFi Liquidity"
2. **Exploration**: User scrolls through the page to learn about:
   - Platform features (Monetize Data Provenance, Dynamic Collateral Score, Instant Cross-Chain Liquidity)
   - Platform metrics (Total CVS Valued, Data-Backed Loans, GenAI Data Licenses Issued)
   - Recent license sales ticker
3. **Action**: User clicks "Create Data Vault" button to navigate to the Vault Creation page

### Smart Contract Functions

**No direct smart contract calls on this page** - This is a display-only page.

**However, to display real data, you should query:**

- **From IDO Contract** (read-only):
  - `getCVS(bytes32 ipId)` - To get CVS scores for different IP assets
  
- **From ADLV Contract** (read-only):
  - `vaults(address vaultAddress)` - To get vault statistics
  - Events: `VaultCreated`, `LicenseSold`, `LoanIssued` - To track platform activity

### Backend Endpoints

**No backend API calls required for this page.**

**Optional endpoints for displaying real-time data:**

```
GET /api/stats/platform
Response: {
  totalCVSValued: number,
  totalLoans: number,
  totalLicenses: number,
  recentLicenseSales: Array<{
    company: string,
    tier: string,
    amount: string,
    cvs: string
  }>
}
```

---

## 2. Dashboard

### Page Purpose
The Dashboard is the main control center for users who have created a vault. It displays real-time CVS (Content Value Score), loan eligibility, active loans, and recent license sales. It provides a comprehensive view of the user's IP asset performance and financial position.

### User Journey

1. **View Overview**: User sees their current CVS score, licensing yield, active loans, and collateral ratio
2. **Monitor CVS**: User views the CVS growth chart showing historical data (30 days)
3. **Check Eligibility**: User reviews their loan eligibility based on current CVS score
4. **Review Loans**: User sees all active loans with their health status
5. **Take Action**: User can navigate to Loans page to request a new loan, or to Licensing page to view license sales

### Smart Contract Functions

**Read Functions (Query Data):**

1. **Get Vault Information**:
   - Contract: `ADLV`
   - Function: `getVault(address vaultAddress)`
   - Parameters: `vaultAddress` (address of user's vault)
   - Returns: `Vault` struct with all vault data

2. **Get Current CVS**:
   - Contract: `IDO`
   - Function: `getCVS(bytes32 ipId)`
   - Parameters: `ipId` (bytes32 IP asset identifier)
   - Returns: `uint256` - Current CVS score

3. **Calculate Max Loan Amount**:
   - Contract: `ADLV`
   - Function: `calculateMaxLoanAmount(address vaultAddress)`
   - Parameters: `vaultAddress` (address)
   - Returns: `uint256` - Maximum loan amount based on CVS

4. **Get All Loans for Vault**:
   - Contract: `ADLV`
   - Function: `getVaultLoans(address vaultAddress)`
   - Parameters: `vaultAddress` (address)
   - Returns: `uint256[]` - Array of loan IDs

5. **Get Loan Details**:
   - Contract: `ADLV`
   - Function: `getLoan(uint256 loanId)`
   - Parameters: `loanId` (uint256)
   - Returns: `Loan` struct with loan details

**Events to Listen To:**
- `CVSUpdated(address indexed vaultAddress, uint256 oldCVS, uint256 newCVS)` - To update CVS in real-time
- `LicenseSold(address indexed vaultAddress, bytes32 indexed ipId, address indexed licensee, uint256 price, string licenseType)` - To track license sales
- `LoanIssued(address indexed vaultAddress, address indexed borrower, uint256 indexed loanId, uint256 amount, uint256 collateral, uint256 interestRate, uint256 duration)` - To track new loans

### Backend Endpoints

```
GET /api/dashboard/:vaultAddress
Response: {
  vaultAddress: string,
  cvsScore: number,
  cvsHistory: Array<{
    timestamp: number,
    value: number
  }>,
  totalLicenseRevenue: number,
  activeLoans: Array<{
    loanId: number,
    amount: string,
    chain: string,
    apr: string,
    dueDate: number,
    status: string,
    cvsHealth: number,
    collateralRatio: number,
    currentCVS: number
  }>,
  maxBorrowable: number,
  recentLicenses: Array<{
    id: string,
    ipAsset: string,
    buyer: string,
    amount: string,
    date: string,
    status: string,
    cvsImpact: string
  }>
}
```

---

## 3. Vault Creation

### Page Purpose
The Vault Creation page guides users through the process of creating a new data vault for their IP asset. It involves selecting an IP asset from Story Protocol, verifying human identity with World ID, configuring vault terms, and deploying the vault on-chain.

### User Journey

1. **Step 1: Select IP Asset**
   - User enters IP Asset ID from Story Protocol
   - User enters or auto-fills creator wallet address
   - User clicks "Validate IP & Continue" to verify IP asset exists
   - System validates IP asset on Story Protocol

2. **Step 2: Verify Human Identity (World ID)**
   - User clicks "Verify with World ID" button
   - World ID widget opens for verification
   - User completes World ID verification
   - System verifies proof with backend

3. **Step 3: Configure Vault Terms**
   - User selects default loan currency (USDC or WETH)
   - User selects default loan duration (7, 30, 60, or 90 days)
   - User clicks "Review Vault Details" to proceed

4. **Step 4: Review & Deploy**
   - User reviews all vault information
   - User clicks "Deploy Atlas Vault" button
   - System creates vault on-chain via backend
   - User sees success message with vault address and transaction hash

5. **Step 5: Success**
   - User sees confirmation with vault address
   - User can navigate to Dashboard to start using the vault

### Smart Contract Functions

**Write Functions (Execute Transactions):**

1. **Create Vault**:
   - Contract: `ADLV`
   - Function: `createVault(bytes32 ipId)`
   - Parameters: 
     - `ipId` (bytes32) - IP Asset ID from Story Protocol
   - Returns: `address` - The created vault address
   - **Note**: This is typically called by the backend service, not directly from frontend

**Read Functions (Validation):**

1. **Check if Vault Exists**:
   - Contract: `ADLV`
   - Function: `ipToVault(bytes32 ipId)`
   - Parameters: `ipId` (bytes32)
   - Returns: `address` - Returns zero address if vault doesn't exist

2. **Get IP Asset from Story Protocol**:
   - Use Story Protocol SDK: `client.ipAsset.get(ipId)`
   - Parameters: `ipId` (Address)
   - Returns: IP Asset details to verify ownership

### Backend Endpoints

```
POST /verify-vault
Request Body: {
  proof: {
    merkle_root: string,
    nullifier_hash: string,
    proof: string,
    verification_level: string
  },
  signal: string, // e.g., "vault_creation" or the ipAssetId
  vaultData: {
    ipId: string, // IP Asset ID from Story Protocol
    creator: string // Creator wallet address
  }
}

Response (Success - 200): {
  success: true,
  message: string,
  vaultAddress: string,
  transactionHash: string
}

Response (Vault Exists - 200): {
  success: true,
  message: string,
  vaultAddress: string,
  alreadyExists: true
}

Response (Error - 400/401/409/500): {
  error: string,
  details?: string,
  code?: string // e.g., "VAULT_EXISTS"
}
```

**Important Notes:**
- The backend handles World ID proof verification
- The backend creates the vault on-chain via `ADLV.createVault()`
- If vault already exists, backend returns existing vault address
- Frontend should handle errors gracefully (World ID verification failure, vault exists, network errors)

---

## 4. Loans

### Page Purpose
The Loans page allows users to request and manage data-backed loans using their CVS score as collateral. Users can execute liquidity drawdowns, specify target chains for cross-chain disbursement via Owlto Bridge, and monitor their active loan positions with health status indicators.

### User Journey

1. **View Eligibility**: User sees their current CVS score and maximum borrowable amount
2. **Request Loan**: 
   - User enters loan amount (USDC)
   - User selects target chain (Ethereum, Polygon, Arbitrum, Optimism, Base)
   - User selects loan duration (7, 30, 90, 180 days)
   - System calculates estimated APR and required collateral
   - User clicks "Execute Liquidity Drawdown"
3. **Loan Processing**: 
   - Transaction is submitted to blockchain
   - Cross-chain bridge (Owlto) processes transfer to target chain
   - User receives funds on target chain
4. **Manage Loans**: 
   - User views all active loans with health status
   - User can repay loans or add collateral
   - System shows liquidation warnings for critical loans

### Smart Contract Functions

**Write Functions (Execute Transactions):**

1. **Issue Loan**:
   - Contract: `ADLV`
   - Function: `issueLoan(address vaultAddress, uint256 loanAmount, uint256 duration)`
   - Parameters:
     - `vaultAddress` (address) - User's vault address
     - `loanAmount` (uint256) - Amount to borrow (in wei)
     - `duration` (uint256) - Loan duration in seconds
   - **Value Sent**: Must send ETH as collateral (150% of loan amount)
   - Returns: `uint256` - Loan ID
   - Events: `LoanIssued`

2. **Repay Loan**:
   - Contract: `ADLV`
   - Function: `repayLoan(uint256 loanId)`
   - Parameters: `loanId` (uint256)
   - **Value Sent**: Amount to repay (in wei)
   - Events: `LoanRepaid`

3. **Liquidate Loan** (for liquidators):
   - Contract: `ADLV`
   - Function: `liquidateLoan(uint256 loanId)`
   - Parameters: `loanId` (uint256)
   - Returns: Collateral to liquidator
   - Events: `LoanLiquidated`

**Read Functions (Query Data):**

1. **Calculate Max Loan Amount**:
   - Contract: `ADLV`
   - Function: `calculateMaxLoanAmount(address vaultAddress)`
   - Parameters: `vaultAddress` (address)
   - Returns: `uint256` - Maximum loan amount

2. **Get Loan Details**:
   - Contract: `ADLV`
   - Function: `getLoan(uint256 loanId)`
   - Parameters: `loanId` (uint256)
   - Returns: `Loan` struct

3. **Get All Borrower Loans**:
   - Contract: `ADLV`
   - Function: `getBorrowerLoans(address borrower)`
   - Parameters: `borrower` (address)
   - Returns: `uint256[]` - Array of loan IDs

4. **Calculate Interest Rate**:
   - Contract: `ADLV`
   - Function: `calculateInterestRate(uint256 cvs)`
   - Parameters: `cvs` (uint256) - Current CVS score
   - Returns: `uint256` - Interest rate in basis points (e.g., 500 = 5%)

5. **Calculate Interest**:
   - Contract: `ADLV`
   - Function: `calculateInterest(uint256 principal, uint256 rate, uint256 elapsedTime, uint256 duration)`
   - Parameters:
     - `principal` (uint256) - Loan principal
     - `rate` (uint256) - Interest rate in basis points
     - `elapsedTime` (uint256) - Time elapsed in seconds
     - `duration` (uint256) - Total loan duration in seconds
   - Returns: `uint256` - Interest amount

6. **Get Current CVS**:
   - Contract: `IDO`
   - Function: `getCVS(bytes32 ipId)`
   - Parameters: `ipId` (bytes32)
   - Returns: `uint256` - Current CVS score

### Backend Endpoints

```
POST /api/loans/request
Request Body: {
  vaultAddress: string,
  loanAmount: string, // in wei or smallest unit
  duration: number, // in seconds
  targetChain: number, // chain ID (e.g., 1 for Ethereum, 137 for Polygon)
  borrowerAddress: string
}

Response (Success - 200): {
  success: true,
  loanId: number,
  transactionHash: string,
  bridgeTransactionHash?: string, // if cross-chain
  estimatedArrivalTime?: string
}

Response (Error - 400/500): {
  error: string,
  details?: string
}
```

```
GET /api/loans/:borrowerAddress
Response: {
  loans: Array<{
    loanId: number,
    vaultAddress: string,
    loanAmount: string,
    collateralAmount: string,
    interestRate: number,
    duration: number,
    cvsAtIssuance: number,
    startTime: number,
    endTime: number,
    repaidAmount: string,
    outstandingAmount: string,
    status: string, // "Active", "Repaid", "Defaulted", "Liquidated"
    currentCVS: number,
    cvsHealth: number, // percentage
    collateralRatio: number, // percentage
    chain: string // target chain name
  }>
}
```

```
POST /api/loans/repay
Request Body: {
  loanId: number,
  amount: string // in wei
}

Response: {
  success: true,
  transactionHash: string,
  remainingAmount: string
}
```

**Notes:**
- Cross-chain transfers are handled by Owlto Bridge (backend integration)
- CVS health is calculated as: `(currentCVS / (loanAmount * 2)) * 100`
- Loans become critical when CVS health < 40%
- Collateral ratio is calculated as: `(currentCVS / loanAmount) * 100`

---

## 5. Licensing

### Page Purpose
The Licensing page allows users to purchase licenses for IP assets (GenAI data licenses). Buyers can choose from different tiers (Basic, Commercial, Enterprise), provide their information, and complete purchases. Each license purchase increases the creator's CVS score and generates revenue that's split between the creator, vault, and protocol.

### User Journey

1. **Browse Plans**: User views available license tiers (Basic, Commercial, Enterprise) with features and pricing
2. **Select Tier**: User clicks "Purchase License" on desired tier
3. **Provide Information**: 
   - Modal opens requesting buyer information
   - User enters: Personal Name, Organization Name, Contact Email
   - User clicks "Continue" to submit
4. **Purchase Processing**:
   - Frontend sends metadata to backend
   - Smart contract transaction is executed (license sale)
   - Transaction is indexed by Goldsky
   - License is registered on Story Protocol via abv.dev
5. **Confirmation**: 
   - User sees confirmation modal with transaction details
   - CVS impact is displayed
   - License appears in recent purchases table

### Smart Contract Functions

**Write Functions (Execute Transactions):**

1. **Sell License**:
   - Contract: `ADLV`
   - Function: `sellLicense(address vaultAddress, string calldata licenseType, uint256 duration)`
   - Parameters:
     - `vaultAddress` (address) - Vault address of the IP asset creator
     - `licenseType` (string) - Type of license: "exclusive", "commercial", "derivative", or "standard"
     - `duration` (uint256) - Reserved for future use (can be 0)
   - **Value Sent**: License price (in wei) - must match tier price
   - Events: `LicenseSold`, `CVSUpdated` (triggered by backend)
   - **Revenue Distribution**:
     - Protocol fee: 5% (configurable)
     - Creator share: 70% of remaining
     - Vault share: 25% of remaining (stays in vault for loans)

2. **Record Revenue** (called by ADLV internally):
   - Contract: `IDO`
   - Function: `recordRevenue(bytes32 ipId, uint256 amount)`
   - Parameters:
     - `ipId` (bytes32) - IP Asset ID
     - `amount` (uint256) - Revenue amount
   - Events: `RevenueCollected`

**Read Functions (Query Data):**

1. **Get Vault by IP ID**:
   - Contract: `ADLV`
   - Function: `ipToVault(bytes32 ipId)`
   - Parameters: `ipId` (bytes32)
   - Returns: `address` - Vault address

2. **Get Vault Information**:
   - Contract: `ADLV`
   - Function: `getVault(address vaultAddress)`
   - Parameters: `vaultAddress` (address)
   - Returns: `Vault` struct

3. **Get Current CVS**:
   - Contract: `IDO`
   - Function: `getCVS(bytes32 ipId)`
   - Parameters: `ipId` (bytes32)
   - Returns: `uint256` - Current CVS score

4. **Get Total License Revenue**:
   - Contract: `IDO`
   - Function: `totalLicenseRevenue(bytes32 ipId)`
   - Parameters: `ipId` (bytes32)
   - Returns: `uint256` - Total revenue collected

**Events to Listen To:**
- `LicenseSold(address indexed vaultAddress, bytes32 indexed ipId, address indexed licensee, uint256 price, string licenseType)` - Track license sales
- `CVSUpdated(bytes32 indexed ipId, uint256 newCVS, uint256 oldCVS)` - Track CVS updates

### Backend Endpoints

```
POST /api/licenses/metadata
Request Body: {
  personalName: string,
  organization: string,
  email: string,
  tierId: string, // "basic", "commercial", or "enterprise"
  tierName: string,
  amount: string, // price in USD format, e.g., "$1,500"
  vaultAddress: string, // optional, if known
  ipId: string // optional, if known
}

Response (Success - 200): {
  success: true,
  message: string
}
```

```
POST /api/licenses/purchase
Request Body: {
  vaultAddress: string,
  licenseType: string, // "basic", "commercial", or "enterprise"
  price: string, // in wei
  buyerInfo: {
    name: string,
    organization: string,
    email: string
  }
}

Response (Success - 200): {
  success: true,
  transactionHash: string,
  cvsImpact: number, // CVS points added
  newCVS: number, // Updated CVS score
  licenseId: string, // Story Protocol license ID
  estimatedIndexing: string // e.g., "~30 seconds"
}
```

```
GET /api/licenses/recent
Query Parameters:
  - vaultAddress?: string (optional, filter by vault)
  - limit?: number (default: 20)

Response: {
  licenses: Array<{
    id: string,
    company: string,
    tier: string,
    amount: string,
    cvsImpact: string, // e.g., "+80 pts"
    creator: string,
    date: string,
    transactionHash: string
  }>
}
```

**Notes:**
- License prices are fixed: Basic ($500), Commercial ($1,500), Enterprise (Custom)
- CVS impact per tier: Basic (+25), Commercial (+80), Enterprise (+200)
- Backend handles CVS update calculation and Story Protocol registration
- License purchases are indexed by Goldsky subgraph
- Frontend should display license metadata and track purchase status

---

## Additional Integration Notes

### Story Protocol Integration

For IP asset validation and registration:

```typescript
// Get IP Asset details
import { createStoryClient, getIPAsset } from './services/storyProtocol';

const client = createStoryClient(userAddress);
const ipAsset = await getIPAsset(client, ipId);

// Verify ownership
if (ipAsset.owner.toLowerCase() !== userAddress.toLowerCase()) {
  throw new Error('You do not own this IP Asset');
}
```

### CVS Score Calculation

CVS is calculated off-chain by the backend service based on:
- License sales revenue
- Usage metrics
- Time-based factors
- Historical performance

The backend updates CVS via `IDO.updateCVS()` function.

### Cross-Chain Bridge (Owlto)

For cross-chain loan disbursement:
- Backend integrates with Owlto Finance API
- Frontend passes target chain ID
- Backend handles bridge transaction
- Frontend displays estimated arrival time

### World ID Verification

World ID verification is handled by the backend:
- Frontend integrates World ID widget
- User completes verification
- Frontend sends proof to backend
- Backend verifies with World ID API
- Backend proceeds with vault creation

### Error Handling

All API endpoints should handle:
- Network errors
- Smart contract revert errors
- Validation errors
- Rate limiting
- Timeout errors

Frontend should display user-friendly error messages and retry mechanisms where appropriate.

---

## Contract Addresses

**Base Sepolia (Testnet):**
- ADLV Contract: `0x76d81731e26889Be3718BEB4d43e12C3692753b8`
- IDO Contract: (Deploy separately and update)

**Update these addresses in your frontend configuration based on deployment.**

---

## Environment Variables

Frontend requires these environment variables:

```bash
VITE_WORLD_ID_APP_ID=your_world_id_app_id
VITE_WORLD_ID_ACTION=atlas-verification
VITE_VERIFICATION_ENDPOINT=http://localhost:3001/verify-vault
VITE_AGENT_API_URL=http://localhost:3001
VITE_ADLV_CONTRACT_ADDRESS=0x...
VITE_IDO_CONTRACT_ADDRESS=0x...
```

---

## Testing Checklist

For each page, ensure:
- [ ] Smart contract calls are properly encoded
- [ ] Transaction status is displayed to user
- [ ] Error messages are user-friendly
- [ ] Loading states are shown during async operations
- [ ] Data is refreshed after transactions
- [ ] Wallet connection is validated
- [ ] Network is correct (Base Sepolia/Base Mainnet)
- [ ] World ID verification works (if applicable)
- [ ] Cross-chain transfers work (for Loans page)
- [ ] CVS updates are reflected in real-time

---

**End of Integration Guide**

