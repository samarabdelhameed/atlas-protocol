# Subgraph Deployment Guide - Goldsky

## Prerequisites

1. **Install Goldsky CLI:**
   ```bash
   npm install -g @goldskycom/cli
   ```

2. **Create Goldsky Account:**
   - Go to [Goldsky](https://goldsky.com)
   - Sign up and create a new project
   - Get your `GOLDSKY_API_KEY` and `GOLDSKY_PROJECT_ID` from dashboard

## Setup

1. **Create `.env` file in `subgraph/` directory:**
   ```env
   GOLDSKY_API_KEY=your_goldsky_api_key_here
   GOLDSKY_PROJECT_ID=your_goldsky_project_id_here
   ```

2. **Build Subgraph:**
   ```bash
   cd subgraph
   npm install
   npm run codegen
   npm run build
   ```

3. **Deploy to Goldsky:**
   ```bash
   ./deploy-goldsky.sh
   ```

   Or manually:
   ```bash
   goldsky subgraph deploy \
     --project-id "$GOLDSKY_PROJECT_ID" \
     --subgraph-name atlas-protocol \
     --schema ./schema.graphql \
     --subgraph-yaml ./subgraph.yaml
   ```

## After Deployment

1. **Get GraphQL Endpoint from Goldsky Dashboard**
   - Usually: `https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1`

2. **Update Environment Variables:**

   **apps/agent-service/.env:**
   ```env
   SUBGRAPH_URL=https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1
   ```

   **apps/web/.env:**
   ```env
   NEXT_PUBLIC_SUBGRAPH_URL=https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1
   ```

## Verification

Test the subgraph endpoint:
```bash
curl -X POST https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1 \
  -H "Content-Type: application/json" \
  -d '{"query": "{ _meta { block { number } } }"}'
```

## Current Configuration

- **Network:** Story Protocol Testnet (story-testnet)
- **IDO Contract:** 0xB176c1FA7B3feC56cB23681B6E447A7AE60C5254
- **ADLV Contract:** 0x76d81731e26889Be3718BEB4d43e12C3692753b8

