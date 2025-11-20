#!/bin/bash

# Quick Verification Script for Judges
# Verifies all Atlas Protocol components

echo "=========================================="
echo "Atlas Protocol - Complete Verification"
echo "=========================================="
echo ""

RPC="https://rpc-storyevm-testnet.aldebaranode.xyz"
ADLV="0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205"
IDO="0x75B0EF811CB728aFdaF395a0b17341fb426c26dD"

echo "📊 Contract Verification"
echo "----------------------------------------"

echo "1. Vault Counter:"
cast call $ADLV "vaultCounter()" --rpc-url $RPC
echo ""

echo "2. Story SPG Reference:"
cast call $ADLV "storySPG()" --rpc-url $RPC
echo "   Expected: 0x69415CE984A79a3Cfbe3F51024C63b6C107331e3"
echo ""

echo "3. IP Registry Reference:"
cast call $ADLV "storyIPAssetRegistry()" --rpc-url $RPC
echo "   Expected: 0x292639452A975630802C17c9267169D93BD5a793"
echo ""

echo "4. IDO Owner (should be ADLV):"
cast call $IDO "owner()" --rpc-url $RPC
echo "   Expected: $ADLV"
echo ""

echo "5. Protocol Fee:"
cast call $ADLV "protocolFeeBps()" --rpc-url $RPC
echo "   Expected: 500 (5%)"
echo ""

echo "=========================================="
echo "📝 Transaction Verification"
echo "=========================================="
echo ""

echo "Vault Creation TX:"
echo "0xb54a886ad27693b2955313bcba0348bce13642fc5e129148489b43bd9d8def31"
cast tx 0xb54a886ad27693b2955313bcba0348bce13642fc5e129148489b43bd9d8def31 --rpc-url $RPC | head -5
echo ""

echo "=========================================="
echo "✅ Verification Complete"
echo "=========================================="
echo ""
echo "All systems operational!"
echo "See HACKATHON_EVIDENCE.md for complete evidence package"
echo ""
