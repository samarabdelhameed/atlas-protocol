/**
 * Story Protocol REST API Client
 * 
 * Provides access to on-chain IP asset usage data:
 * - Derivatives (remixes, adaptations)
 * - License tokens
 * - Transactions
 * - Disputes
 * 
 * API Docs: https://api.storyapis.com/api/v4/docs
 */

// ============================================================================
// Types
// ============================================================================

export interface StoryAPIConfig {
  baseUrl: string;
  apiKey: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface PaginationMetadata {
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// IP Asset types
export interface EnrichedIPAsset {
  ipId: string;
  ownerAddress: string;
  blockNumber: number;
  txHash: string;
  chainId: string;
  tokenContract: string;
  tokenId: string;
  name: string;
  title: string;
  description: string;
  uri: string;
  registrationDate: string;
  lastUpdatedAt: string;
  createdAt: string;
  // Usage metrics
  parentsCount: number;
  ancestorsCount: number;
  childrenCount: number;      // Direct derivatives
  descendantsCount: number;   // All derivatives in tree
  isInGroup: boolean;
  rootIPs: string[];
  // Licenses attached to this IP
  licenses?: License[];
  // NFT metadata
  nftMetadata?: {
    name: string;
    description: string | null;
    image?: {
      cachedUrl: string;
      originalUrl: string;
    };
  };
}

export interface License {
  licenseTemplateId: string;
  licenseTermsId: string;
  templateName: string;
  terms: LicenseTerms;
  createdAt: string;
  updatedAt: string;
}

export interface LicenseTerms {
  commercialUse: boolean;
  derivativesAllowed: boolean;
  transferable: boolean;
  royaltyPolicy: string;
  defaultMintingFee: string;
  commercialRevShare: number;
}

// Derivative (Edge) types
export interface DerivativeEdge {
  id: number;
  blockNumber: number;
  blockTimestamp: string;
  txHash: string;
  childIpId: string;
  parentIpId: string;
  licenseTermsId: string;
  licenseTokenId: string;
  caller: string;
  processedAt: string;
}

// License Token types
export interface LicenseToken {
  id: string;
  licensorIpId: string;
  licenseTemplate: string;
  licenseTermsId: string;
  transferable: string;
  owner: string;
  burntAt: string;
  blockNumber: string;
  blockTime: string;
}

// Transaction types
export interface IPTransaction {
  id: number;
  txHash: string;
  logIndex: number;
  blockNumber: number;
  eventType: string;
  ipId: string;
  initiator: string;
  createdAt: string;
}

// Aggregated usage stats
export interface IPUsageStats {
  ipId: string;
  name: string;
  description: string;
  owner: string;
  registeredAt: string;
  
  // Derivative metrics
  directDerivatives: number;
  totalDescendants: number;
  parentIPs: number;
  ancestorIPs: number;
  
  // License metrics
  licensesAttached: number;
  licenseTokensIssued: number;
  
  // Transaction history
  totalTransactions: number;
  recentTransactions: IPTransaction[];
  
  // Derivative details
  derivatives: DerivativeEdge[];
}

// ============================================================================
// API Client
// ============================================================================

/**
 * Normalize IP ID from bytes32 format to standard address format
 * Converts 0x000000000000000000000000c651... to 0xc651...
 */
function normalizeIpId(ipId: string): string {
  // If it's a bytes32 padded address (66 chars), extract the last 40 hex chars
  if (ipId.length === 66 && ipId.startsWith('0x000000000000000000000000')) {
    return '0x' + ipId.slice(-40);
  }
  return ipId;
}

class StoryProtocolAPIClient {
  private config: StoryAPIConfig;

  constructor() {
    // Support both env variable names for backwards compatibility
    // Priority: STORY_API_URL > STORY_PROTOCOL_API_URL > default testnet
    const baseUrl = process.env.STORY_API_URL 
      || process.env.STORY_PROTOCOL_API_URL?.replace('/v1', '/api/v4')  // Convert v1 to v4 format
      || 'https://staging-api.storyprotocol.net/api/v4';  // Testnet default
    
    this.config = {
      baseUrl,
      apiKey: process.env.STORY_API_KEY || 'KOTbaGUSWQ6cUJWhiJYiOjPgB0kTRu1eCFFvQL0IWls',
    };
    
    console.log(`📡 Story Protocol API configured: ${this.config.baseUrl}`);
  }

  private async request<T>(endpoint: string, body: object): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    console.log(`📡 Story API: POST ${endpoint}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.config.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Story API error: ${response.status} - ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get IP Asset details including derivatives count and licenses
   */
  async getIPAsset(ipId: string): Promise<EnrichedIPAsset | null> {
    try {
      const response = await this.request<{
        data: EnrichedIPAsset[];
        pagination: PaginationMetadata;
      }>('/assets', {
        where: {
          ipIds: [normalizeIpId(ipId).toLowerCase()],
        },
        includeLicenses: true,
        pagination: { limit: 1, offset: 0 },
      });

      if (!response.data || response.data.length === 0) {
        return null;
      }

      const asset = response.data[0];
      return asset ?? null;
    } catch (error: any) {
      console.error(`❌ Error fetching IP asset ${ipId}:`, error.message);
      return null;
    }
  }

  /**
   * Get all derivatives (children) of an IP asset
   */
  async getDerivatives(parentIpId: string, pagination?: PaginationOptions): Promise<{
    edges: DerivativeEdge[];
    pagination: PaginationMetadata;
  }> {
    try {
      const response = await this.request<{
        data: DerivativeEdge[];
        pagination: PaginationMetadata;
      }>('/assets/edges', {
        where: {
          parentIpId: normalizeIpId(parentIpId).toLowerCase(),
        },
        orderBy: 'blockNumber',
        orderDirection: 'desc',
        pagination: {
          limit: pagination?.limit || 100,
          offset: pagination?.offset || 0,
        },
      });

      return {
        edges: response.data || [],
        pagination: response.pagination,
      };
    } catch (error: any) {
      console.error(`❌ Error fetching derivatives for ${parentIpId}:`, error.message);
      return {
        edges: [],
        pagination: { offset: 0, limit: 100, total: 0, hasMore: false },
      };
    }
  }

  /**
   * Get all license tokens issued for an IP asset
   */
  async getLicenseTokens(ipId: string, pagination?: PaginationOptions): Promise<{
    tokens: LicenseToken[];
    pagination: PaginationMetadata;
  }> {
    try {
      const response = await this.request<{
        data: LicenseToken[];
        pagination: PaginationMetadata;
      }>('/licenses/tokens', {
        where: {
          licensorIpId: normalizeIpId(ipId).toLowerCase(),
        },
        orderBy: 'blockNumber',
        orderDirection: 'desc',
        pagination: {
          limit: pagination?.limit || 100,
          offset: pagination?.offset || 0,
        },
      });

      return {
        tokens: response.data || [],
        pagination: response.pagination,
      };
    } catch (error: any) {
      console.error(`❌ Error fetching license tokens for ${ipId}:`, error.message);
      return {
        tokens: [],
        pagination: { offset: 0, limit: 100, total: 0, hasMore: false },
      };
    }
  }

  /**
   * Get all transactions for an IP asset
   */
  async getTransactions(ipId: string, pagination?: PaginationOptions): Promise<{
    transactions: IPTransaction[];
    pagination: PaginationMetadata;
  }> {
    try {
      const response = await this.request<{
        data: IPTransaction[];
        pagination: PaginationMetadata;
      }>('/transactions', {
        where: {
          ipIds: [normalizeIpId(ipId).toLowerCase()],
        },
        orderBy: 'blockNumber',
        orderDirection: 'desc',
        pagination: {
          limit: pagination?.limit || 50,
          offset: pagination?.offset || 0,
        },
      });

      return {
        transactions: response.data || [],
        pagination: response.pagination,
      };
    } catch (error: any) {
      console.error(`❌ Error fetching transactions for ${ipId}:`, error.message);
      return {
        transactions: [],
        pagination: { offset: 0, limit: 50, total: 0, hasMore: false },
      };
    }
  }

  /**
   * Get comprehensive usage statistics for an IP asset
   * This is the main function for usage analytics
   */
  async getIPUsageStats(ipId: string): Promise<IPUsageStats | null> {
    const normalizedId = normalizeIpId(ipId);
    console.log(`📊 Fetching Story Protocol usage stats for: ${ipId}`);
    if (normalizedId !== ipId) {
      console.log(`   📝 Normalized to: ${normalizedId}`);
    }

    // Fetch all data in parallel
    const [asset, derivativesResult, licenseTokensResult, transactionsResult] = await Promise.all([
      this.getIPAsset(ipId),
      this.getDerivatives(ipId),
      this.getLicenseTokens(ipId),
      this.getTransactions(ipId, { limit: 10 }),
    ]);

    if (!asset) {
      console.warn(`⚠️ IP Asset ${ipId} not found in Story Protocol`);
      return null;
    }

    const stats: IPUsageStats = {
      ipId: asset.ipId,
      name: asset.name || asset.title || 'Unknown',
      description: asset.description || '',
      owner: asset.ownerAddress,
      registeredAt: asset.registrationDate,

      // Derivative metrics
      directDerivatives: asset.childrenCount,
      totalDescendants: asset.descendantsCount,
      parentIPs: asset.parentsCount,
      ancestorIPs: asset.ancestorsCount,

      // License metrics
      licensesAttached: asset.licenses?.length || 0,
      licenseTokensIssued: licenseTokensResult.pagination.total,

      // Transaction history
      totalTransactions: transactionsResult.pagination.total,
      recentTransactions: transactionsResult.transactions,

      // Derivative details
      derivatives: derivativesResult.edges,
    };

    console.log(`✅ Story Protocol stats fetched:`, {
      directDerivatives: stats.directDerivatives,
      totalDescendants: stats.totalDescendants,
      licenseTokensIssued: stats.licenseTokensIssued,
      totalTransactions: stats.totalTransactions,
    });

    return stats;
  }

  /**
   * List all IP Assets from Story Protocol API
   * Used for marketplace display when Goldsky vaults don't have IP IDs
   */
  async listAllIPAssets(pagination?: PaginationOptions): Promise<{
    assets: EnrichedIPAsset[];
    pagination: PaginationMetadata;
  }> {
    try {
      const response = await this.request<{
        data: EnrichedIPAsset[];
        pagination: PaginationMetadata;
      }>('/assets', {
        includeLicenses: true,
        orderBy: 'createdAt',
        orderDirection: 'desc',
        pagination: {
          limit: pagination?.limit || 20,
          offset: pagination?.offset || 0,
        },
      });

      console.log(`📋 Story API: Found ${response.data?.length || 0} IP assets`);
      
      return {
        assets: response.data || [],
        pagination: response.pagination,
      };
    } catch (error: any) {
      console.error('❌ Error listing IP assets:', error.message);
      return {
        assets: [],
        pagination: { offset: 0, limit: 20, total: 0, hasMore: false },
      };
    }
  }
}

// Export singleton instance
export const storyAPIClient = new StoryProtocolAPIClient();

// Export functions for convenience
export const getIPAsset = (ipId: string) => storyAPIClient.getIPAsset(ipId);
export const getDerivatives = (parentIpId: string, pagination?: PaginationOptions) => 
  storyAPIClient.getDerivatives(parentIpId, pagination);
export const getLicenseTokens = (ipId: string, pagination?: PaginationOptions) => 
  storyAPIClient.getLicenseTokens(ipId, pagination);
export const getTransactions = (ipId: string, pagination?: PaginationOptions) => 
  storyAPIClient.getTransactions(ipId, pagination);
export const getIPUsageStats = (ipId: string) => storyAPIClient.getIPUsageStats(ipId);
export const listAllIPAssets = (pagination?: PaginationOptions) => 
  storyAPIClient.listAllIPAssets(pagination);
