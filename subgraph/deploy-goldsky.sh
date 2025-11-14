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

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Create .env with:"
    echo "  GOLDSKY_API_KEY=your_api_key"
    echo "  GOLDSKY_PROJECT_ID=your_project_id"
    exit 1
fi

source .env

if [ -z "$GOLDSKY_API_KEY" ] || [ -z "$GOLDSKY_PROJECT_ID" ]; then
    echo "❌ GOLDSKY_API_KEY or GOLDSKY_PROJECT_ID not set in .env"
    exit 1
fi

echo "✅ Environment loaded"
echo "   Project ID: $GOLDSKY_PROJECT_ID"
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
goldsky subgraph deploy \
  --project-id "$GOLDSKY_PROJECT_ID" \
  --subgraph-name atlas-protocol \
  --schema ./schema.graphql \
  --subgraph-yaml ./subgraph.yaml

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Get GraphQL endpoint from Goldsky dashboard"
    echo "2. Update NEXT_PUBLIC_SUBGRAPH_URL in apps/web/.env"
    echo "3. Update SUBGRAPH_URL in apps/agent-service/.env"
else
    echo "❌ Deployment failed"
    exit 1
fi

