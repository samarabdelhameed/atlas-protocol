/**
 * ABV.dev Agent Service
 * 
 * Automatically registers licenses sold on Atlas Protocol as IP assets on ABV.dev
 * This service monitors license sales and registers them with ABV.dev
 */

import { fetchLatestLicenseSales } from '../clients/goldskyClient.js';
import { registerLicenseWithABV, type ABVLicenseRegistration } from '../clients/abvClient.js';

export interface ABVAgentResult {
  success: boolean;
  licensesProcessed: number;
  licensesRegistered: number;
  errors: string[];
}

export class ABVAgent {
  private isRunning: boolean = false;
  private pollingInterval: number = 60000; // 1 minute

  /**
   * Start monitoring license sales and registering with ABV.dev
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  ABV Agent already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting ABV Agent...');
    console.log(`   Polling interval: ${this.pollingInterval / 1000}s`);

    // Process immediately
    await this.processLicenseSales();

    // Then process periodically
    const interval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(interval);
        return;
      }
      await this.processLicenseSales();
    }, this.pollingInterval);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.isRunning = false;
    console.log('🛑 ABV Agent stopped');
  }

  /**
   * Process license sales and register with ABV.dev
   */
  async processLicenseSales(): Promise<ABVAgentResult> {
    try {
      console.log('\n📡 ABV Agent: Fetching latest license sales...');
      
      // Fetch latest license sales from Goldsky
      const licenseSales = await fetchLatestLicenseSales();
      
      if (licenseSales.length === 0) {
        console.log('   No license sales found');
        return {
          success: true,
          licensesProcessed: 0,
          licensesRegistered: 0,
          errors: [],
        };
      }

      console.log(`   Found ${licenseSales.length} license sales`);

      // Convert to ABV registration format
      const abvRegistrations: ABVLicenseRegistration[] = licenseSales.map(sale => ({
        ipAssetId: typeof sale.ipAsset === 'string' 
          ? sale.ipAsset 
          : (sale.ipAsset as any)?.id || '',
        vaultAddress: typeof sale.vault === 'string'
          ? sale.vault
          : (sale.vault as any)?.id || '',
        licensee: sale.licensee,
        licenseType: sale.licenseType,
        price: sale.salePrice,
        vaultShare: sale.vaultShare,
        creatorShare: sale.creatorShare,
        timestamp: new Date(Number(sale.timestamp) * 1000).toISOString(),
      }));

      // Filter out invalid registrations
      const validRegistrations = abvRegistrations.filter(
        reg => reg.ipAssetId && reg.ipAssetId !== '' && reg.vaultAddress && reg.vaultAddress !== ''
      );

      if (validRegistrations.length === 0) {
        console.log('   No valid license sales to register (missing IP Asset or Vault addresses)');
        return {
          success: true,
          licensesProcessed: licenseSales.length,
          licensesRegistered: 0,
          errors: ['No valid license sales to register'],
        };
      }

      console.log(`   Registering ${validRegistrations.length} licenses with ABV.dev...`);

      // Register with ABV.dev
      const errors: string[] = [];
      let registeredCount = 0;

      for (const registration of validRegistrations) {
        try {
          const result = await registerLicenseWithABV(registration);
          if (result.status === 'registered') {
            registeredCount++;
            console.log(`   ✅ Registered: ${result.licenseId}`);
          } else {
            errors.push(`License ${registration.ipAssetId}: ${result.message || 'Unknown error'}`);
          }
        } catch (error: any) {
          errors.push(`License ${registration.ipAssetId}: ${error.message}`);
          console.error(`   ❌ Failed to register: ${error.message}`);
        }
      }

      console.log(`\n✅ ABV Agent: Registered ${registeredCount}/${validRegistrations.length} licenses`);

      return {
        success: registeredCount > 0,
        licensesProcessed: licenseSales.length,
        licensesRegistered: registeredCount,
        errors,
      };
    } catch (error: any) {
      console.error('❌ ABV Agent error:', error.message);
      return {
        success: false,
        licensesProcessed: 0,
        licensesRegistered: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * Register a single license with ABV.dev (manual call)
   */
  async registerLicense(licenseData: ABVLicenseRegistration): Promise<ABVAgentResult> {
    try {
      const result = await registerLicenseWithABV(licenseData);
      
      return {
        success: result.status === 'registered',
        licensesProcessed: 1,
        licensesRegistered: result.status === 'registered' ? 1 : 0,
        errors: result.status !== 'registered' ? [result.message || 'Registration failed'] : [],
      };
    } catch (error: any) {
      return {
        success: false,
        licensesProcessed: 1,
        licensesRegistered: 0,
        errors: [error.message],
      };
    }
  }
}

// Export singleton instance
export const abvAgent = new ABVAgent();

