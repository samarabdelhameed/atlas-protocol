/**
 * Start License Event Monitor
 *
 * This script starts the License Event Monitor that listens for
 * LicenseSold events and automatically updates CVS in the IDO contract.
 *
 * Usage:
 *   bun run start-license-monitor.ts
 *
 * Environment Variables Required:
 *   - WALLET_PRIVATE_KEY: Private key for signing CVS update transactions
 *   - RPC_URL: Story Protocol RPC endpoint
 *   - ADLV_ADDRESS: ADLV contract address
 *   - IDO_ADDRESS: IDO contract address
 */

import { LicenseEventMonitor } from './src/services/license-event-monitor.js';

async function main() {
  console.log('🚀 Starting License Event Monitor...\n');

  // Load configuration from environment
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ WALLET_PRIVATE_KEY not found in environment');
    console.error('   Please add it to your .env file');
    process.exit(1);
  }

  const config = {
    adlvAddress: (process.env.ADLV_ADDRESS || '0x8Ed0796e346C0525cB6dB1DFa72CDB1993c7dE0c') as `0x${string}`,
    idoAddress: (process.env.IDO_ADDRESS || '0x4a875fD309C95DBFBcA6dFC3575517Ea7d5F6eC7') as `0x${string}`,
    rpcUrl: process.env.RPC_URL || 'https://rpc.ankr.com/story_aeneid_testnet/bc16a42ff54082470945f1420d9917706e7de9dbea9c11f20d93584bd6d26886',
    privateKey: privateKey as `0x${string}`,
  };

  // Create and start monitor
  const monitor = new LicenseEventMonitor(config);
  await monitor.startMonitoring();

  console.log('✅ License Event Monitor is now running');
  console.log('   Watching for license sales...');
  console.log('   Press Ctrl+C to stop\n');

  // Keep process alive
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down...');
    monitor.stopMonitoring();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n\n🛑 Shutting down...');
    monitor.stopMonitoring();
    process.exit(0);
  });

  // Keep the process running
  await new Promise(() => {});
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
