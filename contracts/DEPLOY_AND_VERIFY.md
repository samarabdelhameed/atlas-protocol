# Deploy & Verify Contracts - Quick Reference

## 🔗 Useful Links

### Story Protocol
- **Testnet Explorer**: https://story-testnet.blockscout.com (or check Story Protocol docs)
- **RPC Endpoint**: Get from Story Protocol documentation
- **Faucet**: Check Story Protocol testnet faucet

### Base Network (Alternative)
- **Base Sepolia Explorer**: https://sepolia.basescan.org
- **Base Mainnet Explorer**: https://basescan.org
- **Base RPC**: https://mainnet.base.org
- **Base Sepolia RPC**: https://sepolia.base.org

### Verification Services
- **Blockscout**: For Story Protocol and other EVM chains
- **Etherscan**: For Ethereum and Base networks

---

## 📝 Deployment Commands

### Deploy to Story Protocol Testnet

```bash
cd contracts

# 1. Set environment variables
export PRIVATE_KEY=your_private_key_without_0x
export STORY_PROTOCOL_RPC=https://your-story-protocol-rpc-url

# 2. Deploy using script
forge script script/DeployToStory.s.sol:DeployToStoryScript \
  --rpc-url "$STORY_PROTOCOL_RPC" \
  --broadcast \
  --private-key "$PRIVATE_KEY" \
  -vvvv

# OR use the helper script
./scripts/deploy-story.sh
```

### Deploy to Base Sepolia (Testnet)

```bash
cd contracts

export PRIVATE_KEY=your_private_key_without_0x
export RPC_URL=https://sepolia.base.org

forge script script/Deploy.s.sol:DeployScript \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --private-key "$PRIVATE_KEY" \
  --verify \
  --etherscan-api-key "$BASE_ETHERSCAN_API_KEY" \
  -vvvv
```

### Deploy to Base Mainnet

```bash
cd contracts

export PRIVATE_KEY=your_private_key_without_0x
export RPC_URL=https://mainnet.base.org

forge script script/Deploy.s.sol:DeployScript \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --private-key "$PRIVATE_KEY" \
  --verify \
  --etherscan-api-key "$BASE_ETHERSCAN_API_KEY" \
  -vvvv
```

---

## ✅ Verification Commands

### Verify on Blockscout (Story Protocol)

After deployment, verify using Foundry:

```bash
# Verify IDO contract
forge verify-contract \
  <IDO_CONTRACT_ADDRESS> \
  src/IDO.sol:IDO \
  --chain <chain_id> \
  --rpc-url "$STORY_PROTOCOL_RPC" \
  --etherscan-api-key "$BLOCKSCOUT_API_KEY" \
  --constructor-args $(cast abi-encode "constructor(address)" <DEPLOYER_ADDRESS>)

# Verify ADLV contract
forge verify-contract \
  <ADLV_CONTRACT_ADDRESS> \
  src/ADLV.sol:ADLV \
  --chain <chain_id> \
  --rpc-url "$STORY_PROTOCOL_RPC" \
  --etherscan-api-key "$BLOCKSCOUT_API_KEY" \
  --constructor-args $(cast abi-encode "constructor(address)" <IDO_CONTRACT_ADDRESS>)
```

### Verify on Base (Etherscan)

```bash
# Verify IDO contract
forge verify-contract \
  <IDO_CONTRACT_ADDRESS> \
  src/IDO.sol:IDO \
  --chain-id 8453 \
  --rpc-url https://mainnet.base.org \
  --etherscan-api-key "$BASE_ETHERSCAN_API_KEY" \
  --constructor-args $(cast abi-encode "constructor(address)" <DEPLOYER_ADDRESS>)

# Verify ADLV contract
forge verify-contract \
  <ADLV_CONTRACT_ADDRESS> \
  src/ADLV.sol:ADLV \
  --chain-id 8453 \
  --rpc-url https://mainnet.base.org \
  --etherscan-api-key "$BASE_ETHERSCAN_API_KEY" \
  --constructor-args $(cast abi-encode "constructor(address)" <IDO_CONTRACT_ADDRESS>)
```

### Automatic Verification (During Deployment)

Add `--verify` flag to deployment command:

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --verify \
  --etherscan-api-key "$ETHERSCAN_API_KEY" \
  -vvvv
```

---

## 🔑 Getting API Keys

### Base/Etherscan API Key
1. Go to https://basescan.org
2. Create account
3. Go to API Keys section
4. Create new API key
5. Copy API key

### Blockscout API Key (for Story Protocol)
1. Go to Story Protocol block explorer
2. Create account (if required)
3. Get API key from account settings
4. Use in verification commands

---

## 📋 Post-Deployment Checklist

After deployment, verify:

```bash
# 1. Check IDO owner (should be ADLV address)
cast call <IDO_ADDRESS> "owner()" --rpc-url "$RPC_URL"

# 2. Check ADLV IDO reference
cast call <ADLV_ADDRESS> "idoContract()" --rpc-url "$RPC_URL"

# 3. Verify contracts on explorer
# Visit: https://basescan.org/address/<CONTRACT_ADDRESS>
# Or Story Protocol explorer for Story Protocol deployments
```

---

## 🛠️ Quick Verification Script

Create a file `verify-contracts.sh`:

```bash
#!/bin/bash

IDO_ADDRESS=$1
ADLV_ADDRESS=$2
RPC_URL=$3

echo "Verifying IDO contract..."
cast call "$IDO_ADDRESS" "owner()" --rpc-url "$RPC_URL"

echo "Verifying ADLV contract..."
cast call "$ADLV_ADDRESS" "idoContract()" --rpc-url "$RPC_URL"

echo "✅ Verification complete!"
```

Usage:
```bash
chmod +x verify-contracts.sh
./verify-contracts.sh <IDO_ADDRESS> <ADLV_ADDRESS> <RPC_URL>
```

---

## 📊 Deployment Output Example

After successful deployment, you should see:

```
==========================================
Story Protocol Deployment Summary
==========================================
Network: Story Protocol Testnet
IDO Contract: 0x1234...
ADLV Contract: 0x5678...
IDO Owner: 0x5678... (should match ADLV)
==========================================

Add these addresses to your .env file:
IDO_ADDRESS=0x1234...
ADLV_ADDRESS=0x5678...
STORY_PROTOCOL_RPC=https://...
==========================================
```

---

## 🔍 Explorer Links Template

After deployment, save these links:

```
IDO Contract:
https://explorer-url/address/<IDO_ADDRESS>

ADLV Contract:
https://explorer-url/address/<ADLV_ADDRESS>

First Transaction:
https://explorer-url/tx/<DEPLOYMENT_TX_HASH>
```

---

## ⚠️ Important Notes

1. **Private Key Security**: Never commit `.env` files with real private keys
2. **Test First**: Always deploy to testnet first
3. **Verify Immediately**: Verify contracts right after deployment
4. **Save Addresses**: Keep contract addresses safe
5. **Check Gas**: Ensure wallet has sufficient funds for deployment

---

## 🆘 Troubleshooting

### Verification Fails

- Wait a few minutes after deployment
- Check API key is correct
- Verify constructor arguments match
- Check network/chain ID is correct

### Deployment Fails

- Check private key format (no 0x prefix)
- Verify wallet has sufficient funds
- Check RPC URL is accessible
- Ensure network is correct

---

## 📞 Support

For deployment issues:
1. Check Foundry documentation: https://book.getfoundry.sh
2. Review contract deployment logs
3. Check network explorer for transaction status

