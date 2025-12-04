/**
 * Usage Data Service
 * 
 * Aggregates global usage analytics for IP assets
 * Requires active license to access
 */

import { licenseDb } from '../db/database.js';
import { graphqlClient } from '@atlas-protocol/graphql-client';
import { gql } from 'graphql-request';
import { fetchOriginalityScore, type YakoaScore } from '../clients/yakoaClient.js';

export interface UsageDataResponse {
  ipId: string;
  ipAssetName: string;
  totalLicensesSold: number;
  totalRevenue: string;
  activeLicenses: number;

  // Provenance data from Yakoa
  provenance: {
    score: number;
    originality: number;
    confidence: number;
    status: 'verified' | 'unverified' | 'pending' | 'unavailable';
  };

  // CVS metrics from subgraph
  cvs: {
    currentScore: string;
    rank: number;
    history: Array<{ timestamp: string; score: string }>;
  };

  recentPurchases: Array<{
    licensee: string;
    amount: string;
    purchasedAt: string;
    tierName: string;
  }>;
  licenseTypeBreakdown: {
    standard: number;
    commercial: number;
    exclusive: number;
  };
  revenueByMonth: Array<{
    month: string;
    revenue: string;
    licenses: number;
  }>;

  // Usage analytics
  analytics: {
    uniqueLicensees: number;
    averagePrice: string;
    last7Days: {
      newLicenses: number;
      revenue: string;
    };
    last30Days: {
      newLicenses: number;
      revenue: string;
    };
  };
}

/**
 * Get comprehensive usage data for an IP asset
 * Combines database records with on-chain data
 */
export async function getUsageData(ipId: string): Promise<UsageDataResponse | null> {
  try {
    // Get all licenses for this IP from database
    const licenses = licenseDb.getAllLicenses({ ipId });

    if (licenses.length === 0) {
      // Try to get basic info from subgraph
      return await getUsageDataFromSubgraph(ipId);
    }

    // Calculate metrics from database
    const totalRevenue = licenses.reduce((sum, lic) => {
      return sum + BigInt(lic.amount || '0');
    }, BigInt(0));

    const activeLicenses = licenses.filter(lic => {
      return lic.is_active === 1 && new Date(lic.expiresAt) > new Date();
    }).length;

    // License type breakdown
    const licenseTypeBreakdown = {
      standard: licenses.filter(l => l.licenseType === 'standard').length,
      commercial: licenses.filter(l => l.licenseType === 'commercial').length,
      exclusive: licenses.filter(l => l.licenseType === 'exclusive').length,
    };

    // Recent purchases (last 10)
    const recentPurchases = licenses
      .sort((a, b) => new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime())
      .slice(0, 10)
      .map(lic => ({
        licensee: lic.licenseeAddress,
        amount: lic.amount,
        purchasedAt: lic.purchased_at,
        tierName: lic.tierName,
      }));

    // Revenue by month (last 12 months)
    const revenueByMonth = calculateRevenueByMonth(licenses);

    // Get IP asset name from first license or subgraph
    const ipAssetName = await getIPAssetName(ipId);

    // Fetch Yakoa provenance data
    const provenance = await fetchProvenanceData(ipId);

    // Fetch CVS data from subgraph
    const cvs = await fetchCVSData(ipId);

    // Calculate analytics
    const analytics = calculateAnalytics(licenses);

    return {
      ipId,
      ipAssetName,
      totalLicensesSold: licenses.length,
      totalRevenue: totalRevenue.toString(),
      activeLicenses,
      provenance,
      cvs,
      recentPurchases,
      licenseTypeBreakdown,
      revenueByMonth,
      analytics,
    };
  } catch (error: any) {
    console.error(`Error fetching usage data for ${ipId}:`, error);
    return null;
  }
}

/**
 * Calculate revenue grouped by month
 */
function calculateRevenueByMonth(licenses: any[]): Array<{ month: string; revenue: string; licenses: number }> {
  const monthlyData = new Map<string, { revenue: bigint; count: number }>();

  licenses.forEach(lic => {
    const date = new Date(lic.purchased_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const existing = monthlyData.get(monthKey) || { revenue: BigInt(0), count: 0 };
    monthlyData.set(monthKey, {
      revenue: existing.revenue + BigInt(lic.amount || '0'),
      count: existing.count + 1,
    });
  });

  // Convert to array and sort by month (most recent first)
  return Array.from(monthlyData.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 12)
    .map(([month, data]) => ({
      month,
      revenue: data.revenue.toString(),
      licenses: data.count,
    }));
}

/**
 * Fetch Yakoa provenance data for an IP asset
 * Uses existing yakoaClient to avoid duplicate implementation
 */
async function fetchProvenanceData(ipId: string): Promise<{
  score: number;
  originality: number;
  confidence: number;
  status: 'verified' | 'unverified' | 'pending' | 'unavailable';
}> {
  try {
    const yakoaScore = await fetchOriginalityScore(ipId);

    return {
      score: yakoaScore.score,
      originality: yakoaScore.score,
      confidence: yakoaScore.confidence,
      status: yakoaScore.verified ? 'verified' : 'unverified',
    };
  } catch (error: any) {
    console.error('Error fetching Yakoa provenance data:', error);
    // Graceful degradation - return unavailable status
    return {
      score: 0,
      originality: 0,
      confidence: 0,
      status: 'unavailable',
    };
  }
}

/**
 * Fetch CVS (Content Verification Score) data from subgraph
 */
async function fetchCVSData(ipId: string): Promise<{
  currentScore: string;
  rank: number;
  history: Array<{ timestamp: string; score: string }>;
}> {
  try {
    const query = gql`
      query GetCVSData($id: ID!) {
        ipasset(id: $id) {
          cvsScore
        }
      }
    `;

    const data = await graphqlClient.request(query, { id: ipId.toLowerCase() }) as any;

    return {
      currentScore: data.ipasset?.cvsScore || '0',
      rank: 0, // TODO: Calculate rank from all IP assets when available
      history: [], // TODO: Add CVS history tracking in subgraph
    };
  } catch (error) {
    console.error('Error fetching CVS data:', error);
    return {
      currentScore: '0',
      rank: 0,
      history: [],
    };
  }
}

/**
 * Calculate analytics from license records
 */
function calculateAnalytics(licenses: any[]): {
  uniqueLicensees: number;
  averagePrice: string;
  last7Days: { newLicenses: number; revenue: string };
  last30Days: { newLicenses: number; revenue: string };
} {
  const now = new Date();
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Unique licensees
  const uniqueLicensees = new Set(licenses.map(l => l.licenseeAddress.toLowerCase())).size;

  // Average price
  const totalRevenue = licenses.reduce((sum, lic) => {
    return sum + BigInt(lic.amount || '0');
  }, BigInt(0));
  const averagePrice = licenses.length > 0
    ? (totalRevenue / BigInt(licenses.length)).toString()
    : '0';

  // Last 7 days
  const recentLicenses7d = licenses.filter(
    l => new Date(l.purchased_at) >= last7Days
  );
  const revenue7d = recentLicenses7d.reduce((sum, lic) => {
    return sum + BigInt(lic.amount || '0');
  }, BigInt(0));

  // Last 30 days
  const recentLicenses30d = licenses.filter(
    l => new Date(l.purchased_at) >= last30Days
  );
  const revenue30d = recentLicenses30d.reduce((sum, lic) => {
    return sum + BigInt(lic.amount || '0');
  }, BigInt(0));

  return {
    uniqueLicensees,
    averagePrice,
    last7Days: {
      newLicenses: recentLicenses7d.length,
      revenue: revenue7d.toString(),
    },
    last30Days: {
      newLicenses: recentLicenses30d.length,
      revenue: revenue30d.toString(),
    },
  };
}

/**
 * Get IP asset name from subgraph
 */
async function getIPAssetName(ipId: string): Promise<string> {
  try {
    const query = gql`
      query GetIPAssetName($id: ID!) {
        ipasset(id: $id) {
          name
        }
      }
    `;

    const data = await graphqlClient.request(query, { id: ipId.toLowerCase() }) as any;
    return data.ipasset?.name || 'Unknown IP Asset';
  } catch (error) {
    return 'Unknown IP Asset';
  }
}

/**
 * Fallback: Get usage data from Goldsky subgraph
 */
async function getUsageDataFromSubgraph(ipId: string): Promise<UsageDataResponse | null> {
  try {
    const query = gql`
      query GetIPUsageData($id: ID!) {
        ipasset(id: $id) {
          name
          licenseSales(orderBy: timestamp, orderDirection: desc, first: 100) {
            licensee
            salePrice
            timestamp
            licenseType
          }
        }
      }
    `;

    const data = await graphqlClient.request(query, { id: ipId.toLowerCase() }) as any;

    if (!data.ipasset) {
      return null;
    }

    const sales = data.ipasset.licenseSales || [];
    const totalRevenue = sales.reduce((sum: bigint, sale: any) => {
      return sum + BigInt(sale.salePrice || '0');
    }, BigInt(0));

    const licenseTypeBreakdown = {
      standard: sales.filter((s: any) => s.licenseType === 'standard').length,
      commercial: sales.filter((s: any) => s.licenseType === 'commercial').length,
      exclusive: sales.filter((s: any) => s.licenseType === 'exclusive').length,
    };

    // Fetch Yakoa provenance data
    const provenance = await fetchProvenanceData(ipId);

    // Fetch CVS data
    const cvs = await fetchCVSData(ipId);

    // Calculate basic analytics from subgraph data
    const uniqueLicensees = new Set(sales.map((s: any) => s.licensee.toLowerCase())).size;
    const averagePrice = sales.length > 0
      ? (totalRevenue / BigInt(sales.length)).toString()
      : '0';

    const now = Date.now();
    const last7Days = now - 7 * 24 * 60 * 60 * 1000;
    const last30Days = now - 30 * 24 * 60 * 60 * 1000;

    const recent7d = sales.filter((s: any) => Number(s.timestamp) * 1000 >= last7Days);
    const recent30d = sales.filter((s: any) => Number(s.timestamp) * 1000 >= last30Days);

    const revenue7d = recent7d.reduce((sum: bigint, sale: any) => {
      return sum + BigInt(sale.salePrice || '0');
    }, BigInt(0));

    const revenue30d = recent30d.reduce((sum: bigint, sale: any) => {
      return sum + BigInt(sale.salePrice || '0');
    }, BigInt(0));

    return {
      ipId,
      ipAssetName: data.ipasset.name,
      totalLicensesSold: sales.length,
      totalRevenue: totalRevenue.toString(),
      activeLicenses: 0, // Can't determine from subgraph alone
      provenance,
      cvs,
      recentPurchases: sales.slice(0, 10).map((sale: any) => ({
        licensee: sale.licensee,
        amount: sale.salePrice,
        purchasedAt: new Date(Number(sale.timestamp) * 1000).toISOString(),
        tierName: sale.licenseType,
      })),
      licenseTypeBreakdown,
      revenueByMonth: [],
      analytics: {
        uniqueLicensees,
        averagePrice,
        last7Days: {
          newLicenses: recent7d.length,
          revenue: revenue7d.toString(),
        },
        last30Days: {
          newLicenses: recent30d.length,
          revenue: revenue30d.toString(),
        },
      },
    };
  } catch (error) {
    console.error('Error fetching from subgraph:', error);
    return null;
  }
}
