# CVS (Collateral Value Score) Calculation Guide

## Overview

The Collateral Value Score (CVS) is a dynamic metric that represents the market value and usage of an IP asset. It's used to determine lending terms in the ADLV (Adaptive Dynamic Liquidity Vault).

## Core Entities for CVS

### 1. IPAssetUsage
Tracks every usage, license, or remix of an IP asset.

**CVS Impact Factors:**
- Commercial use: 1% of revenue generated
- Derivative works: 2% of revenue generated
- Remixes: Fixed +100 CVS points
- General usage: Fixed +10 CVS points

### 2. IDOVault
Tracks vault state with CVS metrics for lending decisions.

**Key CVS Metrics:**
- `currentCVS`: Real-time CVS score
- `initialCVS`: Starting CVS when vault created
- `lastCVSUpdate`: Last time CVS was recalculated

**Lending Terms Based on CVS:**
- `maxLoanAmount`: CVS × 0.5 (50% of CVS)
- `interestRate`: 20% - (CVS/100), minimum 5%
- `collateralRatio`: 150% default

### 3. DataLicenseSale
Tracks license sales that significantly impact CVS.

**CVS Increment by License Type:**
- Exclusive license: 10% of sale price
- Commercial license: 5% of sale price
- Derivative license: 4% of sale price
- Standard license: 2% of sale price

## CVS Calculation Formula

```
Total CVS = 
  Initial CVS
  + Σ(License Sales CVS Increments)
  + Σ(Usage CVS Impacts)
  + Σ(Remix Bonuses)
```

## Event Handlers

### 1. handleIPRegistered
**Triggered:** When IP is registered on Story Protocol
**CVS Impact:** Initializes CVS at 0
**Updates:** Creates IPAsset entity

### 2. handleLicenseSale
**Triggered:** When a data license is sold via ADLV
**CVS Impact:** +2% to +10% of sale price
**Updates:**
- Creates DataLicenseSale entity
- Updates vault.currentCVS
- Updates vault.maxLoanAmount
- Updates vault.interestRate
- Updates ipAsset.totalLicenseRevenue

### 3. handleLoanIssued
**Triggered:** When a loan is issued based on CVS
**CVS Check:** Requires CVS ≥ 2× loan amount
**Updates:**
- Creates Loan entity with cvsAtIssuance
- Updates vault.totalLoansIssued
- Updates vault.activeLoansCount
- Updates vault.availableLiquidity

## Example Scenarios

### Scenario 1: New IP Asset
```
1. IP Registered → CVS = 0
2. First license sold for 1 ETH (commercial) → CVS += 0.05 ETH
3. IP remixed → CVS += 100 points
4. Current CVS = 0.05 ETH + 100 points
5. Max Loan = CVS × 0.5 = 0.025 ETH + 50 points
```

### Scenario 2: Growing IP Portfolio
```
Initial CVS: 1000 points

License Sales:
- Exclusive: 10 ETH → +1 ETH CVS
- Commercial: 5 ETH → +0.25 ETH CVS
- Total: +1.25 ETH

Usage Events:
- 50 commercial uses averaging 0.1 ETH → +0.05 ETH
- 20 remixes → +2000 points

New CVS = 1000 + 1.25 ETH + 0.05 ETH + 2000 = 3000 points + 1.3 ETH

Max Loan Available:
- From points: 1500 points
- From ETH value: 0.65 ETH
- Total: ~1500 + 0.65 ETH

Interest Rate:
- 20% - (3000/100) = 20% - 30% = 5% (minimum)
```

### Scenario 3: Loan Qualification
```
Creator wants loan of 5 ETH

Required CVS = 5 ETH × 2 = 10 ETH
Current CVS = 12 ETH equivalent

✅ Loan Approved
- Amount: 5 ETH
- Collateral: 7.5 ETH (150%)
- Interest Rate: 20% - (12/1) = 8%
- Duration: Customizable
```

## GraphQL Query Examples

### Query 1: Get IP Asset with CVS Metrics
```graphql
{
  ipAsset(id: "0x123...") {
    name
    creator
    cvsScore
    totalLicenseRevenue
    totalUsageCount
    totalRemixes
    
    usageEvents(first: 10, orderBy: timestamp, orderDirection: desc) {
      usageType
      revenueGenerated
      cvsImpact
      timestamp
    }
    
    licenseSales(first: 10) {
      salePrice
      licenseType
      cvsIncrement
      timestamp
    }
    
    vault {
      currentCVS
      maxLoanAmount
      interestRate
      activeLoansCount
    }
  }
}
```

### Query 2: Get Vault with Loan Eligibility
```graphql
{
  idoVault(id: "0xabc...") {
    vaultAddress
    creator
    currentCVS
    initialCVS
    maxLoanAmount
    interestRate
    collateralRatio
    
    ipAsset {
      name
      totalUsageCount
      totalLicenseRevenue
    }
    
    loans(where: { status: Active }) {
      borrower
      loanAmount
      cvsAtIssuance
      outstandingAmount
      endTime
    }
    
    licenseSales(orderBy: timestamp, orderDirection: desc, first: 5) {
      licensee
      salePrice
      licenseType
      cvsIncrement
      timestamp
    }
  }
}
```

### Query 3: Get All License Sales with CVS Impact
```graphql
{
  dataLicenseSales(
    first: 20
    orderBy: cvsIncrement
    orderDirection: desc
  ) {
    id
    ipAsset {
      name
      creator
    }
    licensee
    salePrice
    licenseType
    cvsIncrement
    creatorShare
    vaultShare
    timestamp
  }
}
```

### Query 4: Find High-CVS Vaults
```graphql
{
  idoVaults(
    first: 10
    where: { currentCVS_gt: "10000000000000000000" } # > 10 ETH
    orderBy: currentCVS
    orderDirection: desc
  ) {
    vaultAddress
    currentCVS
    maxLoanAmount
    interestRate
    totalLicenseRevenue
    activeLoansCount
    
    ipAsset {
      name
      creator
      totalUsageCount
    }
  }
}
```

## Integration with Frontend

### React Hook Example
```typescript
import { useQuery } from '@tanstack/react-query';
import { request, gql } from 'graphql-request';

const SUBGRAPH_URL = 'https://api.goldsky.com/api/public/atlas-protocol/subgraphs';

const GET_VAULT_CVS = gql`
  query GetVaultCVS($vaultId: ID!) {
    idoVault(id: $vaultId) {
      currentCVS
      maxLoanAmount
      interestRate
      ipAsset {
        name
        totalLicenseRevenue
      }
    }
  }
`;

export function useVaultCVS(vaultId: string) {
  return useQuery({
    queryKey: ['vaultCVS', vaultId],
    queryFn: async () => {
      const data = await request(SUBGRAPH_URL, GET_VAULT_CVS, { vaultId });
      return data.idoVault;
    },
  });
}
```

## Smart Contract Integration

The subgraph listens to these events from your contracts:

```solidity
// Story Protocol
event IPRegistered(bytes32 indexed ipId, address indexed creator, string name, string description, string ipHash);
event IPUsed(bytes32 indexed ipId, address indexed user, string usageType, uint256 revenue);
event IPRemixed(bytes32 indexed originalIPId, bytes32 indexed newIPId, address indexed remixer);

// Atlas ADLV
event VaultCreated(address indexed vaultAddress, bytes32 indexed ipId, uint256 initialCVS);
event LicenseSold(address indexed vaultAddress, bytes32 indexed ipId, address indexed licensee, uint256 price, string licenseType);
event LoanIssued(address indexed vaultAddress, address indexed borrower, uint256 loanId, uint256 amount, uint256 collateral, uint256 duration);
event CVSUpdated(address indexed vaultAddress, uint256 oldCVS, uint256 newCVS);
```

## Deployment Checklist

- [ ] Update contract addresses in `subgraph.yaml`
- [ ] Update network (story-testnet, story-mainnet)
- [ ] Update startBlock numbers
- [ ] Place ABI files in `abis/` directory
- [ ] Run `npm run codegen`
- [ ] Run `npm run build`
- [ ] Deploy to Goldsky: `npm run deploy`
- [ ] Test GraphQL queries
- [ ] Integrate with frontend

## References

- Story Protocol: https://docs.story.foundation/
- The Graph: https://thegraph.com/docs/
- Goldsky: https://docs.goldsky.com/

