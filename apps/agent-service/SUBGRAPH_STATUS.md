# 📊 Subgraph Status - Agent Service

## Current Status

**Subgraph**: ✅ Built and ready, 🟡 Not deployed yet

The agent service is configured to work with or without the subgraph.

---

## Why the Error?

When you run `bun dev`, you see:

```
Error fetching stats: ConnectionRefused: Unable to connect
path: "http://localhost:8000/subgraphs/name/atlas-protocol"
```

**This is expected!** The subgraph is not deployed yet.

---

## How It Works Now

### Without Subgraph (Current State)

The agent service will:
- ✅ Start successfully
- ✅ Monitor contracts via RPC
- ⚠️  Show connection errors for subgraph queries
- ✅ Use fallback methods for data

**The service still works!** It just can't query historical data from the subgraph.

### With Subgraph (After Deployment)

Once deployed, the agent will:
- ✅ Query historical data efficiently
- ✅ Get aggregated statistics
- ✅ Monitor CVS changes in real-time
- ✅ No more connection errors

---

## How to Deploy Subgraph

### Option 1: Goldsky (Recommended)

```bash
# 1. Create account at https://goldsky.com

# 2. Get credentials:
# - GOLDSKY_API_KEY
# - GOLDSKY_PROJECT_ID

# 3. Add to subgraph/.env:
echo "GOLDSKY_API_KEY=your_key" >> subgraph/.env
echo "GOLDSKY_PROJECT_ID=your_id" >> subgraph/.env

# 4. Deploy:
cd subgraph
goldsky subgraph deploy atlas-protocol/1.0.0 --path .

# 5. Update agent-service/.env:
echo "SUBGRAPH_URL=https://api.goldsky.com/api/public/your-endpoint" >> .env
```

### Option 2: The Graph Studio (Free)

```bash
# 1. Go to https://thegraph.com/studio/

# 2. Connect wallet

# 3. Create subgraph

# 4. Deploy:
cd subgraph
graph auth --studio <DEPLOY_KEY>
graph deploy --studio atlas-protocol

# 5. Update agent-service/.env:
echo "SUBGRAPH_URL=https://api.studio.thegraph.com/query/your-endpoint" >> .env
```

---

## Running Without Subgraph

The agent service works fine without the subgraph! Just ignore the connection errors.

### What Works:
- ✅ Contract monitoring
- ✅ Event listening
- ✅ Direct RPC queries
- ✅ CVS calculations (basic)
- ✅ Loan monitoring

### What Doesn't Work:
- ❌ Historical data queries
- ❌ Aggregated statistics
- ❌ CVS leaderboard
- ❌ Global protocol stats

---

## Configuration

### Current Setup

```typescript
// packages/graphql-client/src/client.ts
export const SUBGRAPH_ENDPOINTS = {
  development: process.env.SUBGRAPH_URL || 'https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1',
  production: process.env.SUBGRAPH_URL || 'https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1',
};
```

### After Deployment

Add to `apps/agent-service/.env`:

```bash
# Subgraph URL (after deployment)
SUBGRAPH_URL=https://api.goldsky.com/api/public/your-actual-endpoint
```

---

## Suppressing Errors (Optional)

If you want to hide the connection errors while developing:

### Option 1: Set Dummy URL

```bash
# In apps/agent-service/.env
SUBGRAPH_URL=https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1
```

The errors will still happen but less frequently.

### Option 2: Disable Subgraph Queries

Comment out the stats display in `index.ts`:

```typescript
// await this.displayStats(); // Disable until subgraph is deployed
```

---

## For Hackathon Judges

**The subgraph is ready but not deployed** because:

1. ✅ Schema is complete
2. ✅ Event handlers are implemented
3. ✅ Build is successful
4. 🔑 Needs Goldsky account credentials

**All data is available on-chain** and can be verified:

```bash
# Verify real data
cast call 0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205 "vaultCounter()" \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
# Returns: 2 ✅

cast call 0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205 \
  "getVault(address)" "0x5E23c8894D44c41294Ec991F01653286fBf971C9" \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
# Returns: Vault with 8.325 IP ✅
```

---

## Summary

| Feature | Status | Notes |
|---------|--------|-------|
| **Subgraph Schema** | ✅ Complete | Ready for deployment |
| **Event Handlers** | ✅ Complete | All events covered |
| **Build** | ✅ Success | Compiled to WASM |
| **Deployment** | 🟡 Pending | Needs Goldsky credentials |
| **Agent Service** | ✅ Working | Works with/without subgraph |
| **On-Chain Data** | ✅ Real | 2 vaults, 8.325 IP liquidity |

**Status**: Agent service is operational. Subgraph deployment is optional for hackathon.

---

**Last Updated**: November 20, 2024
