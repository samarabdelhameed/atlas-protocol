import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  IPAsset,
  IPAssetUsage,
  IDOVault,
  DataLicenseSale,
  Loan,
  Deposit,
  LoanPayment,
  GlobalStats,
} from "../generated/schema";

// ========================================
// CORE HANDLER 1: IP Registration (Story Protocol)
// ========================================

export function handleIPRegistered(event: any): void {
  let asset = new IPAsset(event.params.ipId.toHex());
  
  asset.ipId = event.params.ipId;
  asset.name = event.params.name;
  asset.description = event.params.description;
  asset.creator = event.params.creator;
  asset.ipHash = event.params.ipHash;
  asset.timestamp = event.block.timestamp;
  asset.blockNumber = event.block.number;
  
  // Initialize licensing terms
  asset.commercialUse = false;
  asset.derivatives = false;
  asset.royaltyPercent = BigInt.fromI32(0);
  asset.mintingFee = BigInt.fromI32(0);
  
  // Initialize CVS metrics
  asset.totalUsageCount = BigInt.fromI32(0);
  asset.totalLicenseRevenue = BigInt.fromI32(0);
  asset.totalRemixes = BigInt.fromI32(0);
  asset.cvsScore = BigInt.fromI32(0);
  
  asset.save();
  
  updateGlobalStats("ipAsset");
}

// ========================================
// IP Usage Tracking (for CVS calculation)
// ========================================

export function handleIPUsed(event: any): void {
  let usageId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let usage = new IPAssetUsage(usageId);
  
  usage.ipAsset = event.params.ipId.toHex();
  usage.user = event.params.user;
  usage.usageType = event.params.usageType;
  usage.timestamp = event.block.timestamp;
  usage.blockNumber = event.block.number;
  usage.transactionHash = event.transaction.hash;
  usage.revenueGenerated = event.params.revenue;
  usage.cvsImpact = calculateCVSImpact(event.params.usageType, event.params.revenue);
  
  usage.save();
  
  // Update IP Asset metrics
  let asset = IPAsset.load(event.params.ipId.toHex());
  if (asset) {
    asset.totalUsageCount = asset.totalUsageCount.plus(BigInt.fromI32(1));
    asset.totalLicenseRevenue = asset.totalLicenseRevenue.plus(event.params.revenue);
    asset.cvsScore = asset.cvsScore.plus(usage.cvsImpact);
    asset.save();
  }
}

export function handleIPRemixed(event: any): void {
  let usageId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let usage = new IPAssetUsage(usageId);
  
  usage.ipAsset = event.params.originalIPId.toHex();
  usage.user = event.params.remixer;
  usage.usageType = "remix";
  usage.timestamp = event.block.timestamp;
  usage.blockNumber = event.block.number;
  usage.transactionHash = event.transaction.hash;
  usage.revenueGenerated = BigInt.fromI32(0);
  usage.cvsImpact = BigInt.fromI32(100); // Base CVS increment for remix
  
  usage.save();
  
  // Update IP Asset remix count
  let asset = IPAsset.load(event.params.originalIPId.toHex());
  if (asset) {
    asset.totalRemixes = asset.totalRemixes.plus(BigInt.fromI32(1));
    asset.totalUsageCount = asset.totalUsageCount.plus(BigInt.fromI32(1));
    asset.cvsScore = asset.cvsScore.plus(usage.cvsImpact);
    asset.save();
  }
}

// ========================================
// Vault Management
// ========================================

export function handleVaultCreated(event: any): void {
  let vault = new IDOVault(event.params.vaultAddress.toHex());
  
  vault.vaultAddress = event.params.vaultAddress;
  vault.creator = event.params.creator;
  vault.ipAsset = event.params.ipId.toHex();
  
  // Initialize CVS
  vault.currentCVS = event.params.initialCVS;
  vault.initialCVS = event.params.initialCVS;
  vault.lastCVSUpdate = event.block.timestamp;
  
  // Initialize vault metrics
  vault.totalLiquidity = BigInt.fromI32(0);
  vault.availableLiquidity = BigInt.fromI32(0);
  vault.totalLoansIssued = BigInt.fromI32(0);
  vault.activeLoansCount = BigInt.fromI32(0);
  
  // Calculate initial loan terms based on CVS
  vault.maxLoanAmount = calculateMaxLoanAmount(event.params.initialCVS);
  vault.interestRate = calculateInterestRate(event.params.initialCVS);
  vault.collateralRatio = BigInt.fromI32(150); // 150% default
  
  vault.totalLicenseRevenue = BigInt.fromI32(0);
  vault.totalLoanRepayments = BigInt.fromI32(0);
  vault.utilizationRate = BigInt.fromI32(0).toBigDecimal();
  
  vault.createdAt = event.block.timestamp;
  vault.updatedAt = event.block.timestamp;
  
  vault.save();
}

// ========================================
// CORE HANDLER 2: License Sale (CVS Calculation)
// ========================================

export function handleLicenseSale(event: any): void {
  let saleId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let sale = new DataLicenseSale(saleId);
  
  sale.vault = event.params.vaultAddress.toHex();
  sale.ipAsset = event.params.ipId.toHex();
  sale.licensee = event.params.licensee;
  
  // Sale details
  sale.salePrice = event.params.price;
  sale.licenseType = event.params.licenseType;
  sale.duration = BigInt.fromI32(365 * 24 * 60 * 60); // 1 year default
  
  // Calculate revenue distribution
  let creatorShare = event.params.price.times(BigInt.fromI32(70)).div(BigInt.fromI32(100)); // 70%
  let vaultShare = event.params.price.times(BigInt.fromI32(25)).div(BigInt.fromI32(100)); // 25%
  let protocolFee = event.params.price.times(BigInt.fromI32(5)).div(BigInt.fromI32(100)); // 5%
  
  sale.creatorShare = creatorShare;
  sale.vaultShare = vaultShare;
  sale.protocolFee = protocolFee;
  
  // Calculate CVS impact based on license type and price
  sale.cvsIncrement = calculateCVSIncrementFromLicense(
    event.params.licenseType,
    event.params.price
  );
  
  sale.isActive = true;
  sale.expiresAt = event.block.timestamp.plus(sale.duration);
  sale.timestamp = event.block.timestamp;
  sale.blockNumber = event.block.number;
  sale.transactionHash = event.transaction.hash;
  
  sale.save();
  
  // Update vault metrics
  let vault = IDOVault.load(event.params.vaultAddress.toHex());
  if (vault) {
    vault.totalLicenseRevenue = vault.totalLicenseRevenue.plus(vaultShare);
    vault.currentCVS = vault.currentCVS.plus(sale.cvsIncrement);
    vault.lastCVSUpdate = event.block.timestamp;
    vault.updatedAt = event.block.timestamp;
    
    // Recalculate loan terms based on new CVS
    vault.maxLoanAmount = calculateMaxLoanAmount(vault.currentCVS);
    vault.interestRate = calculateInterestRate(vault.currentCVS);
    
    vault.save();
  }
  
  // Update IP Asset
  let asset = IPAsset.load(event.params.ipId.toHex());
  if (asset) {
    asset.totalLicenseRevenue = asset.totalLicenseRevenue.plus(event.params.price);
    asset.cvsScore = asset.cvsScore.plus(sale.cvsIncrement);
    asset.save();
  }
  
  updateGlobalStats("license");
}

// ========================================
// CORE HANDLER 3: Loan Issuance (Based on CVS)
// ========================================

export function handleLoanIssued(event: any): void {
  let loanId = event.params.vaultAddress.toHex() + "-" + event.params.loanId.toString();
  let loan = new Loan(loanId);
  
  loan.loanId = event.params.loanId;
  loan.vault = event.params.vaultAddress.toHex();
  loan.borrower = event.params.borrower;
  
  // Loan terms
  loan.loanAmount = event.params.amount;
  loan.collateralAmount = event.params.collateral;
  loan.interestRate = event.params.interestRate;
  loan.duration = event.params.duration;
  
  // CVS metrics at loan issuance
  let vault = IDOVault.load(event.params.vaultAddress.toHex());
  if (vault) {
    loan.cvsAtIssuance = vault.currentCVS;
    loan.requiredCVS = calculateRequiredCVS(event.params.amount);
  } else {
    loan.cvsAtIssuance = BigInt.fromI32(0);
    loan.requiredCVS = BigInt.fromI32(0);
  }
  
  // Loan status
  loan.status = "Active";
  loan.repaidAmount = BigInt.fromI32(0);
  loan.outstandingAmount = event.params.amount;
  
  // Timestamps
  loan.startTime = event.block.timestamp;
  loan.endTime = event.block.timestamp.plus(event.params.duration);
  loan.issuedAt = event.block.timestamp;
  
  loan.save();
  
  // Update vault metrics
  if (vault) {
    vault.totalLoansIssued = vault.totalLoansIssued.plus(event.params.amount);
    vault.activeLoansCount = vault.activeLoansCount.plus(BigInt.fromI32(1));
    vault.availableLiquidity = vault.availableLiquidity.minus(event.params.amount);
    vault.updatedAt = event.block.timestamp;
    
    // Update utilization rate
    if (vault.totalLiquidity.gt(BigInt.fromI32(0))) {
      let utilization = vault.totalLoansIssued
        .times(BigInt.fromI32(10000))
        .div(vault.totalLiquidity);
      vault.utilizationRate = utilization.toBigDecimal().div(BigInt.fromI32(100).toBigDecimal());
    }
    
    vault.save();
  }
  
  updateGlobalStats("loan");
}

// ========================================
// CVS Update Handler
// ========================================

export function handleCVSUpdated(event: any): void {
  let vault = IDOVault.load(event.params.vaultAddress.toHex());
  
  if (vault) {
    vault.currentCVS = event.params.newCVS;
    vault.lastCVSUpdate = event.block.timestamp;
    vault.updatedAt = event.block.timestamp;
    
    // Recalculate loan terms
    vault.maxLoanAmount = calculateMaxLoanAmount(event.params.newCVS);
    vault.interestRate = calculateInterestRate(event.params.newCVS);
    
    vault.save();
  }
}

// ========================================
// Loan Management Handlers
// ========================================

export function handleLoanRepaid(event: any): void {
  let loanId = event.params.vaultAddress.toHex() + "-" + event.params.loanId.toString();
  let loan = Loan.load(loanId);
  
  if (loan) {
    loan.repaidAmount = loan.repaidAmount.plus(event.params.amount);
    loan.outstandingAmount = loan.outstandingAmount.minus(event.params.amount);
    loan.lastPaymentAt = event.block.timestamp;
    
    // Check if fully repaid
    if (loan.outstandingAmount.le(BigInt.fromI32(0))) {
      loan.status = "Repaid";
    }
    
    loan.save();
    
    // Create payment record
    let paymentId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
    let payment = new LoanPayment(paymentId);
    payment.loan = loanId;
    payment.payer = event.params.borrower;
    payment.amount = event.params.amount;
    payment.isPrincipal = event.params.amount.gt(BigInt.fromI32(0));
    payment.timestamp = event.block.timestamp;
    payment.blockNumber = event.block.number;
    payment.save();
    
    // Update vault
    let vault = IDOVault.load(event.params.vaultAddress.toHex());
    if (vault) {
      vault.totalLoanRepayments = vault.totalLoanRepayments.plus(event.params.amount);
      vault.availableLiquidity = vault.availableLiquidity.plus(event.params.amount);
      
      if (loan.status == "Repaid") {
        vault.activeLoansCount = vault.activeLoansCount.minus(BigInt.fromI32(1));
      }
      
      vault.updatedAt = event.block.timestamp;
      vault.save();
    }
  }
}

export function handleLoanDefaulted(event: any): void {
  let loanId = event.params.vaultAddress.toHex() + "-" + event.params.loanId.toString();
  let loan = Loan.load(loanId);
  
  if (loan) {
    loan.status = "Defaulted";
    loan.save();
    
    // Update vault
    let vault = IDOVault.load(event.params.vaultAddress.toHex());
    if (vault) {
      vault.activeLoansCount = vault.activeLoansCount.minus(BigInt.fromI32(1));
      vault.updatedAt = event.block.timestamp;
      vault.save();
    }
  }
}

// ========================================
// Vault Deposit/Withdrawal Handlers
// ========================================

export function handleDeposited(event: any): void {
  let depositId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let deposit = new Deposit(depositId);
  
  deposit.vault = event.params.vaultAddress.toHex();
  deposit.depositor = event.params.depositor;
  deposit.amount = event.params.amount;
  deposit.shares = event.params.shares;
  deposit.timestamp = event.block.timestamp;
  deposit.blockNumber = event.block.number;
  
  deposit.save();
  
  // Update vault liquidity
  let vault = IDOVault.load(event.params.vaultAddress.toHex());
  if (vault) {
    vault.totalLiquidity = vault.totalLiquidity.plus(event.params.amount);
    vault.availableLiquidity = vault.availableLiquidity.plus(event.params.amount);
    vault.updatedAt = event.block.timestamp;
    vault.save();
  }
}

export function handleWithdrawn(event: any): void {
  let vault = IDOVault.load(event.params.vaultAddress.toHex());
  
  if (vault) {
    vault.totalLiquidity = vault.totalLiquidity.minus(event.params.amount);
    vault.availableLiquidity = vault.availableLiquidity.minus(event.params.amount);
    vault.updatedAt = event.block.timestamp;
    vault.save();
  }
}

// ========================================
// Helper Functions for CVS Calculation
// ========================================

function calculateCVSImpact(usageType: string, revenue: BigInt): BigInt {
  // Different usage types have different CVS impacts
  if (usageType == "commercial") {
    return revenue.div(BigInt.fromI32(100)); // 1% of revenue
  } else if (usageType == "derivative") {
    return revenue.div(BigInt.fromI32(50)); // 2% of revenue
  } else if (usageType == "remix") {
    return BigInt.fromI32(100); // Fixed increment
  }
  return BigInt.fromI32(10); // Default small increment
}

function calculateCVSIncrementFromLicense(licenseType: string, price: BigInt): BigInt {
  // License sales have significant CVS impact
  if (licenseType == "exclusive") {
    return price.div(BigInt.fromI32(10)); // 10% of price
  } else if (licenseType == "commercial") {
    return price.div(BigInt.fromI32(20)); // 5% of price
  } else if (licenseType == "derivative") {
    return price.div(BigInt.fromI32(25)); // 4% of price
  }
  return price.div(BigInt.fromI32(50)); // 2% default
}

function calculateMaxLoanAmount(cvs: BigInt): BigInt {
  // Max loan = CVS * 0.5 (50% of CVS)
  return cvs.div(BigInt.fromI32(2));
}

function calculateInterestRate(cvs: BigInt): BigInt {
  // Interest rate inversely proportional to CVS
  // Higher CVS = Lower interest rate
  // Formula: 20% - (CVS / 10000)
  // Minimum 5%, Maximum 20%
  let baseRate = BigInt.fromI32(2000); // 20%
  let discount = cvs.div(BigInt.fromI32(100));
  let rate = baseRate.minus(discount);
  
  // Ensure minimum 5%
  if (rate.lt(BigInt.fromI32(500))) {
    return BigInt.fromI32(500);
  }
  
  return rate;
}

function calculateRequiredCVS(loanAmount: BigInt): BigInt {
  // Required CVS = Loan Amount * 2 (200% coverage)
  return loanAmount.times(BigInt.fromI32(2));
}

// ========================================
// Global Statistics Helper
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
  }
  
  stats.lastUpdated = BigInt.fromI32(0); // Update with actual timestamp
  stats.save();
}
