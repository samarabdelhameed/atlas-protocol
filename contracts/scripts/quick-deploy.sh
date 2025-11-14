#!/bin/bash

# Quick deployment script with automatic verification

set -e

echo "=========================================="
echo "Atlas Protocol - Quick Deploy & Verify"
echo "=========================================="

# Check .env
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Creating from .env.example..."
    cp .env.example .env
    echo "✅ Please edit .env and add:"
    echo "   - PRIVATE_KEY"
    echo "   - STORY_PROTOCOL_RPC (or RPC_URL)"
    exit 1
fi

source .env

# Check required vars
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ PRIVATE_KEY not set in .env"
    exit 1
fi

# Determine network
if [ -n "$STORY_PROTOCOL_RPC" ]; then
    RPC_URL="$STORY_PROTOCOL_RPC"
    SCRIPT="script/DeployToStory.s.sol:DeployToStoryScript"
    NETWORK="Story Protocol"
else
    RPC_URL="${RPC_URL:-https://sepolia.base.org}"
    SCRIPT="script/Deploy.s.sol:DeployScript"
    NETWORK="Base Sepolia"
fi

echo "Network: $NETWORK"
echo "RPC URL: $RPC_URL"
echo ""

# Build
echo "Building contracts..."
forge build
echo "✅ Build successful"
echo ""

# Deploy
echo "Deploying contracts..."
echo ""

forge script "$SCRIPT" \
    --rpc-url "$RPC_URL" \
    --broadcast \
    --private-key "$PRIVATE_KEY" \
    -vvvv | tee deployment.log

echo ""

# Extract addresses from log
IDO_ADDRESS=$(grep "IDO Contract:" deployment.log | tail -1 | awk '{print $3}' || echo "")
ADLV_ADDRESS=$(grep "ADLV Contract:" deployment.log | tail -1 | awk '{print $3}' || echo "")

if [ -z "$IDO_ADDRESS" ] || [ -z "$ADLV_ADDRESS" ]; then
    echo "⚠️  Could not extract addresses from log"
    echo "Please check deployment.log manually"
    exit 1
fi

echo "=========================================="
echo "✅ Deployment Successful!"
echo "=========================================="
echo "IDO Contract: $IDO_ADDRESS"
echo "ADLV Contract: $ADLV_ADDRESS"
echo ""

# Generate explorer links
if [[ "$RPC_URL" == *"story"* ]] || [[ "$RPC_URL" == *"Story"* ]]; then
    # Explorer may not be available - check Story Protocol docs
    EXPLORER_BASE=""
else
    if [[ "$RPC_URL" == *"sepolia"* ]]; then
        EXPLORER_BASE="https://sepolia.basescan.org"
    else
        EXPLORER_BASE="https://basescan.org"
    fi
fi

echo "🔗 Explorer Links:"
echo "   IDO: $EXPLORER_BASE/address/$IDO_ADDRESS"
echo "   ADLV: $EXPLORER_BASE/address/$ADLV_ADDRESS"
echo ""

# Save to file
echo "IDO_ADDRESS=$IDO_ADDRESS" > deployed_addresses.env
echo "ADLV_ADDRESS=$ADLV_ADDRESS" >> deployed_addresses.env
echo "EXPLORER_BASE=$EXPLORER_BASE" >> deployed_addresses.env

echo "✅ Addresses saved to deployed_addresses.env"
echo ""

# Verification prompt
read -p "Do you want to verify contracts now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -z "$ETHERSCAN_API_KEY" ] && [ -z "$BLOCKSCOUT_API_KEY" ]; then
        echo "⚠️  API key not set. Skipping verification."
        echo "   Set ETHERSCAN_API_KEY or BLOCKSCOUT_API_KEY in .env to verify"
    else
        API_KEY="${ETHERSCAN_API_KEY:-$BLOCKSCOUT_API_KEY}"
        CHAIN_ID="${CHAIN_ID:-84532}"
        
        echo "Verifying contracts..."
        echo ""
        
        # Get deployer address
        DEPLOYER=$(cast wallet address --private-key "$PRIVATE_KEY" || echo "")
        
        if [ -n "$DEPLOYER" ]; then
            echo "Verifying IDO..."
            forge verify-contract \
                "$IDO_ADDRESS" \
                src/IDO.sol:IDO \
                --chain-id "$CHAIN_ID" \
                --rpc-url "$RPC_URL" \
                --etherscan-api-key "$API_KEY" \
                --constructor-args $(cast abi-encode "constructor(address)" "$DEPLOYER") \
                2>&1 | tee verify-ido.log || echo "⚠️  IDO verification may have failed"
            
            echo ""
            echo "Verifying ADLV..."
            forge verify-contract \
                "$ADLV_ADDRESS" \
                src/ADLV.sol:ADLV \
                --chain-id "$CHAIN_ID" \
                --rpc-url "$RPC_URL" \
                --etherscan-api-key "$API_KEY" \
                --constructor-args $(cast abi-encode "constructor(address)" "$IDO_ADDRESS") \
                2>&1 | tee verify-adlv.log || echo "⚠️  ADLV verification may have failed"
            
            echo ""
            echo "✅ Verification complete!"
            echo "   Check explorer links above to confirm"
        fi
    fi
fi

echo ""
echo "=========================================="
echo "📝 Next Steps:"
echo "=========================================="
echo "1. Update apps/agent-service/.env:"
echo "   ADLV_ADDRESS=$ADLV_ADDRESS"
echo "   IDO_ADDRESS=$IDO_ADDRESS"
echo "   RPC_URL=$RPC_URL"
echo ""
echo "2. Start Agent Service:"
echo "   cd apps/agent-service && bun run dev"
echo ""
echo "3. Test integration:"
echo "   cd apps/agent-service && ./scripts/test-integration.sh"
echo "=========================================="

