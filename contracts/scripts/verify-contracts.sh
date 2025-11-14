#!/bin/bash

# Script to verify deployed contracts

set -e

if [ $# -lt 3 ]; then
    echo "Usage: ./verify-contracts.sh <IDO_ADDRESS> <ADLV_ADDRESS> <RPC_URL> [CHAIN_ID] [API_KEY]"
    echo ""
    echo "Example:"
    echo "  ./verify-contracts.sh 0x1234... 0x5678... https://mainnet.base.org 8453 YOUR_API_KEY"
    exit 1
fi

IDO_ADDRESS=$1
ADLV_ADDRESS=$2
RPC_URL=$3
CHAIN_ID=${4:-8453}
API_KEY=${5:-""}

echo "=========================================="
echo "Contract Verification"
echo "=========================================="
echo "IDO Address: $IDO_ADDRESS"
echo "ADLV Address: $ADLV_ADDRESS"
echo "RPC URL: $RPC_URL"
echo "Chain ID: $CHAIN_ID"
echo "=========================================="
echo ""

# Check if contracts are accessible
echo "1. Checking contract accessibility..."
IDO_OWNER=$(cast call "$IDO_ADDRESS" "owner()" --rpc-url "$RPC_URL" 2>/dev/null || echo "ERROR")
ADLV_IDO=$(cast call "$ADLV_ADDRESS" "idoContract()" --rpc-url "$RPC_URL" 2>/dev/null || echo "ERROR")

if [ "$IDO_OWNER" != "ERROR" ]; then
    echo "   ✅ IDO contract accessible"
    echo "      Owner: $IDO_OWNER"
else
    echo "   ❌ IDO contract not accessible"
fi

if [ "$ADLV_IDO" != "ERROR" ]; then
    echo "   ✅ ADLV contract accessible"
    echo "      IDO Reference: $ADLV_IDO"
else
    echo "   ❌ ADLV contract not accessible"
fi

echo ""

# Verify setup
if [ "$IDO_OWNER" != "ERROR" ] && [ "$ADLV_IDO" != "ERROR" ]; then
    if [ "$IDO_OWNER" == "$ADLV_ADDRESS" ]; then
        echo "✅ IDO ownership correctly set to ADLV"
    else
        echo "⚠️  Warning: IDO owner ($IDO_OWNER) does not match ADLV address"
    fi
    
    if [ "$ADLV_IDO" == "$IDO_ADDRESS" ]; then
        echo "✅ ADLV correctly references IDO contract"
    else
        echo "⚠️  Warning: ADLV IDO reference ($ADLV_IDO) does not match IDO address"
    fi
fi

echo ""

# Generate verification commands if API key provided
if [ -n "$API_KEY" ]; then
    echo "2. Verification Commands:"
    echo ""
    echo "   # Verify IDO contract"
    echo "   forge verify-contract \\"
    echo "     $IDO_ADDRESS \\"
    echo "     src/IDO.sol:IDO \\"
    echo "     --chain-id $CHAIN_ID \\"
    echo "     --rpc-url $RPC_URL \\"
    echo "     --etherscan-api-key $API_KEY \\"
    echo "     --constructor-args \$(cast abi-encode \"constructor(address)\" <DEPLOYER_ADDRESS>)"
    echo ""
    echo "   # Verify ADLV contract"
    echo "   forge verify-contract \\"
    echo "     $ADLV_ADDRESS \\"
    echo "     src/ADLV.sol:ADLV \\"
    echo "     --chain-id $CHAIN_ID \\"
    echo "     --rpc-url $RPC_URL \\"
    echo "     --etherscan-api-key $API_KEY \\"
    echo "     --constructor-args \$(cast abi-encode \"constructor(address)\" $IDO_ADDRESS)"
    echo ""
else
    echo "2. To verify contracts, provide API_KEY as 5th argument"
fi

echo ""
echo "=========================================="
echo "Verification Complete"
echo "=========================================="

