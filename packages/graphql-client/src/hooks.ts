/**
 * React Query Hooks for Atlas Protocol Subgraph
 * Use these hooks in the frontend to fetch CVS and vault data
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { request } from 'graphql-request';
import { getSubgraphEndpoint } from './client';
import * as queries from './queries';

// ========================================
// IP Asset Hooks
// ========================================

export function useIPAsset(id: string): UseQueryResult<any> {
  return useQuery({
    queryKey: ['ipAsset', id],
    queryFn: async () => {
      const data = await request(getSubgraphEndpoint(), queries.GET_IP_ASSET, { id });
      return data.ipAsset;
    },
    enabled: !!id,
    staleTime: 30000, // 30 seconds
  });
}

export function useIPAssets(options?: {
  first?: number;
  skip?: number;
  orderBy?: string;
  orderDirection?: string;
}): UseQueryResult<any[]> {
  return useQuery({
    queryKey: ['ipAssets', options],
    queryFn: async () => {
      const data = await request(getSubgraphEndpoint(), queries.GET_IP_ASSETS, options || {});
      return data.ipAssets;
    },
    staleTime: 60000, // 1 minute
  });
}

export function useIPUsageEvents(ipAssetId: string, first: number = 50): UseQueryResult<any[]> {
  return useQuery({
    queryKey: ['ipUsageEvents', ipAssetId, first],
    queryFn: async () => {
      const data = await request(getSubgraphEndpoint(), queries.GET_IP_USAGE_EVENTS, {
        ipAssetId,
        first,
      });
      return data.ipAssetUsages;
    },
    enabled: !!ipAssetId,
    staleTime: 30000,
  });
}

// ========================================
// Vault Hooks
// ========================================

export function useVault(id: string): UseQueryResult<any> {
  return useQuery({
    queryKey: ['vault', id],
    queryFn: async () => {
      const data = await request(getSubgraphEndpoint(), queries.GET_VAULT, { id });
      return data.idoVault;
    },
    enabled: !!id,
    staleTime: 15000, // 15 seconds (more frequent for vault data)
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
}

export function useVaults(options?: {
  first?: number;
  skip?: number;
  minCVS?: string;
}): UseQueryResult<any[]> {
  return useQuery({
    queryKey: ['vaults', options],
    queryFn: async () => {
      const data = await request(getSubgraphEndpoint(), queries.GET_VAULTS, options || {});
      return data.idoVaults;
    },
    staleTime: 60000,
  });
}

export function useVaultsByCreator(creator: string): UseQueryResult<any[]> {
  return useQuery({
    queryKey: ['vaultsByCreator', creator],
    queryFn: async () => {
      const data = await request(getSubgraphEndpoint(), queries.GET_VAULT_BY_CREATOR, {
        creator,
      });
      return data.idoVaults;
    },
    enabled: !!creator,
    staleTime: 30000,
  });
}

// ========================================
// License Sale Hooks
// ========================================

export function useLicenseSales(options?: {
  first?: number;
  skip?: number;
}): UseQueryResult<any[]> {
  return useQuery({
    queryKey: ['licenseSales', options],
    queryFn: async () => {
      const data = await request(getSubgraphEndpoint(), queries.GET_LICENSE_SALES, options || {});
      return data.dataLicenseSales;
    },
    staleTime: 60000,
  });
}

export function useHighImpactLicenseSales(minCVSIncrement: string): UseQueryResult<any[]> {
  return useQuery({
    queryKey: ['highImpactLicenseSales', minCVSIncrement],
    queryFn: async () => {
      const data = await request(
        getSubgraphEndpoint(),
        queries.GET_HIGH_IMPACT_LICENSE_SALES,
        { minCVSIncrement }
      );
      return data.dataLicenseSales;
    },
    staleTime: 60000,
  });
}

// ========================================
// Loan Hooks
// ========================================

export function useLoan(id: string): UseQueryResult<any> {
  return useQuery({
    queryKey: ['loan', id],
    queryFn: async () => {
      const data = await request(getSubgraphEndpoint(), queries.GET_LOAN, { id });
      return data.loan;
    },
    enabled: !!id,
    staleTime: 30000,
  });
}

export function useActiveLoans(first: number = 50): UseQueryResult<any[]> {
  return useQuery({
    queryKey: ['activeLoans', first],
    queryFn: async () => {
      const data = await request(getSubgraphEndpoint(), queries.GET_ACTIVE_LOANS, { first });
      return data.loans;
    },
    staleTime: 30000,
    refetchInterval: 60000, // Check for new loans every minute
  });
}

export function useLoansByBorrower(borrower: string): UseQueryResult<any[]> {
  return useQuery({
    queryKey: ['loansByBorrower', borrower],
    queryFn: async () => {
      const data = await request(getSubgraphEndpoint(), queries.GET_LOANS_BY_BORROWER, {
        borrower,
      });
      return data.loans;
    },
    enabled: !!borrower,
    staleTime: 30000,
  });
}

// ========================================
// Analytics Hooks
// ========================================

export function useGlobalStats(): UseQueryResult<any> {
  return useQuery({
    queryKey: ['globalStats'],
    queryFn: async () => {
      const data = await request(getSubgraphEndpoint(), queries.GET_GLOBAL_STATS);
      return data.globalStats;
    },
    staleTime: 120000, // 2 minutes
    refetchInterval: 300000, // Refresh every 5 minutes
  });
}

export function useCVSLeaderboard(first: number = 10): UseQueryResult<any[]> {
  return useQuery({
    queryKey: ['cvsLeaderboard', first],
    queryFn: async () => {
      const data = await request(getSubgraphEndpoint(), queries.GET_CVS_LEADERBOARD, { first });
      return data.ipAssets;
    },
    staleTime: 120000,
  });
}

export function useVaultAnalytics(vaultId: string, timeframe?: number): UseQueryResult<any> {
  return useQuery({
    queryKey: ['vaultAnalytics', vaultId, timeframe],
    queryFn: async () => {
      const data = await request(getSubgraphEndpoint(), queries.GET_VAULT_ANALYTICS, {
        vaultId,
        timeframe,
      });
      return data.idoVault;
    },
    enabled: !!vaultId,
    staleTime: 60000,
  });
}

// ========================================
// Custom Hooks for Computed Data
// ========================================

/**
 * Hook to calculate loan eligibility based on CVS
 */
export function useLoanEligibility(vaultId: string, requestedAmount: string) {
  const { data: vault, ...queryResult } = useVault(vaultId);

  const isEligible = vault
    ? BigInt(vault.maxLoanAmount) >= BigInt(requestedAmount) &&
      BigInt(vault.availableLiquidity) >= BigInt(requestedAmount)
    : false;

  return {
    ...queryResult,
    vault,
    isEligible,
    maxLoanAmount: vault?.maxLoanAmount,
    interestRate: vault?.interestRate,
    collateralRatio: vault?.collateralRatio,
  };
}

/**
 * Hook to get CVS growth over time
 */
export function useCVSGrowth(vaultId: string) {
  const { data: analytics, ...queryResult } = useVaultAnalytics(vaultId);

  const cvsGrowth = analytics?.licenseSales?.map((sale: any) => ({
    timestamp: sale.timestamp,
    cvsIncrement: sale.cvsIncrement,
    revenue: sale.salePrice,
  })) || [];

  return {
    ...queryResult,
    cvsGrowth,
    currentCVS: analytics?.currentCVS,
    totalRevenue: analytics?.totalLicenseRevenue,
  };
}

/**
 * Hook to calculate vault health metrics
 */
export function useVaultHealth(vaultId: string) {
  const { data: vault, ...queryResult } = useVault(vaultId);

  if (!vault) {
    return { ...queryResult, healthScore: 0, metrics: null };
  }

  // Calculate health metrics
  const utilizationRate = parseFloat(vault.utilizationRate || '0');
  const cvsGrowth = vault.currentCVS > vault.initialCVS ? 
    ((vault.currentCVS - vault.initialCVS) / vault.initialCVS) * 100 : 0;
  const liquidityRatio = vault.totalLiquidity > 0 ?
    (vault.availableLiquidity / vault.totalLiquidity) * 100 : 0;

  // Health score (0-100)
  const healthScore = Math.min(100, (
    (utilizationRate < 80 ? 30 : 10) + // Utilization (30 points max)
    (cvsGrowth > 0 ? 30 : 10) + // CVS growth (30 points max)
    (liquidityRatio > 20 ? 20 : liquidityRatio) + // Liquidity (20 points max)
    (vault.activeLoansCount < 10 ? 20 : 10) // Active loans (20 points max)
  ));

  return {
    ...queryResult,
    vault,
    healthScore,
    metrics: {
      utilizationRate,
      cvsGrowth,
      liquidityRatio,
      activeLoans: vault.activeLoansCount,
    },
  };
}

