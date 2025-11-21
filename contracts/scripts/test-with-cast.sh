#!/bin/bash

# Comprehensive test script using cast
# Tests all ADLVWithStory functions on Story Aeneid Testnet

set -e

# Load variables from .env
source .env

# Network settings
# Using alternative RPC URL
RPC_URL="https://testnet.storyrpc.io"
CHAIN_ID=1513

# Contract addresses
ADLV_ADDRESS="0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205"
IDO_ADDRESS="0x75B0EF811CB728aFdaF395a0b17341fb426c26dD"

echo "=============================================="
echo "Testing ADLVWithStory on Story Aeneid Testnet"
echo "=============================================="
echo "RPC URL: $RPC_URL"
echo "Chain ID: $CHAIN_ID"
echo "ADLV Address: $ADLV_ADDRESS"
echo "IDO Address: $IDO_ADDRESS"
echo "Deployer: $ADDRESS"
echo ""

# 1. Check network connection
echo "Step 1: Checking network connection..."
BLOCK_NUMBER=$(cast block-number --rpc-url $RPC_URL)
echo "Current block number: $BLOCK_NUMBER"
echo ""

# 2. Check wallet balance
echo "Step 2: Checking wallet balance..."
BALANCE=$(cast balance $ADDRESS --rpc-url $RPC_URL)
BALANCE_ETH=$(cast --to-unit $BALANCE ether)
echo "Wallet balance: $BALANCE_ETH ETH"
echo ""

# 3. Verify contract owner
echo "Step 3: Verifying contract owner..."
OWNER=$(cast call $ADLV_ADDRESS "owner()(address)" --rpc-url $RPC_URL)
echo "Contract owner: $OWNER"
echo ""

# 4. Check Protocol Fee
echo "Step 4: Checking protocol fee..."
PROTOCOL_FEE=$(cast call $ADLV_ADDRESS "protocolFeeBps()(uint256)" --rpc-url $RPC_URL)
echo "Protocol fee (bps): $PROTOCOL_FEE (5%)"
echo ""

# 5. Check vault counter
echo "Step 5: Checking vault counter..."
VAULT_COUNTER=$(cast call $ADLV_ADDRESS "vaultCounter()(uint256)" --rpc-url $RPC_URL)
echo "Total vaults created: $VAULT_COUNTER"
echo ""

# 6. Check loan counter
echo "Step 6: Checking loan counter..."
LOAN_COUNTER=$(cast call $ADLV_ADDRESS "loanCounter()(uint256)" --rpc-url $RPC_URL)
echo "Total loans issued: $LOAN_COUNTER"
echo ""

echo "=============================================="
echo "Running Full Test Scenario with forge script"
echo "=============================================="
echo ""

# 7. Run full test scenario
forge script script/FullTestScenario.s.sol:FullTestScenarioScript \
    --rpc-url $RPC_URL \
    --broadcast \
    --private-key $PRIVATE_KEY \
    -vvv

echo ""
echo "=============================================="
echo "Test completed successfully!"
echo "=============================================="
