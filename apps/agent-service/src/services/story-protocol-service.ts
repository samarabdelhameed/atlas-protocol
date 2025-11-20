/**
 * Story Protocol Service
 * 
 * Handles integration with Story Protocol SDK for:
 * - IP Asset registration and verification
 * - License registration on Story Protocol
 * - IP Asset linking (derivative works)
 * - Ownership verification
 */

import { JsonRpcProvider, Wallet, Contract } from 'ethers';
import { config } from '../config/index.js';

// Story Protocol contract addresses (Story Protocol Testnet)
// These should be updated based on actual Story Protocol deployment
const STORY_PROTOCOL_CONTRACTS = {
  IP_ASSET_REGISTRY: process.env.STORY_PROTOCOL_IP_ASSET_REGISTRY || '0x0000000000000000000000000000000000000000',
  LICENSING_MODULE: process.env.STORY_PROTOCOL_LICENSING_MODULE || '0x0000000000000000000000000000000000000000',
  REGISTRY: process.env.STORY_PROTOCOL_REGISTRY || '0x0000000000000000000000000000000000000000',
};

// Story Protocol API endpoints
const STORY_PROTOCOL_API_BASE = process.env.STORY_PROTOCOL_API_URL || 'https://api.story.foundation/v1';

export interface StoryProtocolIPAsset {
  ipId: string;
  owner: string;
  name?: string;
  description?: string;
  metadata?: Record<string, any>;
  registeredAt?: number;
  verified: boolean;
}

export interface StoryProtocolLicense {
  licenseId: string;
  ipId: string;
  licensee: string;
  licenseType: string;
  price: string;
  transactionHash: string;
  registeredAt: number;
}

export interface RegisterIPAssetParams {
  name: string;
  description?: string;
  metadata?: Record<string, any>;
  owner: string;
  contentHash?: string;
}

export interface RegisterLicenseParams {
  ipId: string;
  licensee: string;
  licenseType: string;
  price: string;
  transactionHash: string;
  duration?: number;
  terms?: string;
}

export interface LinkIPAssetsParams {
  parentIPId: string;
  childIPId: string;
  relationshipType: 'derivative' | 'collection' | 'remix';
}

export class StoryProtocolService {
  private provider: JsonRpcProvider;
  private signer: Wallet | null = null;
  private apiKey: string;
  private rpcUrl: string;

  constructor(rpcUrl?: string) {
    this.rpcUrl = rpcUrl || config.storyProtocol.rpcUrl || config.rpcUrl;
    this.provider = new JsonRpcProvider(this.rpcUrl);
    this.apiKey = config.storyProtocol.apiKey;

    // Initialize signer if private key is provided
    if (config.privateKey) {
      this.signer = new Wallet(config.privateKey, this.provider);
    }

    console.log('✅ StoryProtocolService initialized');
    console.log(`   RPC URL: ${this.rpcUrl}`);
    console.log(`   API Key: ${this.apiKey ? '✅ Set' : '❌ Not set'}`);
  }

  /**
   * Register an IP Asset on Story Protocol
   * This creates a new IP Asset entry in Story Protocol's registry
   */
  async registerIPAsset(params: RegisterIPAssetParams): Promise<StoryProtocolIPAsset> {
    if (!this.apiKey) {
      throw new Error('Story Protocol API key not configured');
    }

    try {
      console.log(`📝 Registering IP Asset on Story Protocol: ${params.name}`);

      // Option 1: Use Story Protocol API (if available)
      if (STORY_PROTOCOL_API_BASE) {
        const response = await fetch(`${STORY_PROTOCOL_API_BASE}/ip-assets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            name: params.name,
            description: params.description,
            metadata: params.metadata,
            owner: params.owner,
            contentHash: params.contentHash,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Story Protocol API failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log(`✅ IP Asset registered: ${data.ipId}`);

        return {
          ipId: data.ipId,
          owner: data.owner || params.owner,
          name: params.name,
          description: params.description,
          metadata: params.metadata,
          registeredAt: Date.now(),
          verified: true,
        };
      }

      // Option 2: Direct contract interaction (if SDK not available)
      // This is a placeholder - actual implementation depends on Story Protocol SDK
      throw new Error('Story Protocol SDK integration required. Please install @story-protocol/sdk');
    } catch (error) {
      console.error('❌ Error registering IP Asset:', error);
      throw error;
    }
  }

  /**
   * Get IP Asset information from Story Protocol
   */
  async getIPAsset(ipId: string): Promise<StoryProtocolIPAsset | null> {
    try {
      // Option 1: Use Story Protocol API
      if (STORY_PROTOCOL_API_BASE && this.apiKey) {
        const response = await fetch(`${STORY_PROTOCOL_API_BASE}/ip-assets/${ipId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        });

        if (response.status === 404) {
          return null;
        }

        if (!response.ok) {
          throw new Error(`Story Protocol API failed: ${response.status}`);
        }

        const data = await response.json();
        return {
          ipId: data.ipId,
          owner: data.owner,
          name: data.name,
          description: data.description,
          metadata: data.metadata,
          registeredAt: data.registeredAt,
          verified: data.verified || false,
        };
      }

      // Option 2: Query contract directly
      // This would require Story Protocol SDK
      console.warn('⚠️  Story Protocol SDK not available. Using placeholder.');
      return null;
    } catch (error) {
      console.error(`❌ Error getting IP Asset ${ipId}:`, error);
      return null;
    }
  }

  /**
   * Verify IP Asset ownership
   */
  async verifyIPOwnership(ipId: string, owner: string): Promise<boolean> {
    try {
      const ipAsset = await this.getIPAsset(ipId);
      if (!ipAsset) {
        return false;
      }

      // Compare owner addresses (case-insensitive)
      return ipAsset.owner.toLowerCase() === owner.toLowerCase();
    } catch (error) {
      console.error(`❌ Error verifying ownership for ${ipId}:`, error);
      return false;
    }
  }

  /**
   * Register a license on Story Protocol
   * This links the license sold on ADLV with Story Protocol's licensing system
   */
  async registerLicense(params: RegisterLicenseParams): Promise<StoryProtocolLicense> {
    if (!this.apiKey) {
      throw new Error('Story Protocol API key not configured');
    }

    try {
      console.log(`📜 Registering license on Story Protocol for IP: ${params.ipId}`);

      // Option 1: Use Story Protocol API
      if (STORY_PROTOCOL_API_BASE) {
        const response = await fetch(`${STORY_PROTOCOL_API_BASE}/licenses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            ipId: params.ipId,
            licensee: params.licensee,
            licenseType: params.licenseType,
            price: params.price,
            transactionHash: params.transactionHash,
            duration: params.duration,
            terms: params.terms,
            source: 'atlas-protocol',
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Story Protocol API failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log(`✅ License registered: ${data.licenseId}`);

        return {
          licenseId: data.licenseId || data.id,
          ipId: params.ipId,
          licensee: params.licensee,
          licenseType: params.licenseType,
          price: params.price,
          transactionHash: params.transactionHash,
          registeredAt: Date.now(),
        };
      }

      // Option 2: Direct contract interaction
      throw new Error('Story Protocol SDK integration required');
    } catch (error) {
      console.error('❌ Error registering license:', error);
      throw error;
    }
  }

  /**
   * Link two IP Assets (e.g., derivative work)
   * This creates a relationship between parent and child IP Assets
   */
  async linkIPAssets(params: LinkIPAssetsParams): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Story Protocol API key not configured');
    }

    try {
      console.log(`🔗 Linking IP Assets: ${params.parentIPId} -> ${params.childIPId}`);

      if (STORY_PROTOCOL_API_BASE) {
        const response = await fetch(`${STORY_PROTOCOL_API_BASE}/ip-assets/link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            parentIPId: params.parentIPId,
            childIPId: params.childIPId,
            relationshipType: params.relationshipType,
            source: 'atlas-protocol',
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Story Protocol API failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log(`✅ IP Assets linked: ${data.linkId || 'success'}`);
        return data.linkId || 'linked';
      }

      throw new Error('Story Protocol SDK integration required');
    } catch (error) {
      console.error('❌ Error linking IP Assets:', error);
      throw error;
    }
  }

  /**
   * Get all licenses for an IP Asset
   */
  async getIPAssetLicenses(ipId: string): Promise<StoryProtocolLicense[]> {
    try {
      if (STORY_PROTOCOL_API_BASE && this.apiKey) {
        const response = await fetch(`${STORY_PROTOCOL_API_BASE}/ip-assets/${ipId}/licenses`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Story Protocol API failed: ${response.status}`);
        }

        const data = await response.json();
        return data.licenses || [];
      }

      return [];
    } catch (error) {
      console.error(`❌ Error getting licenses for ${ipId}:`, error);
      return [];
    }
  }

  /**
   * Convert bytes32 IP ID to Story Protocol IP ID format
   * Story Protocol uses string-based IP IDs, while ADLV uses bytes32
   */
  convertBytes32ToStoryIPId(bytes32Id: string): string {
    // If already a Story Protocol IP ID format, return as is
    if (bytes32Id.startsWith('ip://')) {
      return bytes32Id;
    }

    // Convert bytes32 to Story Protocol IP ID format
    // Format: ip://<chainId>/<contractAddress>/<tokenId>
    // For now, we'll use a simple mapping
    return `ip://story-testnet/${bytes32Id}`;
  }

  /**
   * Convert Story Protocol IP ID to bytes32
   */
  convertStoryIPIdToBytes32(storyIPId: string): string {
    // Extract the identifier from Story Protocol IP ID
    // Format: ip://<chainId>/<contractAddress>/<tokenId>
    const parts = storyIPId.split('/');
    if (parts.length >= 4) {
      return parts[3]; // Return the tokenId part
    }
    return storyIPId; // Fallback
  }

  /**
   * Check if Story Protocol integration is available
   */
  isAvailable(): boolean {
    return !!this.apiKey && !!STORY_PROTOCOL_API_BASE;
  }
}

