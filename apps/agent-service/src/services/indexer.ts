/**
 * Local Indexer Service
 * Indexes events from ADLV and IDO contracts and stores in SQLite database
 * This replaces the need for Goldsky subgraph
 */

import { createPublicClient, http, type Address, type Log } from 'viem';
import { config } from '../config/index.js';
import { IndexerDatabase } from '../database/schema.js';
import ADLV_JSON from '../../contracts/ADLV.json' assert { type: 'json' };
import IDO_JSON from '../../contracts/IDO.json' assert { type: 'json' };

const ADLV_ABI = ADLV_JSON.abi;
const IDO_ABI = IDO_JSON.abi;

export class IndexerService {
  private publicClient: ReturnType<typeof createPublicClient>;
  private db: IndexerDatabase;
  private adlvAddress: Address;
  private idoAddress: Address;
  private isIndexing: boolean = false;
  private indexingInterval: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 1000; // Blocks per batch
  private readonly POLL_INTERVAL = 12000; // 12 seconds

  constructor(adlvAddress: Address, idoAddress: Address) {
    this.adlvAddress = adlvAddress;
    this.idoAddress = idoAddress;

    this.publicClient = createPublicClient({
      transport: http(config.rpcUrl),
    });

    this.db = new IndexerDatabase();
    console.log('✅ IndexerService initialized');
  }

  /**
   * Start indexing historical events and watch for new ones
   */
  async start() {
    if (this.isIndexing) {
      console.log('⚠️  Indexer is already running');
      return;
    }

    this.isIndexing = true;
    console.log('🚀 Starting indexer...');

    // First, index historical events
    await this.indexHistoricalEvents();

    // Then start watching for new events
    this.startWatching();

    console.log('✅ Indexer started successfully');
  }

  /**
   * Stop indexing
   */
  stop() {
    this.isIndexing = false;
    if (this.indexingInterval) {
      clearInterval(this.indexingInterval);
      this.indexingInterval = null;
    }
    this.db.close();
    console.log('🛑 Indexer stopped');
  }

  /**
   * Index historical events from deployment block to current
   */
  private async indexHistoricalEvents() {
    console.log('📚 Indexing historical events...');

    const lastIndexedBlock = this.db.getLastIndexedBlock();
    const currentBlock = await this.publicClient.getBlockNumber();

    if (lastIndexedBlock >= Number(currentBlock)) {
      console.log('✅ All blocks already indexed');
      return;
    }

    console.log(`   From block: ${lastIndexedBlock}`);
    console.log(`   To block: ${Number(currentBlock)}`);

    let fromBlock = BigInt(lastIndexedBlock);
    const toBlock = currentBlock;

    while (fromBlock < toBlock) {
      const endBlock = fromBlock + BigInt(this.BATCH_SIZE) > toBlock 
        ? toBlock 
        : fromBlock + BigInt(this.BATCH_SIZE);

      try {
        await this.indexBlockRange(Number(fromBlock), Number(endBlock));
        this.db.updateLastIndexedBlock(Number(endBlock));
        fromBlock = endBlock + 1n;

        console.log(`   ✓ Indexed blocks ${fromBlock - BigInt(this.BATCH_SIZE)}-${endBlock}`);
      } catch (error) {
        console.error(`   ✗ Error indexing blocks ${fromBlock}-${endBlock}:`, error);
        // Continue with next batch
        fromBlock = endBlock + 1n;
      }
    }

    console.log('✅ Historical indexing complete');
  }

  /**
   * Index events in a block range
   */
  private async indexBlockRange(fromBlock: number, toBlock: number) {
    try {
      // Get ADLV VaultCreated events
      const vaultCreatedLogs = await this.publicClient.getLogs({
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
        fromBlock: BigInt(fromBlock),
        toBlock: BigInt(toBlock),
      });

      // Get ADLV LicenseSold events
      const licenseSoldLogs = await this.publicClient.getLogs({
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
        fromBlock: BigInt(fromBlock),
        toBlock: BigInt(toBlock),
      });

      // Get ADLV LoanIssued events
      const loanIssuedLogs = await this.publicClient.getLogs({
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
        fromBlock: BigInt(fromBlock),
        toBlock: BigInt(toBlock),
      });

      // Get ADLV CVSUpdated events
      const cvsUpdatedLogs = await this.publicClient.getLogs({
        address: this.adlvAddress,
        event: {
          type: 'event',
          name: 'CVSUpdated',
          inputs: [
            { type: 'address', indexed: true, name: 'vaultAddress' },
            { type: 'uint256', indexed: false, name: 'oldCVS' },
            { type: 'uint256', indexed: false, name: 'newCVS' },
          ],
        },
        fromBlock: BigInt(fromBlock),
        toBlock: BigInt(toBlock),
      });

      // Get ADLV LoanRepaid events
      const loanRepaidLogs = await this.publicClient.getLogs({
        address: this.adlvAddress,
        event: {
          type: 'event',
          name: 'LoanRepaid',
          inputs: [
            { type: 'address', indexed: true, name: 'vaultAddress' },
            { type: 'address', indexed: true, name: 'borrower' },
            { type: 'uint256', indexed: true, name: 'loanId' },
            { type: 'uint256', indexed: false, name: 'amount' },
          ],
        },
        fromBlock: BigInt(fromBlock),
        toBlock: BigInt(toBlock),
      });

      // Process all logs
      for (const log of vaultCreatedLogs) {
        await this.handleVaultCreated(log as any);
      }
      for (const log of licenseSoldLogs) {
        await this.handleLicenseSold(log as any);
      }
      for (const log of loanIssuedLogs) {
        await this.handleLoanIssued(log as any);
      }
      for (const log of cvsUpdatedLogs) {
        await this.handleCVSUpdated(log as any);
      }
      for (const log of loanRepaidLogs) {
        await this.handleLoanRepaid(log as any);
      }
    } catch (error) {
      // Fallback to basic logs if event filters fail
      console.error('Error with event filters, using basic logs:', error);
      const allLogs = await this.publicClient.getLogs({
        address: this.adlvAddress,
        fromBlock: BigInt(fromBlock),
        toBlock: BigInt(toBlock),
      });
      // Would need manual decoding here - for now just log
      console.log(`   Found ${allLogs.length} logs in block range ${fromBlock}-${toBlock}`);
    }
  }


  /**
   * Start watching for new events
   */
  private startWatching() {
    // Watch ADLV events
    const unwatchADLV = this.publicClient.watchContractEvent({
      address: this.adlvAddress,
      abi: ADLV_ABI,
      eventName: 'VaultCreated',
      onLogs: async (logs) => {
        for (const log of logs) {
          await this.handleVaultCreated(log);
        }
      },
    });

    this.publicClient.watchContractEvent({
      address: this.adlvAddress,
      abi: ADLV_ABI,
      eventName: 'LicenseSold',
      onLogs: async (logs) => {
        for (const log of logs) {
          await this.handleLicenseSold(log);
        }
      },
    });

    this.publicClient.watchContractEvent({
      address: this.adlvAddress,
      abi: ADLV_ABI,
      eventName: 'LoanIssued',
      onLogs: async (logs) => {
        for (const log of logs) {
          await this.handleLoanIssued(log);
        }
      },
    });

    this.publicClient.watchContractEvent({
      address: this.adlvAddress,
      abi: ADLV_ABI,
      eventName: 'CVSUpdated',
      onLogs: async (logs) => {
        for (const log of logs) {
          await this.handleCVSUpdated(log);
        }
      },
    });

    this.publicClient.watchContractEvent({
      address: this.adlvAddress,
      abi: ADLV_ABI,
      eventName: 'LoanRepaid',
      onLogs: async (logs) => {
        for (const log of logs) {
          await this.handleLoanRepaid(log);
        }
      },
    });

    // Also poll for any missed blocks
    this.indexingInterval = setInterval(async () => {
      if (this.isIndexing) {
        const lastBlock = this.db.getLastIndexedBlock();
        const currentBlock = await this.publicClient.getBlockNumber();
        
        if (lastBlock < Number(currentBlock) - 100) { // If we're behind by 100+ blocks
          await this.indexBlockRange(lastBlock + 1, Number(currentBlock));
          this.db.updateLastIndexedBlock(Number(currentBlock));
        }
      }
    }, this.POLL_INTERVAL);

    console.log('👀 Watching for new events...');
  }

  // Event handlers
  private async handleVaultCreated(log: any) {
    const args = log.args;
    const block = await this.publicClient.getBlock({ blockNumber: log.blockNumber! });

    this.db.insertVault({
      vaultAddress: args.vaultAddress || log.address,
      ipId: args.ipId?.toString() || '0x0',
      creator: args.creator || '0x0',
      initialCVS: args.initialCVS?.toString() || '0',
      currentCVS: args.initialCVS?.toString() || '0',
      totalLiquidity: '0',
      availableLiquidity: '0',
      totalLoansIssued: '0',
      activeLoansCount: 0,
      totalLicenseRevenue: '0',
      createdAt: Number(block.timestamp),
      updatedAt: Number(block.timestamp),
      blockNumber: Number(log.blockNumber!),
      txHash: log.transactionHash!,
    });

    console.log('📝 Indexed: VaultCreated', args.vaultAddress);
  }

  private async handleLicenseSold(log: any) {
    const args = log.args;
    const block = await this.publicClient.getBlock({ blockNumber: log.blockNumber! });

    const price = args.price?.toString() || '0';
    const creatorShare = (BigInt(price) * 70n / 100n).toString();
    const vaultShare = (BigInt(price) * 25n / 100n).toString();
    const protocolFee = (BigInt(price) * 5n / 100n).toString();
    
    // Calculate CVS increment based on license type
    let cvsIncrement = '0';
    const licenseType = args.licenseType || 'standard';
    if (licenseType === 'exclusive') {
      cvsIncrement = (BigInt(price) / 10n).toString(); // 10%
    } else if (licenseType === 'commercial') {
      cvsIncrement = (BigInt(price) / 20n).toString(); // 5%
    } else {
      cvsIncrement = (BigInt(price) / 50n).toString(); // 2%
    }

    this.db.insertLicenseSale({
      vaultAddress: args.vaultAddress || log.address,
      ipId: args.ipId?.toString() || '0x0',
      licensee: args.licensee || '0x0',
      salePrice: price,
      licenseType: licenseType,
      cvsIncrement: cvsIncrement,
      creatorShare: creatorShare,
      vaultShare: vaultShare,
      protocolFee: protocolFee,
      blockNumber: Number(log.blockNumber!),
      txHash: log.transactionHash!,
      timestamp: Number(block.timestamp),
    });

    // Update vault's total license revenue and CVS
    const vault = this.db.getVault(args.vaultAddress);
    if (vault) {
      const newRevenue = (BigInt(vault.totalLicenseRevenue) + BigInt(vaultShare)).toString();
      const newCVS = (BigInt(vault.currentCVS) + BigInt(cvsIncrement)).toString();
      
      this.db.insertVault({
        ...vault,
        totalLicenseRevenue: newRevenue,
        currentCVS: newCVS,
        updatedAt: Number(block.timestamp),
      });
    }

    console.log('📝 Indexed: LicenseSold', { vault: args.vaultAddress, price });
  }

  private async handleLoanIssued(log: any) {
    const args = log.args;
    const block = await this.publicClient.getBlock({ blockNumber: log.blockNumber! });

    const vault = this.db.getVault(args.vaultAddress);
    
    this.db.insertLoan({
      loanId: args.loanId?.toString() || '0',
      vaultAddress: args.vaultAddress || log.address,
      borrower: args.borrower || '0x0',
      loanAmount: args.amount?.toString() || '0',
      collateralAmount: args.collateral?.toString() || '0',
      interestRate: args.interestRate?.toString() || '0',
      duration: Number(args.duration || 0n),
      cvsAtIssuance: vault?.currentCVS || '0',
      status: 'Active',
      repaidAmount: '0',
      outstandingAmount: args.amount?.toString() || '0',
      startTime: Number(block.timestamp),
      endTime: Number(block.timestamp) + Number(args.duration || 0n),
      blockNumber: Number(log.blockNumber!),
      txHash: log.transactionHash!,
      issuedAt: Number(block.timestamp),
    });

    // Update vault loan counts
    if (vault) {
      this.db.insertVault({
        ...vault,
        totalLoansIssued: (BigInt(vault.totalLoansIssued) + BigInt(args.amount || 0n)).toString(),
        activeLoansCount: vault.activeLoansCount + 1,
        availableLiquidity: (BigInt(vault.availableLiquidity) - BigInt(args.amount || 0n)).toString(),
        updatedAt: Number(block.timestamp),
      });
    }

    console.log('📝 Indexed: LoanIssued', { loanId: args.loanId, vault: args.vaultAddress });
  }

  private async handleCVSUpdated(log: any) {
    const args = log.args;
    const block = await this.publicClient.getBlock({ blockNumber: log.blockNumber! });

    this.db.insertCVSUpdate({
      vaultAddress: args.vaultAddress || log.address,
      ipId: '0x0', // Will need to get from vault
      oldCVS: args.oldCVS?.toString() || '0',
      newCVS: args.newCVS?.toString() || '0',
      blockNumber: Number(log.blockNumber!),
      txHash: log.transactionHash!,
      timestamp: Number(block.timestamp),
    });

    // Update vault CVS
    const vault = this.db.getVault(args.vaultAddress);
    if (vault) {
      this.db.insertVault({
        ...vault,
        currentCVS: args.newCVS?.toString() || vault.currentCVS,
        updatedAt: Number(block.timestamp),
      });
    }

    console.log('📝 Indexed: CVSUpdated', { vault: args.vaultAddress, newCVS: args.newCVS });
  }

  private async handleLoanRepaid(log: any) {
    const args = log.args;
    const loanId = `${args.vaultAddress}-${args.loanId}`;
    const loan = this.db.getLoan(loanId);

    if (loan) {
      const newRepaid = (BigInt(loan.repaidAmount) + BigInt(args.amount || 0n)).toString();
      const newOutstanding = (BigInt(loan.outstandingAmount) - BigInt(args.amount || 0n)).toString();
      
      this.db.insertLoan({
        ...loan,
        repaidAmount: newRepaid,
        outstandingAmount: newOutstanding.toString(),
        status: newOutstanding === '0' ? 'Repaid' : 'Active',
      });

      // Update vault
      const vault = this.db.getVault(args.vaultAddress);
      if (vault) {
        this.db.insertVault({
          ...vault,
          availableLiquidity: (BigInt(vault.availableLiquidity) + BigInt(args.amount || 0n)).toString(),
          activeLoansCount: newOutstanding === '0' ? vault.activeLoansCount - 1 : vault.activeLoansCount,
          updatedAt: Date.now(),
        });
      }
    }

    console.log('📝 Indexed: LoanRepaid', { loanId: args.loanId, amount: args.amount });
  }

  /**
   * Get database instance for API access
   */
  getDatabase(): IndexerDatabase {
    return this.db;
  }
}

