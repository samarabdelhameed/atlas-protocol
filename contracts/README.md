# Atlas Protocol Contracts

Smart contracts for Atlas Protocol - IP-backed lending and licensing platform.

## Quick Start

### 1. Setup Environment

```bash
cp .env.example .env
# Edit .env and add your PRIVATE_KEY
```

### 2. Build Contracts

```bash
forge build
```

### 3. Deploy to Story Protocol Testnet

```bash
# Using deployment script
./scripts/deploy-to-story.sh

# Or manually
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $STORY_PROTOCOL_RPC \
  --broadcast \
  --private-key $PRIVATE_KEY \
  -vvvv
```

### 4. Verify Contracts (Optional)

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $STORY_PROTOCOL_RPC \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --private-key $PRIVATE_KEY \
  -vvvv
```

## Environment Variables

Required:
- `PRIVATE_KEY` - Deployer private key (without 0x prefix)
- `STORY_PROTOCOL_RPC` - Story Protocol Testnet RPC URL

Optional:
- `ETHERSCAN_API_KEY` - For contract verification
- `STORY_PROTOCOL_API_KEY` - Story Protocol API key (public key included)
- Story Protocol contract addresses (for integration)

See `.env.example` for all available variables.

## Contracts

- **IDO** (`src/IDO.sol`) - IP Data Oracle, manages CVS scores
- **ADLV** (`src/ADLV.sol`) - Automated Data Licensing Vault, manages vaults and loans

## Network

- **Network**: Story Protocol Testnet
- **Chain ID**: 1315
- **RPC URL**: https://rpc-storyevm-testnet.aldebaranode.xyz
- **Explorer**: https://testnet.storyscan.xyz

## Documentation

- [Foundry Book](https://book.getfoundry.sh/)
- [Story Protocol Docs](https://docs.story.foundation/)
