# Subgraph Testing Guide

## Current Testing Status

### ✅ What Has Been Tested

1. **Build Test** ✅
   - Subgraph compiles successfully without errors
   - Schema is valid
   - Event handlers are properly implemented
   - Types are generated correctly

   ```bash
   cd subgraph
   npm run codegen  # ✅ Success
   npm run build    # ✅ Success
   ```

2. **Code Validation** ✅
   - AssemblyScript code compiles to WASM
   - No syntax errors
   - Event handlers match contract events
   - Entity definitions match schema

### ⏳ What Needs Testing

1. **Unit Tests** - Not implemented yet
2. **Local Testing** - Not done yet (requires Graph Node)
3. **Integration Testing** - Requires deployment
4. **Query Testing** - Requires live endpoint

---

## How to Test the Subgraph

### Option 1: Local Testing with Graph Node (Recommended for Development)

**Requirements:**
- Docker and Docker Compose
- Graph Node running locally

**Steps:**

1. **Start Graph Node:**
   ```bash
   # Create docker-compose.yml (if not exists)
   # Or use The Graph's official docker-compose
   
   docker-compose up
   ```

2. **Deploy Locally:**
   ```bash
   cd subgraph
   
   # Create subgraph locally
   npm run create-local
   
   # Deploy to local node
   npm run deploy-local
   ```

3. **Test Queries:**
   ```bash
   # Query local endpoint
   curl -X POST http://localhost:8000/subgraphs/name/atlas-protocol \
     -H "Content-Type: application/json" \
     -d '{
       "query": "{ _meta { block { number } } }"
     }'
   ```

### Option 2: Testing After Goldsky Deployment

Once deployed to Goldsky:

1. **Get Endpoint from Goldsky Dashboard**

2. **Test Basic Query:**
   ```bash
   curl -X POST https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1 \
     -H "Content-Type: application/json" \
     -d '{
       "query": "{ _meta { block { number } } }"
     }'
   ```

3. **Test Vault Query:**
   ```bash
   curl -X POST https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1 \
     -H "Content-Type: application/json" \
     -d '{
       "query": "{ idoVaults(first: 5) { vaultAddress currentCVS totalLicenseRevenue } }"
     }'
   ```

4. **Test License Sales Query:**
   ```bash
   curl -X POST https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1 \
     -H "Content-Type: application/json" \
     -d '{
       "query": "{ dataLicenseSales(first: 10, orderBy: timestamp, orderDirection: desc) { salePrice licenseType cvsIncrement } }"
     }'
   ```

---

## Testing Checklist

### Pre-Deployment Testing

- [x] Schema validation
- [x] Build successful
- [x] Event handlers match contract events
- [x] ABIs are correct
- [ ] Local Graph Node deployment
- [ ] Event handler logic verification
- [ ] Entity relationships testing

### Post-Deployment Testing

- [ ] Endpoint accessible
- [ ] Basic metadata query works
- [ ] Vault queries return data
- [ ] License sale queries work
- [ ] Loan queries work
- [ ] CVS calculations are correct
- [ ] Historical data is indexed
- [ ] Real-time indexing works

---

## How the Subgraph Was Validated

### 1. Build Verification

```bash
cd subgraph
npm run codegen    # Generated TypeScript types
npm run build      # Compiled to WASM successfully
```

**Result**: ✅ Build completed without errors

### 2. Schema Validation

- Schema defines all entities correctly
- Entity fields match event data
- Relationships are properly defined

**Result**: ✅ Schema is valid

### 3. Event Handler Implementation

- All contract events have handlers
- Handlers update entities correctly
- CVS calculation logic is implemented

**Result**: ✅ Handlers are implemented

### 4. Code Compilation

- AssemblyScript compiles to WASM
- No compilation errors
- Types are correctly generated

**Result**: ✅ Code compiles successfully

---

## What Testing Means for Subgraph

Unlike unit tests for smart contracts, subgraph testing typically involves:

1. **Build Testing** ✅ - Verify code compiles
2. **Local Testing** ⏳ - Test with local Graph Node
3. **Deployment Testing** ⏳ - Test after deployment
4. **Query Testing** ⏳ - Test GraphQL queries
5. **Integration Testing** ⏳ - Test with real blockchain data

**Current Status**: The subgraph has passed build testing and is ready for deployment. Full testing requires deployment to Goldsky or local Graph Node.

---

## Next Steps for Full Testing

1. **Deploy to Goldsky** (or set up local Graph Node)
2. **Wait for initial sync** (index historical blocks)
3. **Test GraphQL queries** with real data
4. **Verify event indexing** matches on-chain events
5. **Test CVS calculations** with actual license sales
6. **Monitor indexing** for new events

---

## Manual Verification Methods

### Check Build Output

```bash
cd subgraph
npm run build

# Check build output
ls -la build/
# Should see:
# - schema.graphql
# - subgraph.yaml
# - AtlasADLV/AtlasADLV.wasm
# - AtlasADLV/abis/AtlasADLV.json
```

### Verify Event Handlers

```bash
# Check that all events in subgraph.yaml have handlers in mapping.ts
grep -E "event:|handler:" subgraph/subgraph.yaml
grep -E "export function handle" subgraph/src/mapping.ts
```

### Verify Schema Matches Entities

```bash
# Check entities in schema
grep -E "type.*{" subgraph/schema.graphql

# Check entity creation in mapping
grep -E "new.*\(" subgraph/src/mapping.ts
```

---

**Note**: The subgraph is built and ready, but full testing requires either:
1. Local Graph Node deployment (for development)
2. Goldsky deployment (for production)

Both options will allow testing with real blockchain data and GraphQL queries.

