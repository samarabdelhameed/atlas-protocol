#!/bin/bash

# Script to test Agent Service integration

set -e

echo "=========================================="
echo "Atlas Protocol - Integration Test"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please run: ./scripts/update-env.sh first"
    exit 1
fi

# Load environment variables
source .env

# Check required variables
if [ -z "$ADLV_ADDRESS" ] || [ "$ADLV_ADDRESS" == "0x..." ]; then
    echo "❌ Error: ADLV_ADDRESS not set in .env"
    exit 1
fi

if [ -z "$IDO_ADDRESS" ] || [ "$IDO_ADDRESS" == "0x..." ]; then
    echo "❌ Error: IDO_ADDRESS not set in .env"
    exit 1
fi

if [ -z "$RPC_URL" ]; then
    echo "❌ Error: RPC_URL not set in .env"
    exit 1
fi

echo "✅ Environment variables loaded"
echo "   ADLV Address: $ADLV_ADDRESS"
echo "   IDO Address: $IDO_ADDRESS"
echo "   RPC URL: $RPC_URL"
echo ""

# Check if contracts are accessible
echo "Testing contract connectivity..."
echo ""

# Test RPC connection
echo "1. Testing RPC connection..."
if curl -s -X POST "$RPC_URL" -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null; then
    echo "   ✅ RPC connection successful"
else
    echo "   ❌ RPC connection failed"
    exit 1
fi

# Test contract addresses (basic validation)
echo "2. Validating contract addresses..."
if [[ "$ADLV_ADDRESS" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo "   ✅ ADLV address format valid"
else
    echo "   ❌ ADLV address format invalid"
    exit 1
fi

if [[ "$IDO_ADDRESS" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo "   ✅ IDO address format valid"
else
    echo "   ❌ IDO address format invalid"
    exit 1
fi

echo ""
echo "✅ All checks passed!"
echo ""
echo "📝 Next steps:"
echo "1. Start Agent Service: bun run dev"
echo "2. Monitor logs for contract events"
echo "3. Test loan issuance from frontend"
echo "4. Test license sales from frontend"
echo ""

