// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IDO.sol";
import "./interfaces/IStoryProtocolSPG.sol";
import "./interfaces/IStoryProtocolIPAssetRegistry.sol";

/**
 * @title ADLVWithStory - ADLV with Story Protocol Integration
 * @notice Manages IP-backed lending vaults with Story Protocol SPG integration
 * @dev Integrates with Story Protocol for IP Asset registration and verification
 */
contract ADLVWithStory {
    // ========================================
    // State Variables
    // ========================================
    
    /// @notice IDO contract reference
    IDO public idoContract;
    
    /// @notice Story Protocol SPG (Story Protocol Gateway) address
    IStoryProtocolSPG public storySPG;
    
    /// @notice Story Protocol IP Asset Registry address
    IStoryProtocolIPAssetRegistry public storyIPAssetRegistry;
    
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
        string storyIPId;          // Story Protocol IP ID
        address creator;
        uint256 totalLiquidity;
        uint256 availableLiquidity;
        uint256 totalLoansIssued;
        uint256 activeLoansCount;
        uint256 totalLicenseRevenue;
        uint256 totalLoanRepayments;
        uint256 createdAt;
        bool exists;
        bool registeredOnStory;    // Whether IP is registered on Story Protocol
    }
    
    struct Loan {
        uint256 loanId;
        address vaultAddress;
        address borrower;
        uint256 loanAmount;
        uint256 collateralAmount;
        uint256 interestRate;
        uint256 duration;
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
    
    mapping(address => Vault) public vaults;
    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public vaultLoans;
    mapping(address => uint256[]) public borrowerLoans;
    mapping(bytes32 => address) public ipToVault;
    mapping(address => mapping(address => uint256)) public depositorShares;
    mapping(address => uint256) public totalShares;
    mapping(string => address) public storyIPIdToVault; // Story IP ID to vault
    
    // ========================================
    // Events
    // ========================================
    
    event VaultCreated(
        address indexed vaultAddress,
        bytes32 indexed ipId,
        string storyIPId,
        address indexed creator,
        uint256 initialCVS
    );
    
    event IPRegisteredOnStory(
        address indexed vaultAddress,
        bytes32 indexed ipId,
        string storyIPId
    );
    
    event LicenseSold(
        address indexed vaultAddress,
        bytes32 indexed ipId,
        address indexed licensee,
        uint256 price,
        string licenseType
    );
    
    event LoanIssued(
        address indexed vaultAddress,
        address indexed borrower,
        uint256 indexed loanId,
        uint256 amount,
        uint256 collateral,
        uint256 interestRate,
        uint256 duration
    );
    
    event LoanRepaid(
        address indexed vaultAddress,
        address indexed borrower,
        uint256 indexed loanId,
        uint256 amount
    );
    
    event LoanLiquidated(
        address indexed vaultAddress,
        address indexed borrower,
        uint256 indexed loanId
    );
    
    event Deposited(
        address indexed vaultAddress,
        address indexed depositor,
        uint256 amount,
        uint256 shares
    );
    
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
    
    modifier vaultExists(address vaultAddress) {
        require(vaults[vaultAddress].exists, "ADLV: Vault does not exist");
        _;
    }
    
    // ========================================
    // Constructor
    // ========================================
    
    constructor(
        address _idoContract,
        address _storySPG,
        address _storyIPAssetRegistry
    ) {
        require(_idoContract != address(0), "ADLV: Invalid IDO address");
        require(_storySPG != address(0), "ADLV: Invalid SPG address");
        require(_storyIPAssetRegistry != address(0), "ADLV: Invalid registry address");
        
        idoContract = IDO(_idoContract);
        storySPG = IStoryProtocolSPG(_storySPG);
        storyIPAssetRegistry = IStoryProtocolIPAssetRegistry(_storyIPAssetRegistry);
        owner = msg.sender;
    }
    
    // ========================================
    // Owner Functions
    // ========================================
    
    function setProtocolFee(uint256 _protocolFeeBps) external onlyOwner {
        require(_protocolFeeBps <= 1000, "ADLV: Fee too high");
        protocolFeeBps = _protocolFeeBps;
        uint256 remaining = 10000 - _protocolFeeBps;
        creatorShareBps = (remaining * 70) / 100;
        vaultShareBps = remaining - creatorShareBps;
    }
    
    function setIDOContract(address _idoContract) external onlyOwner {
        require(_idoContract != address(0), "ADLV: Invalid address");
        idoContract = IDO(_idoContract);
    }
    
    function setStorySPG(address _storySPG) external onlyOwner {
        require(_storySPG != address(0), "ADLV: Invalid SPG address");
        storySPG = IStoryProtocolSPG(_storySPG);
    }
    
    // ========================================
    // Vault Management with Story Protocol
    // ========================================
    
    /**
     * @notice Create vault with Story Protocol metadata
     * @param ipId Internal IP identifier
     * @param storyIPId Story Protocol IP ID (from off-chain registration)
     * @return vaultAddress The created vault address
     */
    function createVault(
        bytes32 ipId,
        string calldata storyIPId
    ) external returns (address vaultAddress) {
        require(ipToVault[ipId] == address(0), "ADLV: Vault already exists");
        
        uint256 initialCVS = idoContract.getCVS(ipId);
        
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
        
        bool isRegisteredOnStory = bytes(storyIPId).length > 0;
        
        vaults[vaultAddress] = Vault({
            vaultAddress: vaultAddress,
            ipId: ipId,
            storyIPId: storyIPId,
            creator: msg.sender,
            totalLiquidity: 0,
            availableLiquidity: 0,
            totalLoansIssued: 0,
            activeLoansCount: 0,
            totalLicenseRevenue: 0,
            totalLoanRepayments: 0,
            createdAt: block.timestamp,
            exists: true,
            registeredOnStory: isRegisteredOnStory
        });
        
        ipToVault[ipId] = vaultAddress;
        
        if (isRegisteredOnStory) {
            storyIPIdToVault[storyIPId] = vaultAddress;
        }
        
        emit VaultCreated(vaultAddress, ipId, storyIPId, msg.sender, initialCVS);
        
        if (isRegisteredOnStory) {
            emit IPRegisteredOnStory(vaultAddress, ipId, storyIPId);
        }
        
        return vaultAddress;
    }
    
    /**
     * @notice Update Story IP ID for existing vault
     * @param vaultAddress The vault address
     * @param storyIPId Story Protocol IP ID
     */
    function updateStoryIPId(
        address vaultAddress,
        string calldata storyIPId
    ) external vaultExists(vaultAddress) {
        Vault storage vault = vaults[vaultAddress];
        require(vault.creator == msg.sender, "ADLV: Only creator");
        
        vault.storyIPId = storyIPId;
        vault.registeredOnStory = bytes(storyIPId).length > 0;
        
        if (vault.registeredOnStory) {
            storyIPIdToVault[storyIPId] = vaultAddress;
            emit IPRegisteredOnStory(vaultAddress, vault.ipId, storyIPId);
        }
    }
    
    /**
     * @notice Check if vault has Story IP ID
     * @param vaultAddress The vault address
     * @return isRegistered Whether vault has Story IP ID
     */
    function hasStoryIPId(
        address vaultAddress
    ) external view vaultExists(vaultAddress) returns (bool isRegistered) {
        Vault memory vault = vaults[vaultAddress];
        return vault.registeredOnStory && bytes(vault.storyIPId).length > 0;
    }
    
    /**
     * @notice Get Story IP ID for vault
     * @param vaultAddress The vault address
     * @return storyIPId The Story Protocol IP ID
     */
    function getStoryIPId(
        address vaultAddress
    ) external view vaultExists(vaultAddress) returns (string memory storyIPId) {
        return vaults[vaultAddress].storyIPId;
    }
    
    // ========================================
    // License Sales & Revenue Distribution
    // ========================================
    
    function sellLicense(
        address vaultAddress,
        string calldata licenseType,
        uint256 /* duration */
    ) external payable vaultExists(vaultAddress) {
        require(msg.value > 0, "ADLV: Invalid price");
        
        Vault storage vault = vaults[vaultAddress];
        bytes32 ipId = vault.ipId;
        
        _distributeLicenseRevenue(vaultAddress, ipId, msg.value);
        
        emit LicenseSold(vaultAddress, ipId, msg.sender, msg.value, licenseType);
    }
    
    function _distributeLicenseRevenue(
        address vaultAddress,
        bytes32 ipId,
        uint256 salePrice
    ) internal {
        Vault storage vault = vaults[vaultAddress];
        
        uint256 protocolFee = (salePrice * protocolFeeBps) / 10000;
        uint256 creatorShare = (salePrice * creatorShareBps) / 10000;
        uint256 vaultShare = salePrice - protocolFee - creatorShare;
        
        idoContract.recordRevenue(ipId, vaultShare);
        
        vault.totalLicenseRevenue += vaultShare;
        vault.totalLiquidity += vaultShare;
        vault.availableLiquidity += vaultShare;
        
        if (protocolFee > 0) {
            payable(owner).transfer(protocolFee);
        }
        if (creatorShare > 0) {
            payable(vault.creator).transfer(creatorShare);
        }
    }
    
    // ========================================
    // Loan Management (same as original)
    // ========================================
    
    function issueLoan(
        address vaultAddress,
        uint256 loanAmount,
        uint256 duration
    ) external payable vaultExists(vaultAddress) returns (uint256 loanId) {
        Vault storage vault = vaults[vaultAddress];
        bytes32 ipId = vault.ipId;
        
        uint256 currentCVS = idoContract.getCVS(ipId);
        
        require(
            currentCVS >= loanAmount * MIN_CVS_RATIO,
            "ADLV: Insufficient CVS"
        );
        
        require(
            vault.availableLiquidity >= loanAmount,
            "ADLV: Insufficient liquidity"
        );
        
        uint256 interestRate = calculateInterestRate(currentCVS);
        uint256 requiredCollateral = (loanAmount * defaultCollateralRatio) / 10000;
        
        require(
            msg.value >= requiredCollateral,
            "ADLV: Insufficient collateral"
        );
        
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
        
        vault.totalLoansIssued += loanAmount;
        vault.activeLoansCount += 1;
        vault.availableLiquidity -= loanAmount;
        
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
    
    function repayLoan(uint256 loanId) external payable {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Active, "ADLV: Loan not active");
        require(loan.borrower == msg.sender, "ADLV: Not borrower");
        
        uint256 repaymentAmount = msg.value;
        require(repaymentAmount > 0, "ADLV: Invalid amount");
        
        uint256 interest = calculateInterest(
            loan.loanAmount,
            loan.interestRate,
            block.timestamp - loan.startTime,
            loan.duration
        );
        uint256 totalDue = loan.loanAmount + interest;
        
        if (repaymentAmount >= totalDue - loan.repaidAmount) {
            loan.repaidAmount = totalDue;
            loan.outstandingAmount = 0;
            loan.status = LoanStatus.Repaid;
            
            payable(loan.borrower).transfer(loan.collateralAmount);
        } else {
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
    
    function liquidateLoan(uint256 loanId) external {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Active, "ADLV: Loan not active");
        require(block.timestamp > loan.endTime, "ADLV: Loan not expired");
        
        bytes32 ipId = vaults[loan.vaultAddress].ipId;
        uint256 currentCVS = idoContract.getCVS(ipId);
        bool isUndercollateralized = currentCVS < (loan.loanAmount * MIN_CVS_RATIO);
        
        require(
            isUndercollateralized || block.timestamp > loan.endTime,
            "ADLV: Loan not liquidatable"
        );
        
        loan.status = LoanStatus.Liquidated;
        
        Vault storage vault = vaults[loan.vaultAddress];
        vault.activeLoansCount -= 1;
        
        payable(msg.sender).transfer(loan.collateralAmount);
        
        emit LoanLiquidated(loan.vaultAddress, loan.borrower, loanId);
    }
    
    // ========================================
    // Deposit/Withdraw (same as original)
    // ========================================
    
    function deposit(
        address vaultAddress
    ) external payable vaultExists(vaultAddress) returns (uint256 shares) {
        require(msg.value > 0, "ADLV: Invalid amount");
        
        Vault storage vault = vaults[vaultAddress];
        
        if (vault.totalLiquidity == 0) {
            shares = msg.value;
        } else {
            shares = (msg.value * totalShares[vaultAddress]) / vault.totalLiquidity;
        }
        
        depositorShares[vaultAddress][msg.sender] += shares;
        totalShares[vaultAddress] += shares;
        
        vault.totalLiquidity += msg.value;
        vault.availableLiquidity += msg.value;
        
        emit Deposited(vaultAddress, msg.sender, msg.value, shares);
        
        return shares;
    }
    
    function withdraw(
        address vaultAddress,
        uint256 shares
    ) external vaultExists(vaultAddress) {
        require(
            depositorShares[vaultAddress][msg.sender] >= shares,
            "ADLV: Insufficient shares"
        );
        
        Vault storage vault = vaults[vaultAddress];
        
        uint256 withdrawalAmount = (shares * vault.totalLiquidity) / totalShares[vaultAddress];
        
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
    
    function getVault(address vaultAddress) external view returns (Vault memory) {
        return vaults[vaultAddress];
    }
    
    function getLoan(uint256 loanId) external view returns (Loan memory) {
        return loans[loanId];
    }
    
    function calculateMaxLoanAmount(address vaultAddress) external view returns (uint256) {
        bytes32 ipId = vaults[vaultAddress].ipId;
        uint256 currentCVS = idoContract.getCVS(ipId);
        return currentCVS / 2;
    }
    
    function calculateInterestRate(uint256 cvs) public pure returns (uint256) {
        uint256 baseRate = 2000;
        uint256 discount = cvs / 100;
        uint256 rate = baseRate > discount ? baseRate - discount : 500;
        
        if (rate < 500) {
            return 500;
        }
        
        return rate;
    }
    
    function calculateInterest(
        uint256 principal,
        uint256 rate,
        uint256 elapsedTime,
        uint256 duration
    ) public pure returns (uint256) {
        return (principal * rate * elapsedTime) / (10000 * duration);
    }
    
    function getVaultLoans(address vaultAddress) external view returns (uint256[] memory) {
        return vaultLoans[vaultAddress];
    }
    
    function getBorrowerLoans(address borrower) external view returns (uint256[] memory) {
        return borrowerLoans[borrower];
    }
    
    function getVaultByStoryIPId(string calldata storyIPId) external view returns (address) {
        return storyIPIdToVault[storyIPId];
    }
}
