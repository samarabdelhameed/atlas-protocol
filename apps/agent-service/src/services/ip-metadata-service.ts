/**
 * IP Metadata Service
 * 
 * Fetches IP Asset metadata from Story Protocol using the existing Story SDK.
 * Provides caching and bulk fetching capabilities for the marketplace.
 */

import type { Address } from 'viem';
import { getIPAsset } from '../../services/storyProtocol.js';

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
 * Fetch IP metadata from Story Protocol
 * Uses existing getIPAsset wrapper function
 */
export async function fetchIPMetadata(ipId: Address): Promise<IPMetadata | null> {
  try {
    // Check cache first
    const cached = metadataCache.get(ipId.toLowerCase());
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`✅ Cache hit for IP ${ipId}`);
      return cached.data;
    }

    console.log(`🔍 Fetching metadata for IP ${ipId} from Story Protocol...`);

    // Fetch from Story Protocol SDK using existing wrapper
    const ipAsset = await getIPAsset(ipId);

    if (!ipAsset) {
      console.warn(`⚠️ No IP Asset found for ${ipId}`);
      return null;
    }

    // Parse the metadata from Story Protocol response
    // The SDK returns the IP Asset data including metadata
    const parsedMetadata: IPMetadata = {
      name: (ipAsset as any).metadata?.name || (ipAsset as any).name || `IP Asset ${ipId.slice(0, 10)}...`,
      description: (ipAsset as any).metadata?.description || (ipAsset as any).description || 'No description available',
      contentURI: (ipAsset as any).metadataURI || (ipAsset as any).metadata?.metadataURI,
      creator: ((ipAsset as any).owner || '0x0000000000000000000000000000000000000000') as Address,
      thumbnailURI: (ipAsset as any).metadata?.image,
      mediaUrl: (ipAsset as any).metadata?.mediaUrl,
      mediaType: (ipAsset as any).metadata?.mediaType,
      category: (ipAsset as any).metadata?.category,
    };

    // If metadata includes external URI (IPFS/HTTP), try to fetch it
    if (parsedMetadata.contentURI && parsedMetadata.contentURI.startsWith('http')) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(parsedMetadata.contentURI, { 
          signal: controller.signal 
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const externalData = await response.json() as any;
          // Merge external metadata (prefer external data if available)
          parsedMetadata.name = externalData.title || externalData.name || parsedMetadata.name;
          parsedMetadata.description = externalData.description || parsedMetadata.description;
          parsedMetadata.thumbnailURI = externalData.image || externalData.thumbnail || parsedMetadata.thumbnailURI;
          parsedMetadata.category = externalData.category || parsedMetadata.category;
          parsedMetadata.mediaUrl = externalData.mediaUrl || parsedMetadata.mediaUrl;
          parsedMetadata.mediaType = externalData.mediaType || parsedMetadata.mediaType;
        }
      } catch (fetchError: any) {
        console.warn(`⚠️ Failed to fetch external metadata from ${parsedMetadata.contentURI}:`, fetchError.message);
        // Continue with on-chain metadata
      }
    }

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
