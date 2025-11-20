/**
 * Licensing Agent Service
 * 
 * Handles GenAI licensing through abv.dev
 * Integrates with ADLV contract for revenue distribution
 * Automatically updates CVS after license sales
 * Integrates with Story Protocol for IP Asset licensing
 */

import { Contract, Wallet, JsonRpcProvider, type EventLog } from 'ethers';
import { config } from '../config/index.js';
import { StoryProtocolService } from './story-protocol-service.js';
import ADLV_JSON from '../../contracts/ADLV.json' assert { type: 'json' };
import IDO_JSON from '../../contracts/IDO.json' assert { type: 'json' };

const ADLV_ABI = ADLV_JSON.abi;
const IDO_ABI = IDO_JSON.abi;

// abv.dev API URL
const ABV_API_URL = process.env.ABV_API_URL || 'https://api.abv.dev/v1/licenses';

export interface LicenseRequest {
  vaultAddress: string;
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
  transactionHash: string;
  licenseId?: string; // If abv.dev returns a license ID
  revenueDistribution: {
    protocolFee: bigint;
    creatorShare: bigint;
    vaultShare: bigint;
  };
}

export class LicensingAgent {
  private provider: JsonRpcProvider;
  private signer: Wallet | null = null;
  private adlvContract: Contract;
  private idoContract: Contract;
  private abvApiKey: string;
  private storyProtocolService: StoryProtocolService | null = null;
  private isMonitoring: boolean = false;

  constructor(
    adlvAddress: string,
    idoAddress: string,
    rpcUrl?: string
  ) {
    const providerUrl = rpcUrl || config.rpcUrl;
    this.provider = new JsonRpcProvider(providerUrl);

    // Initialize signer if private key is provided
    if (config.privateKey) {
      this.signer = new Wallet(config.privateKey, this.provider);
    }

    // Initialize contracts
    this.adlvContract = new Contract(
      adlvAddress,
      ADLV_ABI,
      this.signer || this.provider
    );

    this.idoContract = new Contract(
      idoAddress,
      IDO_ABI,
      this.signer || this.provider
    );

    this.abvApiKey = config.abv.apiKey;

    // Initialize Story Protocol service if available
    try {
      this.storyProtocolService = new StoryProtocolService(providerUrl);
      if (this.storyProtocolService.isAvailable()) {
        console.log('✅ Story Protocol integration enabled');
      } else {
        console.log('⚠️  Story Protocol integration disabled (API key not set)');
        this.storyProtocolService = null;
      }
    } catch (error) {
      console.warn('⚠️  Story Protocol service initialization failed:', error);
      this.storyProtocolService = null;
    }

    console.log('✅ LicensingAgent initialized');
    console.log(`   ADLV Contract: ${adlvAddress}`);
    console.log(`   IDO Contract: ${idoAddress}`);
  }

  /**
   * Start monitoring LicenseSold events from ADLV contract
   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('⚠️  License monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log('🔍 Starting license event monitoring...');

    // Listen for LicenseSold events
    this.adlvContract.on('LicenseSold', this.handleLicenseSaleEvent.bind(this));

    // Also listen for CVS updates
    this.idoContract.on('CVSUpdated', this.handleCVSUpdatedEvent.bind(this));

    console.log('✅ License event monitoring active');
  }

  /**
   * Stop monitoring events
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    this.adlvContract.removeAllListeners('LicenseSold');
    this.idoContract.removeAllListeners('CVSUpdated');
    console.log('🛑 License monitoring stopped');
  }

  /**
   * Handle LicenseSold event - Main function for GenAI licensing
   * This is called automatically when a license is sold
   */
  private async handleLicenseSaleEvent(
    vaultAddress: string,
    ipId: string,
    licensee: string,
    price: bigint,
    licenseType: string,
    event: EventLog
  ): Promise<void> {
    const priceEth = Number(price) / 1e18;
    
    console.log('\n🎫 LicenseSold Event Detected!');
    console.log('═══════════════════════════════════════════');
    console.log(`   Vault: ${vaultAddress}`);
    console.log(`   IP ID: ${ipId}`);
    console.log(`   Licensee: ${licensee}`);
    console.log(`   Price: ${priceEth} tokens`);
    console.log(`   License Type: ${licenseType}`);
    console.log('═══════════════════════════════════════════\n');

    try {
      // Get vault details to calculate revenue distribution
      const vault = await this.adlvContract.getVault(vaultAddress);
      
      // Calculate revenue amounts (protocol fee already deducted in contract)
      const protocolFeeBps = await this.adlvContract.protocolFeeBps();
      const creatorShareBps = await this.adlvContract.creatorShareBps();
      
      const protocolFee = (price * protocolFeeBps) / BigInt(10000);
      const creatorShare = (price * creatorShareBps) / BigInt(10000);
      const vaultShare = price - protocolFee - creatorShare;

      // [Step 1: Update CVS via IDO contract]
      const newCVSScore = await this.calculateNewCVS(ipId, price, licenseType);

      try {
        await this.updateCVSAfterLicenseSale(ipId, newCVSScore);
        console.log(`✅ CVS for ${ipId} updated successfully to ${newCVSScore.toString()}`);
      } catch (error) {
        console.error(`❌ ERROR updating CVS for ${ipId}:`, error);
      }

      // [Step 2: Register license with abv.dev]
      try {
        const licenseId = await this.registerLicenseWithABV({
          ipId,
          vaultAddress,
          licensee,
          licenseType,
          totalAmount: price.toString(),
          vaultShare: vaultShare.toString(),
          creatorShare: creatorShare.toString(),
        });
        console.log(`✅ License successfully registered with abv.dev. License ID: ${licenseId}`);
      } catch (error) {
        console.error(`❌ ERROR registering license with abv.dev:`, error);
        // Continue even if abv.dev registration fails
      }

      // [Step 3: Register license with Story Protocol]
      if (this.storyProtocolService && this.storyProtocolService.isAvailable()) {
        try {
          // Convert bytes32 IP ID to Story Protocol IP ID format
          const storyIPId = this.storyProtocolService.convertBytes32ToStoryIPId(ipId);
          
          const storyLicense = await this.storyProtocolService.registerLicense({
            ipId: storyIPId,
            licensee: licensee,
            licenseType: licenseType,
            price: price.toString(),
            transactionHash: event.transactionHash,
            duration: 0, // Can be extracted from event if available
          });
          console.log(`✅ License successfully registered with Story Protocol. License ID: ${storyLicense.licenseId}`);
        } catch (error) {
          console.error(`❌ ERROR registering license with Story Protocol:`, error);
          // Continue even if Story Protocol registration fails
        }
      }
    } catch (error) {
      console.error(`❌ ERROR processing license sale for IP ${ipId}:`, error);
    }
  }

  /**
   * Handle CVSUpdated event
   */
  private async handleCVSUpdatedEvent(
    ipId: string,
    newCVS: bigint,
    oldCVS: bigint,
    event: EventLog
  ): Promise<void> {
    console.log(`\n📈 CVS Updated for IP ${ipId}`);
    console.log(`   Old CVS: ${oldCVS.toString()}`);
    console.log(`   New CVS: ${newCVS.toString()}`);
    console.log(`   Change: +${(newCVS - oldCVS).toString()}\n`);
  }

  /**
   * Calculate new CVS based on license sale
   * Uses the same logic as the IDO contract
   */
  private async calculateNewCVS(
    ipId: string,
    salePrice: bigint,
    licenseType: string
  ): Promise<bigint> {
    // Get current CVS from IDO
    const currentCVS = await this.idoContract.getCVS(ipId);

    // Calculate CVS increment based on license type
    const cvsIncrement = this.calculateCVSIncrement(licenseType, salePrice);

    return currentCVS + cvsIncrement;
  }

  /**
   * Calculate CVS increment from license sale
   * This matches the logic in the IDO contract
   */
  private calculateCVSIncrement(licenseType: string, price: bigint): bigint {
    switch (licenseType.toLowerCase()) {
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
   * Update CVS after license sale
   * Called automatically when LicenseSold event is detected
   */
  private async updateCVSAfterLicenseSale(
    ipId: string,
    newCVS: bigint
  ): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer not initialized. Provide PRIVATE_KEY in config.');
    }

    // Update CVS in IDO contract
    // Note: IDO contract must be owned by this service (or ADLV contract)
    const tx = await this.idoContract.updateCVS(ipId, newCVS);
    const receipt = await tx.wait();

    return receipt.hash;
  }

  /**
   * Register license with abv.dev API
   * This is called automatically when LicenseSold event is detected
   */
  private async registerLicenseWithABV(params: {
    ipId: string;
    vaultAddress: string;
    licensee: string;
    licenseType: string;
    totalAmount: string;
    vaultShare: string;
    creatorShare: string;
  }): Promise<string> {
    if (!this.abvApiKey) {
      throw new Error('ABV API key not configured');
    }

    try {
      const response = await fetch(ABV_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.abvApiKey}`,
          'X-ABV-API-Key': this.abvApiKey, // Alternative header format
        },
        body: JSON.stringify({
          ipAssetId: params.ipId,
          vaultAddress: params.vaultAddress,
          licensee: params.licensee,
          licenseType: params.licenseType,
          price: params.totalAmount,
          vaultShare: params.vaultShare,
          creatorShare: params.creatorShare,
          timestamp: new Date().toISOString(),
          source: 'atlas-protocol',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`abv.dev API failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.licenseId || data.id || 'registered';
    } catch (error) {
      console.error('abv.dev API Error:', error);
      throw error;
    }
  }

  /**
   * Sell a license for an IP asset (manual call)
   */
  async sellLicense(request: LicenseRequest): Promise<LicenseResponse> {
    if (!this.signer) {
      throw new Error('Signer not initialized. Provide PRIVATE_KEY in config.');
    }

    try {
      // Get vault to verify it exists
      const vault = await this.adlvContract.getVault(request.vaultAddress);
      
      if (!vault.exists) {
        throw new Error(`Vault ${request.vaultAddress} does not exist`);
      }

      // Get protocol fee configuration
      const protocolFeeBps = await this.adlvContract.protocolFeeBps();
      const creatorShareBps = await this.adlvContract.creatorShareBps();
      const vaultShareBps = await this.adlvContract.vaultShareBps();

      // Calculate revenue distribution
      const protocolFee = (request.price * protocolFeeBps) / BigInt(10000);
      const creatorShare = (request.price * creatorShareBps) / BigInt(10000);
      const vaultShare = request.price - protocolFee - creatorShare;

      // Register license with abv.dev if API key is provided
      let licenseId: string | undefined;
      if (this.abvApiKey) {
        try {
          const vault = await this.adlvContract.getVault(request.vaultAddress);
          licenseId = await this.registerLicenseWithABV({
            ipId: vault.ipId,
            vaultAddress: request.vaultAddress,
            licensee: this.signer.address,
            licenseType: request.licenseType,
            totalAmount: request.price.toString(),
            vaultShare: vaultShare.toString(),
            creatorShare: creatorShare.toString(),
          });
        } catch (error) {
          console.warn('Failed to register license with abv.dev:', error);
          // Continue with on-chain transaction even if abv.dev fails
        }
      }

      // Execute license sale on-chain
      const tx = await this.adlvContract.sellLicense(
        request.vaultAddress,
        request.licenseType,
        BigInt(request.duration || 0),
        { value: request.price }
      );

      // Wait for transaction receipt
      const receipt = await tx.wait();

      return {
        transactionHash: receipt.hash,
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
   * Get license revenue for an IP asset
   */
  async getLicenseRevenue(ipId: string): Promise<bigint> {
    return await this.idoContract.totalLicenseRevenue(ipId) as bigint;
  }

  /**
   * Get current CVS for an IP asset
   */
  async getCVS(ipId: string): Promise<bigint> {
    return await this.idoContract.getCVS(ipId) as bigint;
  }
}
