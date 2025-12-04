/**
 * Global IP Asset Usage Data Service
 *
 * Aggregates real-world usage intelligence for IP assets:
 * - Global usage tracking (where the IP is being used)
 * - Infringement detection via Yakoa
 * - Derivative works from Story Protocol
 * - Authorization status across platforms
 *
 * License holders pay for access to this usage intelligence
 */

import { licenseDb } from '../db/database.js';
import { graphqlClient } from '@atlas-protocol/graphql-client';
import { gql } from 'graphql-request';
import { fetchOriginalityScore } from '../clients/yakoaClient.js';

/**
 * Global IP Asset Usage Response
 * This is the intelligence data that license holders pay to access
 */
export interface UsageDataResponse {
  ipId: string;
  ipAssetName: string;

  // GLOBAL USAGE METRICS (Core value proposition)
  globalUsage: {
    totalDetections: number;           // Times IP detected in the wild
    authorizedUses: number;             // Legitimate authorized uses
    unauthorizedUses: number;           // Potential infringements
    platforms: string[];                // Where IP is being used
    derivatives: number;                // On-chain derivative works
    lastDetectedAt: string | null;      // Most recent usage
  };

  // YAKOA INFRINGEMENT INTELLIGENCE
  infringements: Array<{
    brand_id: string;
    detected_at: string;
    status: string;
    context?: string;
  }>;

  // YAKOA AUTHORIZED USAGES
  authorizations: Array<{
    brand_id: string;
    authorized_at: string;
    context?: string;
  }>;

  // STORY PROTOCOL DERIVATIVES (On-chain remixes/adaptations)
  derivatives: Array<{
    childIpId: string;
    childName?: string;
    creator: string;
    createdAt: string;
    royaltiesPaid?: string;
  }>;

  // PROVENANCE & VERIFICATION
  provenance: {
    yakoaScore: number;                 // Originality score (0-100)
    verified: boolean;                  // Is IP verified authentic?
    confidence: number;                 // Confidence in score
    status: 'verified' | 'unverified' | 'pending' | 'unavailable';
    infringementCount: number;          // Number of detected infringements
    authorizationCount: number;         // Number of authorizations
  };

  // CVS SCORE (Story Protocol Collateral Value)
  cvs: {
    currentScore: string;
    rank: number;
    history: Array<{ timestamp: string; score: string }>;
  };

  // LICENSE SALES SUMMARY (Secondary metrics)
  licensingSummary: {
    totalLicensesSold: number;
    activeLicenses: number;
    totalRevenue: string;
    licenseTypeBreakdown: {
      standard: number;
      commercial: number;
      exclusive: number;
    };
  };
}

/**
 * Get comprehensive GLOBAL USAGE intelligence for an IP asset
 * This is the core value proposition - tracking where and how the IP is used worldwide
 */
export async function getUsageData(ipId: string): Promise<UsageDataResponse | null> {
  try {
    console.log(`📊 Fetching global usage intelligence for IP: ${ipId}`);

    // STEP 1: Fetch Yakoa usage intelligence (infringements, authorizations)
    const yakoaData = await fetchYakoaUsageData(ipId);

    // STEP 2: Fetch Story Protocol derivatives (on-chain remixes)
    const derivatives = await fetchDerivativeWorks(ipId);

    // STEP 3: Fetch CVS score from subgraph
    const cvs = await fetchCVSData(ipId);

    // STEP 4: Get IP asset name
    const ipAssetName = await getIPAssetName(ipId);

    // STEP 5: Get licensing summary (secondary data)
    const licensingSummary = await getLicensingSummary(ipId);

    // STEP 6: Calculate global usage metrics
    const totalDetections = yakoaData.infringements.length + yakoaData.authorizations.length + derivatives.length;
    const platforms = extractUniquePlatforms(yakoaData.infringements, yakoaData.authorizations);
    const lastDetected = getMostRecentDetection(yakoaData.infringements, yakoaData.authorizations, derivatives);

    return {
      ipId,
      ipAssetName,

      // Core value: WHERE and HOW the IP is being used globally
      globalUsage: {
        totalDetections,
        authorizedUses: yakoaData.authorizations.length,
        unauthorizedUses: yakoaData.infringements.length,
        platforms,
        derivatives: derivatives.length,
        lastDetectedAt: lastDetected,
      },

      // Yakoa infringement intelligence
      infringements: yakoaData.infringements,

      // Yakoa authorized uses
      authorizations: yakoaData.authorizations,

      // Story Protocol derivative works
      derivatives,

      // Provenance verification
      provenance: {
        yakoaScore: yakoaData.provenance.score,
        verified: yakoaData.provenance.verified,
        confidence: yakoaData.provenance.confidence,
        status: yakoaData.provenance.status,
        infringementCount: yakoaData.infringements.length,
        authorizationCount: yakoaData.authorizations.length,
      },

      // CVS score
      cvs,

      // Licensing summary (secondary metrics)
      licensingSummary,
    };
  } catch (error: any) {
    console.error(`❌ Error fetching global usage data for ${ipId}:`, error);
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
 * Fetch Yakoa usage intelligence data
 * This includes infringements (unauthorized uses) and authorizations (legitimate uses)
 */
async function fetchYakoaUsageData(ipId: string) {
  try {
    console.log(`🔍 Fetching Yakoa usage data for ${ipId}`);

    // Fetch token data from Yakoa (includes infringements & authorizations)
    const yakoaScore = await fetchOriginalityScore(ipId);

    // Extract infringements and authorizations from Yakoa details
    const infringements = yakoaScore.details?.infringements || 0;
    const authorizations = yakoaScore.details?.authorizations || 0;

    return {
      provenance: {
        score: yakoaScore.score,
        verified: yakoaScore.verified,
        confidence: yakoaScore.confidence,
        status: yakoaScore.verified ? 'verified' as const : 'unverified' as const,
      },
      // Note: Yakoa API returns infringement/authorization counts in details
      // In production, you'd make additional API calls to get full infringement/authorization lists
      infringements: [],  // TODO: Fetch full infringement list from Yakoa API
      authorizations: [], // TODO: Fetch full authorization list from Yakoa API
    };
  } catch (error: any) {
    console.error('⚠️  Error fetching Yakoa data, using graceful fallback:', error.message);
    // Graceful degradation when Yakoa is unavailable
    return {
      provenance: {
        score: 0,
        verified: false,
        confidence: 0,
        status: 'unavailable' as const,
      },
      infringements: [],
      authorizations: [],
    };
  }
}

/**
 * Fetch derivative works from Story Protocol subgraph
 * These are on-chain remixes, adaptations, or child IPs
 */
async function fetchDerivativeWorks(ipId: string) {
  try {
    const query = gql`
      query GetDerivatives($parentId: ID!) {
        ipasset(id: $parentId) {
          childIPs {
            id
            name
            creator
            createdAt
            totalRoyaltiesPaid
          }
        }
      }
    `;

    const data = await graphqlClient.request(query, { parentId: ipId.toLowerCase() }) as any;

    const childIPs = data.ipasset?.childIPs || [];

    return childIPs.map((child: any) => ({
      childIpId: child.id,
      childName: child.name || undefined,
      creator: child.creator,
      createdAt: child.createdAt,
      royaltiesPaid: child.totalRoyaltiesPaid || undefined,
    }));
  } catch (error) {
    console.error('⚠️  Error fetching derivatives:', error);
    return [];
  }
}

/**
 * Get licensing summary (secondary metrics)
 */
async function getLicensingSummary(ipId: string) {
  try {
    const licenses = licenseDb.getAllLicenses({ ipId });

    const totalRevenue = licenses.reduce((sum, lic) => {
      return sum + BigInt(lic.amount || '0');
    }, BigInt(0));

    const activeLicenses = licenses.filter(lic => {
      return lic.is_active === 1 && new Date(lic.expiresAt) > new Date();
    }).length;

    return {
      totalLicensesSold: licenses.length,
      activeLicenses,
      totalRevenue: totalRevenue.toString(),
      licenseTypeBreakdown: {
        standard: licenses.filter(l => l.licenseType === 'standard').length,
        commercial: licenses.filter(l => l.licenseType === 'commercial').length,
        exclusive: licenses.filter(l => l.licenseType === 'exclusive').length,
      },
    };
  } catch (error) {
    console.error('⚠️  Error fetching licensing summary:', error);
    return {
      totalLicensesSold: 0,
      activeLicenses: 0,
      totalRevenue: '0',
      licenseTypeBreakdown: { standard: 0, commercial: 0, exclusive: 0 },
    };
  }
}

/**
 * Extract unique platforms from infringements and authorizations
 */
function extractUniquePlatforms(
  infringements: Array<{ brand_id: string }>,
  authorizations: Array<{ brand_id: string }>
): string[] {
  const platforms = new Set<string>();

  infringements.forEach(inf => platforms.add(inf.brand_id));
  authorizations.forEach(auth => platforms.add(auth.brand_id));

  return Array.from(platforms);
}

/**
 * Get most recent detection timestamp
 */
function getMostRecentDetection(
  infringements: Array<{ detected_at?: string }>,
  authorizations: Array<{ authorized_at?: string }>,
  derivatives: Array<{ createdAt?: string }>
): string | null {
  const timestamps: string[] = [];

  infringements.forEach(inf => inf.detected_at && timestamps.push(inf.detected_at));
  authorizations.forEach(auth => auth.authorized_at && timestamps.push(auth.authorized_at));
  derivatives.forEach(der => der.createdAt && timestamps.push(der.createdAt));

  if (timestamps.length === 0) return null;

  // Return most recent timestamp
  return timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null;
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
 * Fallback: Get usage data from Goldsky subgraph when no local database records
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

    // Fetch Yakoa usage data
    const yakoaData = await fetchYakoaUsageData(ipId);

    // Fetch derivatives from subgraph
    const derivatives = await fetchDerivativeWorks(ipId);

    // Fetch CVS data
    const cvs = await fetchCVSData(ipId);

    // Calculate licensing summary
    const licenseTypeBreakdown = {
      standard: sales.filter((s: any) => s.licenseType === 'standard').length,
      commercial: sales.filter((s: any) => s.licenseType === 'commercial').length,
      exclusive: sales.filter((s: any) => s.licenseType === 'exclusive').length,
    };

    const totalDetections = yakoaData.infringements.length + yakoaData.authorizations.length + derivatives.length;
    const platforms = extractUniquePlatforms(yakoaData.infringements, yakoaData.authorizations);
    const lastDetected = getMostRecentDetection(yakoaData.infringements, yakoaData.authorizations, derivatives);

    return {
      ipId,
      ipAssetName: data.ipasset.name,

      globalUsage: {
        totalDetections,
        authorizedUses: yakoaData.authorizations.length,
        unauthorizedUses: yakoaData.infringements.length,
        platforms,
        derivatives: derivatives.length,
        lastDetectedAt: lastDetected,
      },

      infringements: yakoaData.infringements,
      authorizations: yakoaData.authorizations,
      derivatives,

      provenance: {
        yakoaScore: yakoaData.provenance.score,
        verified: yakoaData.provenance.verified,
        confidence: yakoaData.provenance.confidence,
        status: yakoaData.provenance.status,
        infringementCount: yakoaData.infringements.length,
        authorizationCount: yakoaData.authorizations.length,
      },

      cvs,

      licensingSummary: {
        totalLicensesSold: sales.length,
        activeLicenses: 0, // Can't determine from subgraph alone
        totalRevenue: totalRevenue.toString(),
        licenseTypeBreakdown,
      },
    };
  } catch (error) {
    console.error('Error fetching from subgraph:', error);
    return null;
  }
}
