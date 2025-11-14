# Atlas Protocol Contract Deployment Guide

## Prerequisites

1. Install Foundry: https://book.getfoundry.sh/getting-started/installation
2. Set up environment variables
3. Fund your deployer wallet

## Environment Setup

Create a `.env` file in the `contracts/` directory:

```bash
# Deployer private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# For Story Protocol deployment
STORY_PROTOCOL_RPC=https://your-story-protocol-rpc-url

# For other networks (optional)
RPC_URL=https://mainnet.base.org
```

## Deployment Scripts

### 1. Standard Deployment (Deploy.s.sol)

Deploys to the network specified in your `foundry.toml` or via `--rpc-url`:

```bash
# Deploy to Base Mainnet
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://mainnet.base.org \
  --broadcast \
  --verify \
  -vvvv

# Deploy to Base Sepolia (testnet)
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://sepolia.base.org \
  --broadcast \
  --verify \
  -vvvv
```

### 2. Story Protocol Deployment (DeployToStory.s.sol)

Specifically for Story Protocol testnet:

```bash
forge script script/DeployToStory.s.sol:DeployToStoryScript \
  --rpc-url $STORY_PROTOCOL_RPC \
  --broadcast \
  -vvvv
```

## Deployment Steps

### Step 1: Prepare Environment

```bash
cd contracts

# Load environment variables
source .env

# Verify private key is set
echo $PRIVATE_KEY
```

### Step 2: Build Contracts

```bash
forge build
```

### Step 3: Run Deployment Script

```bash
# For Story Protocol
forge script script/DeployToStory.s.sol:DeployToStoryScript \
  --rpc-url $STORY_PROTOCOL_RPC \
  --broadcast \
  --private-key $PRIVATE_KEY \
  -vvvv

# For other networks
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $RPC_URL \
  --broadcast \
  --private-key $PRIVATE_KEY \
  -vvvv
```

### Step 4: Verify Contracts (Optional)

```bash
# Add --verify flag with Etherscan API key
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv
```

### Step 5: Update Environment Variables

After deployment, update your `.env` files:

```bash
# In contracts/.env (for future deployments)
IDO_ADDRESS=0x...
ADLV_ADDRESS=0x...

# In apps/agent-service/.env
IDO_ADDRESS=0x...
ADLV_ADDRESS=0x...
RPC_URL=https://your-rpc-url
CHAIN_ID=your_chain_id
```

## What Gets Deployed

1. **IDO Contract** (IP Data Oracle)
   - Manages CVS scores
   - Tracks license revenue
   - Owned by ADLV after deployment

2. **ADLV Contract** (Automated Data Licensing Vault)
   - Manages vaults and loans
   - Handles revenue distribution
   - References IDO contract

3. **Ownership Transfer**
   - IDO ownership transferred from deployer to ADLV
   - This allows ADLV to update CVS scores

## Verification

After deployment, verify the setup:

```bash
# Check IDO owner (should be ADLV address)
cast call $IDO_ADDRESS "owner()" --rpc-url $RPC_URL

# Check ADLV IDO reference
cast call $ADLV_ADDRESS "idoContract()" --rpc-url $RPC_URL
```

## Troubleshooting

### Error: "PRIVATE_KEY not set"
- Make sure `.env` file exists in `contracts/` directory
- Verify `PRIVATE_KEY` is set without `0x` prefix

### Error: "Insufficient funds"
- Fund your deployer wallet with native tokens
- Check balance: `cast balance $DEPLOYER_ADDRESS --rpc-url $RPC_URL`

### Error: "Contract verification failed"
- Make sure Etherscan API key is correct
- Wait a few minutes after deployment before verifying
- Some networks may not support verification

## Post-Deployment Checklist

- [ ] Contracts deployed successfully
- [ ] IDO ownership transferred to ADLV
- [ ] Contract addresses saved to `.env`
- [ ] Agent Service `.env` updated
- [ ] Contracts verified on block explorer (if applicable)
- [ ] Test contract interactions

## Next Steps

After deployment:

1. Update Agent Service configuration with contract addresses
2. Start Agent Service: `cd apps/agent-service && bun run dev`
3. Test contract interactions
4. Monitor events and transactions

