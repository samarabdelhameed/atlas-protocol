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

interface LicenseMetadata {
  personalName: string;
  organization: string;
  email: string;
  tierId: string;
  tierName: string;
  amount: string;
  timestamp: string;
}

export class VerificationServer {
  private loanManager: LoanManager;
  private server: any = null;
  private licenseMetadata: LicenseMetadata[] = []; // In-memory storage

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
      const { personalName, organization, email, tierId, tierName, amount } = body;

      console.log(`📜 License metadata received:`);
      console.log(`   Organization: ${organization}`);
      console.log(`   Contact: ${email}`);
      console.log(`   Tier: ${tierName} (${tierId})`);
      console.log(`   Amount: ${amount}`);

      // Store metadata in memory
      const metadata: LicenseMetadata = {
        personalName,
        organization,
        email,
        tierId,
        tierName,
        amount,
        timestamp: new Date().toISOString(),
      };

      this.licenseMetadata.unshift(metadata); // Add to beginning (most recent first)

      // Keep only last 20 licenses
      if (this.licenseMetadata.length > 20) {
        this.licenseMetadata = this.licenseMetadata.slice(0, 20);
      }

      return this.jsonResponse({
        success: true,
        message: 'License metadata recorded successfully',
        data: metadata,
      }, 200);

    } catch (error: any) {
      console.error('❌ Error handling license metadata:', error);
      return this.jsonResponse(
        { error: 'Failed to process license metadata', details: error.message },
        500
      );
    }
  }

  /**
   * Handle GET request for license metadata
   */
  private handleGetLicenseMetadata(): Response {
    return this.jsonResponse({
      success: true,
      licenses: this.licenseMetadata,
      count: this.licenseMetadata.length,
    }, 200);
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

      // Return just the vault addresses (matching Dashboard expectation)
      return this.jsonResponse({
        vaults: vaults.map(v => v.vaultAddress),
        count: vaults.length,
      }, 200);

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
