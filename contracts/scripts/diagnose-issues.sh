#!/bin/bash

# Diagnostic script to check contract state and explain errors

RPC_URL="https://rpc-storyevm-testnet.aldebaranode.xyz"
IDO_ADDRESS="0x5b7575272cb12317eb5d8e8d9620a9a34a7a3de4"
ADLV_ADDRESS="0xF8C5804Bdf6875EBB6cCf70Fc7f3ee6745Cecd98"
IP_ID="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

echo "=========================================="
echo "Contract State Diagnostics"
echo "=========================================="
echo ""

# Check IDO owner
echo "1. Checking IDO contract owner..."
IDO_OWNER=$(cast call $IDO_ADDRESS "owner()" --rpc-url $RPC_URL 2>/dev/null | cut -c 27-66)
echo "   IDO Owner: $IDO_OWNER"
echo "   ADLV Address: $ADLV_ADDRESS"
if [ "$IDO_OWNER" == "$(echo $ADLV_ADDRESS | tr '[:upper:]' '[:lower:]' | cut -c 3-)" ]; then
    echo "   ✅ IDO is owned by ADLV (correct)"
else
    echo "   ❌ IDO is NOT owned by ADLV"
fi
echo ""

# Check deployer address
DEPLOYER="0xdAFEE25F98Ff62504C1086eAcbb406190F3110D5"
echo "2. Checking deployer address..."
echo "   Deployer: $DEPLOYER"
if [ "$IDO_OWNER" == "$(echo $DEPLOYER | tr '[:upper:]' '[:lower:]' | cut -c 3-)" ]; then
    echo "   ⚠️  Deployer is still the owner (ownership not transferred)"
else
    echo "   ✅ Ownership was transferred (deployer is not owner)"
fi
echo ""

# Check if vault exists for IP ID
echo "3. Checking if vault exists for IP ID..."
echo "   IP ID: $IP_ID"
VAULT_ADDRESS=$(cast call $ADLV_ADDRESS "ipToVault(bytes32)(address)" $IP_ID --rpc-url $RPC_URL 2>/dev/null)
if [ "$VAULT_ADDRESS" == "0x0000000000000000000000000000000000000000" ] || [ -z "$VAULT_ADDRESS" ]; then
    echo "   ✅ No vault exists for this IP ID"
    echo "   You can create a vault with:"
    echo "   cast send $ADLV_ADDRESS \"createVault(bytes32)\" $IP_ID --rpc-url $RPC_URL --private-key YOUR_KEY"
else
    echo "   ❌ Vault already exists: $VAULT_ADDRESS"
    echo "   You cannot create another vault for this IP ID"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "Issue 1: updateCVS() call failed"
echo "  - Reason: Only the IDO owner (ADLV contract) can call updateCVS()"
echo "  - Your address ($DEPLOYER) is not the owner"
echo "  - Solution: Call updateCVS through ADLV, or transfer ownership back"
echo ""
echo "Issue 2: createVault() call failed"
if [ "$VAULT_ADDRESS" == "0x0000000000000000000000000000000000000000" ] || [ -z "$VAULT_ADDRESS" ]; then
    echo "  - Reason: Unknown (check transaction details)"
    echo "  - Try: Use a different IP ID or check the transaction on explorer"
else
    echo "  - Reason: Vault already exists for this IP ID"
    echo "  - Existing vault: $VAULT_ADDRESS"
    echo "  - Solution: Use a different IP ID or query the existing vault"
fi
echo ""

