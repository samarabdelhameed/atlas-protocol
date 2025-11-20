# Backend & Subgraph Deployment Status

## Current Status

### Backend (Agent Service)
**Status:** ⚠️ **Not deployed yet - runs locally only**

The backend service (`apps/agent-service`) is fully built and functional but currently needs to be run locally. It's not deployed to a cloud service yet.

**To run locally:**
```bash
cd apps/agent-service
bun install
# Set up .env file (see README.md)
bun run dev
```

**Local endpoint:** `http://localhost:3001`

**Features available:**
- ✅ World ID verification server (`/verify-vault`)
- ✅ CVS monitoring engine
- ✅ Loan management
- ✅ Licensing agent
- ✅ Contract event monitoring

**For deployment options:**
- Can be deployed to services like Railway, Render, Fly.io, or Vercel
- Requires environment variables for RPC, contracts, and API keys
- Documentation: `apps/agent-service/README.md`

---

### Subgraph (Goldsky)
**Status:** 🟡 **Ready for deployment - not deployed yet**

The subgraph is fully built and ready, but needs to be deployed to Goldsky with proper credentials.

**Current status:**
- ✅ Schema complete (`subgraph/schema.graphql`)
- ✅ Event handlers implemented (`subgraph/src/mapping.ts`)
- ✅ Build successful
- ✅ Contract addresses configured
- ⏳ Awaiting Goldsky deployment

**To deploy:**
```bash
cd subgraph
npm install -g @goldskycom/cli
# Set GOLDSKY_API_KEY and GOLDSKY_PROJECT_ID in .env
./deploy-goldsky.sh
```

**After deployment:**
- You'll get a GraphQL endpoint like: `https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1`
- Update `VITE_SUBGRAPH_URL` in frontend `.env`
- Update `SUBGRAPH_URL` in backend `.env`

**Why use subgraph:**
- ✅ Efficient data querying (no need to scan blockchain)
- ✅ Real-time indexed events (vaults, loans, licenses)
- ✅ Historical data access
- ✅ Better performance than direct RPC calls
- ✅ GraphQL queries for complex data fetching

**Documentation:**
- `subgraph/DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `subgraph/README.md` - Subgraph overview
- `subgraph/CVS_CALCULATION.md` - CVS calculation logic

---

## Recommended Approach

### For Development:
1. **Backend**: Run locally (`bun run dev`)
2. **Subgraph**: Deploy to Goldsky for better data access
3. **Frontend**: Can connect to local backend + subgraph

### For Production:
1. **Backend**: Deploy to cloud service (Railway/Render/etc)
2. **Subgraph**: Deploy to Goldsky (free tier available)
3. **Frontend**: Deploy to Vercel (already configured)

---

## Troubleshooting Local Backend Issues

**Common issues:**
1. **Missing .env file**: Copy `.env.example` and fill required variables
2. **RPC connection**: Check `RPC_URL` is accessible
3. **Contract addresses**: Ensure correct addresses in `.env`
4. **Port conflict**: Change `VAULT_API_PORT` in `.env` (default: 3001)

**Check logs:**
- Backend logs will show which services are active
- Error messages indicate missing config or connection issues

**Required environment variables:**
- `RPC_URL` - Story Protocol RPC endpoint
- `ADLV_ADDRESS` - ADLV contract address
- `IDO_ADDRESS` - IDO contract address
- `WORLD_ID_APP_ID` - World ID app ID (for verification)
- `PRIVATE_KEY` - For signing transactions (optional for read-only)

See `apps/agent-service/README.md` for full list.

