#!/bin/bash

# Deploy ADLV with Cross-Chain Support
# This script deploys only the ADLV contract with the new targetChainId parameter

set -e

echo "=========================================="
echo "Deploying ADLV with Cross-Chain Support"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    exit 1
fi

# Load environment variables
source .env

# Check required variables
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY not set in .env"
    exit 1
fi

if [ -z "$IDO_V3" ]; then
    echo "❌ Error: IDO_V3 not set in .env"
    exit 1
fi

# Set RPC URL (Story Protocol Testnet)
RPC_URL="https://rpc-storyevm-testnet.aldebaranode.xyz"
CHAIN_ID=1315

echo "Network: Story Aeneid Testnet"
echo "Chain ID: $CHAIN_ID"
echo "RPC URL: $RPC_URL"
echo "IDO Address: $IDO_V3"
echo ""

# Deploy
echo "🚀 Deploying ADLV..."
forge script script/DeployADLVOnly.s.sol:DeployADLVOnlyScript \
    --rpc-url $RPC_URL \
    --broadcast \
    --legacy \
    -vvv

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Copy the ADLV address from above"
echo "2. Update .env files:"
echo "   - contracts/.env: ADLV_V3=<address>"
echo "   - apps/agent-service/.env: ADLV_ADDRESS=<address>"
echo "   - apps/frontend/.env: VITE_ADLV_CONTRACT_ADDRESS=<address>"
echo "3. Run verification script: ./verify-adlv.sh <address>"
echo ""
