// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IDO.sol";
import "./interfaces/IStoryProtocolSPG.sol";
import "./interfaces/IStoryProtocolIPAssetRegistry.sol";
import "./interfaces/IStoryProtocolLicenseRegistry.sol";
import "./interfaces/ILoanNFT.sol";

/**
 * @title ADLVWithStorySecure - Secure ADLV with Story Protocol Integration
 * @notice Manages IP-backed lending vaults with comprehensive security features
 * @dev Includes ReentrancyGuard, Pausable, AccessControl, Rate Limiting, Circuit Breaker, and Oracle Sanity Checks
 */
contract ADLVWithStorySecure is ReentrancyGuard, Pausable, AccessControl {
    // ========================================
    // Roles
    // ========================================
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    
    // ========================================
    // State Variables
    // ========================================
    
    /// @notice IDO contract reference
    IDO public idoContract;
    
    /// @notice Story Protocol SPG (Story Protocol Gateway) address
    IStoryProtocolSPG public storySPG;
    
    /// @notice Story Protocol IP Asset Registry address
    IStoryProtocolIPAssetRegistry public storyIPAssetRegistry;
    
    /// @notice Story Protocol License Registry address
    IStoryProtocolLicenseRegistry public storyLicenseRegistry;
    
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
    
    /// @notice Loan NFT contract
    address public loanNFT;
    
    /// @notice Lending Module contract
    address public lendingModule;
    
    /// @notice Default loan terms
    LoanTerms public defaultLoanTerms;
    
    /// @notice Interest rate model
    InterestRateModel public interestRateModel;
    
    /// @notice Protocol liquidation fee (basis points)
    uint256 public liquidationFeeBps = 500; // 5%
    
    /// @notice Minimum health factor (10000 = 100%)
    uint256 public constant MIN_HEALTH_FACTOR = 10000; // 100%
    
    /// @notice Liquidation threshold (8000 = 80%)
    uint256 public constant LIQUIDATION_THRESHOLD = 8000; // 80%
    
    // ========================================
    // Rate Limiting
    // ========================================
    struct RateLimit {
        uint256 maxAmount;      // Maximum amount per period
        uint256 period;          // Time period in seconds
        uint256 currentAmount;   // Current amount in period
        uint256 periodStart;     // Start of current period
    }
    
    mapping(address => RateLimit) public userRateLimits; // Per-user rate limits
    RateLimit public globalRateLimit; // Global rate limit
    
    // ========================================
    // Circuit Breaker
    // ========================================
    struct CircuitBreaker {
        bool enabled;            // Circuit breaker enabled
        uint256 maxWithdrawal;   // Maximum withdrawal per transaction
        uint256 dailyLimit;      // Daily withdrawal limit
        uint256 dailyWithdrawn; // Amount withdrawn today
        uint256 lastReset;       // Last reset timestamp
    }
    
    mapping(address => CircuitBreaker) public vaultCircuitBreakers; // Per-vault circuit breakers
    CircuitBreaker public globalCircuitBreaker; // Global circuit breaker
    
    // ========================================
    // Oracle Sanity Checks
    // ========================================
    struct OracleConfig {
        uint256 maxDeviation;    // Maximum CVS deviation (basis points)
        uint256 minConfidence;   // Minimum confidence score
        uint256 staleThreshold;  // Stale data threshold (seconds)
    }
    
    OracleConfig public oracleConfig;
    
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
        uint256 collateralAmount;        // ETH/IP collateral
        address ipCollateral;            // IP Asset used as collateral
        uint256 ipCollateralValue;       // CVS value at issuance
        uint256 interestRate;            // Annual interest rate (basis points)
        uint256 duration;
        uint256 cvsAtIssuance;
        uint256 startTime;
        uint256 endTime;
        uint256 repaidAmount;
        uint256 outstandingAmount;
        uint256 accruedInterest;         // Accumulated interest
        uint256 healthFactor;            // Loan health (10000 = 100%)
        uint256 liquidationThreshold;    // CVS threshold for liquidation
        LoanStatus status;
    }
    
    struct LoanTerms {
        uint256 minLoanAmount;
        uint256 maxLoanAmount;
        uint256 minDuration;
        uint256 maxDuration;
        uint256 minCollateralRatio;     // Minimum collateral ratio (basis points)
        uint256 liquidationPenalty;     // Penalty for liquidation (basis points)
        uint256 baseInterestRate;       // Base interest rate (basis points)
        bool allowIPCollateral;         // Allow IP assets as collateral
    }
    
    enum LoanStatus {
        Pending,
        Active,
        Repaid,
        Defaulted,
        Liquidated
    }
    
    enum InterestRateModel {
        Fixed,      // Fixed interest rate
        Variable,   // Variable based on utilization
        Dynamic     // Dynamic based on CVS and market
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
    mapping(address => string[]) public vaultLicenses; // Vault address to license IDs
    mapping(address => address) public derivativeToParentVault; // Derivative vault => Parent vault
    mapping(address => address[]) public vaultDerivatives; // Parent vault => Derivative vaults[]
    
    // Lending Module Mappings
    mapping(address => LoanTerms) public vaultLoanTerms; // Custom loan terms per vault
    mapping(address => uint256) public ipCollateralValue; // IP asset => CVS value
    mapping(uint256 => address) public loanToIPCollateral; // Loan ID => IP collateral address
    mapping(address => uint256[]) public ipCollateralLoans; // IP asset => loan IDs
    
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
    
    event CircuitBreakerTriggered(
        address indexed vaultAddress,
        uint256 attemptedAmount,
        uint256 limit
    );
    
    event RateLimitExceeded(
        address indexed user,
        uint256 attemptedAmount,
        uint256 limit
    );
    
    event OracleSanityCheckFailed(
        bytes32 indexed ipId,
        uint256 receivedCVS,
        uint256 expectedRange
    );
    
    // ========================================
    // Modifiers
    // ========================================
    
    modifier vaultExists(address vaultAddress) {
        require(vaults[vaultAddress].exists, "ADLV: Vault does not exist");
        _;
    }
    
    modifier checkRateLimit(address user, uint256 amount) {
        _checkRateLimit(user, amount);
        _;
    }
    
    modifier checkCircuitBreaker(address vaultAddress, uint256 amount) {
        _checkCircuitBreaker(vaultAddress, amount);
        _;
    }
    
    modifier checkOracleSanity(bytes32 ipId, uint256 cvs) {
        _checkOracleSanity(ipId, cvs);
        _;
    }
    
    // ========================================
    // Constructor
    // ========================================
    
    constructor(
        address _idoContract,
        address _storySPG,
        address _storyIPAssetRegistry,
        address _storyLicenseRegistry,
        address _loanNFT,
        address _lendingModule
    ) {
        require(_idoContract != address(0), "ADLV: Invalid IDO address");
        require(_storySPG != address(0), "ADLV: Invalid SPG address");
        require(_storyIPAssetRegistry != address(0), "ADLV: Invalid registry address");
        
        idoContract = IDO(_idoContract);
        storySPG = IStoryProtocolSPG(_storySPG);
        storyIPAssetRegistry = IStoryProtocolIPAssetRegistry(_storyIPAssetRegistry);
        if (_storyLicenseRegistry != address(0)) {
            storyLicenseRegistry = IStoryProtocolLicenseRegistry(_storyLicenseRegistry);
        }
        loanNFT = _loanNFT;
        lendingModule = _lendingModule;
        
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
        
        // Set default loan terms
        defaultLoanTerms = LoanTerms({
            minLoanAmount: 0.01 ether,
            maxLoanAmount: 1000 ether,
            minDuration: 7 days,
            maxDuration: 365 days,
            minCollateralRatio: 15000, // 150%
            liquidationPenalty: 1000,  // 10%
            baseInterestRate: 1000,    // 10% APR
            allowIPCollateral: true
        });
        
        // Set default interest rate model
        interestRateModel = InterestRateModel.Dynamic;
        
        // Initialize rate limits
        globalRateLimit = RateLimit({
            maxAmount: 10000 ether,
            period: 1 days,
            currentAmount: 0,
            periodStart: block.timestamp
        });
        
        // Initialize circuit breaker
        globalCircuitBreaker = CircuitBreaker({
            enabled: true,
            maxWithdrawal: 5000 ether,
            dailyLimit: 50000 ether,
            dailyWithdrawn: 0,
            lastReset: block.timestamp
        });
        
        // Initialize oracle config
        oracleConfig = OracleConfig({
            maxDeviation: 2000,      // 20% max deviation
            minConfidence: 5000,     // 50% min confidence
            staleThreshold: 1 days   // 1 day stale threshold
        });
    }
    
    // ========================================
    // Security Functions
    // ========================================
    
    /**
     * @notice Pause the contract
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    /**
     * @notice Set rate limit for a user
     */
    function setUserRateLimit(
        address user,
        uint256 maxAmount,
        uint256 period
    ) external onlyRole(ADMIN_ROLE) {
        userRateLimits[user] = RateLimit({
            maxAmount: maxAmount,
            period: period,
            currentAmount: 0,
            periodStart: block.timestamp
        });
    }
    
    /**
     * @notice Set global rate limit
     */
    function setGlobalRateLimit(
        uint256 maxAmount,
        uint256 period
    ) external onlyRole(ADMIN_ROLE) {
        globalRateLimit.maxAmount = maxAmount;
        globalRateLimit.period = period;
    }
    
    /**
     * @notice Set circuit breaker for a vault
     */
    function setVaultCircuitBreaker(
        address vaultAddress,
        bool enabled,
        uint256 maxWithdrawal,
        uint256 dailyLimit
    ) external onlyRole(ADMIN_ROLE) vaultExists(vaultAddress) {
        vaultCircuitBreakers[vaultAddress] = CircuitBreaker({
            enabled: enabled,
            maxWithdrawal: maxWithdrawal,
            dailyLimit: dailyLimit,
            dailyWithdrawn: 0,
            lastReset: block.timestamp
        });
    }
    
    /**
     * @notice Set global circuit breaker
     */
    function setGlobalCircuitBreaker(
        bool enabled,
        uint256 maxWithdrawal,
        uint256 dailyLimit
    ) external onlyRole(ADMIN_ROLE) {
        globalCircuitBreaker.enabled = enabled;
        globalCircuitBreaker.maxWithdrawal = maxWithdrawal;
        globalCircuitBreaker.dailyLimit = dailyLimit;
    }
    
    /**
     * @notice Set oracle configuration
     */
    function setOracleConfig(
        uint256 maxDeviation,
        uint256 minConfidence,
        uint256 staleThreshold
    ) external onlyRole(ADMIN_ROLE) {
        oracleConfig.maxDeviation = maxDeviation;
        oracleConfig.minConfidence = minConfidence;
        oracleConfig.staleThreshold = staleThreshold;
    }
    
    /**
     * @notice Internal function to check rate limit
     */
    function _checkRateLimit(address user, uint256 amount) internal {
        // Check user-specific rate limit
        RateLimit storage userLimit = userRateLimits[user];
        if (userLimit.maxAmount > 0) {
            if (block.timestamp >= userLimit.periodStart + userLimit.period) {
                userLimit.currentAmount = 0;
                userLimit.periodStart = block.timestamp;
            }
            require(
                userLimit.currentAmount + amount <= userLimit.maxAmount,
                "ADLV: User rate limit exceeded"
            );
            userLimit.currentAmount += amount;
        }
        
        // Check global rate limit
        if (block.timestamp >= globalRateLimit.periodStart + globalRateLimit.period) {
            globalRateLimit.currentAmount = 0;
            globalRateLimit.periodStart = block.timestamp;
        }
        require(
            globalRateLimit.currentAmount + amount <= globalRateLimit.maxAmount,
            "ADLV: Global rate limit exceeded"
        );
        globalRateLimit.currentAmount += amount;
    }
    
    /**
     * @notice Internal function to check circuit breaker
     */
    function _checkCircuitBreaker(address vaultAddress, uint256 amount) internal {
        // Check vault-specific circuit breaker
        CircuitBreaker storage vaultBreaker = vaultCircuitBreakers[vaultAddress];
        if (vaultBreaker.enabled) {
            // Reset daily limit if new day
            if (block.timestamp >= vaultBreaker.lastReset + 1 days) {
                vaultBreaker.dailyWithdrawn = 0;
                vaultBreaker.lastReset = block.timestamp;
            }
            
            require(
                amount <= vaultBreaker.maxWithdrawal,
                "ADLV: Vault withdrawal limit exceeded"
            );
            require(
                vaultBreaker.dailyWithdrawn + amount <= vaultBreaker.dailyLimit,
                "ADLV: Vault daily limit exceeded"
            );
            
            vaultBreaker.dailyWithdrawn += amount;
        }
        
        // Check global circuit breaker
        if (globalCircuitBreaker.enabled) {
            // Reset daily limit if new day
            if (block.timestamp >= globalCircuitBreaker.lastReset + 1 days) {
                globalCircuitBreaker.dailyWithdrawn = 0;
                globalCircuitBreaker.lastReset = block.timestamp;
            }
            
            require(
                amount <= globalCircuitBreaker.maxWithdrawal,
                "ADLV: Global withdrawal limit exceeded"
            );
            require(
                globalCircuitBreaker.dailyWithdrawn + amount <= globalCircuitBreaker.dailyLimit,
                "ADLV: Global daily limit exceeded"
            );
            
            globalCircuitBreaker.dailyWithdrawn += amount;
        }
    }
    
    /**
     * @notice Internal function to check oracle sanity
     */
    function _checkOracleSanity(bytes32 ipId, uint256 cvs) internal view {
        // Get cached CVS for comparison
        uint256 cachedCVS = idoContract.getCVS(ipId);
        
        if (cachedCVS > 0) {
            // Calculate deviation
            uint256 deviation;
            if (cvs > cachedCVS) {
                deviation = ((cvs - cachedCVS) * 10000) / cachedCVS;
            } else {
                deviation = ((cachedCVS - cvs) * 10000) / cachedCVS;
            }
            
            require(
                deviation <= oracleConfig.maxDeviation,
                "ADLV: Oracle CVS deviation too high"
            );
        }
        
        // Check confidence if available
        (uint256 currentCVS, uint256 lastUpdated, uint256 confidence) = idoContract.getCVSWithMetadata(ipId);
        if (lastUpdated > 0) {
            require(
                block.timestamp - lastUpdated <= oracleConfig.staleThreshold,
                "ADLV: Oracle data too stale"
            );
            require(
                confidence >= oracleConfig.minConfidence,
                "ADLV: Oracle confidence too low"
            );
        }
    }
    
    // ========================================
    // Vault Management
    // ========================================
    
    /**
     * @notice Create vault with existing Story Protocol IP ID
     */
    function createVault(
        bytes32 ipId,
        string calldata storyIPId
    ) external whenNotPaused nonReentrant returns (address vaultAddress) {
        require(ipToVault[ipId] == address(0), "ADLV: Vault already exists");
        
        // Verify IP exists on Story Protocol if provided
        if (bytes(storyIPId).length > 0) {
            require(storyIPAssetRegistry.exists(storyIPId), "ADLV: IP not registered");
        }
        
        vaultAddress = _createVaultInternal(ipId, storyIPId);
        
        return vaultAddress;
    }
    
    /**
     * @notice Internal function to create vault
     */
    function _createVaultInternal(
        bytes32 ipId,
        string memory storyIPId
    ) internal returns (address vaultAddress) {
        uint256 initialCVS = idoContract.getCVS(ipId);
        
        // Sanity check CVS
        _checkOracleSanity(ipId, initialCVS);
        
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
        
        return vaultAddress;
    }
    
    // ========================================
    // License Sales
    // ========================================
    
    function sellLicense(
        address vaultAddress,
        string calldata licenseType,
        uint256 /* duration */
    ) external payable whenNotPaused nonReentrant checkRateLimit(msg.sender, msg.value) vaultExists(vaultAddress) returns (string memory licenseId) {
        require(msg.value > 0, "ADLV: Invalid price");
        
        Vault storage vault = vaults[vaultAddress];
        bytes32 ipId = vault.ipId;
        
        // Create local license ID
        licenseId = string(abi.encodePacked(
            "license-",
            _uint2str(block.timestamp),
            "-",
            _addressToString(msg.sender),
            "-",
            _uint2str(msg.value)
        ));
        vaultLicenses[vaultAddress].push(licenseId);
        
        _distributeLicenseRevenue(vaultAddress, ipId, msg.value);
        
        emit LicenseSold(vaultAddress, ipId, msg.sender, msg.value, licenseType);
        
        return licenseId;
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
            payable(getRoleMember(DEFAULT_ADMIN_ROLE, 0)).transfer(protocolFee);
        }
        if (creatorShare > 0) {
            payable(vault.creator).transfer(creatorShare);
        }
    }
    
    // ========================================
    // Loan Management
    // ========================================
    
    function issueLoan(
        address vaultAddress,
        uint256 loanAmount,
        uint256 duration
    ) external payable whenNotPaused nonReentrant checkRateLimit(msg.sender, loanAmount) vaultExists(vaultAddress) returns (uint256 loanId) {
        return _issueLoanInternal(vaultAddress, loanAmount, duration, address(0), msg.value);
    }
    
    function _issueLoanInternal(
        address vaultAddress,
        uint256 loanAmount,
        uint256 duration,
        address ipCollateral,
        uint256 ethCollateral
    ) internal returns (uint256 loanId) {
        Vault storage vault = vaults[vaultAddress];
        bytes32 ipId = vault.ipId;
        
        LoanTerms memory terms = vaultLoanTerms[vaultAddress].minLoanAmount > 0 
            ? vaultLoanTerms[vaultAddress] 
            : defaultLoanTerms;
        
        // Validate loan terms
        require(loanAmount >= terms.minLoanAmount, "ADLV: Loan amount too small");
        require(loanAmount <= terms.maxLoanAmount, "ADLV: Loan amount too large");
        require(duration >= terms.minDuration, "ADLV: Duration too short");
        require(duration <= terms.maxDuration, "ADLV: Duration too long");
        
        uint256 currentCVS = idoContract.getCVS(ipId);
        
        // Sanity check CVS
        _checkOracleSanity(ipId, currentCVS);
        
        require(
            currentCVS >= loanAmount * MIN_CVS_RATIO,
            "ADLV: Insufficient CVS"
        );
        
        require(
            vault.availableLiquidity >= loanAmount,
            "ADLV: Insufficient liquidity"
        );
        
        // Calculate collateral value
        uint256 totalCollateralValue = ethCollateral;
        uint256 ipCollateralVal = 0;
        
        if (ipCollateral != address(0)) {
            require(terms.allowIPCollateral, "ADLV: IP collateral not allowed");
            
            bytes32 ipCollateralId = keccak256(abi.encodePacked(ipCollateral));
            ipCollateralVal = idoContract.getCVS(ipCollateralId);
            totalCollateralValue += ipCollateralVal;
        }
        
        uint256 requiredCollateral = (loanAmount * terms.minCollateralRatio) / 10000;
        
        require(
            totalCollateralValue >= requiredCollateral,
            "ADLV: Insufficient collateral"
        );
        
        // Calculate interest rate
        uint256 interestRate = _calculateDynamicInterestRate(currentCVS, vault.availableLiquidity, vault.totalLiquidity);
        
        // Calculate health factor
        uint256 healthFactor = (totalCollateralValue * 10000) / loanAmount;
        
        // Calculate liquidation threshold
        uint256 liquidationThreshold = (loanAmount * LIQUIDATION_THRESHOLD) / 10000;
        
        loanId = loanCounter++;
        
        loans[loanId] = Loan({
            loanId: loanId,
            vaultAddress: vaultAddress,
            borrower: msg.sender,
            loanAmount: loanAmount,
            collateralAmount: ethCollateral,
            ipCollateral: ipCollateral,
            ipCollateralValue: ipCollateralVal,
            interestRate: interestRate,
            duration: duration,
            cvsAtIssuance: currentCVS,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            repaidAmount: 0,
            outstandingAmount: loanAmount,
            accruedInterest: 0,
            healthFactor: healthFactor,
            liquidationThreshold: liquidationThreshold,
            status: LoanStatus.Active
        });
        
        vaultLoans[vaultAddress].push(loanId);
        borrowerLoans[msg.sender].push(loanId);
        
        if (ipCollateral != address(0)) {
            loanToIPCollateral[loanId] = ipCollateral;
            ipCollateralLoans[ipCollateral].push(loanId);
        }
        
        vault.totalLoansIssued += loanAmount;
        vault.activeLoansCount += 1;
        vault.availableLiquidity -= loanAmount;
        
        // Mint Loan NFT
        if (loanNFT != address(0)) {
            try ILoanNFT(loanNFT).mint(msg.sender, loanId) returns (uint256 nftTokenId) {
                // NFT minted successfully
            } catch {}
        }
        
        payable(msg.sender).transfer(loanAmount);
        
        emit LoanIssued(
            vaultAddress,
            msg.sender,
            loanId,
            loanAmount,
            totalCollateralValue,
            interestRate,
            duration
        );
        
        return loanId;
    }
    
    function repayLoan(uint256 loanId) external payable whenNotPaused nonReentrant {
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
    
    // ========================================
    // Deposit/Withdraw
    // ========================================
    
    function deposit(
        address vaultAddress
    ) external payable whenNotPaused nonReentrant checkRateLimit(msg.sender, msg.value) vaultExists(vaultAddress) returns (uint256 shares) {
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
    ) external whenNotPaused nonReentrant checkCircuitBreaker(vaultAddress, shares) vaultExists(vaultAddress) {
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
    
    function calculateInterest(
        uint256 principal,
        uint256 rate,
        uint256 elapsedTime,
        uint256 duration
    ) public pure returns (uint256) {
        return (principal * rate * elapsedTime) / (10000 * duration);
    }
    
    function _calculateDynamicInterestRate(
        uint256 cvs,
        uint256 availableLiquidity,
        uint256 totalLiquidity
    ) internal view returns (uint256 rate) {
        if (interestRateModel == InterestRateModel.Fixed) {
            return defaultLoanTerms.baseInterestRate;
        }
        
        uint256 baseRate = defaultLoanTerms.baseInterestRate;
        
        if (interestRateModel == InterestRateModel.Variable) {
            if (totalLiquidity == 0) return baseRate;
            
            uint256 utilization = ((totalLiquidity - availableLiquidity) * 10000) / totalLiquidity;
            rate = baseRate + (baseRate * 2 * utilization) / 10000;
        } else {
            if (totalLiquidity == 0) return baseRate;
            
            uint256 utilization = ((totalLiquidity - availableLiquidity) * 10000) / totalLiquidity;
            uint256 cvsDiscount = cvs / 1000000 ether;
            if (cvsDiscount > 500) cvsDiscount = 500;
            
            uint256 utilizationPremium = (baseRate * utilization) / 10000;
            rate = baseRate + utilizationPremium;
            if (rate > cvsDiscount) {
                rate -= cvsDiscount;
            } else {
                rate = baseRate / 2;
            }
        }
        
        if (rate < 100) rate = 100;
        if (rate > 10000) rate = 10000;
        
        return rate;
    }
    
    // ========================================
    // Helper Functions
    // ========================================
    
    function _addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2+i*2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3+i*2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
    
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}

