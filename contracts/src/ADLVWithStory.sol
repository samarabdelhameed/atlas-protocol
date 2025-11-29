// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Errors.sol";
import "./IDO.sol";
import "./interfaces/IStoryProtocolSPG.sol";
import "./interfaces/IStoryProtocolIPAssetRegistry.sol";
import "./interfaces/IStoryProtocolLicenseRegistry.sol";
import "./interfaces/ILoanNFT.sol";
import "./interfaces/IIPAccount.sol";
import "./interfaces/ILicensingModule.sol";

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
    
    /// @notice Story Protocol License Registry address
    IStoryProtocolLicenseRegistry public storyLicenseRegistry;
    
    /// @notice Story Protocol Licensing Module address (for PIL policies)
    ILicensingModule public storyLicensingModule;
    
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
    mapping(address => uint256) public vaultPILPolicy; // Vault address => PIL Policy ID (0 = no policy)
    mapping(address => uint256) public vaultLicenseTermsId; // Vault address => License Terms ID
    
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
    
    event IPRegisteredOnStory(
        address indexed vaultAddress,
        bytes32 indexed ipId,
        string storyIPId
    );
    
    event LicenseRegistered(
        address indexed vaultAddress,
        bytes32 indexed ipId,
        string indexed licenseId,
        address licensee,
        string licenseType,
        uint256 price
    );
    
    event LicenseSold(
        address indexed vaultAddress,
        bytes32 indexed ipId,
        address indexed licensee,
        uint256 price,
        string licenseType
    );
    
    event PILPolicyAttached(
        address indexed vaultAddress,
        bytes32 indexed ipId,
        uint256 indexed policyId,
        uint256 licenseTermsId
    );
    
    event PILLicenseMinted(
        address indexed vaultAddress,
        bytes32 indexed ipId,
        string indexed licenseId,
        uint256 licenseTokenId,
        uint256 policyId,
        address licensee,
        uint256 price
    );
    
    event LicensingModuleUpdated(address indexed newLicensingModule);
    
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
    
    event RoyaltiesClaimed(
        address indexed vaultAddress,
        address indexed claimer,
        uint256 amount
    );
    
    event DerivativeVaultCreated(
        address indexed derivativeVaultAddress,
        address indexed parentVaultAddress,
        address indexed derivativeIpId,
        address creator
    );
    
    event LoanTermsUpdated(
        address indexed vaultAddress,
        uint256 minLoanAmount,
        uint256 maxLoanAmount,
        uint256 minCollateralRatio
    );
    
    event LoanHealthUpdated(
        uint256 indexed loanId,
        uint256 healthFactor,
        uint256 currentCVS
    );
    
    event LoanNFTMinted(
        uint256 indexed loanId,
        uint256 indexed nftTokenId,
        address indexed borrower
    );
    
    event IPCollateralAdded(
        uint256 indexed loanId,
        address indexed ipAsset,
        uint256 cvsValue
    );
    
    event InterestAccrued(
        uint256 indexed loanId,
        uint256 interestAmount,
        uint256 totalDebt
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
        address _storyIPAssetRegistry,
        address _storyLicenseRegistry,
        address _loanNFT,
        address _lendingModule,
        address _storyLicensingModule
    ) {
        require(_idoContract != address(0), "ADLV: Invalid IDO address");
        require(_storySPG != address(0), "ADLV: Invalid SPG address");
        require(_storyIPAssetRegistry != address(0), "ADLV: Invalid registry address");
        // License Registry is optional - can be address(0) if not available
        
        idoContract = IDO(_idoContract);
        storySPG = IStoryProtocolSPG(_storySPG);
        storyIPAssetRegistry = IStoryProtocolIPAssetRegistry(_storyIPAssetRegistry);
        if (_storyLicenseRegistry != address(0)) {
            storyLicenseRegistry = IStoryProtocolLicenseRegistry(_storyLicenseRegistry);
        }
        if (_storyLicensingModule != address(0)) {
            storyLicensingModule = ILicensingModule(_storyLicensingModule);
        }
        loanNFT = _loanNFT;
        lendingModule = _lendingModule;
        owner = msg.sender;
        
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
    }
    
    // ========================================
    // Owner Functions
    // ========================================
    
    /**
     * @notice Update CVS for an IP Asset (called by Agent Service)
     * @param ipId The IP Asset ID
     * @param newCVS The new CVS score
     */
    function updateCVS(bytes32 ipId, uint256 newCVS) external onlyOwner {
        idoContract.updateCVS(ipId, newCVS);
    }
    
    /**
     * @notice Set Story Protocol Licensing Module address
     * @param _storyLicensingModule The Licensing Module address
     */
    function setLicensingModule(address _storyLicensingModule) external onlyOwner {
        storyLicensingModule = ILicensingModule(_storyLicensingModule);
        emit LicensingModuleUpdated(_storyLicensingModule);
    }
    
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
    
    function setStoryIPAssetRegistry(address _storyIPAssetRegistry) external onlyOwner {
        require(_storyIPAssetRegistry != address(0), "ADLV: Invalid registry address");
        storyIPAssetRegistry = IStoryProtocolIPAssetRegistry(_storyIPAssetRegistry);
    }
    
    function setStoryLicenseRegistry(address _storyLicenseRegistry) external onlyOwner {
        // Allow setting to address(0) to disable license registry
        if (_storyLicenseRegistry != address(0)) {
            storyLicenseRegistry = IStoryProtocolLicenseRegistry(_storyLicenseRegistry);
        } else {
            // Reset to zero address (disable)
            storyLicenseRegistry = IStoryProtocolLicenseRegistry(address(0));
        }
    }
    
    // ========================================
    // Vault Management with Story Protocol
    // ========================================
    
    /**
     * @notice Register IP Asset on Story Protocol and create vault
     * @param ipId Internal IP identifier
     * @param ipAssetType Story Protocol IP Asset type (typically 1)
     * @param name Name of the IP Asset
     * @param hash Content hash of the IP Asset
     * @param registrationData Additional registration data
     * @return vaultAddress The created vault address
     * @return storyIPId The registered Story Protocol IP ID
     */
    function registerIPAndCreateVault(
        bytes32 ipId,
        uint8 ipAssetType,
        string calldata name,
        bytes32 hash,
        bytes calldata registrationData
    ) external returns (address vaultAddress, string memory storyIPId) {
        require(ipToVault[ipId] == address(0), "ADLV: Vault already exists");
        
        // Try to register IP Asset on Story Protocol via SPG
        // If Story Protocol is not available, create vault without Story IP ID
        if (address(storySPG) != address(0)) {
            try storySPG.register(ipAssetType, name, hash, registrationData) returns (string memory _storyIPId) {
                storyIPId = _storyIPId;
                
                // Verify registration if successful
                if (bytes(storyIPId).length > 0 && address(storyIPAssetRegistry) != address(0)) {
                    try storyIPAssetRegistry.exists(storyIPId) returns (bool exists) {
                        if (!exists) {
                            storyIPId = ""; // Clear if not verified
                        }
                    } catch {
                        storyIPId = ""; // Clear on error
                    }
                }
            } catch {
                // Story Protocol not available, continue without it
                storyIPId = "";
            }
        }
        
        // Create vault (with or without Story IP ID)
        vaultAddress = _createVaultInternal(ipId, storyIPId);
        
        return (vaultAddress, storyIPId);
    }
    
    /**
     * @notice Create vault with existing Story Protocol IP ID
     * @param ipId Internal IP identifier
     * @param storyIPId Story Protocol IP ID (must be registered)
     * @return vaultAddress The created vault address
     */
    function createVault(
        bytes32 ipId,
        string calldata storyIPId
    ) external returns (address vaultAddress) {
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
    ) external payable vaultExists(vaultAddress) returns (string memory licenseId) {
        require(msg.value > 0, "ADLV: Invalid price");
        
        Vault storage vault = vaults[vaultAddress];
        bytes32 ipId = vault.ipId;
        
        // Try to register license on Story Protocol if available
        bool storyRegistered = false;
        if (vault.registeredOnStory && bytes(vault.storyIPId).length > 0 && address(storyLicenseRegistry) != address(0)) {
            bytes memory terms = abi.encode(
                vaultAddress,
                block.timestamp,
                licenseType
            );
            
            try storyLicenseRegistry.registerLicense(
                vault.storyIPId,
                licenseType,
                msg.sender,
                terms,
                msg.value
            ) returns (string memory _licenseId) {
                if (bytes(_licenseId).length > 0) {
                    licenseId = _licenseId;
                    vaultLicenses[vaultAddress].push(licenseId);
                    storyRegistered = true;
                    
                    emit LicenseRegistered(
                        vaultAddress,
                        ipId,
                        licenseId,
                        msg.sender,
                        licenseType,
                        msg.value
                    );
                }
            } catch {
                // Story Protocol not available, continue with local license
            }
        }
        
        // Create local license ID if Story registration failed or not available
        if (!storyRegistered) {
            licenseId = string(abi.encodePacked(
                "license-",
                uint2str(block.timestamp),
                "-",
                addressToString(msg.sender),
                "-",
                uint2str(msg.value)
            ));
            vaultLicenses[vaultAddress].push(licenseId);
        }
        
        _distributeLicenseRevenue(vaultAddress, ipId, msg.value);
        
        emit LicenseSold(vaultAddress, ipId, msg.sender, msg.value, licenseType);
        
        return licenseId;
    }
    
    /**
     * @notice Sell license with PIL (Programmable IP License) policy support
     * @dev Mints license via Story Protocol Licensing Module with PIL policy
     * @param vaultAddress The vault address
     * @param policyId The PIL policy ID (1 = Non-Commercial Social Remixing, 2 = Commercial Use, 3 = Commercial Remix)
     * @param licenseType License type description
     * @param duration License duration in seconds
     * @return licenseId The created license ID
     * @return mintedLicenseTokenIds Array of minted license token IDs from Story Protocol
     */
    function sellLicenseWithPILPolicy(
        address vaultAddress,
        uint256 policyId,
        string calldata licenseType,
        uint256 duration
    ) external payable vaultExists(vaultAddress) returns (string memory licenseId, uint256[] memory mintedLicenseTokenIds) {
        require(msg.value > 0, "ADLV: Invalid price");
        require(policyId >= 1 && policyId <= 3, "ADLV: Invalid PIL policy ID");
        
        Vault storage vault = vaults[vaultAddress];
        require(vault.registeredOnStory && bytes(vault.storyIPId).length > 0, "ADLV: IP not registered on Story");
        
        bytes32 ipId = vault.ipId;
        
        // Get IPAccount for this IP Asset
        address ipAccount = _getIPAccount(vault.storyIPId);
        address ipIdAddress = _parseStoryIPId(vault.storyIPId);
        
        // If policy not attached yet, attach it first
        if (vaultLicenseTermsId[vaultAddress] == 0 && address(storyLicensingModule) != address(0)) {
            bytes memory attachData = abi.encodeWithSelector(
                ILicensingModule.attachLicenseTerms.selector,
                ipIdAddress,
                policyId
            );
            
            bytes memory attachResult = _executeViaIPAccount(ipAccount, address(storyLicensingModule), attachData, 0);
            uint256 licenseTermsId = abi.decode(attachResult, (uint256));
            
            vaultLicenseTermsId[vaultAddress] = licenseTermsId;
            vaultPILPolicy[vaultAddress] = policyId;
            
            emit PILPolicyAttached(vaultAddress, ipId, policyId, licenseTermsId);
        }
        
        // Mint license via Licensing Module
        if (address(storyLicensingModule) != address(0) && vaultLicenseTermsId[vaultAddress] > 0) {
            bytes memory mintData = abi.encodeWithSelector(
                ILicensingModule.mintLicense.selector,
                ipIdAddress,
                policyId,
                1, // amount
                msg.sender // receiver
            );
            
            bytes memory mintResult = _executeViaIPAccount(ipAccount, address(storyLicensingModule), mintData, msg.value);
            mintedLicenseTokenIds = abi.decode(mintResult, (uint256[]));
            
            // Create license ID
            if (mintedLicenseTokenIds.length > 0) {
                licenseId = string(abi.encodePacked(
                    "pil-license-",
                    uint2str(mintedLicenseTokenIds[0]),
                    "-",
                    uint2str(block.timestamp)
                ));
                vaultLicenses[vaultAddress].push(licenseId);
                
                emit PILLicenseMinted(
                    vaultAddress,
                    ipId,
                    licenseId,
                    mintedLicenseTokenIds[0],
                    policyId,
                    msg.sender,
                    msg.value
                );
            }
        } else {
            // Fallback to regular license sale
            licenseId = this.sellLicense{value: msg.value}(vaultAddress, licenseType, duration);
        }
        
        // Distribute revenue
        _distributeLicenseRevenue(vaultAddress, ipId, msg.value);
        
        return (licenseId, mintedLicenseTokenIds);
    }
    
    /**
     * @notice Attach PIL policy to vault (one-time setup)
     * @dev Attaches a PIL policy to the vault's IP Asset via Licensing Module
     * @param vaultAddress The vault address
     * @param policyId The PIL policy ID (1 = Non-Commercial, 2 = Commercial Use, 3 = Commercial Remix)
     * @return licenseTermsId The attached license terms ID
     */
    function attachPILPolicyToVault(
        address vaultAddress,
        uint256 policyId
    ) external vaultExists(vaultAddress) returns (uint256 licenseTermsId) {
        require(policyId >= 1 && policyId <= 3, "ADLV: Invalid PIL policy ID");
        require(vaultLicenseTermsId[vaultAddress] == 0, "ADLV: Policy already attached");
        require(address(storyLicensingModule) != address(0), "ADLV: Licensing Module not configured");
        
        Vault storage vault = vaults[vaultAddress];
        require(vault.registeredOnStory && bytes(vault.storyIPId).length > 0, "ADLV: IP not registered on Story");
        require(vault.creator == msg.sender, "ADLV: Only creator");
        
        // Get IPAccount for this IP Asset
        address ipAccount = _getIPAccount(vault.storyIPId);
        address ipIdAddress = _parseStoryIPId(vault.storyIPId);
        
        // Attach license terms via IPAccount
        bytes memory data = abi.encodeWithSelector(
            ILicensingModule.attachLicenseTerms.selector,
            ipIdAddress,
            policyId
        );
        
        bytes memory result = _executeViaIPAccount(ipAccount, address(storyLicensingModule), data, 0);
        licenseTermsId = abi.decode(result, (uint256));
        
        // Store policy info
        vaultLicenseTermsId[vaultAddress] = licenseTermsId;
        vaultPILPolicy[vaultAddress] = policyId;
        
        emit PILPolicyAttached(vaultAddress, vault.ipId, policyId, licenseTermsId);
        
        return licenseTermsId;
    }
    
    // Helper function to convert address to string
    function addressToString(address _addr) internal pure returns (string memory) {
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
    
    // Helper function to convert uint to string
    function uint2str(uint256 _i) internal pure returns (string memory) {
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
        return _issueLoanInternal(vaultAddress, loanAmount, duration, address(0), msg.value);
    }
    
    /**
     * @notice Issue loan with IP collateral
     * @param vaultAddress The vault address
     * @param loanAmount Amount to borrow
     * @param duration Loan duration
     * @param ipCollateral IP asset address to use as collateral
     * @return loanId The loan ID
     */
    function issueLoanWithIPCollateral(
        address vaultAddress,
        uint256 loanAmount,
        uint256 duration,
        address ipCollateral
    ) external payable vaultExists(vaultAddress) returns (uint256 loanId) {
        require(ipCollateral != address(0), "ADLV: Invalid IP collateral");
        
        // Verify IP ownership via Story Protocol
        address ipOwner = storyIPAssetRegistry.ownerOf(addressToString(ipCollateral));
        require(ipOwner == msg.sender, "ADLV: Not IP owner");
        
        return _issueLoanInternal(vaultAddress, loanAmount, duration, ipCollateral, msg.value);
    }
    
    /**
     * @notice Internal function to issue loan
     */
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
            
            // Get IP CVS value
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
            
            emit IPCollateralAdded(loanId, ipCollateral, ipCollateralVal);
        }
        
        vault.totalLoansIssued += loanAmount;
        vault.activeLoansCount += 1;
        vault.availableLiquidity -= loanAmount;
        
        // Mint Loan NFT
        if (loanNFT != address(0)) {
            try ILoanNFT(loanNFT).mint(msg.sender, loanId) returns (uint256 nftTokenId) {
                emit LoanNFTMinted(loanId, nftTokenId, msg.sender);
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
    
    // ========================================
    // Deposit/Withdraw
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
    
    /**
     * @notice Verify IP Asset exists on Story Protocol
     * @param storyIPId Story Protocol IP ID
     * @return exists True if IP exists
     * @return ipOwner The owner of the IP Asset
     */
    function verifyIPAsset(string calldata storyIPId) external view returns (bool exists, address ipOwner) {
        exists = storyIPAssetRegistry.exists(storyIPId);
        if (exists) {
            ipOwner = storyIPAssetRegistry.ownerOf(storyIPId);
        }
    }
    
    /**
     * @notice Get all licenses for a vault
     * @param vaultAddress The vault address
     * @return Array of license IDs
     */
    function getVaultLicenses(address vaultAddress) external view returns (string[] memory) {
        return vaultLicenses[vaultAddress];
    }
    
    /**
     * @notice Get IPAccount address for a vault's Story IP Asset
     * @dev Returns the IPAccount (Smart Contract Account) for the vault's IP Asset
     * @param vaultAddress The vault address
     * @return ipAccount The IPAccount address
     */
    function getVaultIPAccount(address vaultAddress) external view vaultExists(vaultAddress) returns (address ipAccount) {
        Vault memory vault = vaults[vaultAddress];
        require(vault.registeredOnStory && bytes(vault.storyIPId).length > 0, "ADLV: IP not registered on Story");
        return _getIPAccount(vault.storyIPId);
    }
    
    /**
     * @notice Get IPAccount address for a Story IP ID
     * @param storyIPId Story Protocol IP ID
     * @return ipAccount The IPAccount address
     */
    function getIPAccountByStoryIPId(string calldata storyIPId) external view returns (address ipAccount) {
        require(bytes(storyIPId).length > 0, "ADLV: Empty Story IP ID");
        return _getIPAccount(storyIPId);
    }
    
    /**
     * @notice Get license information from Story Protocol
     * @param licenseId The license ID
     * @return ipId The IP Asset ID
     * @return licenseType The license type
     * @return licensee The licensee address
     * @return licensor The licensor address
     * @return price The license price
     * @return registeredAt Timestamp of registration
     */
    function getLicenseInfo(string calldata licenseId) external view returns (
        string memory ipId,
        string memory licenseType,
        address licensee,
        address licensor,
        uint256 price,
        uint256 registeredAt
    ) {
        require(address(storyLicenseRegistry) != address(0), "ADLV: License Registry not configured");
        return storyLicenseRegistry.getLicense(licenseId);
    }
    
    // ========================================
    // Royalty & Revenue Functions
    // ========================================
    
    /**
     * @notice Set royalty policy for vault's IP
     * @dev Executes via IPAccount.execute() as per Story Protocol architecture
     * @param vaultAddress The vault address
     * @param beneficiary The royalty beneficiary
     * @param royaltyPercentage Royalty percentage (basis points)
     */
    function setRoyaltyPolicy(
        address vaultAddress,
        address beneficiary,
        uint256 royaltyPercentage
    ) external vaultExists(vaultAddress) {
        Vault storage vault = vaults[vaultAddress];
        require(vault.creator == msg.sender, "ADLV: Only creator");
        require(vault.registeredOnStory && bytes(vault.storyIPId).length > 0, "ADLV: IP not registered on Story");
        
        // Get IPAccount for this IP Asset
        address ipAccount = _getIPAccount(vault.storyIPId);
        
        // Parse Story IP ID to address
        address ipId = _parseStoryIPId(vault.storyIPId);
        
        // Encode function call data
        bytes memory data = abi.encodeWithSelector(
            IStoryProtocolSPG.setRoyaltyPolicy.selector,
            ipId,
            beneficiary,
            royaltyPercentage
        );
        
        // Execute via IPAccount
        _executeViaIPAccount(ipAccount, address(storySPG), data, 0);
    }
    
    /**
     * @notice Claim accumulated royalties for vault
     * @dev Executes via IPAccount.execute() as per Story Protocol architecture
     * @param vaultAddress The vault address
     * @return claimedAmount Amount claimed
     */
    function claimRoyalties(
        address vaultAddress
    ) external vaultExists(vaultAddress) returns (uint256 claimedAmount) {
        Vault storage vault = vaults[vaultAddress];
        require(vault.creator == msg.sender, "ADLV: Only creator");
        require(vault.registeredOnStory && bytes(vault.storyIPId).length > 0, "ADLV: IP not registered on Story");
        
        // Get IPAccount for this IP Asset
        address ipAccount = _getIPAccount(vault.storyIPId);
        
        // Parse Story IP ID to address
        address ipId = _parseStoryIPId(vault.storyIPId);
        
        // Encode function call data
        bytes memory data = abi.encodeWithSelector(
            IStoryProtocolSPG.claimRevenue.selector,
            ipId,
            msg.sender
        );
        
        // Execute via IPAccount and decode result
        bytes memory result = _executeViaIPAccount(ipAccount, address(storySPG), data, 0);
        claimedAmount = abi.decode(result, (uint256));
        
        emit RoyaltiesClaimed(vaultAddress, msg.sender, claimedAmount);
        
        return claimedAmount;
    }
    
    /**
     * @notice Get pending revenue for vault creator
     * @param vaultAddress The vault address
     * @return pendingAmount Pending revenue amount
     */
    function getPendingRevenue(
        address vaultAddress
    ) external view vaultExists(vaultAddress) returns (uint256 pendingAmount) {
        Vault memory vault = vaults[vaultAddress];
        
        // Get pending revenue from Story Protocol
        try IStoryProtocolSPG(address(storySPG)).getPendingRevenue(vault.creator) returns (uint256 amount) {
            return amount;
        } catch {
            return 0;
        }
    }
    
    // ========================================
    // Derivative IP Functions
    // ========================================
    
    /**
     * @notice Register derivative IP and create vault
     * @dev Executes via IPAccount.execute() as per Story Protocol architecture
     * @param parentVaultAddress Parent vault address
     * @param licenseId License ID from parent
     * @param name Derivative IP name
     * @param contentHash Derivative content hash
     * @return derivativeVaultAddress The created derivative vault
     * @return derivativeIpId The derivative IP ID
     */
    function registerDerivativeIP(
        address parentVaultAddress,
        uint256 licenseId,
        string calldata name,
        bytes32 contentHash
    ) external vaultExists(parentVaultAddress) returns (
        address derivativeVaultAddress,
        address derivativeIpId
    ) {
        Vault storage parentVault = vaults[parentVaultAddress];
        require(parentVault.registeredOnStory && bytes(parentVault.storyIPId).length > 0, "ADLV: Parent not on Story");
        
        // Get IPAccount for parent IP Asset
        address parentIPAccount = _getIPAccount(parentVault.storyIPId);
        
        // Parse parent Story IP ID to address
        address parentIpId = _parseStoryIPId(parentVault.storyIPId);
        
        // Encode function call data
        bytes memory data = abi.encodeWithSelector(
            IStoryProtocolSPG.registerDerivative.selector,
            parentIpId,
            licenseId,
            msg.sender,
            name,
            contentHash
        );
        
        // Execute via IPAccount and decode result
        bytes memory result = _executeViaIPAccount(parentIPAccount, address(storySPG), data, 0);
        (uint256 tokenId, address _derivativeIpId) = abi.decode(result, (uint256, address));
        
        derivativeIpId = _derivativeIpId;
        
        // Create internal IP ID for derivative
        bytes32 derivativeInternalId = keccak256(abi.encodePacked(
            "derivative",
            parentVault.ipId,
            tokenId,
            block.timestamp
        ));
        
        // Create vault for derivative
        string memory derivativeStoryIPId = _addressToString(derivativeIpId);
        derivativeVaultAddress = _createVaultInternal(derivativeInternalId, derivativeStoryIPId);
        
        // Link derivative to parent
        derivativeToParentVault[derivativeVaultAddress] = parentVaultAddress;
        vaultDerivatives[parentVaultAddress].push(derivativeVaultAddress);
        
        emit DerivativeVaultCreated(
            derivativeVaultAddress,
            parentVaultAddress,
            derivativeIpId,
            msg.sender
        );
        
        return (derivativeVaultAddress, derivativeIpId);
    }
    
    /**
     * @notice Check if vault is derivative
     * @param vaultAddress The vault address
     * @return isDerivative True if derivative
     */
    function isDerivativeVault(
        address vaultAddress
    ) external view vaultExists(vaultAddress) returns (bool isDerivative) {
        return derivativeToParentVault[vaultAddress] != address(0);
    }
    
    /**
     * @notice Get parent vault
     * @param derivativeVaultAddress Derivative vault address
     * @return parentVaultAddress Parent vault address
     */
    function getParentVault(
        address derivativeVaultAddress
    ) external view vaultExists(derivativeVaultAddress) returns (address parentVaultAddress) {
        parentVaultAddress = derivativeToParentVault[derivativeVaultAddress];
        require(parentVaultAddress != address(0), "ADLV: Not a derivative");
        return parentVaultAddress;
    }
    
    /**
     * @notice Get all derivative vaults
     * @param parentVaultAddress Parent vault address
     * @return derivatives Array of derivative vault addresses
     */
    function getDerivativeVaults(
        address parentVaultAddress
    ) external view vaultExists(parentVaultAddress) returns (address[] memory derivatives) {
        return vaultDerivatives[parentVaultAddress];
    }
    
    /**
     * @notice Sell license with automatic royalty sharing for derivatives
     * @dev Executes via IPAccount.execute() as per Story Protocol architecture
     * @param vaultAddress The vault address
     * @param licenseType License type
     * @param duration License duration
     * @return licenseId The created license ID
     */
    function sellLicenseWithSharing(
        address vaultAddress,
        string calldata licenseType,
        uint256 duration
    ) external payable vaultExists(vaultAddress) returns (string memory licenseId) {
        require(msg.value > 0, "ADLV: Invalid price");
        
        Vault storage vault = vaults[vaultAddress];
        
        // Check if derivative
        bool isDerivative = derivativeToParentVault[vaultAddress] != address(0);
        
        if (isDerivative && vault.registeredOnStory && bytes(vault.storyIPId).length > 0) {
            // Get IPAccount for this IP Asset
            address ipAccount = _getIPAccount(vault.storyIPId);
            
            // Parse Story IP ID to address
            address ipId = _parseStoryIPId(vault.storyIPId);
            
            // Encode function call data
            bytes memory data = abi.encodeWithSelector(
                IStoryProtocolSPG.payRoyaltyWithSharing.selector,
                ipId,
                msg.sender
            );
            
            // Execute via IPAccount with ETH value
            _executeViaIPAccount(ipAccount, address(storySPG), data, msg.value);
        } else {
            // Regular license sale
            return this.sellLicense{value: msg.value}(vaultAddress, licenseType, duration);
        }
        
        // Create license ID
        licenseId = string(abi.encodePacked(
            "license-",
            uint2str(block.timestamp),
            "-",
            addressToString(msg.sender)
        ));
        
        vaultLicenses[vaultAddress].push(licenseId);
        
        emit LicenseSold(vaultAddress, vault.ipId, msg.sender, msg.value, licenseType);
        
        return licenseId;
    }
    
    // ========================================
    // Advanced Lending Functions
    // ========================================
    
    /**
     * @notice Update loan health factor
     * @param loanId The loan ID
     * @return healthFactor Updated health factor
     */
    function updateLoanHealth(uint256 loanId) public returns (uint256 healthFactor) {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Active, "ADLV: Loan not active");
        
        // Get current collateral value
        uint256 currentCollateralValue = loan.collateralAmount;
        
        if (loan.ipCollateral != address(0)) {
            bytes32 ipCollateralId = keccak256(abi.encodePacked(loan.ipCollateral));
            uint256 currentIPValue = idoContract.getCVS(ipCollateralId);
            currentCollateralValue += currentIPValue;
        }
        
        // Calculate current debt (principal + accrued interest)
        uint256 accruedInterest = calculateAccruedInterest(loanId);
        uint256 totalDebt = loan.outstandingAmount + accruedInterest;
        
        // Calculate health factor
        healthFactor = (currentCollateralValue * 10000) / totalDebt;
        loan.healthFactor = healthFactor;
        loan.accruedInterest = accruedInterest;
        
        // Get current CVS
        bytes32 ipId = vaults[loan.vaultAddress].ipId;
        uint256 currentCVS = idoContract.getCVS(ipId);
        
        emit LoanHealthUpdated(loanId, healthFactor, currentCVS);
        
        return healthFactor;
    }
    
    /**
     * @notice Calculate accrued interest for a loan
     * @param loanId The loan ID
     * @return interest Accrued interest amount
     */
    function calculateAccruedInterest(uint256 loanId) public view returns (uint256 interest) {
        Loan memory loan = loans[loanId];
        
        if (loan.status != LoanStatus.Active) {
            return loan.accruedInterest;
        }
        
        uint256 timeElapsed = block.timestamp - loan.startTime;
        uint256 principal = loan.outstandingAmount;
        uint256 annualRate = loan.interestRate;
        
        // Interest = Principal * Rate * Time / (10000 * 365 days)
        interest = (principal * annualRate * timeElapsed) / (10000 * 365 days);
        
        return interest;
    }
    
    /**
     * @notice Liquidate undercollateralized loan
     * @param loanId The loan ID
     */
    function liquidateLoan(uint256 loanId) external {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Active, "ADLV: Loan not active");
        
        // Update health factor
        uint256 healthFactor = updateLoanHealth(loanId);
        
        // Check if loan is liquidatable
        require(
            healthFactor < MIN_HEALTH_FACTOR || block.timestamp > loan.endTime,
            "ADLV: Loan not liquidatable"
        );
        
        loan.status = LoanStatus.Liquidated;
        
        Vault storage vault = vaults[loan.vaultAddress];
        vault.activeLoansCount -= 1;
        
        // Calculate liquidation amounts
        uint256 totalDebt = loan.outstandingAmount + loan.accruedInterest;
        uint256 liquidationPenalty = (totalDebt * defaultLoanTerms.liquidationPenalty) / 10000;
        uint256 protocolFee = (loan.collateralAmount * liquidationFeeBps) / 10000;
        
        // Distribute collateral
        uint256 vaultShare = loan.collateralAmount - protocolFee;
        vault.totalLiquidity += vaultShare;
        vault.availableLiquidity += vaultShare;
        
        if (protocolFee > 0) {
            payable(owner).transfer(protocolFee);
        }
        
        // Transfer liquidation reward to liquidator
        if (liquidationPenalty > 0 && address(this).balance >= liquidationPenalty) {
            payable(msg.sender).transfer(liquidationPenalty);
        }
        
        // Burn Loan NFT
        if (loanNFT != address(0)) {
            try ILoanNFT(loanNFT).burn(ILoanNFT(loanNFT).getTokenId(loanId)) {} catch {}
        }
        
        emit LoanLiquidated(loan.vaultAddress, loan.borrower, loanId);
    }
    
    /**
     * @notice Set custom loan terms for vault
     * @param vaultAddress The vault address
     * @param terms Custom loan terms
     */
    function setVaultLoanTerms(
        address vaultAddress,
        LoanTerms calldata terms
    ) external vaultExists(vaultAddress) {
        Vault storage vault = vaults[vaultAddress];
        require(vault.creator == msg.sender, "ADLV: Only creator");
        
        vaultLoanTerms[vaultAddress] = terms;
        
        emit LoanTermsUpdated(
            vaultAddress,
            terms.minLoanAmount,
            terms.maxLoanAmount,
            terms.minCollateralRatio
        );
    }
    
    /**
     * @notice Get loan details with current status
     * @param loanId The loan ID
     * @return loan Loan struct
     * @return currentHealth Current health factor
     * @return currentDebt Current total debt
     */
    function getLoanDetails(uint256 loanId) external view returns (
        Loan memory loan,
        uint256 currentHealth,
        uint256 currentDebt
    ) {
        loan = loans[loanId];
        
        if (loan.status == LoanStatus.Active) {
            // Calculate current values
            uint256 accruedInterest = calculateAccruedInterest(loanId);
            currentDebt = loan.outstandingAmount + accruedInterest;
            
            uint256 currentCollateralValue = loan.collateralAmount;
            if (loan.ipCollateral != address(0)) {
                bytes32 ipCollateralId = keccak256(abi.encodePacked(loan.ipCollateral));
                currentCollateralValue += idoContract.getCVS(ipCollateralId);
            }
            
            currentHealth = (currentCollateralValue * 10000) / currentDebt;
        } else {
            currentHealth = loan.healthFactor;
            currentDebt = loan.outstandingAmount + loan.accruedInterest;
        }
        
        return (loan, currentHealth, currentDebt);
    }
    
    /**
     * @notice Calculate dynamic interest rate
     * @param cvs Current CVS value
     * @param availableLiquidity Available liquidity
     * @param totalLiquidity Total liquidity
     * @return rate Interest rate (basis points)
     */
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
            // Utilization-based rate
            if (totalLiquidity == 0) return baseRate;
            
            uint256 utilization = ((totalLiquidity - availableLiquidity) * 10000) / totalLiquidity;
            
            // Rate increases with utilization
            // 0% utilization = base rate
            // 100% utilization = base rate * 3
            rate = baseRate + (baseRate * 2 * utilization) / 10000;
            
        } else {
            // Dynamic rate based on CVS and utilization
            if (totalLiquidity == 0) return baseRate;
            
            uint256 utilization = ((totalLiquidity - availableLiquidity) * 10000) / totalLiquidity;
            
            // CVS discount (higher CVS = lower rate)
            uint256 cvsDiscount = cvs / 1000000 ether; // 1% discount per 1M CVS
            if (cvsDiscount > 500) cvsDiscount = 500; // Max 5% discount
            
            // Utilization premium
            uint256 utilizationPremium = (baseRate * utilization) / 10000;
            
            rate = baseRate + utilizationPremium;
            if (rate > cvsDiscount) {
                rate -= cvsDiscount;
            } else {
                rate = baseRate / 2; // Minimum 50% of base rate
            }
        }
        
        // Ensure rate is within reasonable bounds
        if (rate < 100) rate = 100;   // Min 1% APR
        if (rate > 10000) rate = 10000; // Max 100% APR
        
        return rate;
    }
    
    /**
     * @notice Get loans by IP collateral
     * @param ipAsset IP asset address
     * @return loanIds Array of loan IDs
     */
    function getLoansByIPCollateral(address ipAsset) external view returns (uint256[] memory) {
        return ipCollateralLoans[ipAsset];
    }
    
    /**
     * @notice Check if loan is liquidatable
     * @param loanId The loan ID
     * @return isLiquidatable True if loan can be liquidated
     * @return reason Reason for liquidation
     */
    function isLoanLiquidatable(uint256 loanId) external view returns (
        bool isLiquidatable,
        string memory reason
    ) {
        Loan memory loan = loans[loanId];
        
        if (loan.status != LoanStatus.Active) {
            return (false, "Loan not active");
        }
        
        // Calculate current health
        uint256 accruedInterest = calculateAccruedInterest(loanId);
        uint256 totalDebt = loan.outstandingAmount + accruedInterest;
        
        uint256 currentCollateralValue = loan.collateralAmount;
        if (loan.ipCollateral != address(0)) {
            bytes32 ipCollateralId = keccak256(abi.encodePacked(loan.ipCollateral));
            currentCollateralValue += idoContract.getCVS(ipCollateralId);
        }
        
        uint256 healthFactor = (currentCollateralValue * 10000) / totalDebt;
        
        if (healthFactor < MIN_HEALTH_FACTOR) {
            return (true, "Undercollateralized");
        }
        
        if (block.timestamp > loan.endTime) {
            return (true, "Loan expired");
        }
        
        return (false, "Loan healthy");
    }
    
    // ========================================
    // Helper Functions
    // ========================================
    
    /**
     * @notice Get IPAccount address for a given Story IP ID
     * @dev IPAccount is the execution layer for IP Assets in Story Protocol
     * @param storyIPId Story Protocol IP ID (string format)
     * @return ipAccount The IPAccount address
     */
    function _getIPAccount(string memory storyIPId) internal view returns (address ipAccount) {
        require(bytes(storyIPId).length > 0, "ADLV: Empty Story IP ID");
        
        // Try to resolve IPAccount from Registry
        try storyIPAssetRegistry.resolve(storyIPId) returns (address account) {
            require(account != address(0), "ADLV: IPAccount not found");
            return account;
        } catch {
            // Fallback: If resolve fails, try to get from parsed address
            address ipId = _parseStoryIPId(storyIPId);
            try storyIPAssetRegistry.resolve(ipId) returns (address account) {
                require(account != address(0), "ADLV: IPAccount not found");
                return account;
            } catch {
                revert("ADLV: Failed to resolve IPAccount");
            }
        }
    }
    
    /**
     * @notice Execute a function call via IPAccount
     * @dev This ensures all IP-related operations go through IPAccount.execute()
     * @param ipAccount The IPAccount address
     * @param target Target contract to call
     * @param data Encoded function call data
     * @param value ETH value to send
     * @return result Return data from execution
     */
    function _executeViaIPAccount(
        address ipAccount,
        address target,
        bytes memory data,
        uint256 value
    ) internal returns (bytes memory result) {
        require(ipAccount != address(0), "ADLV: Invalid IPAccount");
        
        // Execute via IPAccount
        try IIPAccount(ipAccount).execute(target, data, value) returns (bytes memory ret) {
            return ret;
        } catch Error(string memory reason) {
            revert(string(abi.encodePacked("ADLV: IPAccount execution failed: ", reason)));
        } catch {
            revert("ADLV: IPAccount execution failed");
        }
    }
    
    /**
     * @notice Parse Story IP ID string to address
     */
    function _parseStoryIPId(string memory storyIPId) internal pure returns (address) {
        // If storyIPId is already an address string, parse it
        bytes memory strBytes = bytes(storyIPId);
        if (strBytes.length == 42 && strBytes[0] == '0' && strBytes[1] == 'x') {
            return _parseAddress(storyIPId);
        }
        // Otherwise, hash it to get an address
        return address(uint160(uint256(keccak256(abi.encodePacked(storyIPId)))));
    }
    
    /**
     * @notice Parse address from string
     */
    function _parseAddress(string memory str) internal pure returns (address) {
        bytes memory strBytes = bytes(str);
        require(strBytes.length == 42, "Invalid address length");
        
        uint160 result = 0;
        for (uint256 i = 2; i < 42; i++) {
            uint8 digit = uint8(strBytes[i]);
            uint8 value;
            if (digit >= 48 && digit <= 57) {
                value = digit - 48;
            } else if (digit >= 65 && digit <= 70) {
                value = digit - 55;
            } else if (digit >= 97 && digit <= 102) {
                value = digit - 87;
            } else {
                revert("Invalid hex character");
            }
            result = result * 16 + value;
        }
        return address(result);
    }
    
    /**
     * @notice Convert address to string
     */
    function _addressToString(address _addr) internal pure returns (string memory) {
        return addressToString(_addr);
    }
}
