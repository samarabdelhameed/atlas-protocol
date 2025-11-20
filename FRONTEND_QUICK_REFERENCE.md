# Frontend Quick Reference - Atlas Protocol

Quick reference guide for frontend integration. For detailed information, see `FRONTEND_INTEGRATION_GUIDE.md`.

---

## Page Summary

### 1. Landing Page
- **Purpose**: Entry point, showcase platform features and metrics
- **Smart Contracts**: None (display only)
- **Backend**: None (optional stats endpoint)
- **Key Action**: Navigate to Vault Creation

### 2. Dashboard
- **Purpose**: Display user's CVS, loans, and licensing data
- **Smart Contracts**: 
  - `ADLV.getVault()` - Get vault info
  - `IDO.getCVS()` - Get CVS score
  - `ADLV.getVaultLoans()` - Get loan list
  - `ADLV.getLoan()` - Get loan details
- **Backend**: `GET /api/dashboard/:vaultAddress`
- **Key Actions**: View stats, navigate to Loans or Licensing

### 3. Vault Creation
- **Purpose**: Create new vault for IP asset
- **Smart Contracts**: 
  - `ADLV.createVault(bytes32 ipId)` - Create vault (via backend)
  - `ADLV.ipToVault(bytes32 ipId)` - Check if vault exists
- **Backend**: `POST /verify-vault`
- **Key Actions**: 
  1. Validate IP Asset from Story Protocol
  2. Verify World ID
  3. Configure terms
  4. Deploy vault

### 4. Loans
- **Purpose**: Request and manage data-backed loans
- **Smart Contracts**: 
  - `ADLV.issueLoan()` - Create loan (send ETH as collateral)
  - `ADLV.repayLoan()` - Repay loan (send ETH)
  - `ADLV.getLoan()` - Get loan details
  - `ADLV.calculateMaxLoanAmount()` - Get borrowing limit
- **Backend**: 
  - `POST /api/loans/request` - Request loan (handles cross-chain)
  - `GET /api/loans/:borrowerAddress` - Get user's loans
  - `POST /api/loans/repay` - Repay loan
- **Key Actions**: Request loan, repay loan, monitor health

### 5. Licensing
- **Purpose**: Purchase licenses for IP assets
- **Smart Contracts**: 
  - `ADLV.sellLicense()` - Purchase license (send ETH = price)
  - `ADLV.ipToVault()` - Get vault by IP ID
  - `IDO.getCVS()` - Get CVS score
- **Backend**: 
  - `POST /api/licenses/metadata` - Save buyer info
  - `POST /api/licenses/purchase` - Complete purchase
  - `GET /api/licenses/recent` - Get recent purchases
- **Key Actions**: Select tier, provide info, purchase license

---

## Smart Contract Functions Reference

### ADLV Contract

```solidity
// Vault Management
function createVault(bytes32 ipId) external returns (address vaultAddress)
function getVault(address vaultAddress) external view returns (Vault memory)

// Loan Management
function issueLoan(address vaultAddress, uint256 loanAmount, uint256 duration) external payable returns (uint256 loanId)
function repayLoan(uint256 loanId) external payable
function getLoan(uint256 loanId) external view returns (Loan memory)
function calculateMaxLoanAmount(address vaultAddress) external view returns (uint256)
function calculateInterestRate(uint256 cvs) public pure returns (uint256)
function getVaultLoans(address vaultAddress) external view returns (uint256[] memory)
function getBorrowerLoans(address borrower) external view returns (uint256[] memory)

// License Sales
function sellLicense(address vaultAddress, string calldata licenseType, uint256 duration) external payable

// Utility
function ipToVault(bytes32 ipId) external view returns (address)
```

### IDO Contract

```solidity
// CVS Management
function getCVS(bytes32 ipId) external view returns (uint256)
function totalLicenseRevenue(bytes32 ipId) external view returns (uint256)
```

---

## Backend API Reference

### Vault Creation
```
POST /verify-vault
Body: { proof, signal, vaultData: { ipId, creator } }
Response: { vaultAddress, transactionHash }
```

### Dashboard
```
GET /api/dashboard/:vaultAddress
Response: { vaultAddress, cvsScore, cvsHistory, activeLoans, recentLicenses, maxBorrowable }
```

### Loans
```
POST /api/loans/request
Body: { vaultAddress, loanAmount, duration, targetChain, borrowerAddress }
Response: { loanId, transactionHash, bridgeTransactionHash }

GET /api/loans/:borrowerAddress
Response: { loans: [...] }

POST /api/loans/repay
Body: { loanId, amount }
Response: { transactionHash, remainingAmount }
```

### Licensing
```
POST /api/licenses/metadata
Body: { personalName, organization, email, tierId, tierName, amount }

POST /api/licenses/purchase
Body: { vaultAddress, licenseType, price, buyerInfo }

GET /api/licenses/recent
Query: { vaultAddress?, limit? }
Response: { licenses: [...] }
```

---

## License Tiers & Pricing

| Tier | Price | CVS Impact | Features |
|------|-------|------------|----------|
| Basic | $500/month | +25 pts | 10 datasets, basic analytics |
| Commercial | $1,500/month | +80 pts | 50+ datasets, advanced analytics, priority support |
| Enterprise | Custom | +200 pts | Unlimited datasets, full suite, 24/7 support |

---

## CVS Health Calculation

```typescript
const cvsHealth = (currentCVS / (loanAmount * 2)) * 100;

// Health Status:
// >= 70%: Healthy (green)
// 40-69%: At Risk (orange)
// < 40%: Critical (red) - Liquidation warning
```

---

## Collateral Ratio

```typescript
const collateralRatio = (currentCVS / loanAmount) * 100;

// Minimum required: 150% (200% for safety)
// Loan amount max: CVS / 2 (50% of CVS)
```

---

## Interest Rate Calculation

```solidity
// Formula: 20% - (CVS / 10000), minimum 5%
uint256 baseRate = 2000; // 20%
uint256 discount = cvs / 100;
uint256 rate = baseRate > discount ? baseRate - discount : 500;
if (rate < 500) rate = 500; // Minimum 5%
```

---

## Revenue Distribution

When a license is sold:
- **Protocol Fee**: 5% (configurable)
- **Creator Share**: 70% of remaining → sent to creator wallet
- **Vault Share**: 25% of remaining → stays in vault for loans

---

## Cross-Chain Loan Disbursement

For loans with `targetChain` specified:
1. Frontend sends loan request to backend
2. Backend creates loan on ADLV contract
3. Backend uses Owlto Bridge API to transfer funds to target chain
4. Frontend displays bridge transaction hash and estimated arrival time

Supported chains: Ethereum, Polygon, Arbitrum, Optimism, Base

---

## World ID Verification

1. User clicks "Verify with World ID" button
2. World ID widget opens
3. User completes verification
4. Frontend sends proof to backend: `POST /verify-vault`
5. Backend verifies proof with World ID API
6. Backend proceeds with vault creation

---

## Story Protocol Integration

```typescript
import { createStoryClient, getIPAsset } from './services/storyProtocol';

// Get IP Asset details
const client = createStoryClient(userAddress);
const ipAsset = await getIPAsset(client, ipId);

// Verify ownership
if (ipAsset.owner.toLowerCase() !== userAddress.toLowerCase()) {
  throw new Error('You do not own this IP Asset');
}
```

---

## Error Handling

Common errors and handling:

| Error | Status | Handling |
|-------|--------|----------|
| Vault already exists | 409 | Show existing vault address |
| World ID verification failed | 401 | Allow to proceed for testing, or show error |
| Insufficient CVS | Contract revert | Show error: "CVS too low, need 2x loan amount" |
| Insufficient liquidity | Contract revert | Show error: "Vault has no available liquidity" |
| Network error | 500 | Show retry button |

---

## Environment Variables

```bash
VITE_WORLD_ID_APP_ID=your_world_id_app_id
VITE_WORLD_ID_ACTION=atlas-verification
VITE_VERIFICATION_ENDPOINT=http://localhost:3001/verify-vault
VITE_AGENT_API_URL=http://localhost:3001
VITE_ADLV_CONTRACT_ADDRESS=0x76d81731e26889Be3718BEB4d43e12C3692753b8
VITE_IDO_CONTRACT_ADDRESS=0x...
```

---

## Testing Checklist

- [ ] Wallet connection works (wagmi)
- [ ] Network is correct (Base Sepolia/Base Mainnet)
- [ ] Smart contract calls are properly encoded
- [ ] Transaction status is displayed
- [ ] Error messages are user-friendly
- [ ] Loading states are shown
- [ ] Data refreshes after transactions
- [ ] World ID verification works
- [ ] Cross-chain transfers work
- [ ] CVS updates in real-time

---

**For detailed integration information, see `FRONTEND_INTEGRATION_GUIDE.md`**

