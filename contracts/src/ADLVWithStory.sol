// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IDO.sol";
import "./interfaces/IStoryProtocolSPG.sol";
import "./interfaces/IStoryProtocolIPAssetRegistry.sol";
import "./interfaces/IStoryProtocolLicenseRegistry.sol";

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
    mapping(address => string[]) public vaultLicenses; // Vault address to license IDs
    mapping(address => address) public derivativeToParentVault; // Derivative vault => Parent vault
    mapping(address => address[]) public vaultDerivatives; // Parent vault => Derivative vaults[]
    
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
        address _storyLicenseRegistry
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
        owner = msg.sender;
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
        
        // Parse Story IP ID to address
        address ipId = _parseStoryIPId(vault.storyIPId);
        
        // Set royalty policy on Story Protocol
        IStoryProtocolSPG(address(storySPG)).setRoyaltyPolicy(ipId, beneficiary, royaltyPercentage);
    }
    
    /**
     * @notice Claim accumulated royalties for vault
     * @param vaultAddress The vault address
     * @return claimedAmount Amount claimed
     */
    function claimRoyalties(
        address vaultAddress
    ) external vaultExists(vaultAddress) returns (uint256 claimedAmount) {
        Vault storage vault = vaults[vaultAddress];
        require(vault.creator == msg.sender, "ADLV: Only creator");
        
        // Parse Story IP ID to address
        address ipId = _parseStoryIPId(vault.storyIPId);
        
        // Claim revenue from Story Protocol
        claimedAmount = IStoryProtocolSPG(address(storySPG)).claimRevenue(ipId, msg.sender);
        
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
        require(parentVault.registeredOnStory, "ADLV: Parent not on Story");
        
        // Parse parent Story IP ID to address
        address parentIpId = _parseStoryIPId(parentVault.storyIPId);
        
        // Register derivative on Story Protocol
        (uint256 tokenId, address _derivativeIpId) = IStoryProtocolSPG(address(storySPG))
            .registerDerivative(
                parentIpId,
                licenseId,
                msg.sender,
                name,
                contentHash
            );
        
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
        
        if (isDerivative && vault.registeredOnStory) {
            // Use Story Protocol's revenue sharing
            address ipId = _parseStoryIPId(vault.storyIPId);
            
            // Pay royalty with sharing
            IStoryProtocolSPG(address(storySPG)).payRoyaltyWithSharing{value: msg.value}(
                ipId,
                msg.sender
            );
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
    // Helper Functions
    // ========================================
    
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
