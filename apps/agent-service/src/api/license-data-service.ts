/**
 * License Data Service
 *
 * Aggregates data from multiple sources to provide comprehensive
 * IP intelligence data to license holders:
 * - Goldsky subgraph (license history, vault metrics, CVS scores)
 * - Yakoa API (originality scores, provenance data)
 * - CVS Engine (calculated metrics, leaderboard positions)
 */

import { graphqlClient } from '@atlas-protocol/graphql-client';
import { gql } from 'graphql-request';
import { fetchOriginalityScore } from '../clients/yakoaClient';

export interface LicenseInfo {
  id: string;
  ipAssetId: string;
  ipAssetName: string;
  purchasedAt: string;
  pricePaid: string;
  licenseType: string;
  duration: string;
  expiresAt: string;
  isActive: boolean;
  transactionHash: string;
}

export interface IPAssetData {
  id: string;
  name: string;
  description: string;
  creator: string;
  ipHash: string;
  timestamp: string;

  // Licensing info
  commercialUse: boolean;
  derivatives: boolean;
  royaltyPercent: string;

  // CVS metrics
  cvsScore: string;
  totalLicenseRevenue: string;
  totalUsageCount: string;
  totalRemixes: string;

  // Vault info (if exists)
  vault: {
    vaultAddress: string;
    currentCVS: string;
    maxLoanAmount: string;
    interestRate: string;
    totalLiquidity: string;
    utilizationRate: string;
  } | null;

  // Originality score from Yakoa
  originality: {
    score: number;
    confidence: number;
    verified: boolean;
  } | null;

  // Market metrics
  marketMetrics: {
    totalLicensesSold: number;
    averagePrice: string;
    recentSales: Array<{
      buyer: string;
      price: string;
      timestamp: string;
    }>;
  };
}

/**
 * Get all licenses purchased by a user
 */
export async function getUserLicenses(userAddress: string): Promise<LicenseInfo[]> {
  try {
    const query = gql`
      query GetUserLicenses($licensee: String!) {
        dataLicenseSales(
          where: { licensee: $licensee }
          orderBy: timestamp
          orderDirection: desc
        ) {
          id
          ipAsset {
            id
            name
          }
          licensee
          salePrice
          licenseType
          duration
          expiresAt
          isActive
          timestamp
          transactionHash
        }
      }
    `;

    const data = await graphqlClient.request(query, {
      licensee: userAddress.toLowerCase(),
    });

    const licenses = data.dataLicenseSales || [];

    console.log(`📄 Found ${licenses.length} license(s) for ${userAddress}`);

    return licenses.map((sale: any) => ({
      id: sale.id,
      ipAssetId: sale.ipAsset?.id || 'unknown',
      ipAssetName: sale.ipAsset?.name || 'Unknown IP Asset',
      purchasedAt: new Date(Number(sale.timestamp) * 1000).toISOString(),
      pricePaid: sale.salePrice,
      licenseType: sale.licenseType,
      duration: sale.duration,
      expiresAt: new Date(Number(sale.expiresAt) * 1000).toISOString(),
      isActive: sale.isActive,
      transactionHash: sale.transactionHash,
    }));
  } catch (error: any) {
    console.error(`❌ Error fetching licenses for ${userAddress}:`, error.message);
    return [];
  }
}

/**
 * Check if user has an active license for an IP asset
 */
export async function hasActiveLicense(
  userAddress: string,
  ipAssetId: string
): Promise<boolean> {
  try {
    const query = gql`
      query CheckLicense($licensee: String!, $ipAsset: String!) {
        dataLicenseSales(
          where: {
            licensee: $licensee
            ipAsset: $ipAsset
            isActive: true
          }
        ) {
          id
          expiresAt
        }
      }
    `;

    const data = await graphqlClient.request(query, {
      licensee: userAddress.toLowerCase(),
      ipAsset: ipAssetId.toLowerCase(),
    });

    const sales = data.dataLicenseSales || [];

    if (sales.length === 0) {
      return false;
    }

    // Check if any license is still valid
    const now = Math.floor(Date.now() / 1000);
    const hasValid = sales.some((sale: any) => Number(sale.expiresAt) > now);

    return hasValid;
  } catch (error: any) {
    console.error(`❌ Error checking license:`, error.message);
    return false;
  }
}

/**
 * Get comprehensive IP asset data (requires active license)
 */
export async function getIPAssetData(ipAssetId: string): Promise<IPAssetData | null> {
  try {
    const query = gql`
      query GetIPAssetData($id: ID!) {
        ipasset(id: $id) {
          id
          name
          description
          creator
          ipHash
          timestamp
          blockNumber

          # Licensing
          commercialUse
          derivatives
          royaltyPercent
          mintingFee

          # CVS metrics
          cvsScore
          totalLicenseRevenue
          totalUsageCount
          totalRemixes

          # Vault relation
          vault {
            vaultAddress
            currentCVS
            maxLoanAmount
            interestRate
            totalLiquidity
            utilizationRate
          }

          # License sales for market metrics
          licenseSales(orderBy: timestamp, orderDirection: desc, first: 10) {
            licensee
            salePrice
            timestamp
          }
        }
      }
    `;

    const data = await graphqlClient.request(query, { id: ipAssetId.toLowerCase() });

    if (!data.ipasset) {
      console.warn(`❌ IP asset ${ipAssetId} not found`);
      return null;
    }

    const asset = data.ipasset;

    // Calculate market metrics
    const sales = asset.licenseSales || [];
    const totalLicensesSold = sales.length;
    const averagePrice = totalLicensesSold > 0
      ? (BigInt(sales.reduce((sum: bigint, sale: any) => sum + BigInt(sale.salePrice), BigInt(0))) / BigInt(totalLicensesSold)).toString()
      : '0';

    // Fetch originality score from Yakoa
    let originality = null;
    try {
      const yakoaScore = await fetchOriginalityScore(asset.ipHash);
      originality = {
        score: yakoaScore.score,
        confidence: yakoaScore.confidence,
        verified: yakoaScore.verified,
      };
    } catch (error) {
      console.warn(`⚠️  Could not fetch Yakoa score for ${ipAssetId}`);
    }

    console.log(`✅ Fetched IP asset data for ${ipAssetId}`);

    return {
      id: asset.id,
      name: asset.name,
      description: asset.description,
      creator: asset.creator,
      ipHash: asset.ipHash,
      timestamp: new Date(Number(asset.timestamp) * 1000).toISOString(),

      commercialUse: asset.commercialUse,
      derivatives: asset.derivatives,
      royaltyPercent: asset.royaltyPercent,

      cvsScore: asset.cvsScore,
      totalLicenseRevenue: asset.totalLicenseRevenue,
      totalUsageCount: asset.totalUsageCount,
      totalRemixes: asset.totalRemixes,

      vault: asset.vault
        ? {
            vaultAddress: asset.vault.vaultAddress,
            currentCVS: asset.vault.currentCVS,
            maxLoanAmount: asset.vault.maxLoanAmount,
            interestRate: asset.vault.interestRate,
            totalLiquidity: asset.vault.totalLiquidity,
            utilizationRate: asset.vault.utilizationRate,
          }
        : null,

      originality,

      marketMetrics: {
        totalLicensesSold,
        averagePrice,
        recentSales: sales.slice(0, 5).map((sale: any) => ({
          buyer: sale.licensee,
          price: sale.salePrice,
          timestamp: new Date(Number(sale.timestamp) * 1000).toISOString(),
        })),
      },
    };
  } catch (error: any) {
    console.error(`❌ Error fetching IP asset data for ${ipAssetId}:`, error.message);
    return null;
  }
}

/**
 * Get IP asset data with license verification
 */
export async function getIPAssetDataForLicensee(
  ipAssetId: string,
  licenseeAddress: string
): Promise<IPAssetData | { error: string }> {
  // Verify the user has an active license
  const hasLicense = await hasActiveLicense(licenseeAddress, ipAssetId);

  if (!hasLicense) {
    console.warn(`🚫 User ${licenseeAddress} attempted to access ${ipAssetId} without valid license`);
    return {
      error: 'Access denied: You do not have an active license for this IP asset',
    };
  }

  const data = await getIPAssetData(ipAssetId);

  if (!data) {
    return {
      error: 'IP asset not found',
    };
  }

  return data;
}
