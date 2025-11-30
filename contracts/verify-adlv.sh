#!/bin/bash

# Verify ADLV Contract on Story Protocol Explorer

set -e

if [ -z "$1" ]; then
    echo "Usage: ./verify-adlv.sh <ADLV_ADDRESS>"
    exit 1
fi

ADLV_ADDRESS=$1

# Load environment
source .env

if [ -z "$IDO_V3" ]; then
    echo "❌ Error: IDO_V3 not set in .env"
    exit 1
fi

RPC_URL="https://rpc-storyevm-testnet.aldebaranode.xyz"
CHAIN_ID=1315

echo "=========================================="
echo "Verifying ADLV Contract"
echo "=========================================="
echo "ADLV Address: $ADLV_ADDRESS"
echo "IDO Address: $IDO_V3"
echo "Chain ID: $CHAIN_ID"
echo ""

# Encode constructor arguments
CONSTRUCTOR_ARGS=$(cast abi-encode "constructor(address)" $IDO_V3)

echo "Constructor Args: $CONSTRUCTOR_ARGS"
echo ""

# Verify
echo "🔍 Verifying contract..."
forge verify-contract \
    $ADLV_ADDRESS \
    src/ADLV.sol:ADLV \
    --chain-id $CHAIN_ID \
    --constructor-args $CONSTRUCTOR_ARGS \
    --watch

echo ""
echo "✅ Verification complete!"
echo ""
echo "View on Explorer:"
echo "https://aeneid.storyscan.io/address/$ADLV_ADDRESS"
echo ""
