#!/bin/bash

# Deploy Subgraph to Goldsky
# Make sure you have Goldsky CLI installed: npm install -g @goldskycom/cli

set -e

echo "=========================================="
echo "Deploying Subgraph to Goldsky"
echo "=========================================="

# Check if Goldsky CLI is installed
if ! command -v goldsky &> /dev/null; then
    echo "❌ Goldsky CLI not found!"
    echo "Install it: npm install -g @goldskycom/cli"
    exit 1
fi

# Check if user is logged in
echo "Checking Goldsky authentication..."
if ! goldsky subgraph list &> /dev/null; then
    echo "⚠️  Not logged in to Goldsky"
    echo "Please run: goldsky login"
    echo ""
    echo "Or set GOLDSKY_TOKEN environment variable"
    exit 1
fi

echo "✅ Authenticated with Goldsky"
echo ""

# Build subgraph
echo "Building subgraph..."
npm run codegen
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"
echo ""

# Deploy to Goldsky
echo "Deploying to Goldsky..."
echo "   Project ID: $GOLDSKY_PROJECT_ID"
echo "   Subgraph Name: atlas-protocol"
echo ""

# Deploy using the correct Goldsky CLI format
# Format: goldsky subgraph deploy <name>/<version> --path .
goldsky subgraph deploy atlas-protocol/1.0.0 --path .

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Get GraphQL endpoint from Goldsky dashboard"
    echo "   Usually: https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-protocol"
    echo ""
    echo "2. Update SUBGRAPH_URL:"
    echo "   cd .. && ./subgraph/update-env-after-deploy.sh <subgraph_url>"
    echo ""
    echo "   Or manually update:"
    echo "   - apps/agent-service/.env: SUBGRAPH_URL=<url>"
    echo "   - apps/web/.env: NEXT_PUBLIC_SUBGRAPH_URL=<url>"
else
    echo "❌ Deployment failed"
    exit 1
fi

