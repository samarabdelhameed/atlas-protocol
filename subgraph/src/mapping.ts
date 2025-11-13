import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  IPAsset,
  License,
  IPUsageEvent,
  LiquidityVault,
  Loan,
  Deposit,
  IDOPool,
  IDOParticipation,
  BridgeTransaction,
  WorldIDVerification,
  GlobalStats,
} from "../generated/schema";

// ========================================
// IP Asset Event Handlers
// ========================================

export function handleIPAssetRegistered(event: any): void {
  let asset = new IPAsset(event.params.ipHash);
  asset.name = event.params.name;
  asset.description = event.params.description;
  asset.creator = event.params.creator;
  asset.ipHash = event.params.ipHash;
  asset.timestamp = event.block.timestamp;
  asset.blockNumber = event.block.number;
  
  // Set default licensing terms (update based on actual event params)
  asset.commercialUse = false;
  asset.derivatives = false;
  asset.royaltyPercent = BigInt.fromI32(0);
  asset.mintingFee = BigInt.fromI32(0);
  
  asset.save();
  
  updateGlobalStats("ipAsset");
}

export function handleLicenseGranted(event: any): void {
  let licenseId = event.params.ipHash.toHex() + "-" + event.params.licensee.toHex();
  let license = new License(licenseId);
  
  license.ipAsset = event.params.ipHash.toHex();
  license.licensee = event.params.licensee;
  license.isActive = true;
  license.timestamp = event.block.timestamp;
  license.fee = event.params.fee;
  
  license.save();
  
  updateGlobalStats("license");
}

export function handleIPUsed(event: any): void {
  let usageId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let usage = new IPUsageEvent(usageId);
  
  usage.ipAsset = event.params.ipHash.toHex();
  usage.user = event.params.user;
  usage.usageType = event.params.usageType;
  usage.timestamp = event.block.timestamp;
  usage.blockNumber = event.block.number;
  
  usage.save();
}

// ========================================
// ADLV Event Handlers
// ========================================

export function handleDeposited(event: any): void {
  let vaultId = event.address.toHex();
  let vault = LiquidityVault.load(vaultId);
  
  if (!vault) {
    vault = new LiquidityVault(vaultId);
    vault.totalLiquidity = BigInt.fromI32(0);
    vault.totalLoans = BigInt.fromI32(0);
    vault.activeLoans = BigInt.fromI32(0);
    vault.utilizationRate = BigInt.fromI32(0).toBigDecimal();
    vault.averageAPY = BigInt.fromI32(0).toBigDecimal();
  }
  
  vault.totalLiquidity = vault.totalLiquidity.plus(event.params.amount);
  vault.save();
  
  // Create deposit record
  let depositId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let deposit = new Deposit(depositId);
  deposit.vault = vaultId;
  deposit.depositor = event.params.depositor;
  deposit.amount = event.params.amount;
  deposit.timestamp = event.block.timestamp;
  deposit.blockNumber = event.block.number;
  deposit.save();
}

export function handleLoanRequested(event: any): void {
  let loanId = event.params.borrower.toHex() + "-" + event.block.timestamp.toString();
  let loan = new Loan(loanId);
  
  loan.vault = event.address.toHex();
  loan.borrower = event.params.borrower;
  loan.collateralAmount = event.params.collateralAmount;
  loan.loanAmount = event.params.loanAmount;
  loan.interestRate = event.params.interestRate;
  loan.duration = event.params.duration;
  loan.startTime = event.block.timestamp;
  loan.endTime = event.block.timestamp.plus(event.params.duration);
  loan.status = "Active";
  loan.repaidAmount = BigInt.fromI32(0);
  loan.timestamp = event.block.timestamp;
  
  loan.save();
  
  // Update vault stats
  let vault = LiquidityVault.load(event.address.toHex());
  if (vault) {
    vault.totalLoans = vault.totalLoans.plus(BigInt.fromI32(1));
    vault.activeLoans = vault.activeLoans.plus(BigInt.fromI32(1));
    vault.save();
  }
  
  updateGlobalStats("loan");
}

export function handleLoanRepaid(event: any): void {
  let loanId = event.params.borrower.toHex() + "-" + event.params.loanId.toString();
  let loan = Loan.load(loanId);
  
  if (loan) {
    loan.status = "Repaid";
    loan.repaidAmount = event.params.amount;
    loan.save();
    
    // Update vault stats
    let vault = LiquidityVault.load(event.address.toHex());
    if (vault) {
      vault.activeLoans = vault.activeLoans.minus(BigInt.fromI32(1));
      vault.save();
    }
  }
}

export function handleLoanDefaulted(event: any): void {
  let loanId = event.params.borrower.toHex() + "-" + event.params.loanId.toString();
  let loan = Loan.load(loanId);
  
  if (loan) {
    loan.status = "Defaulted";
    loan.save();
    
    // Update vault stats
    let vault = LiquidityVault.load(event.address.toHex());
    if (vault) {
      vault.activeLoans = vault.activeLoans.minus(BigInt.fromI32(1));
      vault.save();
    }
  }
}

// ========================================
// IDO Event Handlers
// ========================================

export function handlePoolCreated(event: any): void {
  let pool = new IDOPool(event.params.poolId.toHex());
  
  pool.tokenAddress = event.params.tokenAddress;
  pool.tokenSymbol = event.params.tokenSymbol;
  pool.totalSupply = event.params.totalSupply;
  pool.price = event.params.price;
  pool.startTime = event.params.startTime;
  pool.endTime = event.params.endTime;
  pool.minContribution = BigInt.fromI32(0);
  pool.maxContribution = BigInt.fromI32(0);
  pool.raised = BigInt.fromI32(0);
  pool.participantCount = BigInt.fromI32(0);
  pool.isActive = true;
  
  pool.save();
  
  updateGlobalStats("idoPool");
}

export function handleParticipated(event: any): void {
  let participationId = event.params.poolId.toHex() + "-" + event.params.participant.toHex();
  let participation = new IDOParticipation(participationId);
  
  participation.pool = event.params.poolId.toHex();
  participation.participant = event.params.participant;
  participation.amount = event.params.amount;
  participation.timestamp = event.block.timestamp;
  participation.claimed = false;
  
  participation.save();
  
  // Update pool stats
  let pool = IDOPool.load(event.params.poolId.toHex());
  if (pool) {
    pool.raised = pool.raised.plus(event.params.amount);
    pool.participantCount = pool.participantCount.plus(BigInt.fromI32(1));
    pool.save();
  }
}

export function handleTokensClaimed(event: any): void {
  let participationId = event.params.poolId.toHex() + "-" + event.params.participant.toHex();
  let participation = IDOParticipation.load(participationId);
  
  if (participation) {
    participation.claimed = true;
    participation.save();
  }
}

// ========================================
// Bridge Event Handlers
// ========================================

export function handleBridgeInitiated(event: any): void {
  let transaction = new BridgeTransaction(event.params.bridgeId.toHex());
  
  transaction.fromChainId = event.params.fromChainId;
  transaction.toChainId = event.params.toChainId;
  transaction.sender = event.params.sender;
  transaction.recipient = event.params.recipient;
  transaction.tokenAddress = event.params.tokenAddress;
  transaction.amount = event.params.amount;
  transaction.status = "Initiated";
  transaction.timestamp = event.block.timestamp;
  
  transaction.save();
  
  updateGlobalStats("bridge");
}

export function handleBridgeCompleted(event: any): void {
  let transaction = BridgeTransaction.load(event.params.bridgeId.toHex());
  
  if (transaction) {
    transaction.status = "Completed";
    transaction.completedAt = event.block.timestamp;
    transaction.save();
  }
}

// ========================================
// World ID Event Handlers
// ========================================

export function handleVerified(event: any): void {
  let verificationId = event.params.user.toHex();
  let verification = new WorldIDVerification(verificationId);
  
  verification.user = event.params.user;
  verification.nullifierHash = event.params.nullifierHash;
  verification.verified = true;
  verification.verificationLevel = event.params.verificationLevel;
  verification.timestamp = event.block.timestamp;
  
  verification.save();
  
  updateGlobalStats("verification");
}

// ========================================
// Helper Functions
// ========================================

function updateGlobalStats(type: string): void {
  let stats = GlobalStats.load("global");
  
  if (!stats) {
    stats = new GlobalStats("global");
    stats.totalIPAssets = BigInt.fromI32(0);
    stats.totalLicenses = BigInt.fromI32(0);
    stats.totalLoans = BigInt.fromI32(0);
    stats.totalIDOPools = BigInt.fromI32(0);
    stats.totalBridgeTransactions = BigInt.fromI32(0);
    stats.totalVerifiedUsers = BigInt.fromI32(0);
  }
  
  if (type == "ipAsset") {
    stats.totalIPAssets = stats.totalIPAssets.plus(BigInt.fromI32(1));
  } else if (type == "license") {
    stats.totalLicenses = stats.totalLicenses.plus(BigInt.fromI32(1));
  } else if (type == "loan") {
    stats.totalLoans = stats.totalLoans.plus(BigInt.fromI32(1));
  } else if (type == "idoPool") {
    stats.totalIDOPools = stats.totalIDOPools.plus(BigInt.fromI32(1));
  } else if (type == "bridge") {
    stats.totalBridgeTransactions = stats.totalBridgeTransactions.plus(BigInt.fromI32(1));
  } else if (type == "verification") {
    stats.totalVerifiedUsers = stats.totalVerifiedUsers.plus(BigInt.fromI32(1));
  }
  
  stats.lastUpdated = BigInt.fromI32(0); // Update with actual timestamp
  stats.save();
}

