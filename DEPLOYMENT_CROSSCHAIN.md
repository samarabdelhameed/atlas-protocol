# 🚀 Cross-Chain ADLV Deployment Guide

## Quick Links

### Deployment Scripts
- **Deploy Script:** [`contracts/deploy-adlv-crosschain.sh`](contracts/deploy-adlv-crosschain.sh)
- **Verify Script:** [`contracts/verify-adlv.sh`](contracts/verify-adlv.sh)
- **Solidity Script:** [`contracts/script/DeployADLVOnly.s.sol`](contracts/script/DeployADLVOnly.s.sol)

### Documentation
- **Integration Guide:** [`contracts/CROSS_CHAIN_INTEGRATION.md`](contracts/CROSS_CHAIN_INTEGRATION.md)
- **Contracts README:** [`contracts/README.md`](contracts/README.md)

---

## 📍 Current Deployment (v3.0)

### Story Aeneid Testnet (Chain ID: 1315)

| Contract | Address | Status | Explorer |
|----------|---------|--------|----------|
| **IDO (v3)** | `0xeF83DB9b011261Ad3a76ccE8B7E54B2c055300D8` | ✅ Active | [View](https://aeneid.storyscan.io/address/0xeF83DB9b011261Ad3a76ccE8B7E54B2c055300D8) |
| **ADLV (v3)** | `0x793402b59d2ca4c501EDBa328347bbaF69a59f7b` | ⚠️ Old (No Cross-Chain) | [View](https://aeneid.storyscan.io/address/0x793402b59d2ca4c501EDBa328347bbaF69a59f7b) |
| **ADLV (v4)** | `TBD - Deploy New` | 🔄 Pending | - |

**Network Info:**
- RPC URL: `https://rpc-storyevm-testnet.aldebaranode.xyz`
- Explorer: `https://aeneid.storyscan.io`
- Faucet: `https://faucet.story.foundation`

---

## 🎯 Why Deploy New ADLV?

### What Changed?

**Old Function (v3):**
```solidity
function issueLoan(
    address vaultAddress,
    uint256 loanAmount,
    uint256 duration
) external payable returns (uint256 loanId)
```

**New Function (v4 - Cross-Chain):**
```solidity
function issueLoan(
    address vaultAddress,
    uint256 loanAmount,
    uint256 duration,
    uint256 targetChainId  // ← NEW PARAMETER
) external payable returns (uint256 loanId)
```

**Event Updated:**
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

### Why Not Upgrade?

- ADLV is **not upgradeable** (no proxy pattern)
- Function signature changed → **incompatible** with old contract
- Must deploy **new contract** with new code

---

## 📋 Pre-Deployment Checklist

### 1. Check Environment

```bash
cd contracts

# Verify .env file exists
cat .env | grep -E "PRIVATE_KEY|IDO_V3"
```

**Required Variables:**
- ✅ `PRIVATE_KEY` - Your deployer wallet private key
- ✅ `IDO_V3` - Existing IDO contract address (`0xeF83DB9b011261Ad3a76ccE8B7E54B2c055300D8`)

### 2. Check Wallet Balance

```bash
# Check deployer balance
cast balance $ADDRESS --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
```

**Required:** At least 0.01 ETH for deployment + gas

**Get Testnet ETH:**
- Faucet: https://faucet.story.foundation

### 3. Verify Build

```bash
# Build contracts
forge build

# Run tests
forge test --match-contract ADLV
```

**Expected:** All tests pass ✅

---

## 🚀 Deployment Steps

### Step 1: Deploy ADLV

```bash
cd contracts

# Run deployment script
./deploy-adlv-crosschain.sh
```

**Expected Output:**
```
==========================================
Deploying ADLV with Cross-Chain Support
==========================================

Network: Story Aeneid Testnet
Chain ID: 1315
RPC URL: https://rpc-storyevm-testnet.aldebaranode.xyz
IDO Address: 0xeF83DB9b011261Ad3a76ccE8B7E54B2c055300D8

🚀 Deploying ADLV...

===========================================
Deployment Complete!
===========================================
ADLV Address: 0x... (NEW ADDRESS)

Update your .env files:
ADLV_V3=0x...
VITE_ADLV_CONTRACT_ADDRESS=0x...
```

**Save the new ADLV address!** ⚠️

---

### Step 2: Update Environment Files

#### contracts/.env
```bash
# Update ADLV_V3 with new address
ADLV_V3=0x... (NEW ADDRESS)
```

#### apps/agent-service/.env
```bash
# Update ADLV_ADDRESS
ADLV_ADDRESS=0x... (NEW ADDRESS)
```

#### apps/frontend/.env
```bash
# Update VITE_ADLV_CONTRACT_ADDRESS
VITE_ADLV_CONTRACT_ADDRESS=0x... (NEW ADDRESS)
```

---

### Step 3: Verify Contract

```bash
cd contracts

# Verify on Story Explorer
./verify-adlv.sh 0x... (NEW ADDRESS)
```

**Expected Output:**
```
==========================================
Verifying ADLV Contract
==========================================
ADLV Address: 0x...
IDO Address: 0xeF83DB9b011261Ad3a76ccE8B7E54B2c055300D8
Chain ID: 1315

Constructor Args: 0x...

🔍 Verifying contract...

✅ Verification complete!

View on Explorer:
https://aeneid.storyscan.io/address/0x...
```

---

### Step 4: Update ABIs

```bash
# Update Agent Service ABI
cd contracts
cat out/ADLV.sol/ADLV.json | jq '.abi' > ../apps/agent-service/contracts/ADLV.json

# Update Frontend ABI
cp out/ADLV.sol/ADLV.json ../apps/frontend/src/contracts/abis/ADLV.json
```

---

### Step 5: Test Integration

#### Test Agent Service

```bash
cd apps/agent-service

# Restart service
bun run dev
```

**Check logs for:**
```
✅ LoanManager initialized
   ADLV Contract: 0x... (NEW ADDRESS)
   IDO Contract: 0xeF83DB9b011261Ad3a76ccE8B7E54B2c055300D8
```

#### Test Frontend

```bash
cd apps/frontend

# Rebuild
bun run build

# Start dev server
bun run dev
```

**Test:**
1. Connect wallet
2. Go to Loans page
3. Select target chain (Base, Arbitrum, etc.)
4. Request loan
5. Check transaction on explorer

---

## ✅ Post-Deployment Verification

### 1. Check Contract on Explorer

Visit: `https://aeneid.storyscan.io/address/<NEW_ADLV_ADDRESS>`

**Verify:**
- ✅ Contract is verified (source code visible)
- ✅ Read/Write functions available
- ✅ `issueLoan` function has 4 parameters
- ✅ Constructor shows IDO address

### 2. Test Contract Functions

```bash
# Check IDO reference
cast call <NEW_ADLV_ADDRESS> "idoContract()(address)" \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz

# Expected: 0xeF83DB9b011261Ad3a76ccE8B7E54B2c055300D8
```

### 3. Create Test Vault

```bash
# Create vault
cast send <NEW_ADLV_ADDRESS> \
  "createVault(bytes32)" \
  0x1234567890123456789012345678901234567890123456789012345678901234 \
  --private-key $PRIVATE_KEY \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
```

### 4. Test Loan Issuance

```bash
# Issue loan with cross-chain (targetChainId = 8453 for Base)
cast send <NEW_ADLV_ADDRESS> \
  "issueLoan(address,uint256,uint256,uint256)" \
  <VAULT_ADDRESS> \
  1000000000000000000 \
  2592000 \
  8453 \
  --value 1500000000000000000 \
  --private-key $PRIVATE_KEY \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
```

**Check:**
- ✅ Transaction succeeds
- ✅ LoanIssued event emitted with targetChainId
- ✅ Agent Service detects event and logs target chain

---

## 🔧 Troubleshooting

### Issue: Deployment Fails

**Error:** `insufficient funds for gas * price + value`

**Solution:**
```bash
# Get testnet ETH from faucet
# Visit: https://faucet.story.foundation
```

---

### Issue: Verification Fails

**Error:** `Contract source code already verified`

**Solution:**
- Contract already verified ✅
- Check explorer: `https://aeneid.storyscan.io/address/<ADDRESS>`

---

### Issue: Frontend Transaction Fails

**Error:** `Wrong argument count for function call`

**Solution:**
```bash
# Update frontend ABI
cd contracts
cp out/ADLV.sol/ADLV.json ../apps/frontend/src/contracts/abis/ADLV.json

# Rebuild frontend
cd ../apps/frontend
bun run build
```

---

### Issue: Agent Service Not Detecting Events

**Solution:**
```bash
# Check ADLV address in .env
cat apps/agent-service/.env | grep ADLV_ADDRESS

# Should match new deployed address
# If not, update and restart:
bun run dev
```

---

## 📊 Deployment Summary Template

**Copy this after deployment:**

```
===========================================
ADLV Cross-Chain Deployment Summary
===========================================

Network: Story Aeneid Testnet
Chain ID: 1315
Deployed: [DATE]

Contract Addresses:
- IDO (v3): 0xeF83DB9b011261Ad3a76ccE8B7E54B2c055300D8
- ADLV (v4): 0x... [NEW ADDRESS]

Explorer Links:
- ADLV: https://aeneid.storyscan.io/address/0x...
- IDO: https://aeneid.storyscan.io/address/0xeF83DB9b011261Ad3a76ccE8B7E54B2c055300D8

Verification Status:
- ADLV: ✅ Verified
- IDO: ✅ Verified

Features:
- ✅ Cross-chain loan disbursement
- ✅ Owlto Finance integration
- ✅ Target chain selection (Base, Arbitrum, Optimism, etc.)

Updated Files:
- contracts/.env
- apps/agent-service/.env
- apps/frontend/.env
- apps/agent-service/contracts/ADLV.json
- apps/frontend/src/contracts/abis/ADLV.json

Next Steps:
1. Test loan issuance with different chains
2. Monitor Agent Service logs for Owlto bridge calls
3. Update documentation with new address
===========================================
```

---

## 📚 Additional Resources

- **Cross-Chain Integration Guide:** [CROSS_CHAIN_INTEGRATION.md](contracts/CROSS_CHAIN_INTEGRATION.md)
- **Contracts README:** [contracts/README.md](contracts/README.md)
- **Story Protocol Docs:** https://docs.story.foundation
- **Owlto Finance Docs:** https://docs.owlto.finance

---

**Last Updated:** November 30, 2024  
**Version:** 4.0.0 (Cross-Chain)  
**Status:** Ready for Deployment
