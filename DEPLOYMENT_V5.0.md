# Atlas Protocol v5.0 - CVS Oracle Integrated Deployment

**Deployment Date:** 2025-12-03
**Network:** Story Aeneid Testnet (Chain ID: 1315)
**Deployment Block:** 11797578

## Deployed Contract Addresses

| Contract | Address | Description |
|----------|---------|-------------|
| **IDO** | `0xFb1EC26171848c330356ff1C9e2a1228066Da324` | IP Data Offering Contract (v5.0) |
| **ADLV** | `0x9c7cCfB831Ed4D521599a3B97df0174C91bB2AAC` | Automated Data Licensing Vault (v5.0) |
| **CVS Oracle** | `0x4a875fD309C95DBFBcA6dFC3575517Ea7d5F6eC7` | Collateral Value Score Oracle (NEW!) |
| **Lending Module** | `0x3154484F0CdBa14F2A2A3Ba8D2125a5c088a5E4f` | IP-backed lending module |
| **Loan NFT** | `0x69D6C3E0D2BAE75Cbad6de75e8a367C607Ae8bC1` | NFT representing active loans |

## Key Changes from v4.1

### ✅ CVS Oracle Integration
- **CVS Oracle deployed and integrated** with IDO contract
- **Backend wallet added as operator** - Can update CVS on-chain
- **Real-time CVS sync** from Story Protocol every 5 minutes
- **On-chain CVS history** tracked via Goldsky subgraph

### ✅ Ownership Structure
- You (deployer) own: ADLV, CVS Oracle
- ADLV owns: IDO contract
- Lending Module owns: Loan NFT

### ✅ Configuration Updates
All `.env` files and configuration updated:
- ✅ `contracts/.env` - Updated
- ✅ `apps/agent-service/.env` - Updated
- ✅ `apps/frontend/src/contracts/addresses.ts` - Updated
- ✅ `subgraph/subgraph.yaml` - Updated

## Deployment Steps Completed

1. ✅ Deployed all contracts with integrated CVS Oracle
2. ✅ Set CVS Oracle in IDO contract (during deployment)
3. ✅ Added backend wallet as operator in CVS Oracle
4. ✅ Updated all configuration files
5. ✅ Rebuilt subgraph with new addresses and start block
6. ⏳ **Waiting for Goldsky to index new contracts** (10-15 minutes)
7. ⏳ Deploy subgraph v2.0.0 to Goldsky
8. ⏳ Update backend SUBGRAPH_URL
9. ⏳ Restart backend service
10. ⏳ Verify CVS Oracle integration

## Next Steps

### 1. Wait for Contract Indexing (10-15 minutes)

Goldsky needs to index the newly deployed contracts before we can deploy the subgraph.

**Current Status:** Contracts deployed at block 11797578, waiting for indexing...

### 2. Deploy Subgraph (After Indexing)

```bash
cd /Users/a0000/projects/atlas/subgraph
goldsky subgraph deploy atlasprotocol/2.0.0 --path .
```

### 3. Update Backend Subgraph URL

After subgraph deployment, update `apps/agent-service/.env`:

```env
SUBGRAPH_URL=https://api.goldsky.com/api/public/project_cmi7k5szzd54101yy44xg05em/subgraphs/atlasprotocol/2.0.0/gn
```

### 4. Restart Backend Service

```bash
cd /Users/a0000/projects/atlas/apps/agent-service
# Kill existing processes
pkill -f "bun run index.ts"
# Start fresh
bun run index.ts
```

### 5. Verify CVS Oracle Integration

Check backend logs for:
```
✅ CVS Oracle initialized
   Oracle Address: 0x4a875fD309C95DBFBcA6dFC3575517Ea7d5F6eC7
   Sync Interval: 300000ms
🔄 CVS Sync Service starting...
✅ First CVS sync completed
```

## Contract Explorer Links

- **ADLV:** https://aeneid.storyscan.io/address/0x9c7cCfB831Ed4D521599a3B97df0174C91bB2AAC
- **IDO:** https://aeneid.storyscan.io/address/0xFb1EC26171848c330356ff1C9e2a1228066Da324
- **CVS Oracle:** https://aeneid.storyscan.io/address/0x4a875fD309C95DBFBcA6dFC3575517Ea7d5F6eC7
- **Lending Module:** https://aeneid.storyscan.io/address/0x3154484F0CdBa14F2A2A3Ba8D2125a5c088a5E4f
- **Loan NFT:** https://aeneid.storyscan.io/address/0x69D6C3E0D2BAE75Cbad6de75e8a367C607Ae8bC1

## Testing Checklist

After complete deployment:

- [ ] Create a test vault
- [ ] Purchase a license
- [ ] Verify CVS updates automatically
- [ ] Check subgraph for CVS history
- [ ] Issue a test loan
- [ ] Verify loan uses oracle CVS
- [ ] Check frontend displays new contracts correctly

## Rollback Plan

If issues occur, old deployment (v4.1) addresses:
- ADLV: `0xFe9E0Dd8893F71303ACF8164462d323905199669`
- IDO: `0x64A5997775e59Ae304662D0850B281A5a224E0cf`

## Notes

- CVS Oracle updates every 5 minutes from Story Protocol
- Backend wallet (`0x7D4e2d9D7cf03199D5E41bAB5E9930a8d9A44FD7`) is operator
- All contracts deployed in single transaction for consistency
- Ownership properly configured for easy management
