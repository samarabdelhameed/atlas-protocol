/**
 * Yakoa Client - Fetch Originality Score for IP Assets
 * 
 * Yakoa provides originality verification for IP assets
 * Originality Score ranges from 0-100 (higher = more original)
 */

export interface YakoaScore {
  score: number; // 0-100
  confidence: number; // 0-100
  verified: boolean;
  timestamp: number;
  details?: {
    similarity?: number;
    uniqueness?: number;
    originality?: number;
  };
}

/**
 * Fetch originality score from Yakoa API
 * 
 * @param ipAssetId - IP Asset ID (bytes32 hex string or address)
 * @returns Originality score (0-100)
 */
export async function fetchOriginalityScore(ipAssetId: string): Promise<YakoaScore> {
  const apiKey = process.env.YAKOA_API_KEY;
  const apiUrl = process.env.YAKOA_API_URL || 'https://api.yakoa.com/v1/verify';
  
  if (!apiKey) {
    throw new Error('YAKOA_API_KEY not set in environment variables. Please set YAKOA_API_KEY in .env file');
  }

  try {
    console.log(`🔍 Fetching Yakoa score for IP Asset: ${ipAssetId}`);
    
    // Yakoa API endpoint - adjust based on actual API documentation
    const response = await fetch(`${apiUrl}?asset=${ipAssetId}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Yakoa API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Yakoa Response:', JSON.stringify(data, null, 2));
    
    // Parse response based on Yakoa API format
    // Adjust field names based on actual API response
    const score: YakoaScore = {
      score: data.score || data.originalityScore || data.originality || 0,
      confidence: data.confidence || data.confidenceScore || 90,
      verified: data.verified || data.isVerified || false,
      timestamp: data.timestamp || Date.now(),
      details: {
        similarity: data.similarity || data.similarityScore,
        uniqueness: data.uniqueness || data.uniquenessScore,
        originality: data.originality || data.originalityScore,
      },
    };
    
    if (score.score === 0) {
      throw new Error('Invalid Yakoa score received (0). Check API response format.');
    }
    
    return score;
  } catch (error: any) {
    console.error('❌ Error fetching Yakoa score:', error.message);
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

