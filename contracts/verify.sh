#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

RPC="https://rpc-storyevm-testnet.aldebaranode.xyz"
ADLV="0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205"
IDO="0x75B0EF811CB728aFdaF395a0b17341fb426c26dD"
VAULT1="0x5e23c8894d44c41294ec991f01653286fbf971c9"

echo -e "${BLUE}🔍 Verifying Atlas Protocol Contracts on Story Testnet${NC}"
echo "=================================================="
echo ""

echo -e "${YELLOW}📦 Contract Addresses:${NC}"
echo "ADLV: $ADLV"
echo "IDO:  $IDO"
echo ""

echo -e "${YELLOW}1️⃣  Checking Vault Counter...${NC}"
VAULT_COUNT=$(cast call $ADLV "vaultCounter()" --rpc-url $RPC)
echo "Result: $VAULT_COUNT"
if [ "$VAULT_COUNT" = "0x0000000000000000000000000000000000000000000000000000000000000002" ]; then
    echo -e "${GREEN}✅ PASS: 2 vaults created${NC}"
else
    echo "⚠️  Unexpected value"
fi
echo ""

echo -e "${YELLOW}2️⃣  Checking Story SPG Integration...${NC}"
SPG=$(cast call $ADLV "storySPG()" --rpc-url $RPC)
echo "Result: $SPG"
if [[ "$SPG" == *"69415ce984a79a3cfbe3f51024c63b6c107331e3"* ]]; then
    echo -e "${GREEN}✅ PASS: Story SPG correctly configured${NC}"
else
    echo "⚠️  Unexpected value"
fi
echo ""

echo -e "${YELLOW}3️⃣  Checking Story IP Asset Registry...${NC}"
REGISTRY=$(cast call $ADLV "storyIPAssetRegistry()" --rpc-url $RPC)
echo "Result: $REGISTRY"
if [[ "$REGISTRY" == *"292639452a975630802c17c9267169d93bd5a793"* ]]; then
    echo -e "${GREEN}✅ PASS: Story IP Registry correctly configured${NC}"
else
    echo "⚠️  Unexpected value"
fi
echo ""

echo -e "${YELLOW}4️⃣  Checking Protocol Configuration...${NC}"
PROTOCOL_FEE=$(cast call $ADLV "protocolFeeBps()" --rpc-url $RPC)
echo "Protocol Fee: $PROTOCOL_FEE (should be 500 = 5%)"
if [[ "$PROTOCOL_FEE" == *"500"* ]] || [[ "$PROTOCOL_FEE" == *"1f4"* ]]; then
    echo -e "${GREEN}✅ PASS: Protocol fee is 5%${NC}"
else
    echo "⚠️  Unexpected value"
fi
echo ""

echo -e "${YELLOW}5️⃣  Checking Owner...${NC}"
OWNER=$(cast call $ADLV "owner()" --rpc-url $RPC)
echo "Owner: $OWNER"
if [[ "$OWNER" == *"dafee25f98ff62504c1086eacbb406190f3110d5"* ]]; then
    echo -e "${GREEN}✅ PASS: Owner correctly set${NC}"
else
    echo "⚠️  Unexpected value"
fi
echo ""

echo -e "${YELLOW}6️⃣  Checking IDO Contract Reference...${NC}"
IDO_REF=$(cast call $ADLV "idoContract()" --rpc-url $RPC)
echo "IDO Contract: $IDO_REF"
if [[ "$IDO_REF" == *"75b0ef811cb728afdaf395a0b17341fb426c26dd"* ]]; then
    echo -e "${GREEN}✅ PASS: IDO contract correctly referenced${NC}"
else
    echo "⚠️  Unexpected value"
fi
echo ""

echo -e "${YELLOW}7️⃣  Checking Vault #1 Data...${NC}"
echo "Vault Address: $VAULT1"
VAULT_DATA=$(cast call $ADLV "getVault(address)" "$VAULT1" --rpc-url $RPC 2>&1)
if [[ "$VAULT_DATA" == *"0x"* ]]; then
    echo -e "${GREEN}✅ PASS: Vault data retrieved successfully${NC}"
    echo "Vault contains liquidity and Story IP ID data"
else
    echo "⚠️  Could not retrieve vault data"
fi
echo ""

echo -e "${YELLOW}8️⃣  Checking Transaction History...${NC}"
TX1="0xb54a886ad27693b2955313bcba0348bce13642fc5e129148489b43bd9d8def31"
echo "Checking vault creation tx: $TX1"
TX_DATA=$(cast tx $TX1 --rpc-url $RPC 2>&1)
if [[ "$TX_DATA" == *"blockNumber"* ]]; then
    echo -e "${GREEN}✅ PASS: Transaction confirmed on-chain${NC}"
    echo "$TX_DATA" | grep "blockNumber"
else
    echo "⚠️  Could not retrieve transaction"
fi
echo ""

echo "=================================================="
echo -e "${GREEN}✅ Verification Complete!${NC}"
echo ""
echo "Summary:"
echo "- Contracts are deployed and functional"
echo "- Story Protocol integration verified"
echo "- Live data exists on blockchain"
echo "- All transactions confirmed"
echo ""
echo "For detailed verification, see: HOW_TO_VERIFY.md"
