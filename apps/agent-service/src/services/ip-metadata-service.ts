/**
 * IP Metadata Service
 * 
 * Fetches IP Asset metadata from Story Protocol using the REST API.
 * Provides caching and bulk fetching capabilities for the marketplace.
 */

import type { Address } from 'viem';
import { getIPAsset as getIPAssetFromAPI } from '../clients/storyProtocolApiClient.js';

export interface IPMetadata {
  name: string;
  description: string;
  contentURI?: string;
  category?: string;
  creator: Address;
  createdAt?: number;
  thumbnailURI?: string;
  mediaUrl?: string;
  mediaType?: string;
}

// In-memory cache (use Redis in production)
const metadataCache = new Map<string, { data: IPMetadata; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour

/**
 * Check if a name is a generic/auto-generated name that should be replaced
 * Examples of generic names:
 * - "1315: Test NFTs #3542" (chain ID + collection name + token ID)
 * - "IP Asset 0x1234...abcd" (subgraph default)
 * - "IP Asset #123"
 * - Names that are just numbers or hex addresses
 */
function isGenericName(name: string | undefined | null): boolean {
  if (!name) return true;
  
  // Pattern: "chainId: Collection Name #tokenId" (e.g., "1315: Test NFTs #3542")
  if (/^\d+:\s*.+\s*#\d+$/.test(name)) return true;
  
  // Pattern: "IP Asset 0x..." or "IP Asset #..."
  if (/^IP Asset\s*(0x[a-fA-F0-9]|#\d)/i.test(name)) return true;
  
  // Pattern: Just a hex address
  if (/^0x[a-fA-F0-9]{6,}$/i.test(name)) return true;
  
  // Pattern: Just "IP Asset" with nothing else meaningful
  if (/^IP Asset$/i.test(name.trim())) return true;
  
  return false;
}

/**
 * Generate the subgraph-style default name for an IP asset
 * Format: "IP Asset 0x1234...abcd"
 */
function getDefaultName(ipId: string): string {
  const cleanId = ipId.toLowerCase();
  return `IP Asset ${cleanId.slice(0, 6)}...${cleanId.slice(-4)}`;
}

/**
 * Fetch IP metadata from Story Protocol REST API
 * Uses the enriched API that returns name, description, and nftMetadata
 */
export async function fetchIPMetadata(ipId: Address): Promise<IPMetadata | null> {
  try {
    // Check cache first
    const cached = metadataCache.get(ipId.toLowerCase());
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`✅ Cache hit for IP ${ipId}`);
      return cached.data;
    }

    console.log(`🔍 Fetching metadata for IP ${ipId} from Story Protocol API...`);

    // Fetch from Story Protocol REST API (returns enriched data with name/description)
    const ipAsset = await getIPAssetFromAPI(ipId);

    if (!ipAsset) {
      console.warn(`⚠️ No IP Asset found for ${ipId}`);
      return null;
    }

    // Determine the best name to use:
    // 1. First, check if there's a custom name in the API response (not generic)
    // 2. If all names are generic, use the subgraph default format
    const candidateNames = [
      ipAsset.name,
      ipAsset.title,
      ipAsset.nftMetadata?.name,
    ];
    
    // Find the first non-generic name, or use the default format
    let resolvedName = candidateNames.find(n => !isGenericName(n));
    if (!resolvedName) {
      resolvedName = getDefaultName(ipId);
      console.log(`📝 Using default name format for ${ipId}: ${resolvedName}`);
    }

    // Parse the metadata from Story Protocol API response
    const parsedMetadata: IPMetadata = {
      name: resolvedName,
      description: ipAsset.nftMetadata?.description || ipAsset.description || 'IP Asset registered via ADLV vault creation',
      contentURI: ipAsset.uri,
      creator: (ipAsset.ownerAddress || '0x0000000000000000000000000000000000000000') as Address,
      thumbnailURI: ipAsset.nftMetadata?.image?.cachedUrl || ipAsset.nftMetadata?.image?.originalUrl,
      createdAt: ipAsset.registrationDate ? new Date(ipAsset.registrationDate).getTime() : undefined,
    };

    // Cache the result
    metadataCache.set(ipId.toLowerCase(), {
      data: parsedMetadata,
      timestamp: Date.now(),
    });

    console.log(`✅ Retrieved metadata for ${parsedMetadata.name}`);
    return parsedMetadata;
  } catch (error: any) {
    console.error(`❌ Error fetching IP metadata for ${ipId}:`, error.message);
    return null;
  }
}

/**
 * Fetch metadata for multiple IP assets in parallel
 * Batches requests to avoid overwhelming the API
 */
export async function fetchBulkIPMetadata(ipIds: Address[]): Promise<Map<Address, IPMetadata>> {
  const results = new Map<Address, IPMetadata>();

  // Fetch in parallel with concurrency limit
  const BATCH_SIZE = 5;
  for (let i = 0; i < ipIds.length; i += BATCH_SIZE) {
    const batch = ipIds.slice(i, i + BATCH_SIZE);
    
    console.log(`📦 Fetching batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(ipIds.length / BATCH_SIZE)} (${batch.length} IPs)`);
    
    const promises = batch.map(async (ipId) => {
      const metadata = await fetchIPMetadata(ipId);
      if (metadata) {
        results.set(ipId, metadata);
      }
    });
    
    await Promise.all(promises);
  }

  console.log(`✅ Fetched metadata for ${results.size}/${ipIds.length} IP assets`);
  return results;
}

/**
 * Clear the metadata cache
 * Useful for forcing refresh
 */
export function clearMetadataCache(): void {
  metadataCache.clear();
  console.log('🗑️ Metadata cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; entries: number } {
  return {
    size: metadataCache.size,
    entries: metadataCache.size,
  };
}
