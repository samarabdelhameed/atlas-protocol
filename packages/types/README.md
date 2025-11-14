# @atlas-protocol/types

Shared TypeScript type definitions for Atlas Protocol monorepo.

## Purpose

This package contains all shared type definitions used across:
- **Frontend** (`apps/frontend`)
- **Agent Service** (`apps/agent-service`)

## Type Categories

### IP Asset & Licensing Types
- `IPAssetMetadata` - Intellectual property asset metadata
- `LicensingTerms` - Licensing terms and conditions

### CVS (Cross-chain Value System) Types
- `CVSData` - Cross-chain value system data
- `BridgeRequest` - Cross-chain bridge request

### ADLV (Adaptive Dynamic Liquidity Vault) Types
- `LoanRequest` - Loan request information
- `LoanStatus` - Enum for loan statuses
- `VaultStats` - Vault statistics

### IDO Types
- `IDOPool` - IDO pool configuration
- `IDOParticipation` - User participation in IDO

### World ID Types
- `WorldIDVerification` - World ID verification data

### Agent Service Types
- `AgentTask` - Agent service task
- `AgentResponse` - Agent service response

## Usage

```typescript
import type { 
  IPAssetMetadata, 
  LoanRequest, 
  CVSData 
} from "@atlas-protocol/types";

const asset: IPAssetMetadata = {
  id: "0x123",
  name: "My IP Asset",
  // ...
};
```

## Development

This is a TypeScript-only package with no build step required.
