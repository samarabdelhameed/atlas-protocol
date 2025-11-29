#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================================="
echo "🔍 Get IPAccount Address"
echo "=================================================="
echo ""
echo "This script helps you find the IPAccount address"
echo "for your IP Asset on Story Protocol"
echo -e "${NC}"

# Configuration
RPC_URL="https://rpc-storyevm-testnet.aldebaranode.xyz"
STORY_CORE="0x825B9Ad5F77B64aa1d56B52ef01291E6D4aA60a5"
IP_ASSET_REGISTRY="0x292639452A975630802C17c9267169D93BD5a793"
ADLV_V3="0x793402b59d2ca4c501EDBa328347bbaF69a59f7b"

echo -e "${YELLOW}📋 Available Methods:${NC}"
echo ""
echo "1. From IP ID (numeric)"
echo "2. From Transaction Hash"
echo "3. From Story Protocol Explorer"
echo "4. List all registered IPs"
echo ""

read -p "Select method (1-4): " METHOD

case $METHOD in
    1)
        echo ""
        read -p "Enter IP ID (numeric): " IP_ID
        
        echo ""
        echo -e "${YELLOW}Resolving IPAccount from IP ID $IP_ID...${NC}"
        
        # Try to resolve from registry
        IPACCOUNT=$(cast call $IP_ASSET_REGISTRY \
            "resolve(uint256)(address)" \
            $IP_ID \
            --rpc-url $RPC_URL 2>/dev/null)
        
        if [ $? -eq 0 ] && [ "$IPACCOUNT" != "0x0000000000000000000000000000000000000000" ]; then
            echo -e "${GREEN}✅ IPAccount found!${NC}"
            echo ""
            echo "IP ID: $IP_ID"
            echo "IPAccount: $IPACCOUNT"
            echo ""
            echo "Explorer: https://aeneid.storyscan.io/address/$IPACCOUNT"
        else
            echo -e "${RED}❌ IPAccount not found for IP ID $IP_ID${NC}"
        fi
        ;;
        
    2)
        echo ""
        read -p "Enter Transaction Hash: " TX_HASH
        
        echo ""
        echo -e "${YELLOW}Fetching transaction receipt...${NC}"
        
        # Get transaction receipt
        RECEIPT=$(cast receipt $TX_HASH --rpc-url $RPC_URL 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Transaction found!${NC}"
            echo ""
            echo "$RECEIPT"
            echo ""
            echo -e "${YELLOW}Look for 'IPRegistered' or 'IPAccountCreated' events${NC}"
            echo "The IPAccount address will be in the event logs"
        else
            echo -e "${RED}❌ Transaction not found${NC}"
        fi
        ;;
        
    3)
        echo ""
        echo -e "${YELLOW}📖 Manual Steps:${NC}"
        echo ""
        echo "1. Go to Story Protocol Explorer:"
        echo "   https://aeneid.storyscan.io"
        echo ""
        echo "2. Search for your transaction or IP registration"
        echo ""
        echo "3. Look for 'IPRegistered' event in the logs"
        echo ""
        echo "4. The IPAccount address will be in the event data"
        echo ""
        echo "5. Or check the ADLV contract transactions:"
        echo "   https://aeneid.storyscan.io/address/$ADLV_V3"
        ;;
        
    4)
        echo ""
        echo -e "${YELLOW}Checking registered IPs...${NC}"
        echo ""
        
        # Get IP counter from Story Core
        IP_COUNTER=$(cast call $STORY_CORE \
            "ipIdCounter()(uint256)" \
            --rpc-url $RPC_URL 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            IP_COUNT=$((IP_COUNTER))
            echo -e "${GREEN}Total IPs registered: $IP_COUNT${NC}"
            echo ""
            
            if [ $IP_COUNT -gt 0 ]; then
                echo "Resolving IPAccounts..."
                echo ""
                
                for ((i=1; i<=$IP_COUNT; i++)); do
                    IPACCOUNT=$(cast call $IP_ASSET_REGISTRY \
                        "resolve(uint256)(address)" \
                        $i \
                        --rpc-url $RPC_URL 2>/dev/null)
                    
                    if [ $? -eq 0 ] && [ "$IPACCOUNT" != "0x0000000000000000000000000000000000000000" ]; then
                        echo "IP #$i: $IPACCOUNT"
                        echo "  Explorer: https://aeneid.storyscan.io/address/$IPACCOUNT"
                        echo ""
                    fi
                done
            else
                echo -e "${YELLOW}No IPs registered yet${NC}"
            fi
        else
            echo -e "${RED}❌ Failed to get IP counter${NC}"
        fi
        ;;
        
    *)
        echo -e "${RED}Invalid method${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}=================================================="
echo "💡 Next Steps"
echo "==================================================${NC}"
echo ""
echo "Once you have the IPAccount address, run:"
echo ""
echo -e "${GREEN}./setup-ipaccount-permissions.sh <IPACCOUNT_ADDRESS> \$PRIVATE_KEY${NC}"
echo ""
echo -e "${BLUE}==================================================${NC}"
