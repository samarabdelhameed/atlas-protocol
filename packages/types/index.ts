/**
 * Shared TypeScript types for Atlas Protocol
 * Used across frontend, backend, and agent services
 */

// ========================================
// IP Asset & Licensing Types
// ========================================

export interface IPAssetMetadata {
  id: string;
  name: string;
  description: string;
  creator: string;
  ipHash: string;
  licensingTerms: LicensingTerms;
  timestamp: number;
}

export interface LicensingTerms {
  commercial: boolean;
  derivatives: boolean;
  royaltyPercent: number;
  mintingFee: bigint;
}

// ========================================
// CVS (Cross-chain Value System) Types
// ========================================

export interface CVSData {
  chainId: number;
  tokenAddress: string;
  amount: bigint;
  timestamp: number;
  dataHash: string;
}

export interface BridgeRequest {
  from: {
    chainId: number;
    tokenAddress: string;
    amount: bigint;
  };
  to: {
    chainId: number;
    tokenAddress: string;
  };
  recipient: string;
}

// ========================================
// ADLV (Adaptive Dynamic Liquidity Vault) Types
// ========================================

export interface LoanRequest {
  borrower: string;
  collateralAmount: bigint;
  requestedAmount: bigint;
  duration: number;
  interestRate: number;
  status: LoanStatus;
}

export enum LoanStatus {
  Pending = "pending",
  Approved = "approved",
  Active = "active",
  Repaid = "repaid",
  Defaulted = "defaulted",
}

export interface VaultStats {
  totalLiquidity: bigint;
  totalLoans: bigint;
  utilizationRate: number;
  averageAPY: number;
}

// ========================================
// IDO Types
// ========================================

export interface IDOPool {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  totalSupply: bigint;
  price: bigint;
  startTime: number;
  endTime: number;
  minContribution: bigint;
  maxContribution: bigint;
  raised: bigint;
  participants: number;
}

export interface IDOParticipation {
  poolId: string;
  participant: string;
  amount: bigint;
  timestamp: number;
  claimed: boolean;
}

// ========================================
// World ID Types
// ========================================

export interface WorldIDVerification {
  nullifierHash: string;
  merkleRoot: string;
  proof: string;
  verificationLevel: "orb" | "phone";
  verified: boolean;
}

// ========================================
// Agent Service Types
// ========================================

export interface AgentTask {
  id: string;
  type: "licensing" | "bridging" | "loan" | "ido";
  status: "pending" | "processing" | "completed" | "failed";
  data: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}