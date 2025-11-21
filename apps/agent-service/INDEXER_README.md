# Local Indexer Service

## ✅ Implementation Complete

Local indexer service that replaces Goldsky subgraph. Indexes events from ADLV and IDO contracts and stores them in SQLite database.

## Features

- ✅ Indexes historical events from deployment block (11122612)
- ✅ Watches for new events in real-time
- ✅ Stores data in SQLite database (`data/indexer.db`)
- ✅ Provides REST API endpoints for querying data
- ✅ GraphQL-like query interface

## API Endpoints

Indexer API runs on port `3002`:

### REST Endpoints

- `GET /api/stats` - Get protocol statistics
- `GET /api/vaults` - Get all vaults
- `GET /api/vault?address=<address>` - Get specific vault
- `GET /api/loans?vaultAddress=<address>` - Get loans (optional vault filter)
- `GET /api/license-sales?vaultAddress=<address>` - Get license sales
- `GET /api/cvs-updates?vaultAddress=<address>` - Get CVS updates

### GraphQL-like Query

- `POST /query` - GraphQL-like queries
  ```json
  {
    "query": "{ vaults { vaultAddress currentCVS totalLicenseRevenue } }"
  }
  ```

## Usage

The indexer starts automatically with the agent service:

```bash
cd apps/agent-service
bun run dev
```

Indexer will:
1. Index historical events from block 11122612 to current
2. Watch for new events
3. Start API server on port 3002

## Database

Data is stored in `data/indexer.db` (SQLite). Contains:
- `vaults` - Vault information
- `license_sales` - License sales events
- `loans` - Loan information
- `cvs_updates` - CVS update history
- `indexing_progress` - Last indexed block

## Testing

```bash
# Get stats
curl http://localhost:3002/api/stats

# Get all vaults
curl http://localhost:3002/api/vaults

# Get specific vault
curl http://localhost:3002/api/vault?address=0x...

# Get loans
curl http://localhost:3002/api/loans

# GraphQL query
curl -X POST http://localhost:3002/query \
  -H "Content-Type: application/json" \
  -d '{"query": "{ stats { vaults loans licenseSales } }"}'
```

## Status

✅ Ready for deployment
✅ Replaces Goldsky subgraph
✅ Provides same functionality locally
