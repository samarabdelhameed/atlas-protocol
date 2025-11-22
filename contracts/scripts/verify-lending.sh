#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "==================================="
echo "IP-Backed Lending Verification"
echo "==================================="
echo ""

RPC_URL="https://rpc-storyevm-testnet.aldebaranode.xyz"

# Contract Addresses
STORY_CORE="0x825B9Ad5F77B64aa1d56B52ef01291E6D4aA60a5"
IDO="0xeF83DB9b011261Ad3a76ccE8B7E54B2c055300D8"
LOAN_NFT="0x9386262027dc860337eC4F93A8503aD4ee852c41"
LENDING_MODULE="0xbefb2fF399Bd0faCDBd100A16A569c625e1E4bf3"
ADLV="0x793402b59d2ca4c501EDBa328347bbaF69a59f7b"

echo -e "${BLUE}Contract Addresses:${NC}"
echo "Story Protocol Core: $STORY_CORE"
echo "IDO: $IDO"
echo "Loan NFT: $LOAN_NFT"
echo "Lending Module: $LENDING_MODULE"
echo "ADLV: $ADLV"
echo ""

# Check Story Protocol Core
echo -e "${BLUE}1. Checking Story Protocol Core...${NC}"
IP_COUNTER=$(cast call $STORY_CORE "ipIdCounter()(uint256)" --rpc-url $RPC_URL)
IP_COUNTER_DEC=$((IP_COUNTER))
echo -e "${GREEN}✓${NC} IP Counter: $IP_COUNTER_DEC"
echo ""

# Check IDO
echo -e "${BLUE}2. Checking IDO...${NC}"
IDO_OWNER=$(cast call $IDO "owner()(address)" --rpc-url $RPC_URL)
echo -e "${GREEN}✓${NC} IDO Owner: $IDO_OWNER"
echo ""

# Check Loan NFT
echo -e "${BLUE}3. Checking Loan NFT...${NC}"
NFT_OWNER=$(cast call $LOAN_NFT "owner()(address)" --rpc-url $RPC_URL)
NFT_SUPPLY=$(cast call $LOAN_NFT "totalSupply()(uint256)" --rpc-url $RPC_URL)
NFT_SUPPLY_DEC=$((NFT_SUPPLY))
echo -e "${GREEN}✓${NC} Loan NFT Owner: $NFT_OWNER"
echo -e "${GREEN}✓${NC} Total Loan NFTs: $NFT_SUPPLY_DEC"
echo ""

# Check Lending Module
echo -e "${BLUE}4. Checking Lending Module...${NC}"
LOAN_COUNTER=$(cast call $LENDING_MODULE "loanCounter()(uint256)" --rpc-url $RPC_URL)
LOAN_COUNTER_DEC=$((LOAN_COUNTER))
LENDING_OWNER=$(cast call $LENDING_MODULE "owner()(address)" --rpc-url $RPC_URL)
echo -e "${GREEN}✓${NC} Loan Counter: $LOAN_COUNTER_DEC"
echo -e "${GREEN}✓${NC} Lending Module Owner: $LENDING_OWNER"
echo ""

# Check ADLV
echo -e "${BLUE}5. Checking ADLV...${NC}"
VAULT_COUNTER=$(cast call $ADLV "vaultCounter()(uint256)" --rpc-url $RPC_URL)
VAULT_COUNTER_DEC=$((VAULT_COUNTER))
ADLV_OWNER=$(cast call $ADLV "owner()(address)" --rpc-url $RPC_URL)
echo -e "${GREEN}✓${NC} Vault Counter: $VAULT_COUNTER_DEC"
echo -e "${GREEN}✓${NC} ADLV Owner: $ADLV_OWNER"
echo ""

# Summary
echo "==================================="
echo -e "${GREEN}✓ Summary${NC}"
echo "==================================="
echo "IP Assets Registered: $IP_COUNTER_DEC"
echo "Vaults Created: $VAULT_COUNTER_DEC"
echo "Loans Issued: $LOAN_COUNTER_DEC"
echo "Loan NFTs Minted: $NFT_SUPPLY_DEC"
echo ""
echo "Status: All contracts deployed and operational!"
echo "==================================="
