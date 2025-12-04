/**
 * World ID Verification Server
 * 
 * Lightweight HTTP server for verifying World ID proofs before vault creation
 */

import { LoanManager } from '../services/loan-manager.js';
import { config } from '../config/index.js';
import { fetchVaultsByCreator } from '../clients/goldskyClient.js';
import { padHex } from 'viem';
import * as AuthService from './auth-service.js';
import * as LicenseDataService from './license-data-service.js';
import { licenseDb } from '../db/database.js';

// Constants for World ID verification
const APP_ID = config.worldId.appId;
const ACTION_ID = config.worldId.actionId;
const VAULT_API_PORT = parseInt(process.env.VAULT_API_PORT || '3001');

// World ID API endpoint for verification
const WORLD_ID_VERIFY_URL = 'https://developer.worldcoin.org/api/v1/verify';

export interface VaultCreationData {
  ipId: string;
  creator: string;
}



export class VerificationServer {
  private loanManager: LoanManager;
  private server: any = null;

  constructor(loanManager: LoanManager) {
    this.loanManager = loanManager;
  }

  /**
   * Start the verification server using Bun.serve
   */
  public start() {
    if (this.server) {
      console.log('⚠️  Verification server already running');
      return;
    }

    try {
      this.server = Bun.serve({
        port: VAULT_API_PORT,
        fetch: this.handleRequest.bind(this),
      });

      console.log(`✅ World ID Verification Server running on port ${VAULT_API_PORT}`);
      console.log(`   Endpoint: http://localhost:${VAULT_API_PORT}/verify-vault`);
    } catch (error: any) {
      if (error.code === 'EADDRINUSE') {
        console.log(`⚠️  Port ${VAULT_API_PORT} is already in use. Verification server may already be running.`);
        console.log(`   If you need to restart, please stop the existing process first.`);
      } else {
        console.error('❌ Failed to start verification server:', error);
        throw error;
      }
    }
  }

  /**
   * Stop the verification server
   */
  public stop() {
    if (this.server) {
      this.server.stop();
      this.server = null;
      console.log('🛑 Verification server stopped');
    }
  }

  /**
   * Handle incoming HTTP requests
   */
  private async handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Handle POST /verify-vault
    if (req.method === 'POST' && url.pathname === '/verify-vault') {
      return await this.handleVerifyVault(req);
    }

    // Handle POST /licenses/metadata
    if (req.method === 'POST' && url.pathname === '/licenses/metadata') {
      return await this.handleLicenseMetadata(req);
    }

    // Handle GET /licenses/metadata - retrieve recent licenses
    if (req.method === 'GET' && url.pathname === '/licenses/metadata') {
      return this.handleGetLicenseMetadata();
    }

    // Handle GET /api/vaults/:address - retrieve vaults by creator address
    if (req.method === 'GET' && url.pathname.startsWith('/api/vaults/')) {
      return await this.handleGetVaultsByCreator(req, url);
    }

    // ========================================
    // License Holder API Routes
    // ========================================

    // Handle POST /api/auth/challenge - Generate authentication challenge
    if (req.method === 'POST' && url.pathname === '/api/auth/challenge') {
      return await this.handleAuthChallenge(req);
    }

    // Handle POST /api/auth/verify - Verify signature and issue JWT
    if (req.method === 'POST' && url.pathname === '/api/auth/verify') {
      return await this.handleAuthVerify(req);
    }

    // Handle GET /api/licenses/:address - Get user's licenses
    if (req.method === 'GET' && url.pathname.startsWith('/api/licenses/')) {
      return await this.handleGetUserLicenses(req, url);
    }

    // Handle GET /api/ip-data/:ipId - Get IP asset data (requires auth)
    if (req.method === 'GET' && url.pathname.startsWith('/api/ip-data/')) {
      return await this.handleGetIPAssetData(req, url);
    }

    // ========================================
    // IP Asset Marketplace API Routes
    // ========================================

    // Handle GET /api/ip-metadata/:ipId - Get IP metadata from Story Protocol
    if (req.method === 'GET' && url.pathname.startsWith('/api/ip-metadata/')) {
      return await this.handleGetIPMetadata(req, url);
    }

    // Handle POST /api/ip-metadata/bulk - Bulk IP metadata fetch
    if (req.method === 'POST' && url.pathname === '/api/ip-metadata/bulk') {
      return await this.handleBulkIPMetadata(req);
    }

    // Handle GET /api/marketplace - Get all IP assets for marketplace
    if (req.method === 'GET' && url.pathname === '/api/marketplace') {
      return await this.handleGetMarketplace();
    }

    // Handle GET /api/admin/licenses - Admin dashboard
    if (req.method === 'GET' && url.pathname === '/api/admin/licenses') {
      return await this.handleAdminGetLicenses(req, url);
    }

    // Handle GET /api/admin/analytics - Admin analytics
    if (req.method === 'GET' && url.pathname === '/api/admin/analytics') {
      return await this.handleAdminAnalytics();
    }

    // Handle GET /api/usage-data/:ipId - Global usage analytics (requires license)
    if (req.method === 'GET' && url.pathname.startsWith('/api/usage-data/')) {
      return await this.handleGetUsageData(req, url);
    }

    // Handle health check
    if (req.method === 'GET' && url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'world-id-verification' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('404 Not Found', { status: 404 });
  }

  /**
   * Handle vault verification request
   */
  private async handleVerifyVault(req: Request): Promise<Response> {
    try {
      const body = await req.json() as any;
      const { proof, signal, vaultData } = body;

      // Validate required fields
      if (!vaultData) {
        return this.jsonResponse(
          { error: 'Missing required field: vaultData' },
          400
        );
      }

      if (!vaultData.ipId || !vaultData.creator) {
        return this.jsonResponse(
          { error: 'Missing required vaultData fields: ipId or creator' },
          400
        );
      }

      // Check if World ID verification is disabled (for testing)
      const skipWorldId = process.env.SKIP_WORLD_ID === 'true';
      
      // Verify World ID proof if provided and not skipped
      let isVerified = false;
      
      if (skipWorldId) {
        console.log(`⚠️  World ID verification DISABLED (SKIP_WORLD_ID=true)`);
        console.log(`   Allowing vault creation for: ${vaultData.creator}`);
        isVerified = true;
      } else if (proof && signal) {
        console.log(`🔍 Verifying World ID proof for creator: ${vaultData.creator}`);
        isVerified = await this.verifyWorldIdProof(proof, signal);

        if (!isVerified) {
          console.log(`❌ World ID proof verification failed for creator: ${vaultData.creator}`);
          return this.jsonResponse(
            { error: 'World ID proof failed validation.' },
            401
          );
        }
        console.log(`✅ World ID Verified. Proceeding with Vault deployment for Creator: ${vaultData.creator}`);
      } else {
        // If no proof provided, allow vault creation for development/testing
        // In production, this should require proof
        console.log(`⚠️  No World ID proof provided. Allowing vault creation for: ${vaultData.creator}`);
        isVerified = true;
      }

      console.log(`📝 Processing IP ID: ${vaultData.ipId}`);
      console.log(`   Length: ${vaultData.ipId.length} characters`);

      // Convert IP ID to bytes32 format for responses
      const ipIdBytes32 = padHex(vaultData.ipId as `0x${string}`, { size: 32 });

      // Create vault on-chain via LoanManager
      // LoanManager handles the ipId to bytes32 conversion internally
      try {
        const result = await this.loanManager.createVault(vaultData.ipId);

        console.log(`✅ Vault created successfully:`);
        console.log(`   IP ID: ${vaultData.ipId}`);
        console.log(`   Vault Address: ${result.vaultAddress}`);
        console.log(`   Transaction Hash: ${result.transactionHash}`);

        return this.jsonResponse(
          {
            success: true,
            message: 'Identity verified. Vault creation transaction initiated.',
            ipId: ipIdBytes32,
            vaultAddress: result.vaultAddress,
            transactionHash: result.transactionHash,
          },
          200
        );
      } catch (vaultError: any) {
        console.error('❌ Error creating vault:', vaultError);
        
        // Check if vault already exists
        if (vaultError.message && vaultError.message.includes('Vault already exists') || 
            vaultError.reason && vaultError.reason.includes('Vault already exists')) {
          // Try to get existing vault address
          try {
            const existingVault = await this.loanManager.getVaultByIpId(ipIdBytes32);
            if (existingVault) {
              return this.jsonResponse(
                {
                  success: true,
                  message: 'Vault already exists for this IP Asset.',
                  ipId: ipIdBytes32,
                  vaultAddress: existingVault,
                  alreadyExists: true,
                },
                200
              );
            }
          } catch {
            // If we can't get the vault, return error
          }
          
          return this.jsonResponse(
            {
              error: 'Vault already exists for this IP Asset ID',
              details: 'A vault has already been created for this IP Asset. Please use a different IP Asset ID or check the existing vault.',
              code: 'VAULT_EXISTS',
            },
            409 // Conflict status code
          );
        }
        
        return this.jsonResponse(
          {
            error: 'Failed to create vault on-chain',
            details: vaultError.message || vaultError.reason || 'Unknown error',
          },
          500
        );
      }
    } catch (error: any) {
      console.error('❌ Verification error:', error);
      return this.jsonResponse(
        {
          error: 'Internal server error',
          details: error.message || 'Unknown error',
        },
        500
      );
    }
  }

  /**
   * Verify World ID proof using World ID API
   */
  private async verifyWorldIdProof(proof: any, signal: string): Promise<boolean> {
    if (!APP_ID || !ACTION_ID) {
      console.warn('⚠️  World ID configuration missing. Skipping verification.');
      return false;
    }

    try {
      // Verify proof using World ID API
      const response = await fetch(WORLD_ID_VERIFY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: APP_ID,
          action: ACTION_ID,
          signal: signal,
          proof: proof,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`World ID API error: ${response.status} - ${errorText}`);
        return false;
      }

      const result = await response.json() as any;
      return result.success === true || result.verified === true;
    } catch (error) {
      console.error('Error calling World ID API:', error);
      return false;
    }
  }

  /**
   * Handle license metadata submission
   */
  private async handleLicenseMetadata(req: Request): Promise<Response> {
    try {
      const body = await req.json() as any;
      const {
        personalName, organization, email,
        tierId, tierName, amount,
        vaultAddress, transactionHash, ipId, licenseeAddress
      } = body;

      // Calculate expiration (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Map tier to license type
      const tierToLicenseType: Record<string, string> = {
        'basic': 'standard',
        'commercial': 'commercial',
        'enterprise': 'exclusive',
      };

      // Store in SQLite database
      const licenseId = licenseDb.insertLicense({
        transactionHash: transactionHash || `tx_${Date.now()}`, // Fallback for testing
        vaultAddress: vaultAddress || '0x0000000000000000000000000000000000000000',
        ipId: ipId || '0x0',
        licenseeAddress: licenseeAddress || '0x0000000000000000000000000000000000000000',
        buyerName: personalName,
        buyerOrganization: organization,
        buyerEmail: email,
        tierId,
        tierName,
        licenseType: (tierToLicenseType[tierId] || 'standard') as "standard" | "commercial" | "exclusive",
        amount,
        expiresAt: expiresAt.toISOString(),
      });

      console.log(`✅ License #${licenseId} stored in database`);

      return this.jsonResponse({
        success: true,
        message: 'License metadata recorded successfully',
        licenseId: Number(licenseId),
      }, 200);
    } catch (error: any) {
      console.error('❌ Error storing license metadata:', error);
      return this.jsonResponse({
        error: 'Failed to store license metadata',
        details: error.message,
      }, 500);
    }
  }

  private handleGetLicenseMetadata(): Response {
    try {
      // Get recent licenses (last 20)
      const stmt = licenseDb.db.prepare(`
        SELECT * FROM license_metadata
        ORDER BY purchased_at DESC
        LIMIT 20
      `);
      const licenses = stmt.all();

      return this.jsonResponse({
        success: true,
        licenses,
        count: licenses.length,
      }, 200);
    } catch (error: any) {
      return this.jsonResponse({
        error: 'Failed to fetch licenses',
        details: error.message,
      }, 500);
    }
  }

  private async handleAdminGetLicenses(req: Request, url: URL): Promise<Response> {
    try {
      // Parse query params for filters
      const params = url.searchParams;
      const filters = {
        ipId: params.get('ipId') || undefined,
        vaultAddress: params.get('vaultAddress') || undefined,
        startDate: params.get('startDate') || undefined,
        endDate: params.get('endDate') || undefined,
        isActive: params.get('isActive') === 'true' ? true : undefined,
      };

      const licenses = licenseDb.getAllLicenses(filters);

      return this.jsonResponse({
        success: true,
        licenses,
        count: licenses.length,
        filters,
      }, 200);
    } catch (error: any) {
      return this.jsonResponse({
        error: 'Failed to fetch admin licenses',
        details: error.message,
      }, 500);
    }
  }

  private handleAdminAnalytics(): Response {
    try {
      const analytics = licenseDb.getAnalytics();

      return this.jsonResponse({
        success: true,
        analytics,
        totalVaults: analytics.length,
        totalRevenue: analytics.reduce((sum: number, a: any) => sum + parseFloat(a.total_revenue || '0'), 0),
        totalLicenses: analytics.reduce((sum: number, a: any) => sum + (a.total_licenses || 0), 0),
      }, 200);
    } catch (error: any) {
      return this.jsonResponse({
        error: 'Failed to fetch analytics',
        details: error.message,
      }, 500);
    }
  }

  /**
   * Handle GET /api/usage-data/:ipId - Get global usage analytics
   * Requires active license for the IP asset
   */
  private async handleGetUsageData(req: Request, url: URL): Promise<Response> {
    try {
      // Extract and verify JWT token
      const authHeader = req.headers.get('Authorization');
      const token = AuthService.extractToken(authHeader);

      if (!token) {
        return this.jsonResponse({
          error: 'Authentication required',
          message: 'Please provide a valid Bearer token',
        }, 401);
      }

      const userAddress = AuthService.verifyToken(token);

      if (!userAddress) {
        return this.jsonResponse({
          error: 'Invalid or expired token',
        }, 401);
      }

      // Extract IP asset ID from URL
      const pathParts = url.pathname.split('/');
      const ipAssetId = pathParts[pathParts.length - 1];

      if (!ipAssetId || ipAssetId.length < 10) {
        return this.jsonResponse({ error: 'Invalid IP asset ID' }, 400);
      }

      console.log(`📊 Fetching usage data for ${ipAssetId} (user: ${userAddress})`);

      // Verify user has active license for this IP asset
      const hasLicense = await LicenseDataService.hasActiveLicense(userAddress, ipAssetId);

      if (!hasLicense) {
        return this.jsonResponse({
          error: 'Access denied',
          message: 'You must have an active license for this IP asset to view usage data',
        }, 403);
      }

      // Import and fetch usage data
      const { getUsageData } = await import('../services/usage-data-service.js');
      const usageData = await getUsageData(ipAssetId);

      if (!usageData) {
        return this.jsonResponse({
          error: 'Usage data not found',
          message: 'No usage data available for this IP asset',
        }, 404);
      }

      return this.jsonResponse(usageData, 200);
    } catch (error: any) {
      console.error('❌ Error fetching usage data:', error);
      return this.jsonResponse({
        error: 'Failed to fetch usage data',
        details: error.message,
      }, 500);
    }
  }

  /**
   * Handle GET request for vaults by creator address
   */
  private async handleGetVaultsByCreator(req: Request, url: URL): Promise<Response> {
    try {
      // Extract address from URL path (e.g., /api/vaults/0x123...)
      const pathParts = url.pathname.split('/');
      const address = pathParts[pathParts.length - 1];

      if (!address || address.length < 10) {
        return this.jsonResponse({
          error: 'Invalid address parameter',
          vaults: [],
          count: 0,
        }, 400);
      }

      console.log(`🔍 Fetching vaults for creator: ${address}`);

      // Fetch vaults from Goldsky subgraph
      const vaults = await fetchVaultsByCreator(address);

      console.log(`✅ Found ${vaults.length} vault(s) for creator ${address}`);

      // Return full vault data including CVS from subgraph
      const responseData = {
        vaults: vaults.map(v => {
          // Handle ipAsset being either a string ID or an object
          let ipId = '';
          if (typeof v.ipAsset === 'object' && v.ipAsset !== null) {
            ipId = v.ipAsset.ipId || v.ipAsset.id || '';
          } else if (typeof v.ipAsset === 'string') {
            ipId = v.ipAsset;
          }
          
          return {
            address: v.vaultAddress,
            ipId: ipId || v.ipId || '',
            creator: v.creator,
            cvs: v.currentCVS || '0',
            totalLiquidity: v.totalLiquidity || '0',
            totalLicenseRevenue: v.totalLicenseRevenue || '0',
            createdAt: v.createdAt,
          };
        }),
        count: vaults.length,
      };

      console.log('📤 Sending response to frontend:', JSON.stringify(responseData, null, 2));

      return this.jsonResponse(responseData, 200);

    } catch (error: any) {
      console.error('❌ Error fetching vaults by creator:', error);
      return this.jsonResponse({
        error: 'Failed to fetch vaults',
        details: error.message || 'Unknown error',
        vaults: [],
        count: 0,
      }, 500);
    }
  }

  // ========================================
  // License Holder API Handlers
  // ========================================

  /**
   * Handle POST /api/auth/challenge - Generate authentication challenge
   */
  private async handleAuthChallenge(req: Request): Promise<Response> {
    try {
      const body = await req.json() as { address: string };

      if (!body.address) {
        return this.jsonResponse({ error: 'Address is required' }, 400);
      }

      const challenge = AuthService.generateChallenge(body.address);

      return this.jsonResponse(challenge, 200);
    } catch (error: any) {
      console.error('❌ Error generating auth challenge:', error);
      return this.jsonResponse({
        error: 'Failed to generate challenge',
        details: error.message,
      }, 500);
    }
  }

  /**
   * Handle POST /api/auth/verify - Verify signature and issue JWT
   */
  private async handleAuthVerify(req: Request): Promise<Response> {
    try {
      const body = await req.json() as { address: string; signature: string };

      console.log(`📥 Received verify request:`, {
        address: body.address,
        signatureType: typeof body.signature,
        signatureLength: body.signature?.length,
        signatureStart: body.signature?.substring(0, 10),
      });

      if (!body.address || !body.signature) {
        return this.jsonResponse({
          error: 'Address and signature are required',
        }, 400);
      }

      const authToken = await AuthService.verifySignature(body.address, body.signature);

      if (!authToken) {
        return this.jsonResponse({
          error: 'Invalid signature or expired challenge',
        }, 401);
      }

      return this.jsonResponse(authToken, 200);
    } catch (error: any) {
      console.error('❌ Error verifying signature:', error);
      return this.jsonResponse({
        error: 'Failed to verify signature',
        details: error.message,
      }, 500);
    }
  }

  /**
   * Handle GET /api/licenses/:address - Get user's licenses
   */
  private async handleGetUserLicenses(req: Request, url: URL): Promise<Response> {
    try {
      const pathParts = url.pathname.split('/');
      const address = pathParts[pathParts.length - 1];

      if (!address || address.length < 10) {
        return this.jsonResponse({ error: 'Invalid address parameter' }, 400);
      }

      console.log(`📄 Fetching licenses for user: ${address}`);

      const licenses = await LicenseDataService.getUserLicenses(address);

      return this.jsonResponse({
        licenses,
        count: licenses.length,
      }, 200);
    } catch (error: any) {
      console.error('❌ Error fetching user licenses:', error);
      return this.jsonResponse({
        error: 'Failed to fetch licenses',
        details: error.message,
      }, 500);
    }
  }

  /**
   * Handle GET /api/ip-data/:ipId - Get IP asset data (requires auth)
   */
  private async handleGetIPAssetData(req: Request, url: URL): Promise<Response> {
    try {
      // Extract and verify JWT token
      const authHeader = req.headers.get('Authorization');
      const token = AuthService.extractToken(authHeader);

      if (!token) {
        return this.jsonResponse({
          error: 'Authentication required',
          message: 'Please provide a valid Bearer token',
        }, 401);
      }

      const userAddress = AuthService.verifyToken(token);

      if (!userAddress) {
        return this.jsonResponse({
          error: 'Invalid or expired token',
        }, 401);
      }

      // Extract IP asset ID from URL
      const pathParts = url.pathname.split('/');
      const ipAssetId = pathParts[pathParts.length - 1];

      if (!ipAssetId || ipAssetId.length < 10) {
        return this.jsonResponse({ error: 'Invalid IP asset ID' }, 400);
      }

      console.log(`🔍 Fetching IP asset data for ${ipAssetId} (user: ${userAddress})`);

      // Get IP asset data with license verification
      const data = await LicenseDataService.getIPAssetDataForLicensee(
        ipAssetId,
        userAddress
      );

      if ('error' in data) {
        return this.jsonResponse(data, 403);
      }

      return this.jsonResponse(data, 200);
    } catch (error: any) {
      console.error('❌ Error fetching IP asset data:', error);
      return this.jsonResponse({
        error: 'Failed to fetch IP asset data',
        details: error.message,
      }, 500);
    }
  }

  // ========================================
  // IP Asset Marketplace Handlers
  // ========================================

  /**
   * Handle GET /api/ip-metadata/:ipId - Get single IP metadata
   */
  private async handleGetIPMetadata(req: Request, url: URL): Promise<Response> {
    try {
      const pathParts = url.pathname.split('/');
      const ipId = pathParts[pathParts.length - 1];

      if (!ipId || !ipId.startsWith('0x')) {
        return this.jsonResponse({ error: 'Invalid IP ID format' }, 400);
      }

      console.log(`📦 Fetching metadata for IP: ${ipId}`);

      // Import the IP metadata service dynamically
      const { fetchIPMetadata } = await import('../services/ip-metadata-service.js');
      const metadata = await fetchIPMetadata(ipId as `0x${string}`);

      if (!metadata) {
        return this.jsonResponse({ error: 'IP metadata not found' }, 404);
      }

      return this.jsonResponse({ ipId, metadata }, 200);
    } catch (error: any) {
      console.error('❌ Error fetching IP metadata:', error);
      return this.jsonResponse({
        error: 'Failed to fetch IP metadata',
        details: error.message,
      }, 500);
    }
  }

  /**
   * Handle POST /api/ip-metadata/bulk - Bulk IP metadata fetch
   */
  private async handleBulkIPMetadata(req: Request): Promise<Response> {
    try {
      const body = await req.json() as { ipIds: string[] };

      if (!Array.isArray(body.ipIds) || body.ipIds.length === 0) {
        return this.jsonResponse({ error: 'Invalid ipIds array' }, 400);
      }

      if (body.ipIds.length > 50) {
        return this.jsonResponse({ error: 'Maximum 50 IPs per request' }, 400);
      }

      console.log(`📦 Fetching metadata for ${body.ipIds.length} IPs`);

      // Import the IP metadata service dynamically
      const { fetchBulkIPMetadata } = await import('../services/ip-metadata-service.js');
      const metadataMap = await fetchBulkIPMetadata(body.ipIds as `0x${string}`[]);

      // Convert Map to object for JSON serialization
      const response: Record<string, any> = {};
      metadataMap.forEach((metadata, ipId) => {
        response[ipId] = metadata;
      });

      return this.jsonResponse({ metadata: response, count: metadataMap.size }, 200);
    } catch (error: any) {
      console.error('❌ Error fetching bulk IP metadata:', error);
      return this.jsonResponse({
        error: 'Failed to fetch bulk IP metadata',
        details: error.message,
      }, 500);
    }
  }

  /**
   * Handle GET /api/marketplace - Get all IP assets with enriched metadata
   */
  private async handleGetMarketplace(): Promise<Response> {
    try {
      console.log('🏪 Fetching marketplace data...');

      // Import Goldsky client dynamically
      const { fetchAllVaultsWithIPData } = await import('../clients/goldskyClient.js');
      const vaults = await fetchAllVaultsWithIPData();

      if (vaults.length === 0) {
        return this.jsonResponse({ assets: [], count: 0 }, 200);
      }

      // Extract unique IP IDs
      const ipIds = [...new Set(vaults.map(v => {
        if (typeof v.ipAsset === 'object' && v.ipAsset !== null) {
          return v.ipAsset.ipId || v.ipAsset.id;
        }
        return v.ipAsset || v.ipId;
      }).filter(Boolean))].filter((id): id is string => !!id);

      console.log(`📦 Found ${vaults.length} vaults with ${ipIds.length} unique IP assets`);

      // Fetch metadata for all IPs in parallel
      const { fetchBulkIPMetadata } = await import('../services/ip-metadata-service.js');
      const metadataMap = await fetchBulkIPMetadata(ipIds as `0x${string}`[]);

      // Merge vault data with IP metadata
      const assets = vaults.map(vault => {
        // Resolve IP ID from ipAsset object or string
        let ipId = '';
        if (typeof vault.ipAsset === 'object' && vault.ipAsset !== null) {
          ipId = vault.ipAsset.ipId || vault.ipAsset.id || '';
        } else if (typeof vault.ipAsset === 'string') {
          ipId = vault.ipAsset;
        }
        ipId = ipId || vault.ipId || '';

        return {
          // Vault data from subgraph
          vaultAddress: vault.vaultAddress,
          ipId,
          creator: vault.creator,
          cvsScore: vault.currentCVS || '0',
          totalLicensesSold: 0, // TODO: Add to subgraph schema
          totalRevenue: vault.totalLicenseRevenue || '0',
          createdAt: vault.createdAt || vault.timestamp,

          // IP metadata from Story Protocol
          metadata: metadataMap.get(ipId as `0x${string}`) || {
            name: `IP Asset ${ipId.slice(0, 10)}...`,
            description: 'No description available',
            creator: vault.creator as `0x${string}`,
          },
        };
      });

      // Sort by CVS score (highest first)
      assets.sort((a, b) => Number(b.cvsScore || 0) - Number(a.cvsScore || 0));

      console.log(`✅ Returning ${assets.length} marketplace assets`);

      return this.jsonResponse({
        assets,
        count: assets.length,
        timestamp: Date.now(),
      }, 200);
    } catch (error: any) {
      console.error('❌ Error fetching marketplace data:', error);
      return this.jsonResponse({
        error: 'Failed to fetch marketplace data',
        details: error.message,
      }, 500);
    }
  }

  /**
   * Helper to create JSON responses with CORS headers
   */
  private jsonResponse(data: any, status: number): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
