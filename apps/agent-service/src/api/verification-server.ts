/**
 * World ID Verification Server
 * 
 * Lightweight HTTP server for verifying World ID proofs before vault creation
 */

import { LoanManager } from '../services/loan-manager.js';
import { config } from '../config/index.js';

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

    this.server = Bun.serve({
      port: VAULT_API_PORT,
      fetch: this.handleRequest.bind(this),
    });

    console.log(`✅ World ID Verification Server running on port ${VAULT_API_PORT}`);
    console.log(`   Endpoint: http://localhost:${VAULT_API_PORT}/verify-vault`);
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
          'Access-Control-Allow-Headers': 'Content-Type',
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

      // Verify World ID proof if provided
      let isVerified = false;
      if (proof && signal) {
      console.log(`🔍 Verifying World ID proof for creator: ${vaultData.creator}`);
        isVerified = await this.verifyWorldIdProof(proof, signal);

      if (!isVerified) {
        console.log(`❌ World ID proof verification failed for creator: ${vaultData.creator}`);
        return this.jsonResponse(
          { error: 'World ID proof failed validation.', proof, signal },
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

      // Create vault on-chain via LoanManager
      try {
        const result = await this.loanManager.createVault(vaultData.ipId);

        console.log(`✅ Vault created successfully:`);
        console.log(`   Vault Address: ${result.vaultAddress}`);
        console.log(`   Transaction Hash: ${result.transactionHash}`);

        return this.jsonResponse(
          {
            success: true,
            message: 'Identity verified. Vault creation transaction initiated.',
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
            const existingVault = await this.loanManager.getVaultByIpId(vaultData.ipId);
            if (existingVault) {
              return this.jsonResponse(
                {
                  success: true,
                  message: 'Vault already exists for this IP Asset.',
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
