import { ethers } from 'ethers';
import { createPublicClient, http } from 'viem';
import { cvsEngine } from './src/services/cvs-engine.js';
import { LoanManager } from './src/services/loan-manager.js';
import { LicensingAgent } from './src/services/licensing-agent.js';
import { ContractMonitor } from './src/services/contract-monitor.js';
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

  constructor() {
    console.log('🚀 Initializing Atlas Agent Service...');
    console.log('═══════════════════════════════════════════');
    
    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(
      config.rpcUrl
    );

    // Initialize contract services if addresses are configured
    if (config.contracts.adlv && config.contracts.ido) {
      this.loanManager = new LoanManager(
        config.contracts.adlv,
        config.contracts.ido,
        config.rpcUrl
      );

      this.licensingAgent = new LicensingAgent(
        config.contracts.adlv,
        config.contracts.ido,
        config.chain.id
      );

      this.contractMonitor = new ContractMonitor(
        config.contracts.adlv,
        config.contracts.ido
      );
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
    
    console.log('═══════════════════════════════════════════\n');

    // Start CVS monitoring
    this.startCVSMonitoring();

    // Start loan event monitoring (includes Owlto Finance integration)
    if (this.loanManager) {
      this.loanManager.startMonitoring();
    }

    // Start contract event monitoring
    if (this.contractMonitor) {
      this.contractMonitor.startMonitoring();
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
      }

      console.log('\n═══════════════════════════════════════════\n');
    } catch (error) {
      console.error('Error fetching stats:', error);
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
    
    if (this.contractMonitor) {
      this.contractMonitor.stopMonitoring();
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