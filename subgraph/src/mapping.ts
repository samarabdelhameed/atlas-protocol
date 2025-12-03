import { BigInt, Address } from "@graphprotocol/graph-ts";
import {
  IDOVault,
  IPAsset,
  DataLicenseSale,
  Loan,
  Deposit,
  LoanPayment,
  GlobalStats,
  CVSUpdate,
} from "../generated/schema";
import {
  VaultCreated,
  LicenseSold,
  LoanIssued,
  // CVSUpdated, // Not in current contract version
  LoanRepaid,
  // LoanDefaulted, // Not in current contract version
  LoanLiquidated,
  Deposited,
  Withdrawn,
} from "../generated/AtlasADLV/AtlasADLV";
import {
  CVSUpdated as OracleCVSUpdated,
  CVSSyncedFromSPG,
} from "../generated/CVSOracle/CVSOracle";

// ========================================
// Vault Management
// ========================================

export function handleVaultCreated(event: VaultCreated): void {
  let vault = new IDOVault(event.params.vaultAddress.toHex());

  vault.vaultAddress = event.params.vaultAddress;
  vault.creator = event.params.creator;

  // Create or load IPAsset entity
  let ipAssetId = event.params.ipId.toHex();
  let ipAsset = IPAsset.load(ipAssetId);

  if (!ipAsset) {
    ipAsset = new IPAsset(ipAssetId);
    ipAsset.ipId = event.params.ipId;

    // Extract the actual address from bytes32 (remove leading zeros)
    // bytes32 format: 0x000000000000000000000000<actual_address>
    let actualAddress = "0x" + ipAssetId.slice(-40);  // Last 40 chars (20 bytes)
    ipAsset.name = `IP Asset ${actualAddress.slice(0, 6)}...${actualAddress.slice(-4)}`;
    ipAsset.description = "IP Asset registered via ADLV vault creation";
    ipAsset.creator = event.params.creator;
    ipAsset.ipHash = actualAddress;  // Store the clean address
    ipAsset.timestamp = event.block.timestamp;
    ipAsset.blockNumber = event.block.number;

    // Licensing fields (default values)
    ipAsset.commercialUse = true;
    ipAsset.derivatives = true;
    ipAsset.royaltyPercent = BigInt.fromI32(0);
    ipAsset.mintingFee = BigInt.fromI32(0);

    // Initialize CVS metrics
    ipAsset.totalUsageCount = BigInt.fromI32(0);
    ipAsset.totalLicenseRevenue = BigInt.fromI32(0);
    ipAsset.totalRemixes = BigInt.fromI32(0);
    ipAsset.cvsScore = event.params.initialCVS;

    ipAsset.save();
  }

  // Link vault to IPAsset entity (not hex string)
  vault.ipAsset = ipAsset.id;

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

export function handleLicenseSale(event: LicenseSold): void {
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

  // Update IPAsset metrics
  let ipAsset = IPAsset.load(event.params.ipId.toHex());
  if (ipAsset) {
    ipAsset.totalLicenseRevenue = ipAsset.totalLicenseRevenue.plus(event.params.price);
    ipAsset.totalUsageCount = ipAsset.totalUsageCount.plus(BigInt.fromI32(1));
    ipAsset.cvsScore = ipAsset.cvsScore.plus(sale.cvsIncrement);
    ipAsset.save();
  }

  updateGlobalStats("license");
  
  // Update global stats timestamp
  let stats = GlobalStats.load("global");
  if (stats) {
    stats.lastUpdated = event.block.timestamp;
    stats.save();
  }
}

// ========================================
// CORE HANDLER 3: Loan Issuance (Based on CVS)
// ========================================

export function handleLoanIssued(event: LoanIssued): void {
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
  
  // Update global stats timestamp
  let stats = GlobalStats.load("global");
  if (stats) {
    stats.lastUpdated = event.block.timestamp;
    stats.save();
  }
}

// ========================================
// CVS Update Handler (from ADLV)
// ========================================
// NOTE: CVSUpdated event not in current contract version
/*
export function handleCVSUpdated(event: CVSUpdated): void {
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
*/

// ========================================
// CVS Oracle Event Handlers (from CVSOracle contract)
// ========================================

/**
 * Handle CVS updates from CVSOracle contract
 * This event is emitted when CVS is updated in the oracle (from SPG or manual)
 */
export function handleOracleCVSUpdated(event: OracleCVSUpdated): void {
  let ipId = event.params.ipId;
  let updateId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  
  // Create CVSUpdate entity to track oracle updates
  let cvsUpdate = new CVSUpdate(updateId);
  cvsUpdate.ipId = ipId;
  cvsUpdate.oldValue = event.params.oldValue;
  cvsUpdate.newValue = event.params.newValue;
  cvsUpdate.confidence = event.params.confidence;
  cvsUpdate.timestamp = event.params.timestamp;
  cvsUpdate.blockNumber = event.block.number;
  cvsUpdate.transactionHash = event.transaction.hash;
  cvsUpdate.source = "oracle";
  cvsUpdate.save();
  
  // Try to find and update vaults that use this IP ID
  // Note: This requires a mapping from IP ID to vault address
  // For now, we track the update and the indexer service can process it
}

/**
 * Handle CVS synced from Story Protocol SPG
 * This event is emitted when CVS is automatically synced from Story Protocol's system
 */
export function handleCVSSyncedFromSPG(event: CVSSyncedFromSPG): void {
  let ipId = event.params.ipId;
  let cvs = event.params.cvs;
  let timestamp = event.params.timestamp;
  let updateId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  
  // Create CVSUpdate entity to track SPG syncs
  let cvsUpdate = new CVSUpdate(updateId);
  cvsUpdate.ipId = ipId;
  cvsUpdate.oldValue = BigInt.fromI32(0); // SPG sync doesn't provide old value
  cvsUpdate.newValue = cvs;
  cvsUpdate.confidence = BigInt.fromI32(10000); // High confidence for SPG data
  cvsUpdate.timestamp = timestamp;
  cvsUpdate.blockNumber = event.block.number;
  cvsUpdate.transactionHash = event.transaction.hash;
  cvsUpdate.source = "spg-sync";
  cvsUpdate.save();
  
  // Track SPG syncs for monitoring and analytics
  // The actual vault update will happen through the oracle's CVSUpdated event
}

// ========================================
// Loan Management Handlers
// ========================================

export function handleLoanRepaid(event: LoanRepaid): void {
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

// NOTE: LoanDefaulted event not in current contract version
/*
export function handleLoanDefaulted(event: LoanDefaulted): void {
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
*/

export function handleLoanLiquidated(event: LoanLiquidated): void {
  let loanId = event.params.vaultAddress.toHex() + "-" + event.params.loanId.toString();
  let loan = Loan.load(loanId);
  
  if (loan) {
    loan.status = "Liquidated";
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

export function handleDeposited(event: Deposited): void {
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

export function handleWithdrawn(event: Withdrawn): void {
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
    stats.totalMultiAssetVaults = BigInt.fromI32(0);
    stats.lastUpdated = BigInt.fromI32(0);
  }
  
  if (type == "license") {
    stats.totalLicenses = stats.totalLicenses.plus(BigInt.fromI32(1));
  } else if (type == "loan") {
    stats.totalLoans = stats.totalLoans.plus(BigInt.fromI32(1));
  }
  
  // Note: lastUpdated will be set by individual handlers
  stats.save();
}
