/**
 * Atlas Protocol SDK
 *
 * Simple client for accessing global IP usage intelligence data
 * License holders can use this to programmatically access usage analytics
 */

import type { Signer } from 'ethers';

/**
 * Global IP Usage Intelligence Response
 */
export interface GlobalUsageData {
  ipId: string;
  ipAssetName: string;

  globalUsage: {
    totalDetections: number;
    authorizedUses: number;
    unauthorizedUses: number;
    platforms: string[];
    derivatives: number;
    lastDetectedAt: string | null;
  };

  infringements: Array<{
    brand_id: string;
    detected_at: string;
    status: string;
    context?: string;
  }>;

  authorizations: Array<{
    brand_id: string;
    authorized_at: string;
    context?: string;
  }>;

  derivatives: Array<{
    childIpId: string;
    childName?: string;
    creator: string;
    createdAt: string;
    royaltiesPaid?: string;
  }>;

  provenance: {
    yakoaScore: number;
    verified: boolean;
    confidence: number;
    status: 'verified' | 'unverified' | 'pending' | 'unavailable';
    infringementCount: number;
    authorizationCount: number;
  };

  cvs: {
    currentScore: string;
    rank: number;
    history: Array<{ timestamp: string; score: string }>;
  };

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

export interface License {
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

export interface AtlasClientConfig {
  apiUrl?: string;
  signer?: Signer;
}

/**
 * Atlas Protocol Client
 *
 * @example
 * ```typescript
 * import { AtlasClient } from '@atlas-protocol/sdk';
 * import { ethers } from 'ethers';
 *
 * const provider = new ethers.BrowserProvider(window.ethereum);
 * const signer = await provider.getSigner();
 *
 * const client = new AtlasClient({ signer });
 * await client.authenticate();
 *
 * const usageData = await client.getGlobalUsageData('0xIPAssetId');
 * console.log(usageData.globalUsage.totalDetections);
 * ```
 */
export class AtlasClient {
  private apiUrl: string;
  private signer?: Signer;
  private authToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(config: AtlasClientConfig = {}) {
    this.apiUrl = config.apiUrl || 'http://localhost:3001';
    this.signer = config.signer;
  }

  /**
   * Set the wallet signer for authentication
   */
  setSigner(signer: Signer) {
    this.signer = signer;
  }

  /**
   * Authenticate using wallet signature
   * This is free (no gas required) as it only signs a message
   */
  async authenticate(): Promise<boolean> {
    if (!this.signer) {
      throw new Error('Signer not set. Call setSigner() first.');
    }

    try {
      const address = await this.signer.getAddress();

      // Step 1: Get authentication challenge
      const challengeRes = await fetch(`${this.apiUrl}/api/auth/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      if (!challengeRes.ok) {
        throw new Error('Failed to get authentication challenge');
      }

      const { message } = await challengeRes.json();

      // Step 2: Sign the challenge message
      const signature = await this.signer.signMessage(message);

      // Step 3: Verify signature and get JWT token
      const verifyRes = await fetch(`${this.apiUrl}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature }),
      });

      if (!verifyRes.ok) {
        throw new Error('Signature verification failed');
      }

      const authData = await verifyRes.json();
      this.authToken = authData.token;
      this.tokenExpiry = authData.expiresAt;

      return true;
    } catch (error: any) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  /**
   * Check if currently authenticated
   */
  isAuthenticated(): boolean {
    if (!this.authToken || !this.tokenExpiry) return false;
    return Date.now() < this.tokenExpiry;
  }

  /**
   * Get authorization header for API requests
   */
  private getAuthHeaders(): Record<string, string> {
    if (!this.authToken) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    if (!this.isAuthenticated()) {
      throw new Error('Authentication expired. Please authenticate again.');
    }

    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get global usage intelligence data for an IP asset
   * Requires active license for the IP asset
   *
   * @param ipAssetId - The IP asset ID to get usage data for
   * @returns Global usage intelligence including infringements, authorizations, derivatives, and provenance
   */
  async getGlobalUsageData(ipAssetId: string): Promise<GlobalUsageData> {
    const response = await fetch(`${this.apiUrl}/api/usage-data/${ipAssetId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (response.status === 403) {
      throw new Error('Access denied. You need an active license for this IP asset.');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch usage data: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all licenses owned by the authenticated user
   *
   * @returns List of licenses with expiration and status
   */
  async getMyLicenses(): Promise<{ licenses: License[]; count: number }> {
    if (!this.signer) {
      throw new Error('Signer not set');
    }

    const address = await this.signer.getAddress();

    const response = await fetch(`${this.apiUrl}/api/licenses/${address}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch licenses: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check if user has an active license for a specific IP asset
   *
   * @param ipAssetId - The IP asset ID to check
   * @returns True if user has an active, non-expired license
   */
  async hasActiveLicense(ipAssetId: string): Promise<boolean> {
    try {
      const { licenses } = await this.getMyLicenses();

      const now = new Date();
      return licenses.some(license =>
        license.ipAssetId.toLowerCase() === ipAssetId.toLowerCase() &&
        license.isActive &&
        new Date(license.expiresAt) > now
      );
    } catch (error) {
      console.error('Error checking license:', error);
      return false;
    }
  }

  /**
   * Sign out and clear authentication
   */
  signOut() {
    this.authToken = null;
    this.tokenExpiry = null;
  }
}

/**
 * Create a new Atlas client instance
 */
export function createClient(config?: AtlasClientConfig): AtlasClient {
  return new AtlasClient(config);
}

// Export types
export type {
  AtlasClientConfig,
  GlobalUsageData,
  License,
};
