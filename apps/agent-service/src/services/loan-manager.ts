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
  public startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('⚠️  Loan monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log('🔍 Starting loan event monitoring...');

    // Listen for LoanIssued events
    this.adlvContract.on('LoanIssued', this.handleLoanIssuedEvent.bind(this));

    // Also listen for other important events
    this.adlvContract.on('LoanRepaid', this.handleLoanRepaidEvent.bind(this));
    this.adlvContract.on('LoanLiquidated', this.handleLoanLiquidatedEvent.bind(this));

    console.log('✅ Loan event monitoring active');
  }

  /**
   * Stop monitoring events
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    this.adlvContract.removeAllListeners('LoanIssued');
    this.adlvContract.removeAllListeners('LoanRepaid');
    this.adlvContract.removeAllListeners('LoanLiquidated');
    console.log('🛑 Loan monitoring stopped');
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
    
    console.log('\n🚨 LoanIssued Event Detected!');
    console.log('═══════════════════════════════════════════');
    console.log(`   Loan ID: ${loanId.toString()}`);
    console.log(`   Vault: ${vaultAddress}`);
    console.log(`   Borrower: ${borrower}`);
    console.log(`   Amount: ${amountEth} tokens`);
    console.log(`   Collateral: ${Number(collateral) / 1e18} tokens`);
    console.log(`   Interest Rate: ${Number(interestRate) / 100}%`);
    console.log(`   Duration: ${Number(duration)} seconds`);
    console.log(`   Target Chain: ${targetChainId.toString()} ${targetChainId === 0n ? '(Same Chain - No Bridge)' : ''}`);
    console.log('═══════════════════════════════════════════\n');

    try {
      // Skip cross-chain transfer if targetChainId is 0 (same chain)
      if (targetChainId === 0n) {
        console.log('✅ Loan issued on same chain. No bridging required.');
        return;
      }
      
      // Get vault details
      const vault = await this.adlvContract.getVault(vaultAddress);
      
      // Use targetChainId from event
      const destChainId = Number(targetChainId);
      
      // Get token address (USDC on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
      // You can make this configurable per vault
      const tokenAddress = process.env.LOAN_TOKEN_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

      // Execute cross-chain transfer via Owlto Finance
      await this.executeCrossChainTransfer({
        recipient: borrower,
        targetChainId: destChainId,
        tokenAddress: tokenAddress,
        amount: amount.toString(),
        loanId: loanId,
      });

      console.log(`✅ Cross-chain transfer for Loan ${loanId.toString()} successfully initiated via Owlto Finance`);
    } catch (error) {
      console.error(`❌ ERROR processing Loan ${loanId.toString()}:`, error);
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
   * Execute cross-chain transfer using Owlto Finance API
   * This is the core IPFi functionality
   */
  private async executeCrossChainTransfer(params: CrossChainTransferParams): Promise<any> {
    if (!config.owlto.apiKey) {
      console.warn('⚠️  Owlto API key not configured. Skipping cross-chain transfer.');
      return null;
    }

    try {
      // Get current chain ID from provider
      const network = await this.provider.getNetwork();
      const fromChainId = Number(network.chainId);

      console.log(`🌉 Initiating cross-chain transfer via Owlto Finance...`);
      console.log(`   From Chain: ${fromChainId}`);
      console.log(`   To Chain: ${params.targetChainId}`);
      console.log(`   Recipient: ${params.recipient}`);
      console.log(`   Amount: ${params.amount}`);

      const response = await fetch(OWLTO_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.owlto.apiKey}`,
        },
        body: JSON.stringify({
          fromChainId: fromChainId,
          toChainId: params.targetChainId,
          recipient: params.recipient,
          tokenAddress: params.tokenAddress,
          amount: params.amount,
          // Additional Owlto-specific parameters
          slippage: process.env.OWLTO_SLIPPAGE || '0.5', // 0.5% slippage
          referralCode: process.env.OWLTO_REFERRAL_CODE || '',
          // Metadata for tracking
          metadata: {
            loanId: params.loanId.toString(),
            source: 'atlas-protocol',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Owlto API failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      console.log(`✅ Owlto bridge transaction created:`);
      console.log(`   Bridge ID: ${result.bridgeId || result.id}`);
      console.log(`   Transaction Hash: ${result.txHash || 'Pending'}`);
      console.log(`   Status: ${result.status || 'Processing'}`);

      return result;
    } catch (error) {
      console.error('❌ Owlto API Error:', error);
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
      const vault = await this.adlvContract.getVault(vaultAddress);
      const ipId = vault.ipId;

      // Get current CVS from IDO
      const currentCVS = await this.idoContract.getCVS(ipId);

      // Calculate max loan amount (50% of CVS)
      const maxLoanAmount = await this.adlvContract.calculateMaxLoanAmount(vaultAddress);

      // Calculate interest rate
      const interestRate = await this.adlvContract.calculateInterestRate(currentCVS);

      // Calculate required collateral (150% of loan amount)
      const defaultCollateralRatio = await this.adlvContract.defaultCollateralRatio();
      const requiredCollateral = (loanAmount * defaultCollateralRatio) / BigInt(10000);

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
      const tx = await this.adlvContract.issueLoan(
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
      const loan = await this.adlvContract.getLoan(loanId);

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
      const loan = await this.adlvContract.getLoan(loanId);

      // Calculate total due if amount not provided
      let repaymentAmount = amount;
      if (!repaymentAmount) {
        const elapsedTime = BigInt(Math.floor(Date.now() / 1000)) - loan.startTime;
        const interest = await this.adlvContract.calculateInterest(
          loan.loanAmount,
          loan.interestRate,
          elapsedTime,
          loan.duration
        );

        repaymentAmount = loan.loanAmount + interest - loan.repaidAmount;
      }

      // Repay loan
      const tx = await this.adlvContract.repayLoan(loanId, { value: repaymentAmount });
      const receipt = await tx.wait();

      return receipt.hash;
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
      const tx = await this.adlvContract.liquidateLoan(loanId);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Error liquidating loan:', error);
      throw error;
    }
  }

  /**
   * Get loan details
   */
  async getLoan(loanId: bigint) {
    return await this.adlvContract.getLoan(loanId);
  }

  /**
   * Get vault details
   */
  async getVault(vaultAddress: string) {
    return await this.adlvContract.getVault(vaultAddress);
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
      
      const vaultAddress = await this.adlvContract.ipToVault(ipIdBytes32);
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
      // Convert ipId string to bytes32 using keccak256 (same as in tests)
      // If ipId is already a hex string (0x...), use it directly, otherwise hash it
      let ipIdBytes32: string;
      if (ipId.startsWith('0x') && ipId.length === 66) {
        // Already a bytes32 hex string
        ipIdBytes32 = ipId;
      } else {
        // Hash the string to bytes32
        ipIdBytes32 = keccak256(toUtf8Bytes(ipId));
      }

      // Call createVault on ADLV contract
      // createVault(bytes32 ipId, string storyIPId)
      const tx = await this.adlvContract.createVault(ipIdBytes32, ipId);
      
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
