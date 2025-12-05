/**
 * License Event Monitor
 *
 * Monitors LicenseSold events from ADLV contract and automatically
 * updates CVS in the IDO contract as designed.
 *
 * This is the missing piece - the ADLV contract expects this service
 * to update CVS off-chain after license sales.
 */

import { createPublicClient, createWalletClient, http, parseAbiItem, formatUnits, type AbiEvent } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { storyAeneid } from 'viem/chains';

// Contract ABIs
const LICENSE_SOLD_EVENT = parseAbiItem('event LicenseSold(address indexed vaultAddress, bytes32 indexed ipId, address indexed licensee, uint256 amount, string licenseType)') as AbiEvent;

const ADLV_ABI = [
  LICENSE_SOLD_EVENT,
  parseAbiItem('function getVault(address vaultAddress) view returns (bytes32 ipId, address creator, uint256 totalLiquidity, uint256 availableLiquidity, uint256 totalLoansIssued, uint256 totalLicenseRevenue, uint256 activeLoansCount)'),
];

const IDO_ABI = [
  parseAbiItem('function updateCVS(bytes32 ipId, uint256 newCVS) external'),
  parseAbiItem('function getCVS(bytes32 ipId) view returns (uint256)'),
];

export interface LicenseEventMonitorConfig {
  adlvAddress: `0x${string}`;
  idoAddress: `0x${string}`;
  rpcUrl: string;
  privateKey: `0x${string}`;
}

export class LicenseEventMonitor {
  private publicClient: ReturnType<typeof createPublicClient>;
  private walletClient: ReturnType<typeof createWalletClient>;
  private config: LicenseEventMonitorConfig;
  private isMonitoring = false;
  private unwatch: (() => void) | null = null;

  constructor(config: LicenseEventMonitorConfig) {
    this.config = config;

    const account = privateKeyToAccount(config.privateKey);

    this.publicClient = createPublicClient({
      chain: storyAeneid,
      transport: http(config.rpcUrl),
    });

    this.walletClient = createWalletClient({
      account,
      chain: storyAeneid,
      transport: http(config.rpcUrl),
    });

    console.log('✅ License Event Monitor initialized');
    console.log(`   ADLV: ${config.adlvAddress}`);
    console.log(`   IDO: ${config.idoAddress}`);
    console.log(`   Wallet: ${account.address}`);
  }

  /**
   * Start monitoring for LicenseSold events
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('⚠️  Already monitoring license events');
      return;
    }

    this.isMonitoring = true;
    console.log('\n👂 Listening for LicenseSold events...\n');

    // Watch for new LicenseSold events
    this.unwatch = this.publicClient.watchEvent({
      address: this.config.adlvAddress,
      event: LICENSE_SOLD_EVENT,
      onLogs: async (logs) => {
        for (const log of logs) {
          await this.handleLicenseSold(log);
        }
      },
    });
  }

  /**
   * Handle a LicenseSold event by updating CVS in IDO contract
   */
  private async handleLicenseSold(log: any) {
    try {
      const { vaultAddress, ipId, licensee, amount, licenseType } = log.args;

      console.log(`\n🎫 License Sold Detected!`);
      console.log(`   Block: ${log.blockNumber}`);
      console.log(`   Tx: ${log.transactionHash}`);
      console.log(`   Vault: ${vaultAddress}`);
      console.log(`   IP ID: ${ipId}`);
      console.log(`   Buyer: ${licensee}`);
      console.log(`   Amount: ${formatUnits(amount, 18)} STORY`);
      console.log(`   Type: ${licenseType}`);

      // Calculate CVS increase based on license type
      // These percentages match the subgraph mapping logic
      let cvsPercentage: number;
      const licenseTypeLower = licenseType?.toLowerCase() || '';

      if (licenseTypeLower.includes('exclusive') || licenseTypeLower.includes('enterprise')) {
        cvsPercentage = 10; // 10% for exclusive/enterprise
      } else if (licenseTypeLower.includes('commercial')) {
        cvsPercentage = 5; // 5% for commercial
      } else {
        cvsPercentage = 2; // 2% for standard/basic
      }

      const cvsIncrease = (amount * BigInt(cvsPercentage)) / BigInt(100);
      console.log(`   CVS Increase: ${formatUnits(cvsIncrease, 18)} STORY (${cvsPercentage}%)`);

      // Get current CVS before update
      const currentCVS = await this.publicClient.readContract({
        address: this.config.idoAddress,
        abi: IDO_ABI,
        functionName: 'getCVS',
        args: [ipId],
      }) as bigint;

      console.log(`   Current CVS: ${formatUnits(currentCVS, 18)} STORY`);

      // Calculate new total CVS
      const newCVS = currentCVS + cvsIncrease;
      console.log(`   New CVS: ${formatUnits(newCVS, 18)} STORY`);

      // Update CVS on-chain via ADLV contract (Agent -> ADLV -> IDO)
      console.log(`   📤 Sending CVS update transaction via ADLV...`);

      const ADLV_UPDATE_ABI = [
        parseAbiItem('function updateIPCVS(bytes32 ipId, uint256 newCVS) external')
      ] as const;

      const account = privateKeyToAccount(this.config.privateKey);

      const txHash = await this.walletClient.writeContract({
        address: this.config.adlvAddress,
        abi: ADLV_UPDATE_ABI,
        functionName: 'updateIPCVS',
        args: [ipId, newCVS],
        chain: storyAeneid,
        account,
      });

      console.log(`   ✅ Tx sent: ${txHash}`);
      console.log(`   ⏳ Waiting for confirmation...`);

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 60_000, // 60 second timeout
      });

      if (receipt.status === 'success') {
        // Read new CVS value
        const verifiedCVS = await this.publicClient.readContract({
          address: this.config.idoAddress,
          abi: IDO_ABI,
          functionName: 'getCVS',
          args: [ipId],
        }) as bigint;

        console.log(`   ✅ CVS Updated Successfully!`);
        console.log(`   📈 Verified CVS: ${formatUnits(verifiedCVS, 18)} STORY`);
        console.log(`   📊 Increase: +${formatUnits(cvsIncrease, 18)} STORY\n`);
      } else {
        console.error(`   ❌ Transaction failed (status: ${receipt.status})\n`);
      }
    } catch (error: any) {
      console.error(`\n❌ Error handling license sale:`, error.message || error);
      console.error(`   This license sale's CVS update failed - manual intervention may be needed\n`);
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.unwatch) {
      this.unwatch();
      this.unwatch = null;
    }
    this.isMonitoring = false;
    console.log('🛑 Stopped monitoring license events');
  }

  /**
   * Check if currently monitoring
   */
  isActive(): boolean {
    return this.isMonitoring;
  }
}
