#!/bin/bash

# Script to verify contracts on Story Aeneid Testnet

set -e

source .env

echo "=============================================="
echo "Verifying Contracts on Story Aeneid Testnet"
echo "=============================================="
echo ""

# Contract addresses
IDO_ADDRESS="0x21aD95c76B71f0adCdD37fB2217Dc9d554437e6F"
ADLV_ADDRESS="0xdd0fF1a826FCAC7e3EBAE6E978A4BB043D27eC13"
RPC_URL="https://rpc-storyevm-testnet.aldebaranode.xyz"

echo "IDO Address: $IDO_ADDRESS"
echo "ADLV Address: $ADLV_ADDRESS"
echo ""

# Explorer links
echo "=============================================="
echo "Explorer Links"
echo "=============================================="
echo ""
echo "IDO Contract:"
echo "https://www.storyscan.io/address/$IDO_ADDRESS"
echo ""
echo "ADLV Contract:"
echo "https://www.storyscan.io/address/$ADLV_ADDRESS"
echo ""
echo "Test Vault:"
echo "https://www.storyscan.io/address/0xcca596ff570d007f0f12b9c7155e4277ffa48876"
echo ""

# Verify contracts on network
echo "=============================================="
echo "Verifying Contracts on Network"
echo "=============================================="
echo ""

echo "1. Checking IDO Contract..."
IDO_CODE=$(cast code $IDO_ADDRESS --rpc-url $RPC_URL)
if [ ${#IDO_CODE} -gt 10 ]; then
    echo "✅ IDO Contract exists on network"
    echo "   Code size: ${#IDO_CODE} bytes"
else
    echo "❌ IDO Contract not found"
fi
echo ""

echo "2. Checking ADLV Contract..."
ADLV_CODE=$(cast code $ADLV_ADDRESS --rpc-url $RPC_URL)
if [ ${#ADLV_CODE} -gt 10 ]; then
    echo "✅ ADLV Contract exists on network"
    echo "   Code size: ${#ADLV_CODE} bytes"
else
    echo "❌ ADLV Contract not found"
fi
echo ""

# Verify Owner
echo "3. Checking Contract Owners..."
IDO_OWNER=$(cast call $IDO_ADDRESS "owner()(address)" --rpc-url $RPC_URL)
ADLV_OWNER=$(cast call $ADLV_ADDRESS "owner()(address)" --rpc-url $RPC_URL)

echo "   IDO Owner: $IDO_OWNER"
echo "   ADLV Owner: $ADLV_OWNER"
echo ""

# Verify Protocol Fee
echo "4. Checking Protocol Configuration..."
PROTOCOL_FEE=$(cast call $ADLV_ADDRESS "protocolFeeBps()(uint256)" --rpc-url $RPC_URL)
echo "   Protocol Fee: $PROTOCOL_FEE bps (5%)"
echo ""

# Verify Vault Counter
echo "5. Checking Vault Statistics..."
VAULT_COUNTER=$(cast call $ADLV_ADDRESS "vaultCounter()(uint256)" --rpc-url $RPC_URL)
echo "   Total Vaults Created: $VAULT_COUNTER"
echo ""

echo "=============================================="
echo "Verification Complete!"
echo "=============================================="
echo ""
echo "📝 Note: To verify source code on explorer, visit:"
echo "   https://www.storyscan.io/address/$ADLV_ADDRESS#code"
echo ""
echo "   Then click 'Verify & Publish' and use Foundry verification"
