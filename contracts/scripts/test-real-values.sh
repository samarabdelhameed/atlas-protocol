#!/bin/bash

# Test script with real values - shows actual data instead of zeros

set -e

# Load variables from .env
source .env

# Network settings
RPC_URL="https://testnet.storyrpc.io"
CHAIN_ID=1513

# Contract addresses
ADLV_ADDRESS="0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205"
IDO_ADDRESS="0x75B0EF811CB728aFdaF395a0b17341fb426c26dD"

echo "=============================================="
echo "Testing with REAL VALUES"
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
echo "✓ Current block number: $BLOCK_NUMBER"
echo ""

# 2. Check wallet balance
echo "Step 2: Checking wallet balance..."
BALANCE=$(cast balance $ADDRESS --rpc-url $RPC_URL)
BALANCE_ETH=$(cast --to-unit $BALANCE ether)
echo "✓ Wallet balance: $BALANCE_ETH IP"
echo ""

# 3. Verify contract owner
echo "Step 3: Verifying contract owner..."
OWNER=$(cast call $ADLV_ADDRESS "owner()(address)" --rpc-url $RPC_URL)
echo "✓ Contract owner: $OWNER"
echo ""

# 4. Check Protocol Fee
echo "Step 4: Checking protocol fee..."
PROTOCOL_FEE=$(cast call $ADLV_ADDRESS "protocolFeeBps()(uint256)" --rpc-url $RPC_URL)
echo "✓ Protocol fee: $PROTOCOL_FEE bps (5%)"
echo ""

# 5. Display current contract statistics
echo "Step 5: Current contract statistics..."
VAULT_COUNTER=$(cast call $ADLV_ADDRESS "vaultCounter()(uint256)" --rpc-url $RPC_URL)
LOAN_COUNTER=$(cast call $ADLV_ADDRESS "loanCounter()(uint256)" --rpc-url $RPC_URL)
echo "✓ Total vaults created: $VAULT_COUNTER"
echo "✓ Total loans issued: $LOAN_COUNTER"
echo ""

echo "=============================================="
echo "Running Full Test Scenario with REAL VALUES"
echo "=============================================="
echo ""
echo "This test will:"
echo "1. Set CVS to 1,000,000 IP"
echo "2. Create a new vault"
echo "3. Deposit 10 IP liquidity"
echo "4. Sell 3 licenses (5 IP + 2 IP + 15 IP)"
echo "5. Issue a loan of 5 IP with 2 IP collateral"
echo "6. Display detailed statistics"
echo ""
read -p "Press Enter to continue..."
echo ""

# 7. Run full test scenario
forge script script/FullTestScenario.s.sol:FullTestScenarioScript \
    --rpc-url $RPC_URL \
    --broadcast \
    --private-key $PRIVATE_KEY \
    -vvv

echo ""
echo "=============================================="
echo "Verifying Results on Chain"
echo "=============================================="
echo ""

# 8. Verify final results
echo "Fetching updated statistics..."
VAULT_COUNTER_NEW=$(cast call $ADLV_ADDRESS "vaultCounter()(uint256)" --rpc-url $RPC_URL)
LOAN_COUNTER_NEW=$(cast call $ADLV_ADDRESS "loanCounter()(uint256)" --rpc-url $RPC_URL)

echo "Before test:"
echo "- Vaults: $VAULT_COUNTER"
echo "- Loans: $LOAN_COUNTER"
echo ""
echo "After test:"
echo "- Vaults: $VAULT_COUNTER_NEW (+" $((VAULT_COUNTER_NEW - VAULT_COUNTER)) ")"
echo "- Loans: $LOAN_COUNTER_NEW (+" $((LOAN_COUNTER_NEW - LOAN_COUNTER)) ")"
echo ""

echo "=============================================="
echo "✓ Test completed successfully with REAL VALUES!"
echo "=============================================="
echo ""
echo "Check Story Explorer for transaction details:"
echo "https://testnet.storyscan.xyz/address/$ADLV_ADDRESS"
echo ""
