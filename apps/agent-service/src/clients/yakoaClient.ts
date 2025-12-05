/**
 * Yakoa Client - Fetch Token Authorization and Infringement Data
 *
 * Yakoa provides IP verification, authorization tracking, and infringement detection
 * API Documentation: https://docs.yakoa.io/reference/get-started
 */

export interface YakoaScore {
  score: number; // 0-100 (calculated based on infringement status)
  confidence: number; // 0-100
  verified: boolean; // True if no infringements detected
  timestamp: number;
  details?: {
    infringements?: number; // Number of detected infringements
    authorizations?: number; // Number of brand authorizations
    status?: string; // Token status
  };
}

/**
 * Yakoa API Response Structure
 * Based on official API documentation
 */
interface YakoaTokenResponse {
  token_id: string;
  network: string;
  metadata?: {
    name?: string;
    description?: string;
    image?: string;
  };
  infringements?: Array<{
    brand_id: string;
    detected_at: string;
    status: string;
  }>;
  authorizations?: Array<{
    brand_id: string;
    authorized_at: string;
  }>;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Normalize token ID to standard Ethereum address format (40 hex chars)
 * Story Protocol uses padded bytes32 format (66 hex chars), but Yakoa API expects 40 chars
 * 
 * @param tokenId - Token ID in any format (padded or standard)
 * @returns Normalized 40-char hex address with 0x prefix, lowercased
 */
function normalizeTokenId(tokenId: string): string {
  // Remove 0x prefix for processing
  const hex = tokenId.toLowerCase().replace(/^0x/, '');
  
  // If it's already 40 chars, return as-is
  if (hex.length === 40) {
    return `0x${hex}`;
  }
  
  // If it's a padded bytes32 (64 chars), extract the last 40 chars (the actual address)
  if (hex.length === 64) {
    return `0x${hex.slice(-40)}`;
  }
  
  // For other lengths, try to extract last 40 chars if possible
  if (hex.length > 40) {
    return `0x${hex.slice(-40)}`;
  }
  
  // Return as-is if shorter (will likely fail API validation)
  return `0x${hex}`;
}

/**
 * Fetch originality score from Yakoa API
 *
 * @param tokenId - Token ID or IP Asset ID
 * @returns Originality score based on infringement analysis
 */
export async function fetchOriginalityScore(tokenId: string): Promise<YakoaScore> {
  const apiKey = process.env.YAKOA_API_KEY;
  const subdomain = process.env.YAKOA_SUBDOMAIN || 'docs-demo';
  const network = process.env.YAKOA_NETWORK || 'docs-demo'; // Story Protocol Aeneid testnet

  if (!apiKey) {
    console.warn('⚠️ YAKOA_API_KEY not set. Using default originality score of 0 (Graceful Degradation).');
    console.warn('💡 To get real scores, sign up at https://docs.yakoa.io and set YAKOA_API_KEY in .env');
    
    return {
      score: 0,
      confidence: 0,
      verified: false,
      timestamp: Date.now(),
      details: {
        infringements: 0,
        authorizations: 0,
        status: 'unknown_no_api_key'
      }
    };
  }

  if (!subdomain) {
    console.warn('⚠️ YAKOA_SUBDOMAIN not set. Using default originality score of 0.');
    return {
      score: 0,
      confidence: 0,
      verified: false,
      timestamp: Date.now(),
      details: {
        infringements: 0,
        authorizations: 0,
        status: 'unknown_no_subdomain'
      }
    };
  }

  try {
    console.log(`🔍 Fetching Yakoa data for Token: ${tokenId}`);

    // Yakoa API endpoint for getting token data
    // Format: https://{subdomain}.ip-api-sandbox.yakoa.io/{network}/token/{token_id}
    const baseUrl = `https://${subdomain}.ip-api-sandbox.yakoa.io`;
    const endpoint = `${baseUrl}/${network}/token/${normalizeTokenId(tokenId)}`;

    console.log(`📡 Yakoa API Endpoint: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Yakoa API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json() as YakoaTokenResponse;

    console.log('✅ Yakoa Response:', JSON.stringify(data, null, 2));

    // Calculate originality score based on infringements
    // 100 = no infringements, decreases based on number of issues
    const infringementCount = data.infringements?.length || 0;
    const authorizationCount = data.authorizations?.length || 0;

    // Score calculation:
    // - Start at 100
    // - Subtract 20 points per infringement (minimum 0)
    // - Add bonus if authorized (up to 10 points)
    let calculatedScore = 100 - (infringementCount * 20);
    if (authorizationCount > 0) {
      calculatedScore = Math.min(100, calculatedScore + 10);
    }
    calculatedScore = Math.max(0, calculatedScore);

    const score: YakoaScore = {
      score: calculatedScore,
      confidence: infringementCount === 0 ? 95 : 75, // Higher confidence when no issues
      verified: infringementCount === 0, // Verified if no infringements
      timestamp: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
      details: {
        infringements: infringementCount,
        authorizations: authorizationCount,
        status: data.status || 'unknown',
      },
    };

    return score;
  } catch (error: any) {
    console.error('❌ Error fetching Yakoa data:', error.message);
    throw error; // Throw error instead of returning fallback
  }
}

/**
 * Batch fetch originality scores for multiple IP assets
 */
export async function fetchOriginalityScores(
  ipAssetIds: string[]
): Promise<Map<string, YakoaScore>> {
  const scores = new Map<string, YakoaScore>();
  
  console.log(`🔍 Fetching Yakoa scores for ${ipAssetIds.length} IP Assets...`);
  
  // Fetch scores in parallel (with rate limiting consideration)
  const promises = ipAssetIds.map(async (ipId) => {
    const score = await fetchOriginalityScore(ipId);
    return { ipId, score };
  });
  
  const results = await Promise.all(promises);
  
  for (const { ipId, score } of results) {
    scores.set(ipId, score);
  }
  
  console.log(`✅ Fetched ${scores.size} Yakoa scores`);
  
  return scores;
}

