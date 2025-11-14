/**
 * Contract Event Monitor
 * 
 * Monitors events from ADLV and IDO contracts
 * Integrates with CVS Engine for real-time updates
 */

import { createPublicClient, http, type Address } from 'viem';
import { config } from '../config/index.js';
import { cvsEngine } from './cvs-engine.js';
import ADLV_ABI from '../../contracts/ADLV.json' assert { type: 'json' };
import IDO_ABI from '../../contracts/IDO.json' assert { type: 'json' };

export class ContractMonitor {
  private publicClient: ReturnType<typeof createPublicClient>;
  private adlvAddress: Address;
  private idoAddress: Address;
  private isMonitoring: boolean = false;
  private unwatchFunctions: (() => void)[] = [];

  constructor(adlvAddress: Address, idoAddress: Address) {
    this.adlvAddress = adlvAddress;
    this.idoAddress = idoAddress;

    this.publicClient = createPublicClient({
      transport: http(config.rpcUrl),
    });
  }

  /**
   * Start monitoring all contract events
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('⚠️  Contract monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log('🔍 Starting contract event monitoring...');

    // Monitor ADLV events
    this.watchADLVEvents();
    
    // Monitor IDO events
    this.watchIDOEvents();

    console.log('✅ Contract monitoring active');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    this.unwatchFunctions.forEach((unwatch) => unwatch());
    this.unwatchFunctions = [];
    console.log('🛑 Contract monitoring stopped');
  }

  /**
   * Watch ADLV contract events
   */
  private watchADLVEvents(): void {
    // Watch VaultCreated events
    const unwatchVaultCreated = this.publicClient.watchContractEvent({
      address: this.adlvAddress,
      abi: ADLV_ABI,
      eventName: 'VaultCreated',
      onLogs: (logs) => {
        logs.forEach((log) => {
          const decoded = log as any;
          console.log('📦 New vault created:', {
            vaultAddress: decoded.args.vaultAddress,
            ipId: decoded.args.ipId,
            creator: decoded.args.creator,
            initialCVS: decoded.args.initialCVS?.toString(),
          });
        });
      },
    });

    // Watch LicenseSold events
    const unwatchLicenseSold = this.publicClient.watchContractEvent({
      address: this.adlvAddress,
      abi: ADLV_ABI,
      eventName: 'LicenseSold',
      onLogs: (logs) => {
        logs.forEach(async (log) => {
          const decoded = log as any;
          console.log('📄 License sold:', {
            vaultAddress: decoded.args.vaultAddress,
            ipId: decoded.args.ipId,
            licensee: decoded.args.licensee,
            price: decoded.args.price?.toString(),
            licenseType: decoded.args.licenseType,
          });

          // Trigger CVS recalculation
          try {
            const ipId = decoded.args.ipId as string;
            const newCVS = await cvsEngine.calculateCVS(ipId);
            console.log(`📊 CVS updated for IP ${ipId}: ${newCVS.toString()}`);
          } catch (error) {
            console.error('Error recalculating CVS:', error);
          }
        });
      },
    });

    // Watch LoanIssued events
    const unwatchLoanIssued = this.publicClient.watchContractEvent({
      address: this.adlvAddress,
      abi: ADLV_ABI,
      eventName: 'LoanIssued',
      onLogs: (logs) => {
        logs.forEach((log) => {
          const decoded = log as any;
          console.log('💰 Loan issued:', {
            vaultAddress: decoded.args.vaultAddress,
            borrower: decoded.args.borrower,
            loanId: decoded.args.loanId?.toString(),
            amount: decoded.args.amount?.toString(),
            interestRate: decoded.args.interestRate?.toString(),
          });
        });
      },
    });

    // Watch LoanRepaid events
    const unwatchLoanRepaid = this.publicClient.watchContractEvent({
      address: this.adlvAddress,
      abi: ADLV_ABI,
      eventName: 'LoanRepaid',
      onLogs: (logs) => {
        logs.forEach((log) => {
          const decoded = log as any;
          console.log('✅ Loan repaid:', {
            vaultAddress: decoded.args.vaultAddress,
            borrower: decoded.args.borrower,
            loanId: decoded.args.loanId?.toString(),
            amount: decoded.args.amount?.toString(),
          });
        });
      },
    });

    // Watch LoanLiquidated events
    const unwatchLoanLiquidated = this.publicClient.watchContractEvent({
      address: this.adlvAddress,
      abi: ADLV_ABI,
      eventName: 'LoanLiquidated',
      onLogs: (logs) => {
        logs.forEach((log) => {
          const decoded = log as any;
          console.log('🚨 Loan liquidated:', {
            vaultAddress: decoded.args.vaultAddress,
            borrower: decoded.args.borrower,
            loanId: decoded.args.loanId?.toString(),
          });
        });
      },
    });

    this.unwatchFunctions.push(
      unwatchVaultCreated,
      unwatchLicenseSold,
      unwatchLoanIssued,
      unwatchLoanRepaid,
      unwatchLoanLiquidated
    );
  }

  /**
   * Watch IDO contract events
   */
  private watchIDOEvents(): void {
    // Watch CVSUpdated events
    const unwatchCVSUpdated = this.publicClient.watchContractEvent({
      address: this.idoAddress,
      abi: IDO_ABI,
      eventName: 'CVSUpdated',
      onLogs: (logs) => {
        logs.forEach((log) => {
          const decoded = log as any;
          console.log('📈 CVS updated:', {
            ipId: decoded.args.ipId,
            oldCVS: decoded.args.oldCVS?.toString(),
            newCVS: decoded.args.newCVS?.toString(),
          });
        });
      },
    });

    // Watch RevenueCollected events
    const unwatchRevenueCollected = this.publicClient.watchContractEvent({
      address: this.idoAddress,
      abi: IDO_ABI,
      eventName: 'RevenueCollected',
      onLogs: (logs) => {
        logs.forEach((log) => {
          const decoded = log as any;
          console.log('💵 Revenue collected:', {
            ipId: decoded.args.ipId,
            amount: decoded.args.amount?.toString(),
          });
        });
      },
    });

    this.unwatchFunctions.push(unwatchCVSUpdated, unwatchRevenueCollected);
  }

  /**
   * Get recent events (for debugging)
   */
  async getRecentEvents(blockRange: number = 1000) {
    const currentBlock = await this.publicClient.getBlockNumber();
    const fromBlock = currentBlock - BigInt(blockRange);

    const [vaultCreated, licenseSold, loanIssued, cvsUpdated] = await Promise.all([
      this.publicClient.getLogs({
        address: this.adlvAddress,
        event: {
          type: 'event',
          name: 'VaultCreated',
          inputs: [
            { type: 'address', indexed: true, name: 'vaultAddress' },
            { type: 'bytes32', indexed: true, name: 'ipId' },
            { type: 'address', indexed: true, name: 'creator' },
            { type: 'uint256', indexed: false, name: 'initialCVS' },
          ],
        },
        fromBlock,
        toBlock: currentBlock,
      }),
      this.publicClient.getLogs({
        address: this.adlvAddress,
        event: {
          type: 'event',
          name: 'LicenseSold',
          inputs: [
            { type: 'address', indexed: true, name: 'vaultAddress' },
            { type: 'bytes32', indexed: true, name: 'ipId' },
            { type: 'address', indexed: true, name: 'licensee' },
            { type: 'uint256', indexed: false, name: 'price' },
            { type: 'string', indexed: false, name: 'licenseType' },
          ],
        },
        fromBlock,
        toBlock: currentBlock,
      }),
      this.publicClient.getLogs({
        address: this.adlvAddress,
        event: {
          type: 'event',
          name: 'LoanIssued',
          inputs: [
            { type: 'address', indexed: true, name: 'vaultAddress' },
            { type: 'address', indexed: true, name: 'borrower' },
            { type: 'uint256', indexed: true, name: 'loanId' },
            { type: 'uint256', indexed: false, name: 'amount' },
            { type: 'uint256', indexed: false, name: 'collateral' },
            { type: 'uint256', indexed: false, name: 'interestRate' },
            { type: 'uint256', indexed: false, name: 'duration' },
          ],
        },
        fromBlock,
        toBlock: currentBlock,
      }),
      this.publicClient.getLogs({
        address: this.idoAddress,
        event: {
          type: 'event',
          name: 'CVSUpdated',
          inputs: [
            { type: 'bytes32', indexed: true, name: 'ipId' },
            { type: 'uint256', indexed: false, name: 'newCVS' },
            { type: 'uint256', indexed: false, name: 'oldCVS' },
          ],
        },
        fromBlock,
        toBlock: currentBlock,
      }),
    ]);

    return {
      vaultCreated: vaultCreated.length,
      licenseSold: licenseSold.length,
      loanIssued: loanIssued.length,
      cvsUpdated: cvsUpdated.length,
    };
  }
}

