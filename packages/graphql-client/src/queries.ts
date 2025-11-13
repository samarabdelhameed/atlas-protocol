import { gql } from 'graphql-request';

/**
 * GraphQL Queries for Atlas Protocol Subgraph
 * Focus: CVS (Collateral Value Score) and ADLV data
 */

// ========================================
// IP Asset Queries
// ========================================

export const GET_IP_ASSET = gql`
  query GetIPAsset($id: ID!) {
    ipAsset(id: $id) {
      id
      ipId
      name
      description
      creator
      ipHash
      timestamp
      blockNumber
      
      # CVS Metrics
      totalUsageCount
      totalLicenseRevenue
      totalRemixes
      cvsScore
      
      # Licensing
      commercialUse
      derivatives
      royaltyPercent
      mintingFee
      
      # Recent Usage
      usageEvents(first: 10, orderBy: timestamp, orderDirection: desc) {
        id
        user
        usageType
        revenueGenerated
        cvsImpact
        timestamp
        transactionHash
      }
      
      # License Sales
      licenseSales(first: 10, orderBy: timestamp, orderDirection: desc) {
        id
        licensee
        salePrice
        licenseType
        cvsIncrement
        timestamp
      }
      
      # Associated Vault
      vault {
        id
        vaultAddress
        currentCVS
        maxLoanAmount
        interestRate
      }
    }
  }
`;

export const GET_IP_ASSETS = gql`
  query GetIPAssets($first: Int = 10, $skip: Int = 0, $orderBy: String = "timestamp", $orderDirection: String = "desc") {
    ipAssets(first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      ipId
      name
      creator
      cvsScore
      totalLicenseRevenue
      totalUsageCount
      totalRemixes
      timestamp
    }
  }
`;

export const GET_IP_USAGE_EVENTS = gql`
  query GetIPUsageEvents($ipAssetId: ID!, $first: Int = 50) {
    ipAssetUsages(
      where: { ipAsset: $ipAssetId }
      first: $first
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      user
      usageType
      revenueGenerated
      cvsImpact
      timestamp
      blockNumber
      transactionHash
    }
  }
`;

// ========================================
// Vault Queries (ADLV)
// ========================================

export const GET_VAULT = gql`
  query GetVault($id: ID!) {
    idoVault(id: $id) {
      id
      vaultAddress
      creator
      
      # CVS Metrics
      currentCVS
      initialCVS
      lastCVSUpdate
      
      # Vault Status
      totalLiquidity
      availableLiquidity
      totalLoansIssued
      activeLoansCount
      
      # Loan Terms
      maxLoanAmount
      interestRate
      collateralRatio
      
      # Financial
      totalLicenseRevenue
      totalLoanRepayments
      utilizationRate
      
      # Timestamps
      createdAt
      updatedAt
      
      # IP Asset
      ipAsset {
        id
        name
        creator
        cvsScore
        totalUsageCount
        totalLicenseRevenue
      }
      
      # Active Loans
      loans(where: { status: Active }, first: 20) {
        id
        loanId
        borrower
        loanAmount
        collateralAmount
        interestRate
        cvsAtIssuance
        requiredCVS
        outstandingAmount
        startTime
        endTime
      }
      
      # Recent License Sales
      licenseSales(first: 10, orderBy: timestamp, orderDirection: desc) {
        id
        licensee
        salePrice
        licenseType
        cvsIncrement
        creatorShare
        vaultShare
        timestamp
      }
      
      # Recent Deposits
      deposits(first: 5, orderBy: timestamp, orderDirection: desc) {
        id
        depositor
        amount
        shares
        timestamp
      }
    }
  }
`;

export const GET_VAULTS = gql`
  query GetVaults($first: Int = 10, $skip: Int = 0, $minCVS: BigInt) {
    idoVaults(
      first: $first
      skip: $skip
      where: { currentCVS_gte: $minCVS }
      orderBy: currentCVS
      orderDirection: desc
    ) {
      id
      vaultAddress
      creator
      currentCVS
      maxLoanAmount
      interestRate
      totalLiquidity
      activeLoansCount
      totalLicenseRevenue
      utilizationRate
      ipAsset {
        name
        totalUsageCount
      }
    }
  }
`;

export const GET_VAULT_BY_CREATOR = gql`
  query GetVaultByCreator($creator: Bytes!) {
    idoVaults(where: { creator: $creator }, orderBy: createdAt, orderDirection: desc) {
      id
      vaultAddress
      currentCVS
      maxLoanAmount
      interestRate
      totalLiquidity
      activeLoansCount
      ipAsset {
        name
        cvsScore
      }
    }
  }
`;

// ========================================
// License Sale Queries
// ========================================

export const GET_LICENSE_SALES = gql`
  query GetLicenseSales($first: Int = 20, $skip: Int = 0) {
    dataLicenseSales(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      salePrice
      licenseType
      cvsIncrement
      creatorShare
      vaultShare
      protocolFee
      timestamp
      licensee
      ipAsset {
        id
        name
        creator
      }
      vault {
        id
        currentCVS
      }
    }
  }
`;

export const GET_HIGH_IMPACT_LICENSE_SALES = gql`
  query GetHighImpactLicenseSales($minCVSIncrement: BigInt!) {
    dataLicenseSales(
      where: { cvsIncrement_gte: $minCVSIncrement }
      orderBy: cvsIncrement
      orderDirection: desc
      first: 20
    ) {
      id
      salePrice
      licenseType
      cvsIncrement
      ipAsset {
        name
        creator
        cvsScore
      }
      vault {
        currentCVS
        maxLoanAmount
      }
      timestamp
    }
  }
`;

// ========================================
// Loan Queries
// ========================================

export const GET_LOAN = gql`
  query GetLoan($id: ID!) {
    loan(id: $id) {
      id
      loanId
      borrower
      loanAmount
      collateralAmount
      interestRate
      duration
      cvsAtIssuance
      requiredCVS
      status
      repaidAmount
      outstandingAmount
      startTime
      endTime
      issuedAt
      lastPaymentAt
      
      vault {
        id
        vaultAddress
        currentCVS
        ipAsset {
          name
        }
      }
      
      payments(orderBy: timestamp, orderDirection: desc) {
        id
        payer
        amount
        isPrincipal
        timestamp
      }
    }
  }
`;

export const GET_ACTIVE_LOANS = gql`
  query GetActiveLoans($first: Int = 50) {
    loans(where: { status: Active }, first: $first, orderBy: endTime) {
      id
      loanId
      borrower
      loanAmount
      outstandingAmount
      interestRate
      endTime
      cvsAtIssuance
      vault {
        vaultAddress
        currentCVS
        ipAsset {
          name
        }
      }
    }
  }
`;

export const GET_LOANS_BY_BORROWER = gql`
  query GetLoansByBorrower($borrower: Bytes!) {
    loans(where: { borrower: $borrower }, orderBy: issuedAt, orderDirection: desc) {
      id
      loanId
      loanAmount
      collateralAmount
      interestRate
      status
      outstandingAmount
      endTime
      vault {
        vaultAddress
        ipAsset {
          name
        }
      }
    }
  }
`;

// ========================================
// Dashboard/Analytics Queries
// ========================================

export const GET_GLOBAL_STATS = gql`
  query GetGlobalStats {
    globalStats(id: "global") {
      totalIPAssets
      totalLicenses
      totalLoans
      totalIDOPools
      totalBridgeTransactions
      totalVerifiedUsers
      lastUpdated
    }
  }
`;

export const GET_CVS_LEADERBOARD = gql`
  query GetCVSLeaderboard($first: Int = 10) {
    ipAssets(first: $first, orderBy: cvsScore, orderDirection: desc) {
      id
      name
      creator
      cvsScore
      totalLicenseRevenue
      totalUsageCount
      totalRemixes
      vault {
        currentCVS
        maxLoanAmount
        interestRate
      }
    }
  }
`;

export const GET_VAULT_ANALYTICS = gql`
  query GetVaultAnalytics($vaultId: ID!, $timeframe: Int = 2592000) {
    idoVault(id: $vaultId) {
      id
      currentCVS
      totalLicenseRevenue
      totalLoanRepayments
      utilizationRate
      
      # Recent license sales for revenue chart
      licenseSales(
        first: 100
        orderBy: timestamp
        orderDirection: desc
      ) {
        salePrice
        cvsIncrement
        timestamp
      }
      
      # Loans for risk analysis
      loans {
        status
        loanAmount
        repaidAmount
        outstandingAmount
      }
    }
  }
`;

