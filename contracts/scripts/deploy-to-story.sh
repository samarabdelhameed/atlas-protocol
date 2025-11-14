#!/bin/bash

# Atlas Protocol - Story Protocol Deployment using Deploy.s.sol
# This script deploys IDO and ADLV contracts to Story Protocol testnet using Deploy.s.sol

set -e

echo "=========================================="
echo "Atlas Protocol - Story Protocol Deployment"
echo "Using Deploy.s.sol script"
echo "=========================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with PRIVATE_KEY and STORY_PROTOCOL_RPC"
    exit 1
fi

# Load environment variables
source .env

# Check required variables
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY not set in .env"
    exit 1
fi

if [ -z "$STORY_PROTOCOL_RPC" ]; then
    echo "❌ Error: STORY_PROTOCOL_RPC not set in .env"
    echo "Please add STORY_PROTOCOL_RPC to your .env file"
    exit 1
fi

echo "✅ Environment variables loaded"
echo "   RPC URL: $STORY_PROTOCOL_RPC"
echo ""

# Build contracts
echo "Building contracts..."
forge build
echo "✅ Contracts built successfully"
echo ""

# Deploy contracts using Deploy.s.sol
echo "Deploying contracts to Story Protocol testnet using Deploy.s.sol..."
echo ""

forge script script/Deploy.s.sol:DeployScript \
    --rpc-url "$STORY_PROTOCOL_RPC" \
    --broadcast \
    --private-key "$PRIVATE_KEY" \
    -vvvv 2>&1 | tee deployment.log

echo ""
echo "=========================================="
echo "✅ Deployment completed!"
echo "=========================================="
echo ""

# Extract contract addresses from log
IDO_ADDRESS=$(grep "IDO Contract:" deployment.log | tail -1 | awk -F': ' '{print $2}' | tr -d ' ' || echo "")
ADLV_ADDRESS=$(grep "ADLV Contract:" deployment.log | tail -1 | awk -F': ' '{print $2}' | tr -d ' ' || echo "")

if [ -n "$IDO_ADDRESS" ] && [ -n "$ADLV_ADDRESS" ]; then
    echo "📋 Contract Addresses:"
    echo "   IDO Contract: $IDO_ADDRESS"
    echo "   ADLV Contract: $ADLV_ADDRESS"
    echo ""
    
    # Save addresses to file
    echo "IDO_ADDRESS=$IDO_ADDRESS" > deployed_addresses.env
    echo "ADLV_ADDRESS=$ADLV_ADDRESS" >> deployed_addresses.env
    echo "RPC_URL=$STORY_PROTOCOL_RPC" >> deployed_addresses.env
    echo "NETWORK=Story Protocol Testnet" >> deployed_addresses.env
    echo "✅ Addresses saved to deployed_addresses.env"
    echo ""
    
    # Explorer links - Story Protocol testnet
    EXPLORER_BASE="https://testnet.storyscan.xyz"
    echo "🔗 Explorer Links:"
    echo "   IDO: $EXPLORER_BASE/address/$IDO_ADDRESS"
    echo "   ADLV: $EXPLORER_BASE/address/$ADLV_ADDRESS"
    echo ""
fi

echo "📝 Next steps:"
echo "1. Copy the contract addresses from above"
echo "2. Update apps/agent-service/.env with:"
echo "   - ADLV_ADDRESS=$ADLV_ADDRESS"
echo "   - IDO_ADDRESS=$IDO_ADDRESS"
echo "   - RPC_URL=$STORY_PROTOCOL_RPC"
echo "   - CHAIN_ID=<story_protocol_chain_id>"
echo "3. Start Agent Service: cd apps/agent-service && bun run dev"
echo ""

