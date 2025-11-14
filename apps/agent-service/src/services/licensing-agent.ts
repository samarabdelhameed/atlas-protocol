/**
 * Licensing Agent Service
 * 
 * Handles GenAI licensing through abv.dev
 * Integrates with ADLV contract for revenue distribution
 */

import { createPublicClient, createWalletClient, http, type Address, type Hash } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { config } from '../config/index.js';
import ADLV_ABI from '../../contracts/ADLV.json' assert { type: 'json' };
import IDO_ABI from '../../contracts/IDO.json' assert { type: 'json' };

export interface LicenseRequest {
  vaultAddress: Address;
  licenseType: 'exclusive' | 'commercial' | 'derivative' | 'standard';
  price: bigint;
  duration?: number; // in seconds, optional
  licenseeInfo?: {
    name?: string;
    email?: string;
    organization?: string;
  };
}

export interface LicenseResponse {
  transactionHash: Hash;
  licenseId?: string; // If abv.dev returns a license ID
  revenueDistribution: {
    protocolFee: bigint;
    creatorShare: bigint;
    vaultShare: bigint;
  };
}

export class LicensingAgent {
  private publicClient: ReturnType<typeof createPublicClient>;
  private walletClient: ReturnType<typeof createWalletClient> | null = null;
  private adlvAddress: Address;
  private idoAddress: Address;
  private abvApiKey: string;

  constructor(
    adlvAddress: Address,
    idoAddress: Address,
    chainId: number = 8453 // Base mainnet
  ) {
    this.adlvAddress = adlvAddress;
    this.idoAddress = idoAddress;
    this.abvApiKey = config.abv.apiKey;

    // Initialize public client
    this.publicClient = createPublicClient({
      transport: http(config.rpcUrl),
    });

    // Initialize wallet client if private key is provided
    if (config.privateKey) {
      const account = privateKeyToAccount(config.privateKey as `0x${string}`);
      this.walletClient = createWalletClient({
        account,
        transport: http(config.rpcUrl),
      });
    }
  }

  /**
   * Sell a license for an IP asset
   */
  async sellLicense(request: LicenseRequest): Promise<LicenseResponse> {
    if (!this.walletClient) {
      throw new Error('Wallet client not initialized. Provide PRIVATE_KEY in config.');
    }

    try {
      // Get vault to verify it exists
      const vault = await this.publicClient.readContract({
        address: this.adlvAddress,
        abi: ADLV_ABI,
        functionName: 'getVault',
        args: [request.vaultAddress],
      }) as any;

      if (!vault.exists) {
        throw new Error(`Vault ${request.vaultAddress} does not exist`);
      }

      // Get protocol fee configuration
      const protocolFeeBps = await this.publicClient.readContract({
        address: this.adlvAddress,
        abi: ADLV_ABI,
        functionName: 'protocolFeeBps',
      }) as bigint;

      const creatorShareBps = await this.publicClient.readContract({
        address: this.adlvAddress,
        abi: ADLV_ABI,
        functionName: 'creatorShareBps',
      }) as bigint;

      const vaultShareBps = await this.publicClient.readContract({
        address: this.adlvAddress,
        abi: ADLV_ABI,
        functionName: 'vaultShareBps',
      }) as bigint;

      // Calculate revenue distribution
      const protocolFee = (request.price * protocolFeeBps) / BigInt(10000);
      const creatorShare = (request.price * creatorShareBps) / BigInt(10000);
      const vaultShare = request.price - protocolFee - creatorShare;

      // Register license with abv.dev if API key is provided
      let licenseId: string | undefined;
      if (this.abvApiKey) {
        try {
          licenseId = await this.registerLicenseWithABV(request);
        } catch (error) {
          console.warn('Failed to register license with abv.dev:', error);
          // Continue with on-chain transaction even if abv.dev fails
        }
      }

      // Execute license sale on-chain
      const hash = await this.walletClient.writeContract({
        address: this.adlvAddress,
        abi: ADLV_ABI,
        functionName: 'sellLicense',
        args: [
          request.vaultAddress,
          request.licenseType,
          BigInt(request.duration || 0),
        ],
        value: request.price,
      });

      // Wait for transaction receipt
      await this.publicClient.waitForTransactionReceipt({ hash });

      return {
        transactionHash: hash,
        licenseId,
        revenueDistribution: {
          protocolFee,
          creatorShare,
          vaultShare,
        },
      };
    } catch (error) {
      console.error('Error selling license:', error);
      throw error;
    }
  }

  /**
   * Register license with abv.dev API
   */
  private async registerLicenseWithABV(request: LicenseRequest): Promise<string> {
    if (!this.abvApiKey) {
      throw new Error('ABV API key not configured');
    }

    // Get IP asset info from vault
    const vault = await this.publicClient.readContract({
      address: this.adlvAddress,
      abi: ADLV_ABI,
      functionName: 'getVault',
      args: [request.vaultAddress],
    }) as any;

    const ipId = vault.ipId;

    // Call abv.dev API to register license
    // Note: This is a placeholder - you'll need to implement the actual API call
    // based on abv.dev's API documentation
    const response = await fetch('https://api.abv.dev/v1/licenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.abvApiKey}`,
      },
      body: JSON.stringify({
        ipAssetId: ipId,
        licenseType: request.licenseType,
        price: request.price.toString(),
        duration: request.duration,
        licenseeInfo: request.licenseeInfo,
        vaultAddress: request.vaultAddress,
      }),
    });

    if (!response.ok) {
      throw new Error(`abv.dev API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.licenseId;
  }

  /**
   * Update CVS after license sale (called by Agent Service)
   */
  async updateCVSAfterLicenseSale(
    ipId: `0x${string}`,
    salePrice: bigint,
    licenseType: string
  ): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet client not initialized. Provide PRIVATE_KEY in config.');
    }

    // Calculate new CVS based on license sale
    // This should match the logic in IDO contract
    const cvsIncrement = this.calculateCVSIncrement(licenseType, salePrice);

    // Get current CVS
    const currentCVS = await this.publicClient.readContract({
      address: this.idoAddress,
      abi: IDO_ABI,
      functionName: 'getCVS',
      args: [ipId],
    }) as bigint;

    const newCVS = currentCVS + cvsIncrement;

    // Update CVS in IDO contract
    // Note: This requires IDO contract to be owned by this service
    const hash = await this.walletClient.writeContract({
      address: this.idoAddress,
      abi: IDO_ABI,
      functionName: 'updateCVS',
      args: [ipId, newCVS],
    });

    return hash;
  }

  /**
   * Calculate CVS increment from license sale
   * This should match the logic in the original IDO contract
   */
  private calculateCVSIncrement(licenseType: string, price: bigint): bigint {
    switch (licenseType) {
      case 'exclusive':
        return price / BigInt(10); // 10% of price
      case 'commercial':
        return price / BigInt(20); // 5% of price
      case 'derivative':
        return price / BigInt(25); // 4% of price
      case 'standard':
      default:
        return price / BigInt(50); // 2% of price
    }
  }

  /**
   * Monitor license sale events
   */
  async watchLicenseEvents(
    callback: (event: { type: string; data: any }) => void
  ): Promise<() => void> {
    const unwatch = this.publicClient.watchContractEvent({
      address: this.adlvAddress,
      abi: ADLV_ABI,
      eventName: 'LicenseSold',
      onLogs: (logs) => {
        logs.forEach((log) => {
          callback({
            type: 'LicenseSold',
            data: log,
          });
        });
      },
    });

    // Also watch for CVS updates
    const unwatchCVS = this.publicClient.watchContractEvent({
      address: this.idoAddress,
      abi: IDO_ABI,
      eventName: 'CVSUpdated',
      onLogs: (logs) => {
        logs.forEach((log) => {
          callback({
            type: 'CVSUpdated',
            data: log,
          });
        });
      },
    });

    // Return cleanup function
    return () => {
      unwatch();
      unwatchCVS();
    };
  }

  /**
   * Get license revenue for an IP asset
   */
  async getLicenseRevenue(ipId: `0x${string}`): Promise<bigint> {
    return await this.publicClient.readContract({
      address: this.idoAddress,
      abi: IDO_ABI,
      functionName: 'totalLicenseRevenue',
      args: [ipId],
    }) as bigint;
  }

  /**
   * Get current CVS for an IP asset
   */
  async getCVS(ipId: `0x${string}`): Promise<bigint> {
    return await this.publicClient.readContract({
      address: this.idoAddress,
      abi: IDO_ABI,
      functionName: 'getCVS',
      args: [ipId],
    }) as bigint;
  }
}

