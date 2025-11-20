// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// lib/openzeppelin-contracts/contracts/utils/Context.sol

// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

// src/interfaces/IStoryProtocolIPAssetRegistry.sol

/**
 * @title IStoryProtocolIPAssetRegistry
 * @notice Interface for Story Protocol IP Asset Registry
 * @dev Core registry contract for managing IP Assets on Story Protocol
 */
interface IStoryProtocolIPAssetRegistry {
    /**
     * @notice Register a new IP Asset
     * @param ipAssetType Type of IP Asset
     * @param name Name of the IP Asset
     * @param hash Content hash
     * @param registrationData Additional registration data
     * @return ipId The registered IP Asset ID
     */
    function register(
        uint8 ipAssetType,
        string calldata name,
        bytes32 hash,
        bytes calldata registrationData
    ) external returns (string memory ipId);

    /**
     * @notice Get the owner of an IP Asset
     * @param ipId The IP Asset ID
     * @return owner The owner address
     */
    function ownerOf(string calldata ipId) external view returns (address owner);

    /**
     * @notice Check if an IP Asset exists
     * @param ipId The IP Asset ID
     * @return exists True if the IP Asset exists
     */
    function exists(string calldata ipId) external view returns (bool exists);

    /**
     * @notice Get IP Asset metadata
     * @param ipId The IP Asset ID
     * @return ipAssetType The type of the IP Asset
     * @return name The name of the IP Asset
     * @return hash The content hash
     * @return registeredAt Timestamp of registration
     */
    function getIPAsset(string calldata ipId)
        external
        view
        returns (
            uint8 ipAssetType,
            string memory name,
            bytes32 hash,
            uint256 registeredAt
        );

    /**
     * @notice Transfer IP Asset ownership
     * @param ipId The IP Asset ID
     * @param to The new owner address
     */
    function transfer(string calldata ipId, address to) external;
}

// src/interfaces/IStoryProtocolSPG.sol

/**
 * @title IStoryProtocolSPG
 * @notice Interface for Story Protocol SPG (Story Protocol Gateway/Periphery)
 * @dev SPG is the recommended periphery contract for registration and minting
 * This interface provides the essential functions needed for IP Asset registration
 */
interface IStoryProtocolSPG {
    /**
     * @notice Register an IP Asset on Story Protocol
     * @param ipAssetType Type of IP Asset (e.g., 1 for Story IP Asset)
     * @param name Name of the IP Asset
     * @param hash Content hash of the IP Asset
     * @param registrationData Additional registration data
     * @return ipId The registered IP Asset ID
     */
    function register(
        uint8 ipAssetType,
        string calldata name,
        bytes32 hash,
        bytes calldata registrationData
    ) external returns (string memory ipId);

    /**
     * @notice Mint an IP Asset NFT
     * @param ipId The IP Asset ID to mint
     * @param to Address to mint the NFT to
     * @return tokenId The minted token ID
     */
    function mint(string calldata ipId, address to) external returns (uint256 tokenId);

    /**
     * @notice Get IP Asset information
     * @param ipId The IP Asset ID
     * @return owner The owner of the IP Asset
     * @return ipAssetType The type of the IP Asset
     * @return registeredAt Timestamp of registration
     */
    function getIPAsset(string calldata ipId)
        external
        view
        returns (
            address owner,
            uint8 ipAssetType,
            uint256 registeredAt
        );

    /**
     * @notice Check if an IP Asset is registered
     * @param ipId The IP Asset ID
     * @return isRegistered True if the IP Asset is registered
     */
    function isRegistered(string calldata ipId) external view returns (bool isRegistered);
}

// lib/openzeppelin-contracts/contracts/access/Ownable.sol

// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// src/IDO.sol

/**
 * @title IDO (IP Data Oracle)
 * @notice Stores and tracks the dynamic Collateral Value Score (CVS) for each IP Asset.
 * The CVS is calculated off-chain by the Agent Service and updated by the ADLV contract.
 */
contract IDO is Ownable {
    // 1. تخزين CVS لكل IP Asset ID
    mapping(bytes32 => uint256) public ipAssetCVS; // maps ipId to its current CVS score

    // 2. تتبع إجمالي الإيرادات المجمعة من التراخيص
    mapping(bytes32 => uint256) public totalLicenseRevenue; // maps ipId to total revenue collected

    event CVSUpdated(bytes32 indexed ipId, uint256 newCVS, uint256 oldCVS);
    event RevenueCollected(bytes32 indexed ipId, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Updates the CVS for a specific IP Asset.
     * @dev ONLY callable by the owner (which will be the ADLV contract).
     * @param ipId The ID of the IP Asset.
     * @param newCVS The newly calculated CVS score.
     */
    function updateCVS(bytes32 ipId, uint256 newCVS) external onlyOwner {
        uint256 oldCVS = ipAssetCVS[ipId];
        ipAssetCVS[ipId] = newCVS;
        emit CVSUpdated(ipId, newCVS, oldCVS);
    }

    /**
     * @notice Records revenue collected from data licensing.
     * @dev ONLY callable by the owner (the ADLV contract).
     * @param ipId The ID of the IP Asset.
     * @param amount The revenue amount to record.
     */
    function recordRevenue(bytes32 ipId, uint256 amount) external onlyOwner {
        totalLicenseRevenue[ipId] += amount;
        emit RevenueCollected(ipId, amount);
    }

    /**
     * @notice Gets the current CVS score for an IP Asset.
     * @param ipId The ID of the IP Asset.
     * @return The current CVS score.
     */
    function getCVS(bytes32 ipId) external view returns (uint256) {
        return ipAssetCVS[ipId];
    }
}

// src/ADLVWithStory.sol

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

