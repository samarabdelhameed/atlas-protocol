# Atlas Protocol - Complete Deployment Guide

## 📋 Overview

This guide walks you through deploying Atlas Protocol contracts to Story Protocol testnet and setting up the Agent Service.

## 🚀 Step 1: Deploy Contracts to Story Protocol

### Prerequisites

1. Install Foundry: https://book.getfoundry.sh/getting-started/installation
2. Fund your deployer wallet with native tokens
3. Get Story Protocol RPC URL

### Setup

```bash
cd contracts

# 1. Create .env file
cp .env.example .env

# 2. Edit .env and add:
#    PRIVATE_KEY=your_private_key_without_0x
#    STORY_PROTOCOL_RPC=https://your-story-protocol-rpc-url
```

### Deploy

**Option A: Using Deploy.s.sol with Story Protocol (Recommended)**

This uses the standard `Deploy.s.sol` script with Story Protocol RPC:

```bash
# Using the deployment script
chmod +x scripts/deploy-to-story.sh
./scripts/deploy-to-story.sh
```

Or manually:

```bash
# Load environment
source .env

# Deploy using Deploy.s.sol
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url "$STORY_PROTOCOL_RPC" \
  --broadcast \
  --private-key "$PRIVATE_KEY" \
  -vvvv
```

**Option B: Using DeployToStory.s.sol**

```bash
# Load environment
source .env

# Deploy
forge script script/DeployToStory.s.sol:DeployToStoryScript \
  --rpc-url "$STORY_PROTOCOL_RPC" \
  --broadcast \
  --private-key "$PRIVATE_KEY" \
  -vvvv
```

### Expected Output

```
==========================================
Atlas Protocol - Story Protocol Deployment
==========================================
Deployer: 0x...
Network: Story Protocol Testnet
==========================================

Deploying IDO contract to Story Protocol...
[OK] IDO deployed at: 0x...
   Owner: 0x...

Deploying ADLV contract to Story Protocol...
[OK] ADLV deployed at: 0x...
   IDO Contract: 0x...

Transferring IDO ownership to ADLV...
[OK] IDO ownership transferred to ADLV
   New IDO Owner: 0x...

[OK] Contract setup verified

==========================================
Story Protocol Deployment Summary
==========================================
IDO Contract: 0x...
ADLV Contract: 0x...
==========================================
```

**📝 Save these addresses!**

---

## 🔧 Step 2: Update Agent Service .env

### Setup

```bash
cd apps/agent-service

# 1. Create .env file
cp .env.example .env

# 2. Update with contract addresses
```

### Option A: Using the update script

```bash
chmod +x scripts/update-env.sh
./scripts/update-env.sh
```

### Option B: Manual update

Edit `.env` and set:

```bash
# Contract Addresses (from deployment)
ADLV_ADDRESS=0x...  # From deployment output
IDO_ADDRESS=0x...   # From deployment output

# RPC Configuration
RPC_URL=https://your-story-protocol-rpc-url
CHAIN_ID=<story_protocol_chain_id>

# Private Key (for signing transactions)
PRIVATE_KEY=0x...

# Optional: API Keys
OWLTO_API_KEY=your_owlto_api_key
ABV_API_KEY=your_abv_api_key
```

---

## ✅ Step 3: Test Integration

### Run Integration Tests

```bash
cd apps/agent-service

chmod +x scripts/test-integration.sh
./scripts/test-integration.sh
```

This will verify:
- ✅ RPC connection
- ✅ Contract address format
- ✅ Environment variables

---

## 🎯 Step 4: Start Agent Service

### Install Dependencies

```bash
cd apps/agent-service
bun install
```

### Start Service

```bash
bun run dev
```

### Expected Output

```
🚀 Initializing Atlas Agent Service...
═══════════════════════════════════════════
✅ Agent Service started successfully
═══════════════════════════════════════════
📡 Services active:
   ✓ CVS Engine - Monitoring collateral values
   ✓ Loan Monitor - Checking for liquidations
   ✓ Subgraph Client - Querying Goldsky
   ✓ IP Data Oracle - Ready for ingestion
   ✓ Loan Manager - IPFi integration ready
   ✓ Licensing Agent - GenAI licensing ready
   ✓ Contract Monitor - Event monitoring ready
═══════════════════════════════════════════

🔍 Starting loan event monitoring...
✅ Loan event monitoring active
🔍 Starting license event monitoring...
✅ License event monitoring active
🔍 Starting contract event monitoring...
✅ Contract monitoring active

🔄 Agent Service running... Press Ctrl+C to stop
```

---

## 🧪 Step 5: Test Integration

### Test 1: Create a Vault

From frontend or via contract interaction:

```typescript
// Example: Create vault for an IP asset
const ipId = "0x..."; // Your IP asset ID
const tx = await adlvContract.createVault(ipId);
```

**Expected in Agent Service logs:**
```
📦 New vault created:
   vaultAddress: 0x...
   ipId: 0x...
   creator: 0x...
```

### Test 2: Sell a License

```typescript
// Example: Sell a license
const tx = await adlvContract.sellLicense(
  vaultAddress,
  "commercial",
  0,
  { value: ethers.parseEther("1.0") }
);
```

**Expected in Agent Service logs:**
```
🎫 LicenseSold Event Detected!
   Vault: 0x...
   IP ID: 0x...
   Price: 1.0 tokens
   License Type: commercial

✅ CVS for 0x... updated successfully to ...
✅ License successfully registered with abv.dev
```

### Test 3: Issue a Loan

```typescript
// Example: Issue a loan
const tx = await adlvContract.issueLoan(
  vaultAddress,
  ethers.parseEther("100"),
  30 * 24 * 60 * 60, // 30 days
  { value: collateralAmount }
);
```

**Expected in Agent Service logs:**
```
🚨 LoanIssued Event Detected!
   Loan ID: 1
   Borrower: 0x...
   Amount: 100 tokens

🌉 Initiating cross-chain transfer via Owlto Finance...
   From Chain: ...
   To Chain: 8453
   Recipient: 0x...

✅ Cross-chain transfer for Loan 1 successfully initiated via Owlto
```

---

## 🔍 Monitoring

### Check Service Status

The Agent Service automatically monitors:
- ✅ Loan events (issuance, repayment, liquidation)
- ✅ License sales
- ✅ CVS updates
- ✅ Revenue collection

### View Logs

All events are logged in real-time. Watch for:
- `🚨 LoanIssued` - New loans
- `🎫 LicenseSold` - License sales
- `📈 CVS Updated` - CVS changes
- `✅ Loan Repaid` - Loan repayments
- `🚨 Loan Liquidated` - Liquidations

---

## 🐛 Troubleshooting

### Contracts Not Deploying

- ✅ Check PRIVATE_KEY is set correctly (without 0x)
- ✅ Verify wallet has sufficient funds
- ✅ Check RPC URL is accessible
- ✅ Ensure network is correct

### Agent Service Not Starting

- ✅ Verify contract addresses in .env
- ✅ Check RPC_URL is correct
- ✅ Ensure PRIVATE_KEY is set (if needed)
- ✅ Check all dependencies installed: `bun install`

### Events Not Detected

- ✅ Verify contracts are deployed
- ✅ Check RPC connection
- ✅ Ensure Agent Service is running
- ✅ Verify contract addresses match deployment

### Cross-Chain Transfer Failing

- ✅ Check OWLTO_API_KEY is set
- ✅ Verify token address is correct
- ✅ Check chain IDs are valid
- ✅ Review Owlto API logs

---

## 📝 Post-Deployment Checklist

- [ ] Contracts deployed to Story Protocol
- [ ] Contract addresses saved
- [ ] Agent Service .env updated
- [ ] Integration tests passed
- [ ] Agent Service running
- [ ] Test vault creation
- [ ] Test license sale
- [ ] Test loan issuance
- [ ] Verify events are detected
- [ ] Check CVS updates
- [ ] Verify cross-chain transfers (if Owlto configured)

---

## 🎉 Success!

If all steps complete successfully, your Atlas Protocol deployment is ready!

The system will now:
- ✅ Monitor all contract events
- ✅ Update CVS automatically
- ✅ Handle cross-chain loan transfers
- ✅ Register licenses with abv.dev
- ✅ Track all protocol activity

---

## 📚 Additional Resources

- [Contract Documentation](../contracts/DEPLOYMENT.md)
- [Agent Service README](./apps/agent-service/README.md)
- [Foundry Documentation](https://book.getfoundry.sh/)

