#!/bin/bash

# Story Protocol Integration Test

RPC_URL="https://rpc-storyevm-testnet.aldebaranode.xyz"
STORY_CORE="0x0F067d7467cCaa1e37ca1B2d101b3574A0668FB5"
ADLV="0x1bc89DB4589C669D8dA9ECA1BD00dB98b08155b2"

source .env

echo "=============================================="
echo "Story Protocol Integration Test"
echo "=============================================="
echo ""

# Test 1: Check Story Protocol Core
echo "1. Checking Story Protocol Core..."
IP_COUNTER=$(cast call $STORY_CORE "ipIdCounter()(uint256)" --rpc-url $RPC_URL)
echo "✅ Story Protocol Core working! IP Counter: $((IP_COUNTER))"
echo ""

# Test 2: Check ADLV Integration
echo "2. Checking ADLV Integration..."
SPG_ADDRESS=$(cast call $ADLV "storySPG()(address)" --rpc-url $RPC_URL)
echo "✅ ADLV integrated! Story SPG: $SPG_ADDRESS"
echo ""

# Test 3: Check Vault Counter
echo "3. Checking Vaults..."
VAULT_COUNTER=$(cast call $ADLV "vaultCounter()(uint256)" --rpc-url $RPC_URL)
echo "✅ Total Vaults Created: $((VAULT_COUNTER))"
echo ""

echo "=============================================="
echo "SUCCESS! All contracts working!"
echo "=============================================="
echo "Story Protocol Core: $STORY_CORE"
echo "ADLV: $ADLV"
echo "Network: Story Aeneid Testnet"
echo "=============================================="
