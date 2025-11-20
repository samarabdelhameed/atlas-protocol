#!/bin/bash

echo "🚀 Deploying Atlas Protocol Frontend to Vercel"
echo "=============================================="
echo ""

# Navigate to frontend directory
cd apps/frontend

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
echo ""

# Use npx to ensure we have the latest version
npx vercel --prod --yes

echo ""
echo "✅ Deployment complete!"
echo "Check the output above for your Vercel URL"

