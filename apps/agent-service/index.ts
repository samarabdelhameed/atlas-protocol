import { ethers } from 'ethers';
import { createPublicClient, http } from 'viem';
import { cvsEngine } from './src/services/cvs-engine';
import { config } from './src/config';

/**
 * Atlas Protocol Agent Service
 * 
 * Core backend service for:
 * - CVS (Collateral Value Score) monitoring
 * - IP Data Oracle ingestion from Goldsky
 * - Loan risk assessment
 * - Cross-Chain Bridging (Owlto Finance)
 * - Story Protocol integration
 * - World ID verification
 */

class AgentService {
  private provider: ethers.Provider;

  constructor() {
    console.log('🚀 Initializing Atlas Agent Service...');
    console.log('═══════════════════════════════════════════');
    
    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(
      config.rpcUrl
    );
  }

  async start() {
    console.log('✅ Agent Service started successfully');
    console.log('═══════════════════════════════════════════');
    console.log('📡 Services active:');
    console.log('   ✓ CVS Engine - Monitoring collateral values');
    console.log('   ✓ Loan Monitor - Checking for liquidations');
    console.log('   ✓ Subgraph Client - Querying Goldsky');
    console.log('   ✓ IP Data Oracle - Ready for ingestion');
    console.log('═══════════════════════════════════════════\n');

    // Start CVS monitoring
    this.startCVSMonitoring();

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
    console.log('✅ Agent Service stopped');
    process.exit(0);
  }
}

// Initialize and start the service
const agent = new AgentService();
agent.start().catch(console.error);

// Handle graceful shutdown
process.on('SIGINT', () => agent.shutdown());
process.on('SIGTERM', () => agent.shutdown());