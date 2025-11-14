#!/bin/bash

# Atlas Protocol - Story Protocol Deployment Script
# This script deploys IDO and ADLV contracts to Story Protocol testnet

set -e

echo "=========================================="
echo "Atlas Protocol - Story Protocol Deployment"
echo "=========================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with PRIVATE_KEY and STORY_PROTOCOL_RPC"
    echo "You can copy .env.example as a template"
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

# Deploy contracts
echo "Deploying contracts to Story Protocol testnet..."
echo ""

forge script script/DeployToStory.s.sol:DeployToStoryScript \
    --rpc-url "$STORY_PROTOCOL_RPC" \
    --broadcast \
    --private-key "$PRIVATE_KEY" \
    -vvvv

echo ""
echo "=========================================="
echo "✅ Deployment completed!"
echo "=========================================="
echo ""
echo "📝 Next steps:"
echo "1. Copy the contract addresses from the output above"
echo "2. Update apps/agent-service/.env with:"
echo "   - ADLV_ADDRESS=<deployed_adlv_address>"
echo "   - IDO_ADDRESS=<deployed_ido_address>"
echo "   - RPC_URL=$STORY_PROTOCOL_RPC"
echo "   - CHAIN_ID=<story_protocol_chain_id>"
echo "3. Start Agent Service: cd apps/agent-service && bun run dev"
echo ""

