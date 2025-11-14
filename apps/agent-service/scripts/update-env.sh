#!/bin/bash

# Script to update .env file with deployed contract addresses

set -e

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example "$ENV_FILE"
fi

echo "=========================================="
echo "Update Agent Service .env file"
echo "=========================================="
echo ""

read -p "Enter ADLV contract address: " ADLV_ADDRESS
read -p "Enter IDO contract address: " IDO_ADDRESS
read -p "Enter RPC URL (or press Enter for default): " RPC_URL
read -p "Enter Chain ID (or press Enter for 8453): " CHAIN_ID

# Set defaults
RPC_URL=${RPC_URL:-"https://mainnet.base.org"}
CHAIN_ID=${CHAIN_ID:-"8453"}

# Update .env file
if grep -q "ADLV_ADDRESS=" "$ENV_FILE"; then
    sed -i.bak "s|ADLV_ADDRESS=.*|ADLV_ADDRESS=$ADLV_ADDRESS|" "$ENV_FILE"
else
    echo "ADLV_ADDRESS=$ADLV_ADDRESS" >> "$ENV_FILE"
fi

if grep -q "IDO_ADDRESS=" "$ENV_FILE"; then
    sed -i.bak "s|IDO_ADDRESS=.*|IDO_ADDRESS=$IDO_ADDRESS|" "$ENV_FILE"
else
    echo "IDO_ADDRESS=$IDO_ADDRESS" >> "$ENV_FILE"
fi

if grep -q "RPC_URL=" "$ENV_FILE"; then
    sed -i.bak "s|RPC_URL=.*|RPC_URL=$RPC_URL|" "$ENV_FILE"
else
    echo "RPC_URL=$RPC_URL" >> "$ENV_FILE"
fi

if grep -q "CHAIN_ID=" "$ENV_FILE"; then
    sed -i.bak "s|CHAIN_ID=.*|CHAIN_ID=$CHAIN_ID|" "$ENV_FILE"
else
    echo "CHAIN_ID=$CHAIN_ID" >> "$ENV_FILE"
fi

# Clean up backup file
rm -f "$ENV_FILE.bak"

echo ""
echo "✅ .env file updated successfully!"
echo ""
echo "Updated values:"
echo "  ADLV_ADDRESS=$ADLV_ADDRESS"
echo "  IDO_ADDRESS=$IDO_ADDRESS"
echo "  RPC_URL=$RPC_URL"
echo "  CHAIN_ID=$CHAIN_ID"
echo ""

