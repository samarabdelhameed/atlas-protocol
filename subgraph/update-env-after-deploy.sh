#!/bin/bash

# Update SUBGRAPH_URL in all .env files after Goldsky deployment
# Usage: ./update-env-after-deploy.sh <subgraph_url>

set -e

if [ -z "$1" ]; then
    echo "❌ Error: Subgraph URL required"
    echo "Usage: ./update-env-after-deploy.sh <subgraph_url>"
    echo "Example: ./update-env-after-deploy.sh https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1"
    exit 1
fi

SUBGRAPH_URL="$1"

echo "=========================================="
echo "Updating SUBGRAPH_URL in all .env files"
echo "=========================================="
echo ""
echo "Subgraph URL: $SUBGRAPH_URL"
echo ""

# Update apps/agent-service/.env
if [ -f "../apps/agent-service/.env" ]; then
    echo "Updating apps/agent-service/.env..."
    if grep -q "SUBGRAPH_URL=" ../apps/agent-service/.env; then
        sed -i.bak "s|SUBGRAPH_URL=.*|SUBGRAPH_URL=$SUBGRAPH_URL|" ../apps/agent-service/.env
    else
        echo "SUBGRAPH_URL=$SUBGRAPH_URL" >> ../apps/agent-service/.env
    fi
    echo "✅ Updated apps/agent-service/.env"
else
    echo "⚠️  apps/agent-service/.env not found"
fi

# Update apps/frontend/.env
if [ -f "../apps/frontend/.env" ]; then
    echo "Updating apps/frontend/.env..."
    if grep -q "VITE_SUBGRAPH_URL=" ../apps/frontend/.env; then
        sed -i.bak "s|VITE_SUBGRAPH_URL=.*|VITE_SUBGRAPH_URL=$SUBGRAPH_URL|" ../apps/frontend/.env
    else
        echo "VITE_SUBGRAPH_URL=$SUBGRAPH_URL" >> ../apps/frontend/.env
    fi
    echo "✅ Updated apps/frontend/.env"
else
    echo "⚠️  apps/frontend/.env not found"
fi

echo ""
echo "=========================================="
echo "✅ SUBGRAPH_URL updated successfully!"
echo "=========================================="
echo ""
echo "📝 Updated files:"
echo "   - apps/agent-service/.env"
echo "   - apps/frontend/.env"
echo ""

