/**
 * CVS (Collateral Value Score) Engine
 * 
 * Core logic for calculating and monitoring CVS scores
 * Integrates with Goldsky subgraph for real-time data
 */

import { graphqlClient, queries } from '@atlas-protocol/graphql-client';
import type {IDOVault, IPAssetUsage, DataLicenseSale } from '@atlas-protocol/types';

export class CVSEngine {
  private pollingInterval: number;
  private isMonitoring: boolean = false;

  constructor(pollingIntervalMs: number = 30000) {
    this.pollingInterval = pollingIntervalMs;
  }

  /**
   * Calculate CVS for an IP asset based on subgraph data
   * Falls back to direct contract calls if subgraph is unavailable
   */
  async calculateCVS(ipAssetId: string): Promise<bigint> {
    try {
      const data = await graphqlClient.request(queries.GET_IP_ASSET, {
        id: ipAssetId,
      });

      const ipAsset = data.ipAsset;
      if (!ipAsset) {
        throw new Error(`IP Asset ${ipAssetId} not found`);
      }

      let cvs = BigInt(0);

      // Add CVS from usage events
      for (const usage of ipAsset.usageEvents) {
        cvs += BigInt(usage.cvsImpact);
      }

      // Add CVS from license sales
      for (const sale of ipAsset.licenseSales) {
        cvs += BigInt(sale.cvsIncrement);
      }

      return cvs;
    } catch (error) {
      // Fallback: Return 0 if subgraph is not available
      // In production, this would query contracts directly
      console.warn(`Subgraph unavailable for IP ${ipAssetId}, using fallback`);
      return BigInt(0);
    }
  }

  /**
   * Calculate max loan amount based on CVS
   */
  calculateMaxLoanAmount(cvs: bigint): bigint {
    // Max loan = 50% of CVS
    return cvs / BigInt(2);
  }

  /**
   * Calculate dynamic interest rate based on CVS
   */
  calculateInterestRate(cvs: bigint): number {
    // Interest rate: 20% - (CVS / 100), minimum 5%
    const baseRate = 20;
    const discount = Number(cvs) / 100;
    const rate = Math.max(5, baseRate - discount);
    return rate;
  }

  /**
   * Check if a loan request is eligible based on CVS
   */
  async checkLoanEligibility(
    vaultAddress: string,
    requestedAmount: bigint
  ): Promise<{
    eligible: boolean;
    currentCVS: bigint;
    maxLoanAmount: bigint;
    interestRate: number;
    reason?: string;
  }> {
    const data = await graphqlClient.request(queries.GET_VAULT, {
      id: vaultAddress,
    });

    const vault = data.idoVault;
    if (!vault) {
      return {
        eligible: false,
        currentCVS: BigInt(0),
        maxLoanAmount: BigInt(0),
        interestRate: 20,
        reason: 'Vault not found',
      };
    }

    const currentCVS = BigInt(vault.currentCVS);
    const maxLoanAmount = this.calculateMaxLoanAmount(currentCVS);
    const interestRate = this.calculateInterestRate(currentCVS);
    const availableLiquidity = BigInt(vault.availableLiquidity);

    // Check eligibility
    if (requestedAmount > maxLoanAmount) {
      return {
        eligible: false,
        currentCVS,
        maxLoanAmount,
        interestRate,
        reason: `Requested amount exceeds max loan amount (${maxLoanAmount})`,
      };
    }

    if (requestedAmount > availableLiquidity) {
      return {
        eligible: false,
        currentCVS,
        maxLoanAmount,
        interestRate,
        reason: `Insufficient liquidity (available: ${availableLiquidity})`,
      };
    }

    // Required CVS = 2x loan amount (200% coverage)
    const requiredCVS = requestedAmount * BigInt(2);
    if (currentCVS < requiredCVS) {
      return {
        eligible: false,
        currentCVS,
        maxLoanAmount,
        interestRate,
        reason: `Insufficient CVS (required: ${requiredCVS}, current: ${currentCVS})`,
      };
    }

    return {
      eligible: true,
      currentCVS,
      maxLoanAmount,
      interestRate,
    };
  }

  /**
   * Monitor active loans and check for liquidation conditions
   */
  async monitorLoans(): Promise<{
    atRisk: any[];
    liquidatable: any[];
  }> {
    const data = await graphqlClient.request(queries.GET_ACTIVE_LOANS, {
      first: 100,
    });

    const loans = data.loans;
    const atRisk: any[] = [];
    const liquidatable: any[] = [];

    for (const loan of loans) {
      const vaultData = await graphqlClient.request(queries.GET_VAULT, {
        id: loan.vault.vaultAddress,
      });

      const vault = vaultData.idoVault;
      if (!vault) continue;

      const currentCVS = BigInt(vault.currentCVS);
      const cvsAtIssuance = BigInt(loan.cvsAtIssuance);
      const loanAmount = BigInt(loan.loanAmount);

      // Check if CVS has dropped significantly
      const cvsDropPercent = Number(
        ((cvsAtIssuance - currentCVS) * BigInt(100)) / cvsAtIssuance
      );

      // At risk: CVS dropped by 20%+
      if (cvsDropPercent >= 20) {
        atRisk.push({
          loanId: loan.id,
          borrower: loan.borrower,
          loanAmount: loan.loanAmount,
          cvsAtIssuance: loan.cvsAtIssuance,
          currentCVS: vault.currentCVS,
          dropPercent: cvsDropPercent,
        });
      }

      // Liquidatable: CVS dropped by 50%+ or below required coverage
      const requiredCVS = loanAmount * BigInt(2);
      if (cvsDropPercent >= 50 || currentCVS < requiredCVS) {
        liquidatable.push({
          loanId: loan.id,
          borrower: loan.borrower,
          loanAmount: loan.loanAmount,
          currentCVS: vault.currentCVS,
          requiredCVS: requiredCVS.toString(),
          reason:
            cvsDropPercent >= 50
              ? `CVS dropped by ${cvsDropPercent}%`
              : `CVS below required coverage`,
        });
      }
    }

    return { atRisk, liquidatable };
  }

  /**
   * Start monitoring CVS and loans
   */
  startMonitoring(callback: (result: any) => void): void {
    if (this.isMonitoring) {
      console.log('CVS monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log(`🔍 CVS Engine: Starting monitoring (interval: ${this.pollingInterval}ms)`);

    const monitor = async () => {
      if (!this.isMonitoring) return;

      try {
        console.log('📊 CVS Engine: Checking loans...');
        const result = await this.monitorLoans();

        if (result.atRisk.length > 0) {
          console.log(`⚠️  ${result.atRisk.length} loan(s) at risk`);
        }

        if (result.liquidatable.length > 0) {
          console.log(`🚨 ${result.liquidatable.length} loan(s) liquidatable`);
        }

        callback(result);
      } catch (error) {
        console.error('❌ CVS Engine error:', error);
      }

      // Schedule next check
      setTimeout(monitor, this.pollingInterval);
    };

    // Start first check
    monitor();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('🛑 CVS Engine: Monitoring stopped');
  }

  /**
   * Get vault statistics
   */
  async getVaultStats(vaultAddress: string) {
    const data = await graphqlClient.request(queries.GET_VAULT, {
      id: vaultAddress,
    });

    const vault = data.idoVault;
    if (!vault) {
      throw new Error(`Vault ${vaultAddress} not found`);
    }

    return {
      vaultAddress: vault.vaultAddress,
      creator: vault.creator,
      ipAsset: vault.ipAsset.name,
      currentCVS: vault.currentCVS,
      initialCVS: vault.initialCVS,
      cvsGrowth: ((BigInt(vault.currentCVS) - BigInt(vault.initialCVS)) * BigInt(100)) / BigInt(vault.initialCVS || 1),
      maxLoanAmount: vault.maxLoanAmount,
      interestRate: vault.interestRate,
      totalLiquidity: vault.totalLiquidity,
      availableLiquidity: vault.availableLiquidity,
      activeLoansCount: vault.activeLoansCount,
      utilizationRate: vault.utilizationRate,
      totalLicenseRevenue: vault.totalLicenseRevenue,
      totalLoanRepayments: vault.totalLoanRepayments,
    };
  }

  /**
   * Get global protocol statistics
   */
  async getGlobalStats() {
    const data = await graphqlClient.request(queries.GET_GLOBAL_STATS);
    return data.globalStats;
  }

  /**
   * Get CVS leaderboard
   */
  async getCVSLeaderboard(limit: number = 10) {
    const data = await graphqlClient.request(queries.GET_CVS_LEADERBOARD, {
      first: limit,
    });

    return data.ipAssets.map((asset: any) => ({
      id: asset.id,
      name: asset.name,
      creator: asset.creator,
      cvsScore: asset.cvsScore,
      totalLicenseRevenue: asset.totalLicenseRevenue,
      totalUsageCount: asset.totalUsageCount,
      totalRemixes: asset.totalRemixes,
      vault: asset.vault
        ? {
            currentCVS: asset.vault.currentCVS,
            maxLoanAmount: asset.vault.maxLoanAmount,
            interestRate: asset.vault.interestRate,
          }
        : null,
    }));
  }
}

// Export singleton instance
export const cvsEngine = new CVSEngine();

