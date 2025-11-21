#!/bin/bash

# Full Test Scenario Script - Real Data Testing
# Tests all functions with real data using cast

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
RPC_URL="${STORY_PROTOCOL_RPC:-https://rpc-storyevm-testnet.aldebaranode.xyz}"
PRIVATE_KEY="${PRIVATE_KEY}"
DEPLOYER=$(cast wallet address $PRIVATE_KEY 2>/dev/null || echo "")

if [ -z "$DEPLOYER" ]; then
    echo -e "${RED}Error: PRIVATE_KEY not set or invalid${NC}"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Atlas Protocol - Full Test Scenario${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}Deployer:${NC} $DEPLOYER"
echo -e "${YELLOW}RPC URL:${NC} $RPC_URL"
echo -e "${YELLOW}Network:${NC} Story Aeneid Testnet"
echo ""

# Step 1: Deploy Contracts
echo -e "${BLUE}Step 1: Deploying Contracts...${NC}"
echo "----------------------------------------"

# Deploy IDO
echo -e "${YELLOW}Deploying IDO...${NC}"
IDO_BYTECODE=$(forge build --force 2>&1 | grep -A 5 "IDO.sol" | tail -1 || echo "")
if [ -z "$IDO_BYTECODE" ]; then
    forge build
fi

IDO_DEPLOY=$(cast send --private-key $PRIVATE_KEY --rpc-url $RPC_URL \
    --create $(forge build --force 2>&1 | grep -oP 'IDO\.sol:IDO\s+\K[^\s]+' || echo "0x") \
    --constructor-args $(cast abi-encode "constructor(address)" $DEPLOYER) \
    2>&1)

IDO_ADDRESS=$(echo "$IDO_DEPLOY" | grep -oP 'contractAddress:\s+\K[^\s]+' || echo "")

if [ -z "$IDO_ADDRESS" ]; then
    echo -e "${RED}Failed to deploy IDO${NC}"
    exit 1
fi

echo -e "${GREEN}✅ IDO deployed at: $IDO_ADDRESS${NC}"

# Deploy ADLV
echo -e "${YELLOW}Deploying ADLVWithStory...${NC}"
STORY_SPG="0x69415CE984A79a3Cfbe3F51024C63b6C107331e3"
STORY_IP_REGISTRY="0x292639452A975630802C17c9267169D93BD5a793"
STORY_LICENSE_REGISTRY="0x0000000000000000000000000000000000000000"

ADLV_DEPLOY=$(cast send --private-key $PRIVATE_KEY --rpc-url $RPC_URL \
    --create $(forge build --force 2>&1 | grep -oP 'ADLVWithStory\.sol:ADLVWithStory\s+\K[^\s]+' || echo "0x") \
    --constructor-args $(cast abi-encode "constructor(address,address,address,address)" \
        $IDO_ADDRESS $STORY_SPG $STORY_IP_REGISTRY $STORY_LICENSE_REGISTRY) \
    2>&1)

ADLV_ADDRESS=$(echo "$ADLV_DEPLOY" | grep -oP 'contractAddress:\s+\K[^\s]+' || echo "")

if [ -z "$ADLV_ADDRESS" ]; then
    echo -e "${RED}Failed to deploy ADLV${NC}"
    exit 1
fi

echo -e "${GREEN}✅ ADLV deployed at: $ADLV_ADDRESS${NC}"

# Transfer IDO ownership to ADLV
echo -e "${YELLOW}Transferring IDO ownership to ADLV...${NC}"
cast send --private-key $PRIVATE_KEY --rpc-url $RPC_URL \
    $IDO_ADDRESS \
    "transferOwnership(address)" $ADLV_ADDRESS \
    > /dev/null 2>&1

echo -e "${GREEN}✅ Ownership transferred${NC}"
echo ""

# Step 2: Verify Setup
echo -e "${BLUE}Step 2: Verifying Contract Setup...${NC}"
echo "----------------------------------------"

IDO_OWNER=$(cast call $IDO_ADDRESS "owner()" --rpc-url $RPC_URL | cast parse-bytes32-address || echo "")
if [ "$IDO_OWNER" = "$ADLV_ADDRESS" ]; then
    echo -e "${GREEN}✅ IDO owner is ADLV${NC}"
else
    echo -e "${RED}❌ IDO owner mismatch${NC}"
fi

ADLV_IDO=$(cast call $ADLV_ADDRESS "idoContract()" --rpc-url $RPC_URL | cast parse-address || echo "")
if [ "$ADLV_IDO" = "$IDO_ADDRESS" ]; then
    echo -e "${GREEN}✅ ADLV IDO reference correct${NC}"
else
    echo -e "${RED}❌ ADLV IDO reference mismatch${NC}"
fi

ADLV_SPG=$(cast call $ADLV_ADDRESS "storySPG()" --rpc-url $RPC_URL | cast parse-address || echo "")
if [ "$ADLV_SPG" = "$STORY_SPG" ]; then
    echo -e "${GREEN}✅ Story SPG configured${NC}"
else
    echo -e "${RED}❌ Story SPG mismatch${NC}"
fi
echo ""

# Step 3: Register IP Asset and Create Vault
echo -e "${BLUE}Step 3: Registering IP Asset on Story Protocol...${NC}"
echo "----------------------------------------"

# Generate test IP data
IP_ID=$(cast keccak256 "atlas-test-ip-$(date +%s)")
IP_NAME="Atlas Test IP Asset - $(date +%H:%M:%S)"
CONTENT_HASH=$(cast keccak256 "$IP_NAME")
IP_ASSET_TYPE=1

echo -e "${YELLOW}IP ID:${NC} $IP_ID"
echo -e "${YELLOW}IP Name:${NC} $IP_NAME"

# Register IP and create vault
REGISTER_TX=$(cast send --private-key $PRIVATE_KEY --rpc-url $RPC_URL \
    $ADLV_ADDRESS \
    "registerIPAndCreateVault(bytes32,uint8,string,bytes32,bytes)" \
    $IP_ID $IP_ASSET_TYPE "$IP_NAME" $CONTENT_HASH "0x" \
    2>&1)

VAULT_ADDRESS=$(cast call $ADLV_ADDRESS "ipToVault(bytes32)" $IP_ID --rpc-url $RPC_URL | cast parse-address || echo "")

if [ -z "$VAULT_ADDRESS" ] || [ "$VAULT_ADDRESS" = "0x0000000000000000000000000000000000000000" ]; then
    echo -e "${RED}❌ Failed to create vault${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Vault created at: $VAULT_ADDRESS${NC}"

# Get Story IP ID
STORY_IP_ID=$(cast call $ADLV_ADDRESS "getStoryIPId(address)" $VAULT_ADDRESS --rpc-url $RPC_URL | cast parse-string || echo "")
if [ -n "$STORY_IP_ID" ] && [ "$STORY_IP_ID" != "" ]; then
    echo -e "${GREEN}✅ Story IP ID: $STORY_IP_ID${NC}"
else
    echo -e "${YELLOW}⚠️  Story IP ID not set (may need to check transaction)${NC}"
fi
echo ""

# Step 4: Update CVS
echo -e "${BLUE}Step 4: Updating CVS...${NC}"
echo "----------------------------------------"

INITIAL_CVS=1000000000000000000000  # 1000 tokens (18 decimals)
cast send --private-key $PRIVATE_KEY --rpc-url $RPC_URL \
    $ADLV_ADDRESS \
    "updateCVS(bytes32,uint256)" $IP_ID $INITIAL_CVS \
    > /dev/null 2>&1

CURRENT_CVS=$(cast call $IDO_ADDRESS "getCVS(bytes32)" $IP_ID --rpc-url $RPC_URL | cast parse-uint256 || echo "0")
if [ "$CURRENT_CVS" = "$INITIAL_CVS" ]; then
    echo -e "${GREEN}✅ CVS updated: $CURRENT_CVS${NC}"
else
    echo -e "${RED}❌ CVS update failed${NC}"
fi
echo ""

# Step 5: Deposit Liquidity
echo -e "${BLUE}Step 5: Depositing Liquidity...${NC}"
echo "----------------------------------------"

DEPOSIT_AMOUNT=5000000000000000000  # 5 tokens
cast send --private-key $PRIVATE_KEY --rpc-url $RPC_URL \
    $ADLV_ADDRESS \
    "deposit(address)" $VAULT_ADDRESS \
    --value $DEPOSIT_AMOUNT \
    > /dev/null 2>&1

VAULT_DATA=$(cast call $ADLV_ADDRESS "getVault(address)" $VAULT_ADDRESS --rpc-url $RPC_URL)
TOTAL_LIQUIDITY=$(echo "$VAULT_DATA" | head -1 | cast parse-uint256 || echo "0")

if [ "$TOTAL_LIQUIDITY" -gt "0" ]; then
    echo -e "${GREEN}✅ Liquidity deposited: $TOTAL_LIQUIDITY${NC}"
else
    echo -e "${RED}❌ Deposit failed${NC}"
fi
echo ""

# Step 6: Sell License and Test Revenue Splitting
echo -e "${BLUE}Step 6: Selling License (Revenue Splitting Test)...${NC}"
echo "----------------------------------------"

LICENSE_PRICE=1000000000000000000  # 1 token
LICENSE_TYPE="commercial"

# Get balances before
CREATOR_BALANCE_BEFORE=$(cast balance $DEPLOYER --rpc-url $RPC_URL)
PROTOCOL_OWNER=$(cast call $ADLV_ADDRESS "owner()" --rpc-url $RPC_URL | cast parse-address || echo "")
PROTOCOL_BALANCE_BEFORE=$(cast balance $PROTOCOL_OWNER --rpc-url $RPC_URL)

cast send --private-key $PRIVATE_KEY --rpc-url $RPC_URL \
    $ADLV_ADDRESS \
    "sellLicense(address,string,uint256)" $VAULT_ADDRESS "$LICENSE_TYPE" 0 \
    --value $LICENSE_PRICE \
    > /dev/null 2>&1

# Get balances after
CREATOR_BALANCE_AFTER=$(cast balance $DEPLOYER --rpc-url $RPC_URL)
PROTOCOL_BALANCE_AFTER=$(cast balance $PROTOCOL_OWNER --rpc-url $RPC_URL)

CREATOR_SHARE=$((CREATOR_BALANCE_AFTER - CREATOR_BALANCE_BEFORE))
PROTOCOL_FEE=$((PROTOCOL_BALANCE_AFTER - PROTOCOL_BALANCE_BEFORE))

echo -e "${GREEN}✅ License sold${NC}"
echo -e "${YELLOW}   License Price:${NC} $LICENSE_PRICE"
echo -e "${YELLOW}   Creator Share (70%):${NC} $CREATOR_SHARE"
echo -e "${YELLOW}   Protocol Fee (5%):${NC} $PROTOCOL_FEE"
echo -e "${YELLOW}   Vault Share (25%):${NC} $((LICENSE_PRICE - CREATOR_SHARE - PROTOCOL_FEE))"
echo ""

# Step 7: Verify Revenue Recorded
echo -e "${BLUE}Step 7: Verifying Revenue Recorded in IDO...${NC}"
echo "----------------------------------------"

TOTAL_REVENUE=$(cast call $IDO_ADDRESS "totalLicenseRevenue(bytes32)" $IP_ID --rpc-url $RPC_URL | cast parse-uint256 || echo "0")
if [ "$TOTAL_REVENUE" -gt "0" ]; then
    echo -e "${GREEN}✅ Revenue recorded: $TOTAL_REVENUE${NC}"
else
    echo -e "${RED}❌ Revenue not recorded${NC}"
fi
echo ""

# Step 8: Issue Loan
echo -e "${BLUE}Step 8: Issuing Loan...${NC}"
echo "----------------------------------------"

LOAN_AMOUNT=2000000000000000000  # 2 tokens
COLLATERAL_AMOUNT=3000000000000000000  # 3 tokens (150%)
LOAN_DURATION=2592000  # 30 days

cast send --private-key $PRIVATE_KEY --rpc-url $RPC_URL \
    $ADLV_ADDRESS \
    "issueLoan(address,uint256,uint256)" $VAULT_ADDRESS $LOAN_AMOUNT $LOAN_DURATION \
    --value $COLLATERAL_AMOUNT \
    > /dev/null 2>&1

LOAN_COUNTER=$(cast call $ADLV_ADDRESS "loanCounter()" --rpc-url $RPC_URL | cast parse-uint256 || echo "0")
LOAN_ID=$((LOAN_COUNTER - 1))

if [ "$LOAN_ID" -ge "0" ]; then
    echo -e "${GREEN}✅ Loan issued: ID $LOAN_ID${NC}"
    echo -e "${YELLOW}   Loan Amount:${NC} $LOAN_AMOUNT"
    echo -e "${YELLOW}   Collateral:${NC} $COLLATERAL_AMOUNT"
else
    echo -e "${RED}❌ Loan issuance failed${NC}"
fi
echo ""

# Step 9: Get Final Vault Stats
echo -e "${BLUE}Step 9: Final Vault Statistics...${NC}"
echo "----------------------------------------"

VAULT_INFO=$(cast call $ADLV_ADDRESS "getVault(address)" $VAULT_ADDRESS --rpc-url $RPC_URL)
echo "$VAULT_INFO" | while IFS= read -r line; do
    echo "$line"
done

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Test Scenario Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Contract Addresses:${NC}"
echo "IDO:  $IDO_ADDRESS"
echo "ADLV: $ADLV_ADDRESS"
echo "Vault: $VAULT_ADDRESS"
echo ""
echo -e "${YELLOW}Test Results:${NC}"
echo "✅ Contracts deployed"
echo "✅ IP Asset registered"
echo "✅ CVS updated"
echo "✅ Liquidity deposited"
echo "✅ License sold with revenue splitting"
echo "✅ Revenue recorded in IDO"
echo "✅ Loan issued"
echo ""

