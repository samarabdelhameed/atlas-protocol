#!/bin/bash

# Atlas Protocol - Complete Deployment Script
# This script does everything: deploy, verify, update config, test

set -e

echo "=========================================="
echo "Atlas Protocol - Complete Deployment"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo ""
echo "Step 1: Checking prerequisites..."
echo ""

if ! command -v forge &> /dev/null; then
    echo -e "${RED}❌ Foundry not installed${NC}"
    echo "Install from: https://book.getfoundry.sh/getting-started/installation"
    exit 1
fi

if ! command -v bun &> /dev/null; then
    echo -e "${RED}❌ Bun not installed${NC}"
    echo "Install from: https://bun.sh"
    exit 1
fi

echo -e "${GREEN}✅ Foundry installed${NC}"
echo -e "${GREEN}✅ Bun installed${NC}"

# Step 2: Build contracts
echo ""
echo "Step 2: Building contracts..."
echo ""

cd contracts
forge build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Contracts built successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 3: Run tests
echo ""
echo "Step 3: Running tests..."
echo ""

forge test

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${RED}❌ Tests failed${NC}"
    exit 1
fi

# Step 4: Check .env
echo ""
echo "Step 4: Checking environment..."
echo ""

if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "Creating .env.example..."
    cat > .env.example << EOF
PRIVATE_KEY=your_private_key_without_0x
STORY_PROTOCOL_RPC=https://your-story-protocol-rpc-url
RPC_URL=https://sepolia.base.org
ETHERSCAN_API_KEY=your_api_key_for_verification
EOF
    echo -e "${YELLOW}Please create .env file with your credentials${NC}"
    echo "You can copy .env.example as a template"
    exit 1
fi

source .env

if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}❌ PRIVATE_KEY not set in .env${NC}"
    exit 1
fi

# Determine network
if [ -n "$STORY_PROTOCOL_RPC" ]; then
    RPC_URL="$STORY_PROTOCOL_RPC"
    SCRIPT="script/DeployToStory.s.sol:DeployToStoryScript"
    NETWORK="Story Protocol"
    EXPLORER_BASE="https://story-testnet.blockscout.com"
else
    RPC_URL="${RPC_URL:-https://sepolia.base.org}"
    SCRIPT="script/Deploy.s.sol:DeployScript"
    NETWORK="Base Sepolia"
    EXPLORER_BASE="https://sepolia.basescan.org"
fi

echo -e "${GREEN}✅ Environment loaded${NC}"
echo "   Network: $NETWORK"
echo "   RPC: $RPC_URL"

# Step 5: Deploy
echo ""
echo "Step 5: Deploying contracts..."
echo ""

forge script "$SCRIPT" \
    --rpc-url "$RPC_URL" \
    --broadcast \
    --private-key "$PRIVATE_KEY" \
    -vvvv 2>&1 | tee deployment.log

# Extract addresses
IDO_ADDRESS=$(grep "IDO Contract:" deployment.log | tail -1 | awk -F': ' '{print $2}' | tr -d ' ' || echo "")
ADLV_ADDRESS=$(grep "ADLV Contract:" deployment.log | tail -1 | awk -F': ' '{print $2}' | tr -d ' ' || echo "")

if [ -z "$IDO_ADDRESS" ] || [ -z "$ADLV_ADDRESS" ]; then
    echo -e "${RED}❌ Could not extract contract addresses${NC}"
    echo "Please check deployment.log"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo "   IDO: $IDO_ADDRESS"
echo "   ADLV: $ADLV_ADDRESS"

# Step 6: Generate explorer links
echo ""
echo "Step 6: Explorer Links"
echo "=========================================="
echo -e "${GREEN}IDO Contract:${NC}"
echo "   $EXPLORER_BASE/address/$IDO_ADDRESS"
echo ""
echo -e "${GREEN}ADLV Contract:${NC}"
echo "   $EXPLORER_BASE/address/$ADLV_ADDRESS"
echo "=========================================="

# Step 7: Update Agent Service .env
echo ""
echo "Step 7: Updating Agent Service configuration..."
echo ""

cd ../apps/agent-service

if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || true
fi

# Update .env
if grep -q "ADLV_ADDRESS=" .env 2>/dev/null; then
    sed -i.bak "s|ADLV_ADDRESS=.*|ADLV_ADDRESS=$ADLV_ADDRESS|" .env
else
    echo "ADLV_ADDRESS=$ADLV_ADDRESS" >> .env
fi

if grep -q "IDO_ADDRESS=" .env 2>/dev/null; then
    sed -i.bak "s|IDO_ADDRESS=.*|IDO_ADDRESS=$IDO_ADDRESS|" .env
else
    echo "IDO_ADDRESS=$IDO_ADDRESS" >> .env
fi

if grep -q "RPC_URL=" .env 2>/dev/null; then
    sed -i.bak "s|RPC_URL=.*|RPC_URL=$RPC_URL|" .env
else
    echo "RPC_URL=$RPC_URL" >> .env
fi

rm -f .env.bak

echo -e "${GREEN}✅ Agent Service .env updated${NC}"

# Step 8: Test integration
echo ""
echo "Step 8: Testing integration..."
echo ""

if [ -f scripts/test-integration.sh ]; then
    chmod +x scripts/test-integration.sh
    ./scripts/test-integration.sh
else
    echo -e "${YELLOW}⚠️  Integration test script not found, skipping${NC}"
fi

# Step 9: Install dependencies
echo ""
echo "Step 9: Installing Agent Service dependencies..."
echo ""

bun install --silent

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Final summary
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "📋 Summary:"
echo "   Network: $NETWORK"
echo "   IDO: $IDO_ADDRESS"
echo "   ADLV: $ADLV_ADDRESS"
echo ""
echo "🔗 Explorer Links:"
echo "   IDO: $EXPLORER_BASE/address/$IDO_ADDRESS"
echo "   ADLV: $EXPLORER_BASE/address/$ADLV_ADDRESS"
echo ""
echo "📝 Next Steps:"
echo "   1. Start Agent Service:"
echo "      cd apps/agent-service && bun run dev"
echo ""
echo "   2. Monitor events in Agent Service logs"
echo ""
echo "   3. Test from frontend:"
echo "      - Create vault"
echo "      - Sell license"
echo "      - Issue loan"
echo ""
echo "=========================================="

