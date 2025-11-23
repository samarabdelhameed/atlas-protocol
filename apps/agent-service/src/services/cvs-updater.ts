/**
 * CVS Updater Service
 * 
 * Updates CVS on-chain using the IDO contract's updateCVS function
 */

import { ethers } from 'ethers';
import { config } from '../config/index.js';
import { cvsCalculator, type CVSCalculationResult } from './cvs-calculator.js';

export interface CVSUpdateResult {
  success: boolean;
  ipAssetId: string;
  oldCVS: bigint;
  newCVS: bigint;
  transactionHash?: string;
  error?: string;
}

export class CVSUpdater {
  private provider: ethers.Provider;
  private signer: ethers.Signer | null = null;
  private idoContract: ethers.Contract | null = null;
  private adlvContract: ethers.Contract | null = null;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    
    // Initialize signer if private key is available
    if (config.privateKey) {
      this.signer = new ethers.Wallet(config.privateKey, this.provider);
    }
    
    // Initialize contracts if addresses are available
    if (config.contracts.ido && config.contracts.ido !== '') {
      const idoAbi = [
        'function updateCVS(bytes32 ipId, uint256 newCVS) external',
        'function getCVS(bytes32 ipId) external view returns (uint256)',
        'function owner() external view returns (address)',
      ];
      
      this.idoContract = new ethers.Contract(
        config.contracts.ido,
        idoAbi,
        this.signer || this.provider
      );
    }
    
    if (config.contracts.adlv && config.contracts.adlv !== '') {
      const adlvAbi = [
        'function updateCVS(bytes32 ipId, uint256 newCVS) external',
      ];
      
      this.adlvContract = new ethers.Contract(
        config.contracts.adlv,
        adlvAbi,
        this.signer || this.provider
      );
    }
  }

  /**
   * Update CVS for an IP Asset on-chain
   */
  async updateCVSOnChain(ipAssetId: string): Promise<CVSUpdateResult> {
    try {
      console.log(`\n🔄 Updating CVS on-chain for IP Asset: ${ipAssetId}`);
      
      if (!this.signer) {
        throw new Error('Signer not initialized. Set PRIVATE_KEY in .env');
      }
      
      if (!this.idoContract && !this.adlvContract) {
        throw new Error('IDO or ADLV contract not initialized. Set IDO_ADDRESS or ADLV_ADDRESS in .env');
      }
      
      // Step 1: Calculate CVS
      const calculation = await cvsCalculator.calculateCVS(ipAssetId);
      
      // Step 2: Get current CVS from contract
      let oldCVS = BigInt(0);
      try {
        if (this.idoContract) {
          const ipIdBytes32 = ethers.zeroPadValue(ipAssetId, 32);
          oldCVS = await this.idoContract.getCVS(ipIdBytes32);
        }
      } catch (error) {
        console.warn('⚠️  Could not fetch current CVS from contract:', error);
      }
      
      // Step 3: Update CVS on-chain
      // Use ADLV if available (it's the owner of IDO), otherwise use IDO directly
      const contract = this.adlvContract || this.idoContract!;
      const ipIdBytes32 = ethers.zeroPadValue(ipAssetId, 32);
      
      console.log(`📤 Sending transaction to update CVS...`);
      console.log(`   IP ID: ${ipAssetId}`);
      console.log(`   Old CVS: ${oldCVS.toString()}`);
      console.log(`   New CVS: ${calculation.calculatedCVS.toString()}`);
      
      const tx = await contract.updateCVS(ipIdBytes32, calculation.calculatedCVS);
      console.log(`⏳ Transaction sent: ${tx.hash}`);
      console.log(`   Waiting for confirmation...`);
      
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error('Transaction receipt not received');
      }
      
      console.log(`\n✅ CVS Updated Successfully!`);
      console.log(`   Transaction Hash: ${receipt.hash}`);
      console.log(`   Block Number: ${receipt.blockNumber}`);
      console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
      
      return {
        success: true,
        ipAssetId,
        oldCVS,
        newCVS: calculation.calculatedCVS,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      console.error(`❌ Error updating CVS on-chain:`, error.message);
      
      return {
        success: false,
        ipAssetId,
        oldCVS: BigInt(0),
        newCVS: BigInt(0),
        error: error.message,
      };
    }
  }

  /**
   * Update CVS with custom value
   */
  async updateCVSWithValue(
    ipAssetId: string,
    newCVS: bigint
  ): Promise<CVSUpdateResult> {
    try {
      if (!this.signer) {
        throw new Error('Signer not initialized. Set PRIVATE_KEY in .env');
      }
      
      if (!this.idoContract && !this.adlvContract) {
        throw new Error('IDO or ADLV contract not initialized');
      }
      
      const contract = this.adlvContract || this.idoContract!;
      const ipIdBytes32 = ethers.zeroPadValue(ipAssetId, 32);
      
      // Get current CVS
      let oldCVS = BigInt(0);
      try {
        if (this.idoContract) {
          oldCVS = await this.idoContract.getCVS(ipIdBytes32);
        }
      } catch (error) {
        // Ignore
      }
      
      const tx = await contract.updateCVS(ipIdBytes32, newCVS);
      const receipt = await tx.wait();
      
      return {
        success: true,
        ipAssetId,
        oldCVS,
        newCVS,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      return {
        success: false,
        ipAssetId,
        oldCVS: BigInt(0),
        newCVS,
        error: error.message,
      };
    }
  }
}

// Export singleton instance
export const cvsUpdater = new CVSUpdater();

