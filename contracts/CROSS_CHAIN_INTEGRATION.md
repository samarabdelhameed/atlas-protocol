# Cross-Chain Loan Integration Guide

## Overview

Atlas Protocol now supports **cross-chain loan disbursement** via Owlto Finance Bridge. Users can:
- Deposit collateral on Story Protocol (ETH)
- Receive loan funds on any supported chain (USDC, ETH, or other tokens)
- Repay loans back on Story Protocol

---

## How It Works

### 1. User Flow

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: User Requests Loan on Story Protocol            │
│  - Selects vault                                         │
│  - Chooses loan amount                                   │
│  - Selects target chain (Base, Arbitrum, Optimism, etc.)│
│  - Deposits ETH collateral (150% of loan)                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Step 2: Smart Contract Issues Loan                      │
│  - Validates CVS requirements                            │
│  - Locks collateral                                      │
│  - Emits LoanIssued event with targetChainId             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Step 3: Agent Service Detects Event                     │
│  - Reads targetChainId from event                        │
│  - Calls Owlto Finance API                               │
│  - Initiates bridge transaction                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Step 4: Owlto Bridge Transfers Funds                    │
│  - Bridges from Story Protocol                           │
│  - Converts to target token (USDC, ETH, etc.)            │
│  - Delivers to user's wallet on target chain             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Step 5: User Receives Funds                             │
│  - USDC on Base (or chosen chain)                        │
│  - Ready to use in DeFi, trading, etc.                   │
└─────────────────────────────────────────────────────────┘
```

---

## Contract Changes

### ADLV.sol

#### Modified Function Signature

**Before:**
```solidity
function issueLoan(
    address vaultAddress,
    uint256 loanAmount,
    uint256 duration
) external payable returns (uint256 loanId)
```

**After:**
```solidity
function issueLoan(
    address vaultAddress,
    uint256 loanAmount,
    uint256 duration,
    uint256 targetChainId  // ← NEW PARAMETER
) external payable returns (uint256 loanId)
```

#### Modified Event

**Before:**
```solidity
event LoanIssued(
    address indexed vaultAddress,
    address indexed borrower,
    uint256 indexed loanId,
    uint256 amount,
    uint256 collateral,
    uint256 interestRate,
    uint256 duration
);
```

**After:**
```solidity
event LoanIssued(
    address indexed vaultAddress,
    address indexed borrower,
    uint256 indexed loanId,
    uint256 amount,
    uint256 collateral,
    uint256 interestRate,
    uint256 duration,
    uint256 targetChainId  // ← NEW FIELD
);
```

---

## Supported Chains

### Chain IDs

| Chain | Chain ID | Token | Address |
|-------|----------|-------|---------|
| **Story Protocol** | 1315 | ETH | Native |
| **Base** | 8453 | USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| **Arbitrum** | 42161 | USDC | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |
| **Optimism** | 10 | USDC | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` |
| **Polygon** | 137 | USDC | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` |

**Special Value:**
- `targetChainId = 0` → Same chain (no bridging, user receives ETH on Story Protocol)

---

## Frontend Integration

### Example: Request Loan with Chain Selection

```typescript
import { useContractWrite } from 'wagmi';
import { parseUnits } from 'viem';
import ADLV_ABI from './contracts/abis/ADLV.json';

function LoanRequest() {
  const [selectedChain, setSelectedChain] = useState(8453); // Base
  const [loanAmount, setLoanAmount] = useState('');
  
  const { write: issueLoan } = useContractWrite({
    address: '0x793402b59d2ca4c501EDBa328347bbaF69a59f7b', // ADLV
    abi: ADLV_ABI.abi,
    functionName: 'issueLoan',
    args: [
      vaultAddress,
      parseUnits(loanAmount, 18),
      30 * 24 * 60 * 60, // 30 days
      selectedChain, // ← Target chain ID
    ],
    value: collateralAmount, // 150% of loan
  });

  return (
    <div>
      {/* Chain Selector */}
      <select value={selectedChain} onChange={(e) => setSelectedChain(Number(e.target.value))}>
        <option value={0}>Story Protocol (ETH)</option>
        <option value={8453}>Base (USDC)</option>
        <option value={42161}>Arbitrum (USDC)</option>
        <option value={10}>Optimism (USDC)</option>
        <option value={137}>Polygon (USDC)</option>
      </select>

      {/* Loan Amount */}
      <input
        type="number"
        value={loanAmount}
        onChange={(e) => setLoanAmount(e.target.value)}
        placeholder="Loan amount"
      />

      {/* Submit */}
      <button onClick={() => issueLoan?.()}>
        Request Loan
      </button>
    </div>
  );
}
```

---

## Backend Integration

### Agent Service Changes

The Agent Service now:
1. Listens for `LoanIssued` events
2. Reads `targetChainId` from event
3. If `targetChainId !== 0`, calls Owlto Finance API
4. Monitors bridge transaction status

**Code:**
```typescript
private async handleLoanIssuedEvent(
  vaultAddress: string,
  borrower: string,
  loanId: bigint,
  amount: bigint,
  collateral: bigint,
  interestRate: bigint,
  duration: bigint,
  targetChainId: bigint, // ← NEW PARAMETER
  event: EventLog
): Promise<void> {
  // Skip bridging if same chain
  if (targetChainId === 0n) {
    console.log('✅ Loan issued on same chain. No bridging required.');
    return;
  }

  // Execute cross-chain transfer
  await this.executeCrossChainTransfer({
    recipient: borrower,
    targetChainId: Number(targetChainId),
    tokenAddress: getTokenAddress(targetChainId), // USDC address
    amount: amount.toString(),
    loanId: loanId,
  });
}
```

---

## Owlto Finance Integration

### API Configuration

**Environment Variables:**
```bash
OWLTO_API_URL=https://api.owlto.finance/api/v2/bridge
OWLTO_API_KEY=your_api_key_here
OWLTO_SLIPPAGE=0.5
OWLTO_REFERRAL_CODE=atlas-protocol
```

### API Request Example

```typescript
const response = await fetch(OWLTO_API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OWLTO_API_KEY}`,
  },
  body: JSON.stringify({
    fromChainId: 1315, // Story Protocol
    toChainId: 8453,   // Base
    recipient: borrowerAddress,
    tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
    amount: loanAmount.toString(),
    slippage: '0.5',
    metadata: {
      loanId: loanId.toString(),
      source: 'atlas-protocol',
    },
  }),
});
```

---

## Token Conversion

### How Owlto Converts Tokens

1. **User borrows:** 1 ETH on Story Protocol
2. **Owlto receives:** 1 ETH from Story
3. **Owlto converts:** ETH → USDC at market rate
4. **User receives:** ~$3,000 USDC on Base

**Conversion happens automatically inside Owlto Bridge.**

---

## Testing

### Test Scenarios

#### 1. Same Chain Loan (No Bridge)
```bash
# Call with targetChainId = 0
cast send $ADLV_ADDRESS \
  "issueLoan(address,uint256,uint256,uint256)" \
  $VAULT_ADDRESS \
  1000000000000000000 \
  2592000 \
  0 \
  --value 1500000000000000000 \
  --private-key $PRIVATE_KEY
```

#### 2. Cross-Chain Loan to Base
```bash
# Call with targetChainId = 8453
cast send $ADLV_ADDRESS \
  "issueLoan(address,uint256,uint256,uint256)" \
  $VAULT_ADDRESS \
  1000000000000000000 \
  2592000 \
  8453 \
  --value 1500000000000000000 \
  --private-key $PRIVATE_KEY
```

---

## Deployment Steps

### 1. Update Contract

```bash
cd contracts

# Compile
forge build

# Deploy updated ADLV
forge script script/DeployModular.s.sol:DeployModularScript \
  --rpc-url $RPC_URL \
  --broadcast \
  --private-key $PRIVATE_KEY
```

### 2. Update Agent Service

```bash
cd apps/agent-service

# Update ABI
cp ../../contracts/out/ADLV.sol/ADLV.json contracts/

# Restart service
bun run dev
```

### 3. Update Frontend

```bash
cd apps/frontend

# Update ABI
cp ../../contracts/out/ADLV.sol/ADLV.json src/contracts/abis/

# Add chain selector to UI
# (See Frontend Integration section above)
```

---

## FAQ

### Q: What if Owlto Bridge fails?

**A:** The loan is still issued on Story Protocol. User receives ETH on Story. They can manually bridge later.

### Q: What tokens can users receive?

**A:** Depends on target chain:
- Base: USDC, ETH
- Arbitrum: USDC, ETH
- Optimism: USDC, ETH
- Polygon: USDC, MATIC

### Q: How long does bridging take?

**A:** Typically 1-5 minutes depending on chain congestion.

### Q: What are the fees?

**A:** 
- Story Protocol: Gas fees (~$0.01)
- Owlto Bridge: 0.1-0.3% of amount
- Total: ~$1-5 for typical loan

### Q: Can users choose the token?

**A:** Currently defaults to USDC on destination chain. Can be made configurable in future versions.

---

## Summary

✅ **Contract Updated:** Added `targetChainId` parameter  
✅ **Event Updated:** Added `targetChainId` field  
✅ **Agent Service Updated:** Reads chain from event  
✅ **Owlto Integration:** Automatic bridging  
✅ **Token Conversion:** ETH → USDC automatic  

**Users can now borrow on Story Protocol and receive funds on any supported chain!** 🌉

---

**Last Updated:** November 30, 2024  
**Version:** 2.0.0  
**Status:** Ready for Testing
