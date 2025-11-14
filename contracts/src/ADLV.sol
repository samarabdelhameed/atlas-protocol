// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IDO.sol";

/**
 * @title ADLV - Automated Data Licensing Vault
 * @notice Manages IP-backed lending vaults with CVS-based loan terms
 * @dev Handles revenue splitting, loan issuance, and liquidation
 */
contract ADLV {
    // ========================================
    // State Variables
    // ========================================
    
    /// @notice IDO contract reference
    IDO public idoContract;
    
    /// @notice Protocol owner
    address public owner;
    
    /// @notice Protocol fee percentage (basis points, e.g., 500 = 5%)
    uint256 public protocolFeeBps = 500; // 5%
    
    /// @notice Creator share percentage (basis points, e.g., 7000 = 70%)
    uint256 public creatorShareBps = 7000; // 70%
    
    /// @notice Vault share percentage (basis points, e.g., 2500 = 25%)
    uint256 public vaultShareBps = 2500; // 25%
    
    /// @notice Default collateral ratio (basis points, e.g., 15000 = 150%)
    uint256 public defaultCollateralRatio = 15000; // 150%
    
    /// @notice Minimum CVS required for loan (2x loan amount)
    uint256 public constant MIN_CVS_RATIO = 2;
    
    /// @notice Counter for loan IDs
    uint256 public loanCounter;
    
    /// @notice Counter for vault addresses
    uint256 public vaultCounter;
    
    // ========================================
    // Structs
    // ========================================
    
    struct Vault {
        address vaultAddress;
        bytes32 ipId;
        address creator;
        uint256 totalLiquidity;
        uint256 availableLiquidity;
        uint256 totalLoansIssued;
        uint256 activeLoansCount;
        uint256 totalLicenseRevenue;
        uint256 totalLoanRepayments;
        uint256 createdAt;
        bool exists;
    }
    
    struct Loan {
        uint256 loanId;
        address vaultAddress;
        address borrower;
        uint256 loanAmount;
        uint256 collateralAmount;
        uint256 interestRate; // Basis points
        uint256 duration; // Seconds
        uint256 cvsAtIssuance;
        uint256 startTime;
        uint256 endTime;
        uint256 repaidAmount;
        uint256 outstandingAmount;
        LoanStatus status;
    }
    
    enum LoanStatus {
        Pending,
        Active,
        Repaid,
        Defaulted,
        Liquidated
    }
    
    // ========================================
    // Mappings
    // ========================================
    
    /// @notice Mapping from vault address to vault data
    mapping(address => Vault) public vaults;
    
    /// @notice Mapping from loan ID to loan data
    mapping(uint256 => Loan) public loans;
    
    /// @notice Mapping from vault address to loan IDs
    mapping(address => uint256[]) public vaultLoans;
    
    /// @notice Mapping from borrower to loan IDs
    mapping(address => uint256[]) public borrowerLoans;
    
    /// @notice Mapping from IP ID to vault address
    mapping(bytes32 => address) public ipToVault;
    
    /// @notice Mapping from vault address to depositor shares
    mapping(address => mapping(address => uint256)) public depositorShares;
    
    /// @notice Mapping from vault address to total shares
    mapping(address => uint256) public totalShares;
    
    // ========================================
    // Events
    // ========================================
    
    /// @notice Emitted when a new vault is created
    event VaultCreated(
        address indexed vaultAddress,
        bytes32 indexed ipId,
        address indexed creator,
        uint256 initialCVS
    );
    
    /// @notice Emitted when a license is sold
    event LicenseSold(
        address indexed vaultAddress,
        bytes32 indexed ipId,
        address indexed licensee,
        uint256 price,
        string licenseType
    );
    
    /// @notice Emitted when a loan is issued
    event LoanIssued(
        address indexed vaultAddress,
        address indexed borrower,
        uint256 indexed loanId,
        uint256 amount,
        uint256 collateral,
        uint256 interestRate,
        uint256 duration
    );
    
    /// @notice Emitted when CVS is updated
    event CVSUpdated(
        address indexed vaultAddress,
        uint256 oldCVS,
        uint256 newCVS
    );
    
    /// @notice Emitted when a loan is repaid
    event LoanRepaid(
        address indexed vaultAddress,
        address indexed borrower,
        uint256 indexed loanId,
        uint256 amount
    );
    
    /// @notice Emitted when a loan is defaulted
    event LoanDefaulted(
        address indexed vaultAddress,
        address indexed borrower,
        uint256 indexed loanId
    );
    
    /// @notice Emitted when a loan is liquidated
    event LoanLiquidated(
        address indexed vaultAddress,
        address indexed borrower,
        uint256 indexed loanId
    );
    
    /// @notice Emitted when funds are deposited
    event Deposited(
        address indexed vaultAddress,
        address indexed depositor,
        uint256 amount,
        uint256 shares
    );
    
    /// @notice Emitted when funds are withdrawn
    event Withdrawn(
        address indexed vaultAddress,
        address indexed withdrawer,
        uint256 amount,
        uint256 shares
    );
    
    // ========================================
    // Modifiers
    // ========================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "ADLV: Only owner");
        _;
    }
    
    modifier onlyVaultCreator(address vaultAddress) {
        require(
            vaults[vaultAddress].creator == msg.sender,
            "ADLV: Only vault creator"
        );
        _;
    }
    
    modifier vaultExists(address vaultAddress) {
        require(vaults[vaultAddress].exists, "ADLV: Vault does not exist");
        _;
    }
    
    // ========================================
    // Constructor
    // ========================================
    
    constructor(address _idoContract) {
        require(_idoContract != address(0), "ADLV: Invalid IDO address");
        idoContract = IDO(_idoContract);
        owner = msg.sender;
    }
    
    // ========================================
    // Owner Functions
    // ========================================
    
    /**
     * @notice Set protocol fee percentage
     * @param _protocolFeeBps Protocol fee in basis points
     */
    function setProtocolFee(uint256 _protocolFeeBps) external onlyOwner {
        require(_protocolFeeBps <= 1000, "ADLV: Fee too high"); // Max 10%
        protocolFeeBps = _protocolFeeBps;
        // Update other shares accordingly
        uint256 remaining = 10000 - _protocolFeeBps;
        creatorShareBps = (remaining * 70) / 100; // 70% of remaining
        vaultShareBps = remaining - creatorShareBps; // Rest to vault
    }
    
    /**
     * @notice Set IDO contract address
     * @param _idoContract Address of IDO contract
     */
    function setIDOContract(address _idoContract) external onlyOwner {
        require(_idoContract != address(0), "ADLV: Invalid address");
        idoContract = IDO(_idoContract);
    }
    
    // ========================================
    // Vault Management
    // ========================================
    
    /**
     * @notice Create a new vault for an IP asset
     * @param ipId The IP asset identifier
     * @return vaultAddress The address of the created vault
     */
    function createVault(bytes32 ipId) external returns (address vaultAddress) {
        require(ipToVault[ipId] == address(0), "ADLV: Vault already exists");
        
        // Get current CVS (will be 0 if not initialized yet)
        uint256 initialCVS = idoContract.getCVS(ipId);
        
        // Create vault address (deterministic)
        vaultAddress = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            block.timestamp,
                            msg.sender,
                            ipId,
                            vaultCounter
                        )
                    )
                )
            )
        );
        
        vaultCounter++;
        
        vaults[vaultAddress] = Vault({
            vaultAddress: vaultAddress,
            ipId: ipId,
            creator: msg.sender,
            totalLiquidity: 0,
            availableLiquidity: 0,
            totalLoansIssued: 0,
            activeLoansCount: 0,
            totalLicenseRevenue: 0,
            totalLoanRepayments: 0,
            createdAt: block.timestamp,
            exists: true
        });
        
        ipToVault[ipId] = vaultAddress;
        
        emit VaultCreated(vaultAddress, ipId, msg.sender, initialCVS);
        
        return vaultAddress;
    }
    
    // ========================================
    // License Sales & Revenue Distribution
    // ========================================
    
    /**
     * @notice Sell a license for an IP asset
     * @param vaultAddress The vault address
     * @param licenseType Type of license ("exclusive", "commercial", "derivative", "standard")
     */
    function sellLicense(
        address vaultAddress,
        string calldata licenseType,
        uint256 /* duration - reserved for future use */
    ) external payable vaultExists(vaultAddress) {
        require(msg.value > 0, "ADLV: Invalid price");
        
        Vault storage vault = vaults[vaultAddress];
        bytes32 ipId = vault.ipId;
        
        // Calculate and distribute revenue
        _distributeLicenseRevenue(vaultAddress, ipId, msg.value, licenseType);
        
        emit LicenseSold(vaultAddress, ipId, msg.sender, msg.value, licenseType);
    }
    
    /**
     * @notice Internal function to distribute license revenue and update CVS
     */
    function _distributeLicenseRevenue(
        address vaultAddress,
        bytes32 ipId,
        uint256 salePrice,
        string calldata /* licenseType */
    ) internal {
        Vault storage vault = vaults[vaultAddress];
        
        // Calculate revenue distribution
        uint256 protocolFee = (salePrice * protocolFeeBps) / 10000;
        uint256 creatorShare = (salePrice * creatorShareBps) / 10000;
        uint256 vaultShare = salePrice - protocolFee - creatorShare;
        
        // Record revenue in IDO (CVS will be updated off-chain by Agent Service)
        idoContract.recordRevenue(ipId, vaultShare);
        
        // Update vault metrics
        vault.totalLicenseRevenue += vaultShare;
        vault.totalLiquidity += vaultShare;
        vault.availableLiquidity += vaultShare;
        
        // Distribute revenue
        if (protocolFee > 0) {
            payable(owner).transfer(protocolFee);
        }
        if (creatorShare > 0) {
            payable(vault.creator).transfer(creatorShare);
        }
        // Vault share stays in contract (available for loans)
        
        // Note: CVS update will be handled off-chain by Agent Service
        // which will call idoContract.updateCVS() directly
    }
    
    // ========================================
    // Loan Management
    // ========================================
    
    /**
     * @notice Issue a loan based on CVS
     * @param vaultAddress The vault address
     * @param loanAmount Amount to borrow
     * @param duration Loan duration in seconds
     * @return loanId The ID of the issued loan
     */
    function issueLoan(
        address vaultAddress,
        uint256 loanAmount,
        uint256 duration
    ) external payable vaultExists(vaultAddress) returns (uint256 loanId) {
        Vault storage vault = vaults[vaultAddress];
        bytes32 ipId = vault.ipId;
        
        // Get current CVS
        uint256 currentCVS = idoContract.getCVS(ipId);
        
        // Check CVS requirement (CVS must be >= 2x loan amount)
        require(
            currentCVS >= loanAmount * MIN_CVS_RATIO,
            "ADLV: Insufficient CVS"
        );
        
        // Check vault liquidity
        require(
            vault.availableLiquidity >= loanAmount,
            "ADLV: Insufficient liquidity"
        );
        
        // Calculate interest rate based on CVS
        uint256 interestRate = calculateInterestRate(currentCVS);
        
        // Calculate required collateral (150% of loan amount)
        uint256 requiredCollateral = (loanAmount * defaultCollateralRatio) /
            10000;
        
        require(
            msg.value >= requiredCollateral,
            "ADLV: Insufficient collateral"
        );
        
        // Create loan
        loanId = loanCounter++;
        
        loans[loanId] = Loan({
            loanId: loanId,
            vaultAddress: vaultAddress,
            borrower: msg.sender,
            loanAmount: loanAmount,
            collateralAmount: msg.value,
            interestRate: interestRate,
            duration: duration,
            cvsAtIssuance: currentCVS,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            repaidAmount: 0,
            outstandingAmount: loanAmount,
            status: LoanStatus.Active
        });
        
        vaultLoans[vaultAddress].push(loanId);
        borrowerLoans[msg.sender].push(loanId);
        
        // Update vault metrics
        vault.totalLoansIssued += loanAmount;
        vault.activeLoansCount += 1;
        vault.availableLiquidity -= loanAmount;
        
        // Transfer loan amount to borrower
        payable(msg.sender).transfer(loanAmount);
        
        emit LoanIssued(
            vaultAddress,
            msg.sender,
            loanId,
            loanAmount,
            msg.value,
            interestRate,
            duration
        );
        
        return loanId;
    }
    
    /**
     * @notice Repay a loan
     * @param loanId The loan ID
     */
    function repayLoan(uint256 loanId) external payable {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Active, "ADLV: Loan not active");
        require(loan.borrower == msg.sender, "ADLV: Not borrower");
        
        uint256 repaymentAmount = msg.value;
        require(repaymentAmount > 0, "ADLV: Invalid amount");
        
        // Calculate interest
        uint256 interest = calculateInterest(
            loan.loanAmount,
            loan.interestRate,
            block.timestamp - loan.startTime,
            loan.duration
        );
        uint256 totalDue = loan.loanAmount + interest;
        
        if (repaymentAmount >= totalDue - loan.repaidAmount) {
            // Full repayment
            loan.repaidAmount = totalDue;
            loan.outstandingAmount = 0;
            loan.status = LoanStatus.Repaid;
            
            // Return collateral
            payable(loan.borrower).transfer(loan.collateralAmount);
        } else {
            // Partial repayment
            loan.repaidAmount += repaymentAmount;
            loan.outstandingAmount = totalDue - loan.repaidAmount;
        }
        
        Vault storage vault = vaults[loan.vaultAddress];
        vault.totalLoanRepayments += repaymentAmount;
        vault.availableLiquidity += repaymentAmount;
        
        if (loan.status == LoanStatus.Repaid) {
            vault.activeLoansCount -= 1;
        }
        
        emit LoanRepaid(loan.vaultAddress, loan.borrower, loanId, repaymentAmount);
    }
    
    /**
     * @notice Liquidate a defaulted loan
     * @param loanId The loan ID
     */
    function liquidateLoan(uint256 loanId) external {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Active, "ADLV: Loan not active");
        require(block.timestamp > loan.endTime, "ADLV: Loan not expired");
        
        // Check if loan is undercollateralized or expired
        bytes32 ipId = vaults[loan.vaultAddress].ipId;
        uint256 currentCVS = idoContract.getCVS(ipId);
        bool isUndercollateralized = currentCVS <
            (loan.loanAmount * MIN_CVS_RATIO);
        
        require(
            isUndercollateralized || block.timestamp > loan.endTime,
            "ADLV: Loan not liquidatable"
        );
        
        loan.status = LoanStatus.Liquidated;
        
        Vault storage vault = vaults[loan.vaultAddress];
        vault.activeLoansCount -= 1;
        
        // Liquidator gets collateral (incentive)
        payable(msg.sender).transfer(loan.collateralAmount);
        
        emit LoanLiquidated(loan.vaultAddress, loan.borrower, loanId);
    }
    
    // ========================================
    // Deposit/Withdraw Functions
    // ========================================
    
    /**
     * @notice Deposit funds into a vault
     * @param vaultAddress The vault address
     * @return shares Number of shares received
     */
    function deposit(
        address vaultAddress
    ) external payable vaultExists(vaultAddress) returns (uint256 shares) {
        require(msg.value > 0, "ADLV: Invalid amount");
        
        Vault storage vault = vaults[vaultAddress];
        
        // Calculate shares (1:1 if first deposit, otherwise proportional)
        if (vault.totalLiquidity == 0) {
            shares = msg.value;
        } else {
            shares = (msg.value * totalShares[vaultAddress]) /
                vault.totalLiquidity;
        }
        
        depositorShares[vaultAddress][msg.sender] += shares;
        totalShares[vaultAddress] += shares;
        
        vault.totalLiquidity += msg.value;
        vault.availableLiquidity += msg.value;
        
        emit Deposited(vaultAddress, msg.sender, msg.value, shares);
        
        return shares;
    }
    
    /**
     * @notice Withdraw funds from a vault
     * @param vaultAddress The vault address
     * @param shares Number of shares to withdraw
     */
    function withdraw(
        address vaultAddress,
        uint256 shares
    ) external vaultExists(vaultAddress) {
        require(
            depositorShares[vaultAddress][msg.sender] >= shares,
            "ADLV: Insufficient shares"
        );
        
        Vault storage vault = vaults[vaultAddress];
        
        // Calculate withdrawal amount
        uint256 withdrawalAmount = (shares * vault.totalLiquidity) /
            totalShares[vaultAddress];
        
        require(
            vault.availableLiquidity >= withdrawalAmount,
            "ADLV: Insufficient liquidity"
        );
        
        depositorShares[vaultAddress][msg.sender] -= shares;
        totalShares[vaultAddress] -= shares;
        
        vault.totalLiquidity -= withdrawalAmount;
        vault.availableLiquidity -= withdrawalAmount;
        
        payable(msg.sender).transfer(withdrawalAmount);
        
        emit Withdrawn(vaultAddress, msg.sender, withdrawalAmount, shares);
    }
    
    // ========================================
    // View Functions
    // ========================================
    
    /**
     * @notice Get vault information
     * @param vaultAddress The vault address
     */
    function getVault(
        address vaultAddress
    ) external view returns (Vault memory) {
        return vaults[vaultAddress];
    }
    
    /**
     * @notice Get loan information
     * @param loanId The loan ID
     */
    function getLoan(uint256 loanId) external view returns (Loan memory) {
        return loans[loanId];
    }
    
    /**
     * @notice Calculate maximum loan amount based on CVS
     * @param vaultAddress The vault address
     * @return Maximum loan amount
     */
    function calculateMaxLoanAmount(
        address vaultAddress
    ) external view returns (uint256) {
        bytes32 ipId = vaults[vaultAddress].ipId;
        uint256 currentCVS = idoContract.getCVS(ipId);
        return currentCVS / 2; // 50% of CVS
    }
    
    /**
     * @notice Calculate interest rate based on CVS
     * @param cvs Current CVS score
     * @return Interest rate in basis points
     */
    function calculateInterestRate(
        uint256 cvs
    ) public pure returns (uint256) {
        // Interest rate inversely proportional to CVS
        // Formula: 20% - (CVS / 10000), minimum 5%
        uint256 baseRate = 2000; // 20%
        uint256 discount = cvs / 100;
        uint256 rate = baseRate > discount ? baseRate - discount : 500;
        
        // Ensure minimum 5%
        if (rate < 500) {
            return 500;
        }
        
        return rate;
    }
    
    /**
     * @notice Calculate interest for a loan
     * @param principal Loan principal
     * @param rate Interest rate in basis points
     * @param elapsedTime Time elapsed in seconds
     * @param duration Total loan duration in seconds
     * @return Interest amount
     */
    function calculateInterest(
        uint256 principal,
        uint256 rate,
        uint256 elapsedTime,
        uint256 duration
    ) public pure returns (uint256) {
        // Simple interest: (principal * rate * time) / (10000 * duration)
        return (principal * rate * elapsedTime) / (10000 * duration);
    }
    
    /**
     * @notice Get all loans for a vault
     * @param vaultAddress The vault address
     * @return Array of loan IDs
     */
    function getVaultLoans(
        address vaultAddress
    ) external view returns (uint256[] memory) {
        return vaultLoans[vaultAddress];
    }
    
    /**
     * @notice Get all loans for a borrower
     * @param borrower The borrower address
     * @return Array of loan IDs
     */
    function getBorrowerLoans(
        address borrower
    ) external view returns (uint256[] memory) {
        return borrowerLoans[borrower];
    }
}
