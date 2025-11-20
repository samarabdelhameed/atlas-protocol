#!/bin/bash

# Script to check if .env file has all required variables before deployment

set -e

echo "=========================================="
echo "Checking .env file configuration..."
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo ""
    echo "Please create .env file:"
    echo "  cp .env.example .env"
    echo "  # Then edit .env and fill in your values"
    exit 1
fi

# Load .env
source .env

# Required variables
REQUIRED_VARS=("PRIVATE_KEY" "STORY_PROTOCOL_RPC")
MISSING_VARS=()

# Check required variables
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ] || [ "${!var}" == "your_${var,,}_here"* ] || [ "${!var}" == "0x0000000000000000000000000000000000000000" ]; then
        MISSING_VARS+=("$var")
    fi
done

# Check PRIVATE_KEY format
if [ -n "$PRIVATE_KEY" ]; then
    if [[ "$PRIVATE_KEY" == 0x* ]]; then
        echo "⚠️  Warning: PRIVATE_KEY should not have 0x prefix"
        echo "   Remove 0x from your private key"
    fi
    
    # Check if it's a valid hex string
    if ! [[ "$PRIVATE_KEY" =~ ^[0-9a-fA-F]{64}$ ]]; then
        echo "⚠️  Warning: PRIVATE_KEY format may be incorrect"
        echo "   Should be 64 hex characters (without 0x)"
    fi
fi

# Display results
if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    echo "✅ All required variables are set"
    echo ""
    echo "Required variables:"
    for var in "${REQUIRED_VARS[@]}"; do
        value="${!var}"
        # Mask sensitive values
        if [ "$var" == "PRIVATE_KEY" ]; then
            masked="${value:0:8}...${value: -8}"
            echo "   ✅ $var=$masked"
        else
            echo "   ✅ $var=$value"
        fi
    done
else
    echo "❌ Missing or invalid required variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Please update your .env file with valid values"
    exit 1
fi

echo ""

# Optional but recommended variables
OPTIONAL_VARS=("ETHERSCAN_API_KEY" "CHAIN_ID")
echo "Optional variables (recommended):"
for var in "${OPTIONAL_VARS[@]}"; do
    if [ -z "${!var}" ] || [ "${!var}" == "your_${var,,}_here"* ]; then
        echo "   ⚠️  $var (not set - verification may not work)"
    else
        echo "   ✅ $var=${!var}"
    fi
done

echo ""

# Check deployer address
if [ -n "$PRIVATE_KEY" ]; then
    echo "Checking deployer address..."
    DEPLOYER=$(cast wallet address --private-key "$PRIVATE_KEY" 2>/dev/null || echo "")
    if [ -n "$DEPLOYER" ]; then
        echo "   ✅ Deployer address: $DEPLOYER"
        
        # Check balance if RPC is set
        if [ -n "$STORY_PROTOCOL_RPC" ]; then
            BALANCE=$(cast balance "$DEPLOYER" --rpc-url "$STORY_PROTOCOL_RPC" 2>/dev/null || echo "0")
            BALANCE_ETH=$(cast --to-unit "$BALANCE" ether 2>/dev/null || echo "0")
            echo "   💰 Balance: $BALANCE_ETH ETH"
            
            if [ "$BALANCE" == "0" ] || [ -z "$BALANCE" ]; then
                echo "   ⚠️  Warning: Deployer account has no balance!"
                echo "      Please fund your account before deploying"
            fi
        fi
    else
        echo "   ⚠️  Could not derive deployer address from PRIVATE_KEY"
    fi
fi

echo ""
echo "=========================================="
echo "Environment check complete!"
echo "=========================================="
echo ""

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    echo "✅ Ready to deploy!"
    echo ""
    echo "Next steps:"
    echo "  1. Run: forge build"
    echo "  2. Run: ./scripts/deploy-to-story.sh"
    echo "   Or: forge script script/Deploy.s.sol:DeployScript \\"
    echo "       --rpc-url \$STORY_PROTOCOL_RPC \\"
    echo "       --broadcast \\"
    echo "       --private-key \$PRIVATE_KEY \\"
    echo "       -vvvv"
else
    echo "❌ Please fix the issues above before deploying"
    exit 1
fi

