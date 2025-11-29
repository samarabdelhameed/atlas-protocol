#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================================="
echo "🔐 STEP 2: IPAccount Permissions Setup"
echo "=================================================="
echo ""
echo "🎯 READY TO EXECUTE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To execute, provide:"
echo "  • Vault Address OR IPAccount Address"
echo "  • Private Key"
echo -e "${NC}"

# Check if arguments provided
if [ $# -lt 1 ]; then
    echo -e "${YELLOW}Usage:${NC}"
    echo "  $0 <VAULT_OR_IPACCOUNT_ADDRESS> [PRIVATE_KEY]"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  # Using vault address:"
    echo "  $0 0x28c709329c48b9f20e2a3513fd0bb24cc982a453 \$PRIVATE_KEY"
    echo ""
    echo "  # Using IPAccount address directly:"
    echo "  $0 0xYourIPAccountAddress \$PRIVATE_KEY"
    echo ""
    exit 1
fi

# Configuration
RPC_URL="https://rpc-storyevm-testnet.aldebaranode.xyz"
CHAIN_ID=1315

# Contract Addresses
ADLV_V3="0x793402b59d2ca4c501EDBa328347bbaF69a59f7b"
ACCESS_CONTROLLER="0x825B9Ad5F77B64aa1d56B52ef01291E6D4aA60a5"
IP_ASSET_REGISTRY="0x292639452A975630802C17c9267169D93BD5a793"

# Input parameters
ADDRESS_INPUT=$1
PRIVATE_KEY=${2:-$PRIVATE_KEY}

if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}❌ Error: PRIVATE_KEY not provided${NC}"
    echo "Set it via environment variable or pass as second argument"
    exit 1
fi

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "RPC URL: $RPC_URL"
echo "Chain ID: $CHAIN_ID"
echo "ADLV Module: $ADLV_V3"
echo "AccessController: $ACCESS_CONTROLLER"
echo "IP Asset Registry: $IP_ASSET_REGISTRY"
echo ""

# Step 1: Determine if input is vault or IPAccount
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 1: Resolving IPAccount Address${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Try to get vault data from ADLV
echo "Checking if input is a vault address..."
VAULT_DATA=$(cast call $ADLV_V3 "vaults(address)" $ADDRESS_INPUT --rpc-url $RPC_URL 2>/dev/null)

if [ $? -eq 0 ] && [ "$VAULT_DATA" != "0x0000000000000000000000000000000000000000000000000000000000000000" ]; then
    echo -e "${GREEN}✅ Input is a vault address${NC}"
    
    # Extract storyIPId from vault data (need to parse the struct)
    # For now, we'll ask user to provide IPAccount directly
    echo -e "${YELLOW}⚠️  Please provide the IPAccount address directly${NC}"
    echo "You can get it from Story Protocol Explorer or transaction logs"
    exit 1
else
    echo -e "${YELLOW}Input is not a vault, assuming it's an IPAccount address${NC}"
    IPACCOUNT=$ADDRESS_INPUT
fi

echo "IPAccount Address: $IPACCOUNT"
echo ""

# Step 2: Verify IPAccount exists
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 2: Verifying IPAccount${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

CODE=$(cast code $IPACCOUNT --rpc-url $RPC_URL 2>/dev/null)
if [ ${#CODE} -lt 10 ] || [ "$CODE" == "0x" ]; then
    echo -e "${RED}❌ IPAccount not found at address: $IPACCOUNT${NC}"
    exit 1
fi

echo -e "${GREEN}✅ IPAccount exists on-chain${NC}"
echo "Code size: ${#CODE} bytes"
echo ""

# Step 3: Prepare function selectors
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 3: Preparing Function Selectors${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Function signatures and selectors
declare -A FUNCTIONS
FUNCTIONS["setRoyaltyPolicy"]="0xf845211a"
FUNCTIONS["claimRoyalties"]="0xc162c916"
FUNCTIONS["registerDerivativeIP"]="0xcba7efbc"
FUNCTIONS["sellLicenseWithSharing"]="0xe015fdc6"

echo "Functions to grant permissions:"
for func in "${!FUNCTIONS[@]}"; do
    echo "  • $func: ${FUNCTIONS[$func]}"
done
echo ""

# Step 4: Check current permissions
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 4: Checking Current Permissions${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

for func in "${!FUNCTIONS[@]}"; do
    selector=${FUNCTIONS[$func]}
    echo "Checking $func ($selector)..."
    
    PERMISSION=$(cast call $ACCESS_CONTROLLER \
        "getPermission(address,address,bytes4)(uint8)" \
        $IPACCOUNT \
        $ADLV_V3 \
        $selector \
        --rpc-url $RPC_URL 2>/dev/null)
    
    if [ "$PERMISSION" == "0" ]; then
        echo -e "  ${GREEN}✅ Already ALLOWED${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Not allowed (current: $PERMISSION)${NC}"
    fi
done
echo ""

# Step 5: Set permissions
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 5: Setting Permissions${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Preparing transaction..."
echo "  IPAccount: $IPACCOUNT"
echo "  Module: $ADLV_V3"
echo "  Selectors: [${FUNCTIONS[setRoyaltyPolicy]}, ${FUNCTIONS[claimRoyalties]}, ${FUNCTIONS[registerDerivativeIP]}, ${FUNCTIONS[sellLicenseWithSharing]}]"
echo "  Permissions: [0, 0, 0, 0] (ALLOW)"
echo ""

read -p "Execute transaction? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Transaction cancelled${NC}"
    exit 0
fi

echo "Sending transaction..."
TX_HASH=$(cast send $ACCESS_CONTROLLER \
    "setBatchPermissions(address,address,bytes4[],uint8[])" \
    $IPACCOUNT \
    $ADLV_V3 \
    "[${FUNCTIONS[setRoyaltyPolicy]},${FUNCTIONS[claimRoyalties]},${FUNCTIONS[registerDerivativeIP]},${FUNCTIONS[sellLicenseWithSharing]}]" \
    "[0,0,0,0]" \
    --private-key $PRIVATE_KEY \
    --rpc-url $RPC_URL \
    --chain $CHAIN_ID \
    --legacy 2>&1)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Transaction failed${NC}"
    echo "$TX_HASH"
    exit 1
fi

echo -e "${GREEN}✅ Transaction sent!${NC}"
echo "TX Hash: $TX_HASH"
echo ""

# Wait for confirmation
echo "Waiting for confirmation..."
sleep 5

# Step 6: Verify permissions
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 6: Verifying Permissions${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ALL_SUCCESS=true
for func in "${!FUNCTIONS[@]}"; do
    selector=${FUNCTIONS[$func]}
    echo "Verifying $func ($selector)..."
    
    PERMISSION=$(cast call $ACCESS_CONTROLLER \
        "getPermission(address,address,bytes4)(uint8)" \
        $IPACCOUNT \
        $ADLV_V3 \
        $selector \
        --rpc-url $RPC_URL 2>/dev/null)
    
    if [ "$PERMISSION" == "0" ]; then
        echo -e "  ${GREEN}✅ ALLOWED${NC}"
    else
        echo -e "  ${RED}❌ FAILED (permission: $PERMISSION)${NC}"
        ALL_SUCCESS=false
    fi
done
echo ""

# Final summary
echo -e "${BLUE}=================================================="
echo "📊 SUMMARY"
echo "==================================================${NC}"
echo ""

if [ "$ALL_SUCCESS" = true ]; then
    echo -e "${GREEN}🎉 SUCCESS! All permissions set correctly!${NC}"
    echo ""
    echo "✅ IPAccount: $IPACCOUNT"
    echo "✅ Module: $ADLV_V3"
    echo "✅ Functions: 4/4 allowed"
    echo ""
    echo -e "${GREEN}Ready for Step 3: Module Registration${NC}"
else
    echo -e "${RED}⚠️  Some permissions failed to set${NC}"
    echo "Please check the transaction and try again"
fi

echo ""
echo -e "${BLUE}==================================================${NC}"
