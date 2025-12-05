/**
 * Loan Manager Service
 * 
 * Handles loan issuance, monitoring, and liquidation
 * Integrates with ADLV contract and Owlto Finance for cross-chain loans
 */

import { Contract, Wallet, JsonRpcProvider, type EventLog, keccak256, toUtf8Bytes } from 'ethers';
import { config } from '../config/index.js';
import ADLV_JSON from '../../contracts/ADLV.json' assert { type: 'json' };
import IDO_JSON from '../../contracts/IDO.json' assert { type: 'json' };

const ADLV_ABI = ADLV_JSON.abi;
const IDO_ABI = IDO_JSON.abi;

// Owlto Finance API URL
const OWLTO_API_URL = process.env.OWLTO_API_URL || 'https://api.owlto.finance/api/v2/bridge';

export interface LoanRequest {
  vaultAddress: string;
  loanAmount: bigint;
  duration: number; // in seconds
  targetChain?: number;
}

export interface LoanResponse {
  loanId: bigint;
  transactionHash: string;
  interestRate: bigint;
  collateralAmount: bigint;
  endTime: bigint;
}

export interface CrossChainTransferParams {
  recipient: string;
  targetChainId: number;
  tokenAddress: string;
  amount: string;
  loanId: bigint;
}

export class LoanManager {
  private provider: JsonRpcProvider;
  private signer: Wallet | null = null;
  private adlvContract: Contract;
  private idoContract: Contract;
  private isMonitoring: boolean = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastProcessedTimestamp: number = 0;
  private readonly SUBGRAPH_URL = process.env.SUBGRAPH_URL || 'https://api.goldsky.com/api/public/project_cmi7k5szzd54101yy44xg05em/subgraphs/atlas-protocol/6.0.1/gn';

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

    console.log('✅ LoanManager initialized');
    console.log(`   ADLV Contract: ${adlvAddress}`);
    console.log(`   IDO Contract: ${idoAddress}`);
  }

  /**
   * Start monitoring LoanIssued events from ADLV contract
   */
  /**
   * Start monitoring LoanIssued events via Subgraph polling
   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('⚠️  Loan monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log('🔍 Starting loan monitoring via Subgraph polling...');
    console.log(`   Subgraph URL: ${this.SUBGRAPH_URL}`);

    // Initial poll
    this.pollSubgraph();

    // Start polling interval (every 10 seconds)
    this.pollingInterval = setInterval(() => this.pollSubgraph(), 10000);

    console.log('✅ Loan monitoring active');
  }

  /**
   * Stop monitoring events
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    console.log('🛑 Loan monitoring stopped');
  }

  /**
   * Poll subgraph for new loans
   */
  private async pollSubgraph(): Promise<void> {
    try {
      // Query for recent LoanIssued events
      // We filter by timestamp to get only new events
      const query = `
        query {
          loans(
            orderBy: issuedAt, 
            orderDirection: desc, 
            first: 10,
            where: { issuedAt_gt: ${this.lastProcessedTimestamp} }
          ) {
            id
            loanId
            vault {
              id
            }
            borrower
            loanAmount
            collateralAmount
            interestRate
            duration
            targetChainId
            issuedAt
            transactionHash
          }
        }
      `;

      const response = await fetch(this.SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json() as any;
      
      if (data.errors) {
        console.error('❌ Subgraph query error:', data.errors);
        return;
      }

      const loans = data.data?.loans || [];

      if (loans.length > 0) {
        console.log(`Found ${loans.length} new loans`);
        
        // Process loans (oldest first)
        for (const loan of loans.reverse()) {
          await this.processLoanFromSubgraph(loan);
          
          // Update last processed timestamp
          const timestamp = Number(loan.issuedAt);
          if (timestamp > this.lastProcessedTimestamp) {
            this.lastProcessedTimestamp = timestamp;
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Error polling subgraph:', error.message || error);
      if (error.response) {
        try {
          const text = await error.response.text();
          console.error('   Response body:', text);
        } catch (e) {
          // ignore
        }
      }
    }
  }

  /**
   * Process loan data from subgraph
   */
  private async processLoanFromSubgraph(loan: any): Promise<void> {
    try {
      await this.handleLoanIssuedEvent(
        loan.vault.id, // Extract vault address from object
        loan.borrower,
        BigInt(loan.loanId),
        BigInt(loan.loanAmount),
        BigInt(loan.collateralAmount),
        BigInt(loan.interestRate),
        BigInt(loan.duration),
        BigInt(loan.targetChainId || 0), // Handle optional field
        { transactionHash: loan.transactionHash } as any // Mock event object
      );
    } catch (error) {
      console.error(`Error processing loan ${loan.loanId}:`, error);
    }
  }

  /**
   * Handle LoanIssued event - Main function for IPFi cross-chain transfers
   */
  private async handleLoanIssuedEvent(
    vaultAddress: string,
    borrower: string,
    loanId: bigint,
    amount: bigint,
    collateral: bigint,
    interestRate: bigint,
    duration: bigint,
    targetChainId: bigint,
    event: EventLog
  ): Promise<void> {
    const amountEth = Number(amount) / 1e18;
    const STORY_CHAIN_ID = 1315n;
    
    console.log('\n🚨 LoanIssued Event Detected!');
    console.log('═══════════════════════════════════════════');
    console.log(`   Loan ID: ${loanId.toString()}`);
    console.log(`   Vault: ${vaultAddress}`);
    console.log(`   Borrower: ${borrower}`);
    console.log(`   Amount: ${amountEth} tokens`);
    console.log(`   Collateral: ${Number(collateral) / 1e18} tokens`);
    console.log(`   Interest Rate: ${Number(interestRate) / 100}%`);
    console.log(`   Duration: ${Number(duration)} seconds`);
    console.log(`   Target Chain: ${targetChainId.toString()} ${targetChainId === 0n || targetChainId === STORY_CHAIN_ID ? '(Same Chain - No Bridge)' : '(Cross-Chain Bridge Required)'}`);
    console.log('═══════════════════════════════════════════\n');

    try {
      // Skip cross-chain transfer if targetChainId is 0 or Story chain (same chain)
      if (targetChainId === 0n || targetChainId === STORY_CHAIN_ID) {
        console.log('✅ Loan issued on same chain. No bridging required.');
        return;
      }
      
      // CROSS-CHAIN LOAN DETECTED - Execute bridge flow
      console.log('🌉 Cross-chain loan detected! Initiating Owlto bridge flow...\n');
      
      // Step 1: Claim funds from contract
      console.log('📥 Step 1: Claiming funds from contract...');
      try {
        const claimTx = await this.adlvContract.claimForBridge!(loanId);
        const claimReceipt = await claimTx.wait();
        console.log(`   ✅ Funds claimed! Tx: ${claimReceipt?.hash}`);
      } catch (claimError: any) {
        console.error('   ❌ Failed to claim funds:', claimError.message);
        throw claimError;
      }
      
      // Step 2: Bridge via Owlto Finance SDK
      console.log('\n🌉 Step 2: Bridging via Owlto Finance...');
      const bridgeResult = await this.executeCrossChainTransfer({
        recipient: borrower,
        targetChainId: Number(targetChainId),
        tokenAddress: '0x0000000000000000000000000000000000000000', // Native token
        amount: amount.toString(),
        loanId: loanId,
      });
      
      // Step 3: Confirm bridge on contract (optional)
      if (bridgeResult && bridgeResult.txHash) {
        console.log('\n📝 Step 3: Confirming bridge on contract...');
        try {
          // Convert txHash to bytes32
          const txHashBytes32 = bridgeResult.txHash.padEnd(66, '0').slice(0, 66);
          const confirmTx = await this.adlvContract.confirmBridge!(loanId, txHashBytes32);
          const confirmReceipt = await confirmTx.wait();
          console.log(`   ✅ Bridge confirmed! Tx: ${confirmReceipt?.hash}`);
        } catch (confirmError: any) {
          console.warn('   ⚠️ Failed to confirm bridge (non-critical):', confirmError.message);
        }
      }

      console.log(`\n✅ Cross-chain transfer for Loan ${loanId.toString()} completed!`);
      console.log(`   Recipient: ${borrower}`);
      console.log(`   Amount: ${amountEth} tokens`);
      console.log(`   Destination: Chain ${targetChainId}`);
      
    } catch (error: any) {
      console.error(`\n❌ ERROR processing cross-chain Loan ${loanId.toString()}:`, error.message);
      // In production, you might want to:
      // 1. Log to error tracking service
      // 2. Send alert to administrators
      // 3. Retry the transfer
    }
  }

  /**
   * Handle LoanRepaid event
   */
  private async handleLoanRepaidEvent(
    vaultAddress: string,
    borrower: string,
    loanId: bigint,
    amount: bigint,
    event: EventLog
  ): Promise<void> {
    console.log(`\n✅ Loan Repaid: Loan ID ${loanId.toString()}`);
    console.log(`   Borrower: ${borrower}`);
    console.log(`   Amount: ${Number(amount) / 1e18} tokens\n`);
  }

  /**
   * Handle LoanLiquidated event
   */
  private async handleLoanLiquidatedEvent(
    vaultAddress: string,
    borrower: string,
    loanId: bigint,
    event: EventLog
  ): Promise<void> {
    console.log(`\n🚨 Loan Liquidated: Loan ID ${loanId.toString()}`);
    console.log(`   Borrower: ${borrower}`);
    console.log(`   Vault: ${vaultAddress}\n`);
  }

  /**
   * Execute cross-chain transfer using Owlto Finance SDK
   * This is the core IPFi functionality
   */
  private async executeCrossChainTransfer(params: CrossChainTransferParams): Promise<any> {
    const { getBridgeTransaction } = await import('../clients/owltoClient.js');
    
    if (!this.signer) {
      throw new Error('Signer not available. Cannot execute bridge transaction.');
    }

    try {
      // Get current chain ID from provider
      const network = await this.provider.getNetwork();
      const fromChainId = Number(network.chainId);
      const signerAddress = await this.signer.getAddress();

      console.log(`   From Chain: ${fromChainId}`);
      console.log(`   To Chain: ${params.targetChainId}`);
      console.log(`   Recipient: ${params.recipient}`);
      console.log(`   Amount: ${Number(params.amount) / 1e18} tokens`);

      // Get bridge transaction from Owlto SDK
      const buildTx = await getBridgeTransaction({
        fromChainId,
        toChainId: params.targetChainId,
        amount: params.amount,
        tokenName: 'ETH', // Native token
        recipient: params.recipient,
        sender: signerAddress,
      });

      if (!buildTx || !buildTx.txs?.transferBody) {
        throw new Error('Failed to get bridge transaction from Owlto');
      }

      // Send approve transaction if needed (for ERC20 tokens)
      if (buildTx.txs.approveBody) {
        console.log('   📤 Sending approve transaction...');
        const approveTx = await this.signer.sendTransaction(buildTx.txs.approveBody);
        await approveTx.wait();
        console.log('   ✅ Approve confirmed');
      }

      // Send the bridge transaction
      console.log('   📤 Sending bridge transaction...');
      const tx = await this.signer.sendTransaction(buildTx.txs.transferBody);
      
      console.log(`   ⏳ Waiting for confirmation... Tx: ${tx.hash}`);
      const receipt = await tx.wait();
      
      console.log(`   ✅ Bridge transaction confirmed!`);
      console.log(`   📦 Block: ${receipt?.blockNumber}`);

      // Wait for bridge completion (optional - can take a few minutes)
      // const bridgeReceipt = await waitForBridgeReceipt(tx.hash, fromChainId);

      return {
        txHash: tx.hash,
        blockNumber: receipt?.blockNumber,
        success: true,
      };
    } catch (error: any) {
      console.error('   ❌ Owlto Bridge Error:', error.message);
      throw error;
    }
  }

  /**
   * Check loan eligibility before issuing
   */
  async checkLoanEligibility(
    vaultAddress: string,
    loanAmount: bigint
  ): Promise<{
    eligible: boolean;
    currentCVS: bigint;
    maxLoanAmount: bigint;
    availableLiquidity: bigint;
    interestRate: bigint;
    requiredCollateral: bigint;
    reason?: string;
  }> {
    try {
      // Get vault info
      const vault = await this.adlvContract.getVault!(vaultAddress);
      const ipId = vault.ipId;

      // Get current CVS from IDO
      const currentCVS = await this.idoContract.getCVS!(ipId);

      // Calculate max loan amount (50% of CVS)
      const maxLoanAmount = await this.adlvContract.calculateMaxLoanAmount!(vaultAddress);

      // Calculate interest rate
      const interestRate = await this.adlvContract.calculateInterestRate!(currentCVS);

      // Calculate required collateral (150% of loan amount)
      const defaultCollateralRatio = await this.adlvContract.defaultCollateralRatio!();
      const requiredCollateral = (loanAmount * BigInt(defaultCollateralRatio)) / BigInt(10000);

      // Check eligibility
      const minCVSRatio = BigInt(2); // CVS must be >= 2x loan amount
      const requiredCVS = loanAmount * minCVSRatio;

      if (currentCVS < requiredCVS) {
        return {
          eligible: false,
          currentCVS,
          maxLoanAmount,
          availableLiquidity: vault.availableLiquidity,
          interestRate,
          requiredCollateral,
          reason: `Insufficient CVS. Required: ${requiredCVS}, Current: ${currentCVS}`,
        };
      }

      if (loanAmount > maxLoanAmount) {
        return {
          eligible: false,
          currentCVS,
          maxLoanAmount,
          availableLiquidity: vault.availableLiquidity,
          interestRate,
          requiredCollateral,
          reason: `Loan amount exceeds max. Max: ${maxLoanAmount}`,
        };
      }

      if (loanAmount > vault.availableLiquidity) {
        return {
          eligible: false,
          currentCVS,
          maxLoanAmount,
          availableLiquidity: vault.availableLiquidity,
          interestRate,
          requiredCollateral,
          reason: `Insufficient liquidity. Available: ${vault.availableLiquidity}`,
        };
      }

      return {
        eligible: true,
        currentCVS,
        maxLoanAmount,
        availableLiquidity: vault.availableLiquidity,
        interestRate,
        requiredCollateral,
      };
    } catch (error) {
      console.error('Error checking loan eligibility:', error);
      throw error;
    }
  }

  /**
   * Issue a loan (requires signer)
   */
  async issueLoan(request: LoanRequest): Promise<LoanResponse> {
    if (!this.signer) {
      throw new Error('Signer not initialized. Provide PRIVATE_KEY in config.');
    }

    // Check eligibility first
    const eligibility = await this.checkLoanEligibility(
      request.vaultAddress,
      request.loanAmount
    );

    if (!eligibility.eligible) {
      throw new Error(`Loan not eligible: ${eligibility.reason}`);
    }

    try {
      // Calculate required collateral
      const collateralAmount = eligibility.requiredCollateral;

      // Issue loan transaction
      const tx = await this.adlvContract.issueLoan!(
        request.vaultAddress,
        request.loanAmount,
        BigInt(request.duration),
        BigInt(request.targetChain || 0), // targetChainId (0 = same chain)
        { value: collateralAmount }
      );

      // Wait for transaction receipt
      const receipt = await tx.wait();

      // Get loan ID from event
      const loanIssuedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = this.adlvContract.interface.parseLog({
            topics: log.topics,
            data: log.data,
          });
          return parsed?.name === 'LoanIssued';
        } catch {
          return false;
        }
      });

      if (!loanIssuedEvent) {
        throw new Error('LoanIssued event not found in transaction receipt');
      }

      const parsed = this.adlvContract.interface.parseLog({
        topics: loanIssuedEvent.topics,
        data: loanIssuedEvent.data,
      });

      const loanId = parsed?.args[2] as bigint; // loanId is the 3rd argument

      // Get loan details
      const loan = await this.adlvContract.getLoan!(loanId);

      return {
        loanId,
        transactionHash: receipt.hash,
        interestRate: eligibility.interestRate,
        collateralAmount,
        endTime: loan.endTime,
      };
    } catch (error) {
      console.error('Error issuing loan:', error);
      throw error;
    }
  }

  /**
   * Repay a loan (requires signer)
   */
  async repayLoan(loanId: bigint, amount?: bigint): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer not initialized. Provide PRIVATE_KEY in config.');
    }

    try {
      // Get loan details
      const loan = await this.adlvContract.getLoan!(loanId);

      // Calculate total due if amount not provided
      let repaymentAmount = amount;
      if (!repaymentAmount) {
        const elapsedTime = BigInt(Math.floor(Date.now() / 1000)) - loan.startTime;
        const interest = await this.adlvContract.calculateInterest!(
          loan.loanAmount,
          loan.interestRate,
          elapsedTime,
          loan.duration
        );

        repaymentAmount = BigInt(loan.loanAmount) + BigInt(interest) - BigInt(loan.repaidAmount);
      }

      // Repay loan
      const tx = await this.adlvContract.repayLoan!(loanId, { value: repaymentAmount });
      const receipt = await tx.wait();

      return receipt?.hash ?? '';
    } catch (error) {
      console.error('Error repaying loan:', error);
      throw error;
    }
  }

  /**
   * Liquidate a defaulted loan (requires signer)
   */
  async liquidateLoan(loanId: bigint): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer not initialized. Provide PRIVATE_KEY in config.');
    }

    try {
      const tx = await this.adlvContract.liquidateLoan!(loanId);
      const receipt = await tx.wait();
      return receipt?.hash ?? '';
    } catch (error) {
      console.error('Error liquidating loan:', error);
      throw error;
    }
  }

  /**
   * Get loan details
   */
  async getLoan(loanId: bigint) {
    return await this.adlvContract.getLoan!(loanId);
  }

  /**
   * Get vault details
   */
  async getVault(vaultAddress: string) {
    return await this.adlvContract.getVault!(vaultAddress);
  }

  /**
   * Get vault address by IP ID
   */
  async getVaultByIpId(ipId: string): Promise<string | null> {
    try {
      // Convert ipId to bytes32 if needed
      let ipIdBytes32: string;
      if (ipId.startsWith('0x') && ipId.length === 66) {
        ipIdBytes32 = ipId;
      } else {
        ipIdBytes32 = keccak256(toUtf8Bytes(ipId));
      }
      
      const vaultAddress = await this.adlvContract.ipToVault!(ipIdBytes32);
      if (vaultAddress === '0x0000000000000000000000000000000000000000') {
        return null;
      }
      return vaultAddress;
    } catch (error) {
      console.error('Error getting vault by IP ID:', error);
      return null;
    }
  }

  /**
   * Create a new vault for an IP asset
   * This function calls ADLV.createVault() on-chain
   */
  async createVault(ipId: string): Promise<{ vaultAddress: string; transactionHash: string }> {
    if (!this.signer) {
      throw new Error('Signer not initialized. Provide PRIVATE_KEY in config.');
    }

    try {
      // Convert ipId to bytes32
      // IP Asset IDs in Story Protocol are addresses (42 chars), need to pad to bytes32
      let ipIdBytes32: string;
      if (ipId.startsWith('0x') && ipId.length === 66) {
        // Already a bytes32 hex string
        ipIdBytes32 = ipId;
      } else if (ipId.startsWith('0x') && ipId.length === 42) {
        // It's an address, pad it to bytes32 (left-pad)
        ipIdBytes32 = '0x' + ipId.slice(2).padStart(64, '0');
      } else {
        // Invalid format
        throw new Error('Invalid ipId format. Must be an address (0x... 42 chars) or bytes32 (0x... 66 chars)');
      }

      // Call createVault on ADLV contract
      // createVault(bytes32 ipId) - takes only ONE parameter
      const tx = await this.adlvContract.createVault!(ipIdBytes32);
      
      // Wait for transaction receipt
      const receipt = await tx.wait();

      // Get vault address from event
      const vaultCreatedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = this.adlvContract.interface.parseLog({
            topics: log.topics,
            data: log.data,
          });
          return parsed?.name === 'VaultCreated';
        } catch {
          return false;
        }
      });

      if (!vaultCreatedEvent) {
        throw new Error('VaultCreated event not found in transaction receipt');
      }

      const parsed = this.adlvContract.interface.parseLog({
        topics: vaultCreatedEvent.topics,
        data: vaultCreatedEvent.data,
      });

      const vaultAddress = parsed?.args[0] as string; // vaultAddress is the first argument

      return {
        vaultAddress,
        transactionHash: receipt.hash,
      };
    } catch (error) {
      console.error('Error creating vault:', error);
      throw error;
    }
  }
}
