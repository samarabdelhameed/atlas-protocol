# @atlas-protocol/graphql-client

Shared GraphQL client for querying the Atlas Protocol Goldsky subgraph.

## Features

- **GraphQL Client**: Pre-configured client with retry logic
- **Type-safe Queries**: All subgraph queries in one place
- **React Hooks**: Ready-to-use hooks for frontend
- **CVS Queries**: Focus on Collateral Value Score data
- **Vault Analytics**: Real-time vault and loan data

## Installation

This package is part of the Atlas Protocol monorepo workspace.

```bash
# In apps/frontend or apps/agent-service
bun add @atlas-protocol/graphql-client
```

## Usage

### Frontend (React)

```typescript
import { useVault, useCVSLeaderboard, useVaultHealth } from '@atlas-protocol/graphql-client';

function VaultDashboard({ vaultId }: { vaultId: string }) {
  const { data: vault, isLoading } = useVault(vaultId);
  const { healthScore, metrics } = useVaultHealth(vaultId);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>{vault.ipAsset.name}</h2>
      <p>Current CVS: {vault.currentCVS}</p>
      <p>Max Loan: {vault.maxLoanAmount}</p>
      <p>Interest Rate: {vault.interestRate}%</p>
      <p>Health Score: {healthScore}/100</p>
    </div>
  );
}
```

### Backend / Agent Service

```typescript
import { graphqlClient, queries } from '@atlas-protocol/graphql-client';

// Query vault data
const vaultData = await graphqlClient.request(queries.GET_VAULT, {
  id: vaultAddress,
});

// Query active loans for monitoring
const activeLoans = await graphqlClient.request(queries.GET_ACTIVE_LOANS, {
  first: 100,
});

// Process CVS updates
for (const loan of activeLoans.loans) {
  if (loan.cvsAtIssuance < vaultData.idoVault.currentCVS * 0.5) {
    console.log(`Loan ${loan.id} may need collateral adjustment`);
  }
}
```

## Available Hooks

### IP Asset Hooks
- `useIPAsset(id)` - Get IP asset with CVS metrics
- `useIPAssets(options)` - List IP assets
- `useIPUsageEvents(ipAssetId)` - Get usage events

### Vault Hooks
- `useVault(id)` - Get vault with full details
- `useVaults(options)` - List vaults
- `useVaultsByCreator(creator)` - Get vaults by creator address
- `useVaultHealth(vaultId)` - Calculate vault health score
- `useLoanEligibility(vaultId, amount)` - Check loan eligibility

### Loan Hooks
- `useLoan(id)` - Get loan details
- `useActiveLoans()` - List active loans
- `useLoansByBorrower(borrower)` - Get loans by borrower

### Analytics Hooks
- `useGlobalStats()` - Protocol-wide statistics
- `useCVSLeaderboard()` - Top IP assets by CVS
- `useVaultAnalytics(vaultId)` - Detailed vault analytics
- `useCVSGrowth(vaultId)` - CVS growth over time

## Configuration

Set the subgraph endpoint via environment variables:

```env
# .env
SUBGRAPH_URL=https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1
```

Or use the defaults:
- **Development**: `http://localhost:8000/subgraphs/name/atlas-protocol`
- **Story Testnet**: `https://api.goldsky.com/api/public/atlas-protocol/testnet/subgraphs/atlas-v1`
- **Production**: `https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1`

## GraphQL Queries

All queries are exported from `queries`:

```typescript
import { queries } from '@atlas-protocol/graphql-client';

// Available queries:
queries.GET_IP_ASSET
queries.GET_VAULT
queries.GET_LICENSE_SALES
queries.GET_ACTIVE_LOANS
queries.GET_GLOBAL_STATS
// ... and more
```

## TypeScript

Full TypeScript support with types imported from `@atlas-protocol/types`:

```typescript
import type { IDOVault, DataLicenseSale, Loan } from '@atlas-protocol/types';
```

## Examples

### Check Loan Eligibility

```typescript
function LoanForm({ vaultId }: { vaultId: string }) {
  const [amount, setAmount] = useState('0');
  const { isEligible, maxLoanAmount, interestRate } = useLoanEligibility(vaultId, amount);

  return (
    <div>
      <input 
        type="number" 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)}
        max={maxLoanAmount}
      />
      {isEligible ? (
        <p>✅ Eligible for loan at {interestRate}% interest</p>
      ) : (
        <p>❌ Amount exceeds max loan of {maxLoanAmount}</p>
      )}
    </div>
  );
}
```

### Monitor CVS Growth

```typescript
function CVSChart({ vaultId }: { vaultId: string }) {
  const { cvsGrowth, currentCVS } = useCVSGrowth(vaultId);

  return (
    <div>
      <h3>CVS: {currentCVS}</h3>
      <Chart data={cvsGrowth} />
    </div>
  );
}
```

### Display Leaderboard

```typescript
function Leaderboard() {
  const { data: topAssets } = useCVSLeaderboard(10);

  return (
    <ul>
      {topAssets?.map((asset) => (
        <li key={asset.id}>
          {asset.name} - CVS: {asset.cvsScore}
        </li>
      ))}
    </ul>
  );
}
```

## Development

```bash
# Build
bun run build

# Use in other packages
cd ../../apps/frontend
bun add @atlas-protocol/graphql-client
```
