#!/bin/bash

# CVS Oracle Initialization Script
# This script initializes the CVS Oracle by calling the necessary functions

set -e  # Exit on error

echo "==========================================="
echo "CVS Oracle Initialization"
echo "==========================================="
echo ""

# Load environment variables
source .env

# Check required variables
if [ -z "$ADLV_V3" ]; then
    echo "ERROR: ADLV_V3 not set in .env"
    exit 1
fi

if [ -z "$IDO_V3" ]; then
    echo "ERROR: IDO_V3 not set in .env"
    exit 1
fi

if [ -z "$CVS_ORACLE_ADDRESS" ]; then
    echo "ERROR: CVS_ORACLE_ADDRESS not set in .env"
    exit 1
fi

if [ -z "$BACKEND_WALLET_ADDRESS" ]; then
    echo "ERROR: BACKEND_WALLET_ADDRESS not set in .env"
    exit 1
fi

if [ -z "$ADLV_OWNER_PRIVATE_KEY" ]; then
    echo "ERROR: ADLV_OWNER_PRIVATE_KEY not set in .env"
    echo "You need the private key of the ADLV owner: 0xdAFEE25F98Ff62504C1086eAcbb406190F3110D5"
    exit 1
fi

RPC_URL="https://rpc-storyevm-testnet.aldebaranode.xyz"

echo "Configuration:"
echo "  ADLV Contract: $ADLV_V3"
echo "  IDO Contract: $IDO_V3"
echo "  CVS Oracle: $CVS_ORACLE_ADDRESS"
echo "  Backend Wallet: $BACKEND_WALLET_ADDRESS"
echo ""

# Check current owners
echo "Checking contract ownership..."
IDO_OWNER=$(cast call $IDO_V3 "owner()(address)" --rpc-url $RPC_URL)
ADLV_OWNER=$(cast call $ADLV_V3 "owner()(address)" --rpc-url $RPC_URL)

echo "  IDO owner: $IDO_OWNER"
echo "  ADLV owner: $ADLV_OWNER"
echo ""

# Verify IDO is owned by ADLV
if [ "$IDO_OWNER" != "$ADLV_V3" ]; then
    echo "ERROR: IDO is not owned by ADLV"
    echo "  Expected: $ADLV_V3"
    echo "  Actual: $IDO_OWNER"
    exit 1
fi

echo "PROBLEM DETECTED:"
echo "The IDO contract is owned by the ADLV contract, not by an EOA."
echo "This means we cannot directly call setCVSOracle() from a wallet."
echo ""
echo "SOLUTION OPTIONS:"
echo ""
echo "Option 1: Add a proxy function to ADLV (requires contract upgrade)"
echo "  - Deploy new ADLV with setCVSOracleInIDO() function"
echo "  - Migrate to new ADLV"
echo ""
echo "Option 2: Transfer IDO ownership to an EOA temporarily"
echo "  - Requires ADLV contract to have transferIDOOwnership() function"
echo "  - But ADLV doesn't have this function!"
echo ""
echo "Option 3: Use the CVS Oracle WITHOUT IDO integration (RECOMMENDED)"
echo "  - Backend can query CVS Oracle directly"
echo "  - Skip IDO.setCVSOracle() entirely"
echo "  - Add oracle integration later via ADLV upgrade"
echo ""
echo "Proceeding with Option 3..."
echo ""

# Step: Add backend wallet as operator in CVS Oracle
echo "Step 1: Adding backend wallet as operator in CVS Oracle..."
cast send $CVS_ORACLE_ADDRESS \
    "addOperator(address)" \
    $BACKEND_WALLET_ADDRESS \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --legacy

if [ $? -eq 0 ]; then
    echo "[OK] Backend wallet added as operator"
else
    echo "[FAILED] Could not add backend wallet as operator"
    exit 1
fi

echo ""
echo "==========================================="
echo "Partial Initialization Complete!"
echo "==========================================="
echo ""
echo "STATUS:"
echo "  [OK] CVS Oracle deployed: $CVS_ORACLE_ADDRESS"
echo "  [OK] Backend wallet is an operator"
echo "  [SKIP] IDO integration (requires ADLV upgrade)"
echo ""
echo "NEXT STEPS:"
echo "1. Backend can use CVS Oracle directly"
echo "2. Deploy updated subgraph to track CVS Oracle events"
echo "3. Consider ADLV upgrade for full IDO integration"
