import { ethers } from 'ethers';
import { createPublicClient, http } from 'viem';
import { cvsEngine } from './src/services/cvs-engine.js';
import { LoanManager } from './src/services/loan-manager.js';
import { LicensingAgent } from './src/services/licensing-agent.js';
import { ContractMonitor } from './src/services/contract-monitor.js';
import { VerificationServer } from './src/api/verification-server.js';
import { IndexerService } from './src/services/indexer.js';
import { IndexerAPI } from './src/api/indexer-api.js';
import { CVSSyncService } from './src/services/cvs-sync-service.js';
import { config } from './src/config/index.js';

/**
 * Atlas Protocol Agent Service
 * 
 * Core backend service for:
 * - CVS (Collateral Value Score) monitoring
 * - IP Data Oracle ingestion from Goldsky
 * - Loan risk assessment and management
 * - Cross-Chain Bridging (Owlto Finance)
 * - GenAI Licensing (abv.dev)
 * - Contract event monitoring
 * - Story Protocol integration
 * - World ID verification
 */

class AgentService {
  private provider: ethers.Provider;
  private loanManager: LoanManager | null = null;
  private licensingAgent: LicensingAgent | null = null;
  private contractMonitor: ContractMonitor | null = null;
  private verificationServer: VerificationServer | null = null;
  private indexer: IndexerService | null = null;
  private indexerAPI: IndexerAPI | null = null;
  private cvsSyncService: CVSSyncService | null = null;

  constructor() {
    console.log('🚀 Initializing Atlas Agent Service...');
    console.log('═══════════════════════════════════════════');
    
    // Initialize provider with error suppression for network detection issues
    this.provider = new ethers.JsonRpcProvider(
      config.rpcUrl,
      undefined,
      { staticNetwork: true } // Skip network detection to avoid retry spam
    );

    // Initialize contract services if addresses are configured
    const adlvAddress = config.contracts.adlv ? config.contracts.adlv as `0x${string}` : null;
    const idoAddress = config.contracts.ido ? config.contracts.ido as `0x${string}` : null;
    
    if (adlvAddress && idoAddress) {
      this.loanManager = new LoanManager(
        adlvAddress,
        idoAddress,
        config.rpcUrl
      );

      this.licensingAgent = new LicensingAgent(
        adlvAddress,
        idoAddress,
        config.rpcUrl
      );

      this.contractMonitor = new ContractMonitor(
        adlvAddress,
        idoAddress
      );

      // Initialize World ID Verification Server
      this.verificationServer = new VerificationServer(this.loanManager);

      // Initialize Local Indexer Service (replaces Goldsky subgraph)
      // DISABLED: better-sqlite3 has issues with Bun on macOS
      // this.indexer = new IndexerService(
      //   adlvAddress,
      //   idoAddress
      // );
      
      // Initialize Indexer API
      // this.indexerAPI = new IndexerAPI(this.indexer.getDatabase());

      // Initialize CVS Sync Service (for Story Protocol SPG integration)
      if (process.env.CVS_ORACLE_ADDRESS && process.env.CVS_ORACLE_ADDRESS !== '0x0000000000000000000000000000000000000000') {
        this.cvsSyncService = new CVSSyncService(
          process.env.CVS_ORACLE_ADDRESS as `0x${string}`,
          parseInt(process.env.CVS_SYNC_INTERVAL_MS || '300000') // 5 minutes default
        );
      }
    }
  }

  async start() {
    console.log('✅ Agent Service started successfully');
    console.log('═══════════════════════════════════════════');
    console.log('📡 Services active:');
    console.log('   ✓ CVS Engine - Monitoring collateral values');
    console.log('   ✓ Loan Monitor - Checking for liquidations');
    console.log('   ✓ Subgraph Client - Querying Goldsky');
    console.log('   ✓ IP Data Oracle - Ready for ingestion');
    
    if (this.loanManager) {
      console.log('   ✓ Loan Manager - IPFi integration ready');
    }
    
    if (this.licensingAgent) {
      console.log('   ✓ Licensing Agent - GenAI licensing ready');
    }
    
    if (this.contractMonitor) {
      console.log('   ✓ Contract Monitor - Event monitoring ready');
    }
    
    if (this.verificationServer) {
      console.log('   ✓ World ID Verification Server - Ready');
    }
    
    if (this.indexer) {
      console.log('   ✓ Local Indexer Service - Indexing events');
    }
    
    if (this.indexerAPI) {
      console.log('   ✓ Indexer API - GraphQL-like queries available');
    }
    
    if (this.cvsSyncService) {
      console.log('   ✓ CVS Sync Service - Story Protocol SPG integration ready');
    }
    
    console.log('═══════════════════════════════════════════\n');

    // Start CVS monitoring
    this.startCVSMonitoring();

    // Start loan event monitoring (includes Owlto Finance integration)
    if (this.loanManager) {
      this.loanManager.startMonitoring();
    }

    // Start license event monitoring (includes abv.dev integration)
    if (this.licensingAgent) {
      this.licensingAgent.startMonitoring();
    }

    // Start contract event monitoring
    if (this.contractMonitor) {
      this.contractMonitor.startMonitoring();
    }

    // Start World ID verification server
    if (this.verificationServer) {
      this.verificationServer.start();
    }

    // Start Local Indexer Service
    // DISABLED: better-sqlite3 has issues with Bun on macOS
    // if (this.indexer) {
    //   await this.indexer.start();
    // }

    // Start Indexer API Server
    // if (this.indexerAPI) {
    //   this.indexerAPI.start(3002);
    // }

    // Start CVS Sync Service (automatic sync from Story Protocol)
    if (this.cvsSyncService && process.env.CVS_AUTO_SYNC_IPS) {
      const ipIds = process.env.CVS_AUTO_SYNC_IPS.split(',').map(
        (ip) => ip.trim() as `0x${string}`
      );
      this.cvsSyncService.startAutoSync(ipIds);
      console.log(`🔄 CVS Auto-sync started for ${ipIds.length} IP assets`);
    }

    // Display initial stats
    await this.displayStats();

    // Keep service running
    console.log('🔄 Agent Service running... Press Ctrl+C to stop\n');
  }

  /**
   * Start CVS monitoring and loan risk assessment
   */
  private startCVSMonitoring() {
    cvsEngine.startMonitoring(async (result) => {
      const { atRisk, liquidatable } = result;

      if (atRisk.length > 0) {
        console.log(`\n⚠️  WARNING: ${atRisk.length} loan(s) at risk`);
        for (const loan of atRisk) {
          console.log(`   - Loan ${loan.loanId}: CVS dropped ${loan.dropPercent}%`);
          console.log(`     Borrower: ${loan.borrower}`);
          console.log(`     Amount: ${loan.loanAmount}`);
        }
      }

      if (liquidatable.length > 0) {
        console.log(`\n🚨 ALERT: ${liquidatable.length} loan(s) require liquidation`);
        for (const loan of liquidatable) {
          console.log(`   - Loan ${loan.loanId}`);
          console.log(`     Reason: ${loan.reason}`);
          console.log(`     Borrower: ${loan.borrower}`);
          
          // TODO: Trigger liquidation via Owlto Finance
          // await this.triggerLiquidation(loan);
        }
      }

      if (atRisk.length === 0 && liquidatable.length === 0) {
        console.log('✅ All loans healthy');
      }
    });
  }

  /**
   * Display protocol statistics
   */
  private async displayStats() {
    try {
      console.log('📊 Fetching protocol statistics...\n');

      const globalStats = await cvsEngine.getGlobalStats();
      
      if (globalStats) {
        console.log('Global Protocol Stats:');
        console.log(`   Total IP Assets: ${globalStats.totalIPAssets || 0}`);
        console.log(`   Total Licenses: ${globalStats.totalLicenses || 0}`);
        console.log(`   Total Loans: ${globalStats.totalLoans || 0}`);
        console.log(`   Total Verified Users: ${globalStats.totalVerifiedUsers || 0}`);
      } else {
        console.log('ℹ️  Global stats unavailable (waiting for Story Protocol integration)');
      }

      const leaderboard = await cvsEngine.getCVSLeaderboard(5);
      
      if (leaderboard && leaderboard.length > 0) {
        console.log('\n🏆 Top 5 IP Assets by CVS:');
        leaderboard.forEach((asset: any, index: number) => {
          console.log(`   ${index + 1}. ${asset.name}`);
          console.log(`      CVS: ${asset.cvsScore}`);
          console.log(`      Revenue: ${asset.totalLicenseRevenue}`);
          if (asset.vault) {
            console.log(`      Max Loan: ${asset.vault.maxLoanAmount}`);
          }
        });
      } else {
        console.log('\nℹ️  CVS leaderboard unavailable (waiting for Story Protocol integration)');
      }

      console.log('\n═══════════════════════════════════════════\n');
    } catch (error) {
      console.error('⚠️  Error fetching stats:', error);
      console.log('   Continuing with limited analytics...\n');
    }
  }

  /**
   * Shutdown gracefully
   */
  async shutdown() {
    console.log('\n🛑 Shutting down Agent Service...');
    cvsEngine.stopMonitoring();
    
    if (this.loanManager) {
      this.loanManager.stopMonitoring();
    }
    
    if (this.licensingAgent) {
      this.licensingAgent.stopMonitoring();
    }
    
    if (this.contractMonitor) {
      this.contractMonitor.stopMonitoring();
    }
    
    if (this.verificationServer) {
      this.verificationServer.stop();
    }
    
    if (this.indexer) {
      this.indexer.stop();
    }
    
    if (this.indexerAPI) {
      this.indexerAPI.stop();
    }
    
    if (this.cvsSyncService) {
      this.cvsSyncService.stopAutoSync();
    }
    
    console.log('✅ Agent Service stopped');
    process.exit(0);
  }

  /**
   * Get Loan Manager instance
   */
  getLoanManager(): LoanManager {
    if (!this.loanManager) {
      throw new Error('Loan Manager not initialized. Set ADLV_ADDRESS and IDO_ADDRESS in config.');
    }
    return this.loanManager;
  }

  /**
   * Get Licensing Agent instance
   */
  getLicensingAgent(): LicensingAgent {
    if (!this.licensingAgent) {
      throw new Error('Licensing Agent not initialized. Set ADLV_ADDRESS and IDO_ADDRESS in config.');
    }
    return this.licensingAgent;
  }
}

// Initialize and start the service
const agent = new AgentService();
agent.start().catch(console.error);

// Handle graceful shutdown
process.on('SIGINT', () => agent.shutdown());
process.on('SIGTERM', () => agent.shutdown());