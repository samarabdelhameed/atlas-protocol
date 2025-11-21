#!/bin/bash

# Script to generate more transactions for better Explorer visibility

set -e

source .env

RPC_URL="https://rpc-storyevm-testnet.aldebaranode.xyz"
ADLV="0xdd0fF1a826FCAC7e3EBAE6E978A4BB043D27eC13"

echo "=============================================="
echo "Generating More Transactions"
echo "=============================================="
echo ""

# Generate random IP IDs
IP_ID_1="0x$(openssl rand -hex 32)"
IP_ID_2="0x$(openssl rand -hex 32)"
IP_ID_3="0x$(openssl rand -hex 32)"

echo "📝 Will create 3 new vaults with random IP IDs"
echo ""

# Transaction 1: Update CVS for IP 1
echo "Transaction 1/9: Update CVS for IP 1..."
cast send $ADLV \
  "updateCVS(bytes32,uint256)" \
  "$IP_ID_1" \
  "500000000000000000000000" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --gas-limit 300000 \
  --legacy
echo "✅ Done"
echo ""

# Transaction 2: Create Vault 1
echo "Transaction 2/9: Create Vault 1..."
VAULT_1=$(cast send $ADLV \
  "createVault(bytes32,string)" \
  "$IP_ID_1" \
  "" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --gas-limit 500000 \
  --legacy \
  --json | jq -r '.logs[0].topics[1]' | cast --to-address)
echo "✅ Vault 1 created: $VAULT_1"
echo ""

# Transaction 3: Deposit to Vault 1
echo "Transaction 3/9: Deposit to Vault 1..."
cast send $ADLV \
  "deposit(address)" \
  "$VAULT_1" \
  --value 0.5ether \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --gas-limit 300000 \
  --legacy
echo "✅ Done"
echo ""

# Transaction 4: Update CVS for IP 2
echo "Transaction 4/9: Update CVS for IP 2..."
cast send $ADLV \
  "updateCVS(bytes32,uint256)" \
  "$IP_ID_2" \
  "750000000000000000000000" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --gas-limit 300000 \
  --legacy
echo "✅ Done"
echo ""

# Transaction 5: Create Vault 2
echo "Transaction 5/9: Create Vault 2..."
VAULT_2=$(cast send $ADLV \
  "createVault(bytes32,string)" \
  "$IP_ID_2" \
  "" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --gas-limit 500000 \
  --legacy \
  --json | jq -r '.logs[0].topics[1]' | cast --to-address)
echo "✅ Vault 2 created: $VAULT_2"
echo ""

# Transaction 6: Deposit to Vault 2
echo "Transaction 6/9: Deposit to Vault 2..."
cast send $ADLV \
  "deposit(address)" \
  "$VAULT_2" \
  --value 0.3ether \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --gas-limit 300000 \
  --legacy
echo "✅ Done"
echo ""

# Transaction 7: Update CVS for IP 3
echo "Transaction 7/9: Update CVS for IP 3..."
cast send $ADLV \
  "updateCVS(bytes32,uint256)" \
  "$IP_ID_3" \
  "250000000000000000000000" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --gas-limit 300000 \
  --legacy
echo "✅ Done"
echo ""

# Transaction 8: Create Vault 3
echo "Transaction 8/9: Create Vault 3..."
VAULT_3=$(cast send $ADLV \
  "createVault(bytes32,string)" \
  "$IP_ID_3" \
  "" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --gas-limit 500000 \
  --legacy \
  --json | jq -r '.logs[0].topics[1]' | cast --to-address)
echo "✅ Vault 3 created: $VAULT_3"
echo ""

# Transaction 9: Sell License on Vault 1
echo "Transaction 9/9: Sell license on Vault 1..."
cast send $ADLV \
  "sellLicense(address,string,uint256)" \
  "$VAULT_1" \
  "commercial" \
  "31536000" \
  --value 0.5ether \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --gas-limit 400000 \
  --legacy
echo "✅ Done"
echo ""

echo "=============================================="
echo "✅ Successfully generated 9 new transactions!"
echo "=============================================="
echo ""
echo "New Vaults Created:"
echo "  Vault 1: $VAULT_1 (CVS: 500,000 IP)"
echo "  Vault 2: $VAULT_2 (CVS: 750,000 IP)"
echo "  Vault 3: $VAULT_3 (CVS: 250,000 IP)"
echo ""
echo "Total Transactions Now: 14 (5 old + 9 new)"
echo ""
echo "Check Explorer in 10-30 minutes:"
echo "https://aeneid.storyscan.io/address/$ADLV"
echo ""
