/**
 * CVS Calculator Service
 * 
 * Calculates CVS (Collateral Value Score) based on:
 * 1. License Sales (from Goldsky)
 * 2. Revenue (from Goldsky)
 * 3. Originality Score (from Yakoa)
 */

import { fetchLatestLicenseSales } from '../clients/goldskyClient.js';
import { fetchOriginalityScore, type YakoaScore } from '../clients/yakoaClient.js';
import { ethers } from 'ethers';

export interface CVSCalculationInput {
  ipAssetId: string;
  licenseSalesCount?: number;
  totalRevenue?: bigint;
  originalityScore?: number;
}

export interface CVSCalculationResult {
  ipAssetId: string;
  calculatedCVS: bigint;
  breakdown: {
    baseCVS: bigint;
    revenueComponent: bigint;
    originalityComponent: bigint;
    licenseSalesComponent: bigint;
  };
  yakoaScore: YakoaScore;
  timestamp: number;
}

/**
 * CVS Calculation Formula:
 * 
 * CVS = Base + (Revenue * RevenueMultiplier) + (Originality * OriginalityMultiplier) + (LicenseSales * SalesMultiplier)
 * 
 * Where:
 * - Base = 1000 (minimum CVS)
 * - RevenueMultiplier = 0.1 (10% of revenue in wei)
 * - OriginalityMultiplier = 50 (50 points per originality point)
 * - SalesMultiplier = 100 (100 points per license sale)
 */
export class CVSCalculator {
  private readonly BASE_CVS = BigInt(1000); // Minimum CVS
  private readonly REVENUE_MULTIPLIER = BigInt(10); // 10% of revenue (divide by 10)
  private readonly ORIGINALITY_MULTIPLIER = BigInt(50); // 50 points per originality point
  private readonly SALES_MULTIPLIER = BigInt(100); // 100 points per sale

  /**
   * Calculate CVS for an IP Asset
   */
  async calculateCVS(ipAssetId: string): Promise<CVSCalculationResult> {
    console.log(`\n📊 Calculating CVS for IP Asset: ${ipAssetId}`);
    
    // Step 1: Fetch Yakoa Originality Score
    console.log('🔍 Step 1: Fetching Yakoa Originality Score...');
    const yakoaScore = await fetchOriginalityScore(ipAssetId);
    console.log(`✅ Yakoa Score: ${yakoaScore.score}/100 (confidence: ${yakoaScore.confidence}%)`);
    
    // Step 2: Fetch License Sales from Goldsky
    console.log('🔍 Step 2: Fetching License Sales from Goldsky...');
    const licenseSales = await fetchLatestLicenseSales();
    
    // Filter sales for this IP Asset
    const ipSales = licenseSales.filter(sale => 
      sale.ipAsset.id.toLowerCase() === ipAssetId.toLowerCase() ||
      sale.ipAsset.id === ipAssetId
    );
    
    console.log(`✅ Found ${ipSales.length} license sales for this IP Asset`);
    
    // Calculate metrics
    const licenseSalesCount = ipSales.length;
    const totalRevenue = ipSales.reduce((sum, sale) => {
      return sum + BigInt(sale.salePrice || '0');
    }, BigInt(0));
    
    const revenueEth = Number(totalRevenue) / 1e18;
    console.log(`✅ Total Revenue: ${revenueEth.toFixed(4)} ETH`);
    
    // Step 3: Calculate CVS components
    console.log('🔍 Step 3: Calculating CVS components...');
    
    // Base CVS
    const baseCVS = this.BASE_CVS;
    
    // Revenue component: 10% of total revenue
    const revenueComponent = totalRevenue / this.REVENUE_MULTIPLIER;
    
    // Originality component: 50 points per originality point
    const originalityComponent = BigInt(Math.floor(yakoaScore.score)) * this.ORIGINALITY_MULTIPLIER;
    
    // License sales component: 100 points per sale
    const licenseSalesComponent = BigInt(licenseSalesCount) * this.SALES_MULTIPLIER;
    
    // Total CVS
    const calculatedCVS = baseCVS + revenueComponent + originalityComponent + licenseSalesComponent;
    
    console.log('\n📊 CVS Breakdown:');
    console.log(`   Base CVS: ${baseCVS.toString()}`);
    console.log(`   Revenue Component: ${revenueComponent.toString()} (${revenueEth.toFixed(4)} ETH × 10%)`);
    console.log(`   Originality Component: ${originalityComponent.toString()} (${yakoaScore.score} × 50)`);
    console.log(`   License Sales Component: ${licenseSalesComponent.toString()} (${licenseSalesCount} × 100)`);
    console.log(`\n✅ Total CVS: ${calculatedCVS.toString()}`);
    
    return {
      ipAssetId,
      calculatedCVS,
      breakdown: {
        baseCVS,
        revenueComponent,
        originalityComponent,
        licenseSalesComponent,
      },
      yakoaScore,
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate CVS with custom inputs
   */
  calculateCVSFromInputs(inputs: CVSCalculationInput): bigint {
    const baseCVS = this.BASE_CVS;
    const revenue = inputs.totalRevenue || BigInt(0);
    const originality = BigInt(Math.floor(inputs.originalityScore || 0));
    const sales = BigInt(inputs.licenseSalesCount || 0);
    
    const revenueComponent = revenue / this.REVENUE_MULTIPLIER;
    const originalityComponent = originality * this.ORIGINALITY_MULTIPLIER;
    const salesComponent = sales * this.SALES_MULTIPLIER;
    
    return baseCVS + revenueComponent + originalityComponent + salesComponent;
  }
}

// Export singleton instance
export const cvsCalculator = new CVSCalculator();

