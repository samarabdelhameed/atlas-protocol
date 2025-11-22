// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IDO.sol";
import "./interfaces/IStoryProtocolSPG.sol";
import "./interfaces/IStoryProtocolIPAssetRegistry.sol";

/**
 * @title MultiAssetVault - Vault supporting multiple IP assets
 * @notice Enables vaults to hold multiple IP assets, multi-token pools, multi-CVS, and multi-licensing types
 * @dev Similar to Uniswap V3 but for IP assets - "Basket of IP"
 */
contract MultiAssetVault is ReentrancyGuard, Pausable, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    
    /// @notice IDO contract reference
    IDO public idoContract;
    
    /// @notice Story Protocol SPG address
    IStoryProtocolSPG public storySPG;
    
    /// @notice Story Protocol IP Asset Registry address
    IStoryProtocolIPAssetRegistry public storyIPAssetRegistry;
    
    /// @notice Counter for vault IDs
    uint256 public vaultCounter;
    
    /// @notice Protocol fee percentage (basis points)
    uint256 public protocolFeeBps = 500; // 5%
    
    /// @notice Protocol owner (for fee collection)
    address public protocolOwner;
    
    // ========================================
    // Multi-Asset Vault Structures
    // ========================================
    
    /**
     * @notice Multi-asset vault structure
     * @dev Supports multiple IP assets in a single vault
     */
    struct MultiAssetVaultData {
        address vaultAddress;
        address creator;
        uint256 totalLiquidity;
        uint256 availableLiquidity;
        uint256 totalLoansIssued;
        uint256 activeLoansCount;
        uint256 totalLicenseRevenue;
        uint256 createdAt;
        bool exists;
        VaultType vaultType; // Type of vault (single, multi, basket)
    }
    
    /**
     * @notice IP Asset entry in vault
     */
    struct IPAssetEntry {
        bytes32 ipId;
        string storyIPId;
        uint256 weight;              // Weight in the vault (basis points, total = 10000)
        uint256 cvsValue;            // Current CVS value
        uint256 licenseRevenue;      // Revenue from this IP
        bool isActive;
        uint256 addedAt;
    }
    
    /**
     * @notice License type configuration
     */
    struct LicenseTypeConfig {
        string licenseType;          // "commercial", "derivative", "exclusive", etc.
        uint256 priceMultiplier;     // Price multiplier (basis points)
        uint256 revenueShare;        // Revenue share for this type (basis points)
        bool isActive;
    }
    
    enum VaultType {
        Single,      // Single IP asset (legacy)
        Multi,       // Multiple IP assets with individual CVS
        Basket       // Basket of IP assets with aggregated CVS
    }
    
    // ========================================
    // Mappings
    // ========================================
    
    /// @notice Vault data mapping
    mapping(address => MultiAssetVaultData) public vaults;
    
    /// @notice IP assets in each vault
    mapping(address => IPAssetEntry[]) public vaultIPAssets;
    
    /// @notice IP asset index in vault (for quick lookup)
    mapping(address => mapping(bytes32 => uint256)) public vaultIPAssetIndex;
    
    /// @notice License type configurations per vault
    mapping(address => mapping(string => LicenseTypeConfig)) public vaultLicenseTypes;
    
    /// @notice Total CVS for each vault (aggregated for basket type)
    mapping(address => uint256) public vaultTotalCVS;
    
    /// @notice Depositor shares per vault
    mapping(address => mapping(address => uint256)) public depositorShares;
    mapping(address => uint256) public totalShares;
    
    // ========================================
    // Events
    // ========================================
    
    event MultiAssetVaultCreated(
        address indexed vaultAddress,
        address indexed creator,
        VaultType vaultType,
        bytes32[] ipIds
    );
    
    event IPAssetAdded(
        address indexed vaultAddress,
        bytes32 indexed ipId,
        string storyIPId,
        uint256 weight
    );
    
    event IPAssetRemoved(
        address indexed vaultAddress,
        bytes32 indexed ipId
    );
    
    event IPAssetWeightUpdated(
        address indexed vaultAddress,
        bytes32 indexed ipId,
        uint256 oldWeight,
        uint256 newWeight
    );
    
    event LicenseTypeConfigured(
        address indexed vaultAddress,
        string licenseType,
        uint256 priceMultiplier,
        uint256 revenueShare
    );
    
    event LicenseSold(
        address indexed vaultAddress,
        bytes32[] ipIds,
        address indexed licensee,
        uint256 price,
        string licenseType
    );
    
    event CVSUpdated(
        address indexed vaultAddress,
        uint256 oldTotalCVS,
        uint256 newTotalCVS
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
    
    modifier vaultExists(address vaultAddress) {
        require(vaults[vaultAddress].exists, "MultiAssetVault: Vault does not exist");
        _;
    }
    
    modifier onlyVaultCreator(address vaultAddress) {
        require(vaults[vaultAddress].creator == msg.sender, "MultiAssetVault: Only creator");
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
        require(_idoContract != address(0), "MultiAssetVault: Invalid IDO address");
        require(_storySPG != address(0), "MultiAssetVault: Invalid SPG address");
        require(_storyIPAssetRegistry != address(0), "MultiAssetVault: Invalid registry");
        
        idoContract = IDO(_idoContract);
        storySPG = IStoryProtocolSPG(_storySPG);
        storyIPAssetRegistry = IStoryProtocolIPAssetRegistry(_storyIPAssetRegistry);
        
        protocolOwner = msg.sender;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
    }
    
    // ========================================
    // Vault Creation
    // ========================================
    
    /**
     * @notice Create a multi-asset vault
     * @param vaultType Type of vault (Single, Multi, or Basket)
     * @param ipIds Array of IP asset IDs to include
     * @param storyIPIds Array of Story Protocol IP IDs (can be empty strings)
     * @param weights Array of weights for each IP (basis points, must sum to 10000 for Basket type)
     * @return vaultAddress The created vault address
     */
    function createMultiAssetVault(
        VaultType vaultType,
        bytes32[] calldata ipIds,
        string[] calldata storyIPIds,
        uint256[] calldata weights
    ) external whenNotPaused nonReentrant returns (address vaultAddress) {
        require(ipIds.length > 0, "MultiAssetVault: No IP assets provided");
        require(ipIds.length == storyIPIds.length, "MultiAssetVault: IP ID length mismatch");
        require(ipIds.length == weights.length, "MultiAssetVault: Weight length mismatch");
        
        // Validate weights for Basket type
        if (vaultType == VaultType.Basket) {
            uint256 totalWeight = 0;
            for (uint256 i = 0; i < weights.length; i++) {
                totalWeight += weights[i];
            }
            require(totalWeight == 10000, "MultiAssetVault: Weights must sum to 10000");
        }
        
        // Generate vault address
        vaultAddress = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            block.timestamp,
                            msg.sender,
                            vaultCounter,
                            ipIds
                        )
                    )
                )
            )
        );
        
        vaultCounter++;
        
        // Create vault
        vaults[vaultAddress] = MultiAssetVaultData({
            vaultAddress: vaultAddress,
            creator: msg.sender,
            totalLiquidity: 0,
            availableLiquidity: 0,
            totalLoansIssued: 0,
            activeLoansCount: 0,
            totalLicenseRevenue: 0,
            createdAt: block.timestamp,
            exists: true,
            vaultType: vaultType
        });
        
        // Add IP assets to vault
        uint256 totalCVS = 0;
        for (uint256 i = 0; i < ipIds.length; i++) {
            uint256 cvs = idoContract.getCVS(ipIds[i]);
            totalCVS += (vaultType == VaultType.Basket) ? (cvs * weights[i] / 10000) : cvs;
            
            vaultIPAssets[vaultAddress].push(IPAssetEntry({
                ipId: ipIds[i],
                storyIPId: storyIPIds[i],
                weight: weights[i],
                cvsValue: cvs,
                licenseRevenue: 0,
                isActive: true,
                addedAt: block.timestamp
            }));
            
            vaultIPAssetIndex[vaultAddress][ipIds[i]] = vaultIPAssets[vaultAddress].length - 1;
        }
        
        vaultTotalCVS[vaultAddress] = totalCVS;
        
        emit MultiAssetVaultCreated(vaultAddress, msg.sender, vaultType, ipIds);
        
        return vaultAddress;
    }
    
    // ========================================
    // IP Asset Management
    // ========================================
    
    /**
     * @notice Add IP asset to existing vault
     * @param vaultAddress The vault address
     * @param ipId IP asset ID to add
     * @param storyIPId Story Protocol IP ID
     * @param weight Weight for this IP (basis points)
     */
    function addIPAsset(
        address vaultAddress,
        bytes32 ipId,
        string calldata storyIPId,
        uint256 weight
    ) external whenNotPaused vaultExists(vaultAddress) onlyVaultCreator(vaultAddress) {
        require(vaultIPAssetIndex[vaultAddress][ipId] == 0 && 
                (vaultIPAssets[vaultAddress].length == 0 || 
                 vaultIPAssets[vaultAddress][vaultIPAssetIndex[vaultAddress][ipId]].ipId != ipId),
                "MultiAssetVault: IP asset already exists");
        
        require(vaults[vaultAddress].vaultType != VaultType.Single || 
                vaultIPAssets[vaultAddress].length == 0,
                "MultiAssetVault: Single vault can only have one IP");
        
        uint256 cvs = idoContract.getCVS(ipId);
        
        vaultIPAssets[vaultAddress].push(IPAssetEntry({
            ipId: ipId,
            storyIPId: storyIPId,
            weight: weight,
            cvsValue: cvs,
            licenseRevenue: 0,
            isActive: true,
            addedAt: block.timestamp
        }));
        
        vaultIPAssetIndex[vaultAddress][ipId] = vaultIPAssets[vaultAddress].length - 1;
        
        // Update total CVS
        if (vaults[vaultAddress].vaultType == VaultType.Basket) {
            vaultTotalCVS[vaultAddress] += (cvs * weight / 10000);
        } else {
            vaultTotalCVS[vaultAddress] += cvs;
        }
        
        emit IPAssetAdded(vaultAddress, ipId, storyIPId, weight);
    }
    
    /**
     * @notice Remove IP asset from vault
     * @param vaultAddress The vault address
     * @param ipId IP asset ID to remove
     */
    function removeIPAsset(
        address vaultAddress,
        bytes32 ipId
    ) external whenNotPaused vaultExists(vaultAddress) onlyVaultCreator(vaultAddress) {
        uint256 index = vaultIPAssetIndex[vaultAddress][ipId];
        require(vaultIPAssets[vaultAddress][index].isActive, "MultiAssetVault: IP asset not active");
        
        IPAssetEntry memory entry = vaultIPAssets[vaultAddress][index];
        
        // Update total CVS
        if (vaults[vaultAddress].vaultType == VaultType.Basket) {
            vaultTotalCVS[vaultAddress] -= (entry.cvsValue * entry.weight / 10000);
        } else {
            vaultTotalCVS[vaultAddress] -= entry.cvsValue;
        }
        
        vaultIPAssets[vaultAddress][index].isActive = false;
        
        emit IPAssetRemoved(vaultAddress, ipId);
    }
    
    /**
     * @notice Update weight of IP asset in vault
     * @param vaultAddress The vault address
     * @param ipId IP asset ID
     * @param newWeight New weight (basis points)
     */
    function updateIPAssetWeight(
        address vaultAddress,
        bytes32 ipId,
        uint256 newWeight
    ) external whenNotPaused vaultExists(vaultAddress) onlyVaultCreator(vaultAddress) {
        require(vaults[vaultAddress].vaultType == VaultType.Basket, 
                "MultiAssetVault: Only basket vaults support weight updates");
        
        uint256 index = vaultIPAssetIndex[vaultAddress][ipId];
        IPAssetEntry storage entry = vaultIPAssets[vaultAddress][index];
        require(entry.isActive, "MultiAssetVault: IP asset not active");
        
        uint256 oldWeight = entry.weight;
        entry.weight = newWeight;
        
        // Update total CVS
        vaultTotalCVS[vaultAddress] -= (entry.cvsValue * oldWeight / 10000);
        vaultTotalCVS[vaultAddress] += (entry.cvsValue * newWeight / 10000);
        
        emit IPAssetWeightUpdated(vaultAddress, ipId, oldWeight, newWeight);
    }
    
    // ========================================
    // License Type Configuration
    // ========================================
    
    /**
     * @notice Configure license type for vault
     * @param vaultAddress The vault address
     * @param licenseType License type name
     * @param priceMultiplier Price multiplier (basis points)
     * @param revenueShare Revenue share (basis points)
     */
    function configureLicenseType(
        address vaultAddress,
        string calldata licenseType,
        uint256 priceMultiplier,
        uint256 revenueShare
    ) external whenNotPaused vaultExists(vaultAddress) onlyVaultCreator(vaultAddress) {
        require(priceMultiplier > 0, "MultiAssetVault: Invalid price multiplier");
        require(revenueShare <= 10000, "MultiAssetVault: Invalid revenue share");
        
        vaultLicenseTypes[vaultAddress][licenseType] = LicenseTypeConfig({
            licenseType: licenseType,
            priceMultiplier: priceMultiplier,
            revenueShare: revenueShare,
            isActive: true
        });
        
        emit LicenseTypeConfigured(vaultAddress, licenseType, priceMultiplier, revenueShare);
    }
    
    // ========================================
    // License Sales
    // ========================================
    
    /**
     * @notice Sell license for vault IP assets
     * @param vaultAddress The vault address
     * @param licenseType License type
     * @param ipIds Array of IP IDs to license (empty for all)
     * @return licenseId The created license ID
     */
    function sellLicense(
        address vaultAddress,
        string calldata licenseType,
        bytes32[] calldata ipIds
    ) external payable whenNotPaused nonReentrant vaultExists(vaultAddress) returns (string memory licenseId) {
        require(msg.value > 0, "MultiAssetVault: Invalid price");
        
        MultiAssetVaultData storage vault = vaults[vaultAddress];
        LicenseTypeConfig memory config = vaultLicenseTypes[vaultAddress][licenseType];
        
        require(config.isActive, "MultiAssetVault: License type not configured");
        
        // Calculate base price based on CVS
        uint256 basePrice = vaultTotalCVS[vaultAddress] / 1000; // 0.1% of total CVS
        uint256 finalPrice = (basePrice * config.priceMultiplier) / 10000;
        
        require(msg.value >= finalPrice, "MultiAssetVault: Insufficient payment");
        
        // Determine which IPs to license
        bytes32[] memory licensedIPs;
        if (ipIds.length == 0) {
            // License all IPs
            licensedIPs = new bytes32[](vaultIPAssets[vaultAddress].length);
            uint256 activeCount = 0;
            for (uint256 i = 0; i < vaultIPAssets[vaultAddress].length; i++) {
                if (vaultIPAssets[vaultAddress][i].isActive) {
                    licensedIPs[activeCount] = vaultIPAssets[vaultAddress][i].ipId;
                    activeCount++;
                }
            }
        } else {
            licensedIPs = ipIds;
        }
        
        // Distribute revenue
        uint256 protocolFee = (msg.value * protocolFeeBps) / 10000;
        uint256 remainingRevenue = msg.value - protocolFee;
        
        // Distribute revenue to IP assets based on weight/revenue share
        for (uint256 i = 0; i < licensedIPs.length; i++) {
            uint256 index = vaultIPAssetIndex[vaultAddress][licensedIPs[i]];
            IPAssetEntry storage entry = vaultIPAssets[vaultAddress][index];
            
            uint256 ipRevenue = (remainingRevenue * entry.weight * config.revenueShare) / (10000 * 10000);
            entry.licenseRevenue += ipRevenue;
            
            idoContract.recordRevenue(licensedIPs[i], ipRevenue);
        }
        
        vault.totalLicenseRevenue += remainingRevenue;
        vault.totalLiquidity += remainingRevenue;
        vault.availableLiquidity += remainingRevenue;
        
        if (protocolFee > 0) {
            payable(protocolOwner).transfer(protocolFee);
        }
        
        // Create license ID
        licenseId = string(abi.encodePacked(
            "license-",
            _uint2str(block.timestamp),
            "-",
            _addressToString(msg.sender)
        ));
        
        emit LicenseSold(vaultAddress, licensedIPs, msg.sender, msg.value, licenseType);
        
        return licenseId;
    }
    
    // ========================================
    // CVS Management
    // ========================================
    
    /**
     * @notice Update CVS for vault (called by oracle/admin)
     * @param vaultAddress The vault address
     */
    function updateVaultCVS(
        address vaultAddress
    ) external whenNotPaused vaultExists(vaultAddress) {
        require(hasRole(ADMIN_ROLE, msg.sender) || hasRole(ORACLE_ROLE, msg.sender),
                "MultiAssetVault: Not authorized");
        
        MultiAssetVaultData storage vault = vaults[vaultAddress];
        uint256 oldTotalCVS = vaultTotalCVS[vaultAddress];
        uint256 newTotalCVS = 0;
        
        for (uint256 i = 0; i < vaultIPAssets[vaultAddress].length; i++) {
            IPAssetEntry storage entry = vaultIPAssets[vaultAddress][i];
            if (entry.isActive) {
                uint256 cvs = idoContract.getCVS(entry.ipId);
                entry.cvsValue = cvs;
                
                if (vault.vaultType == VaultType.Basket) {
                    newTotalCVS += (cvs * entry.weight / 10000);
                } else {
                    newTotalCVS += cvs;
                }
            }
        }
        
        vaultTotalCVS[vaultAddress] = newTotalCVS;
        
        emit CVSUpdated(vaultAddress, oldTotalCVS, newTotalCVS);
    }
    
    // ========================================
    // Deposit/Withdraw
    // ========================================
    
    function deposit(
        address vaultAddress
    ) external payable whenNotPaused nonReentrant vaultExists(vaultAddress) returns (uint256 shares) {
        require(msg.value > 0, "MultiAssetVault: Invalid amount");
        
        MultiAssetVaultData storage vault = vaults[vaultAddress];
        
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
    ) external whenNotPaused nonReentrant vaultExists(vaultAddress) {
        require(
            depositorShares[vaultAddress][msg.sender] >= shares,
            "MultiAssetVault: Insufficient shares"
        );
        
        MultiAssetVaultData storage vault = vaults[vaultAddress];
        
        uint256 withdrawalAmount = (shares * vault.totalLiquidity) / totalShares[vaultAddress];
        
        require(
            vault.availableLiquidity >= withdrawalAmount,
            "MultiAssetVault: Insufficient liquidity"
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
    
    function getVault(address vaultAddress) external view returns (MultiAssetVaultData memory) {
        return vaults[vaultAddress];
    }
    
    function getVaultIPAssets(address vaultAddress) external view returns (IPAssetEntry[] memory) {
        return vaultIPAssets[vaultAddress];
    }
    
    function getVaultTotalCVS(address vaultAddress) external view returns (uint256) {
        return vaultTotalCVS[vaultAddress];
    }
    
    function getLicenseTypeConfig(
        address vaultAddress,
        string calldata licenseType
    ) external view returns (LicenseTypeConfig memory) {
        return vaultLicenseTypes[vaultAddress][licenseType];
    }
    
    // ========================================
    // Admin Functions
    // ========================================
    
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    function setProtocolFee(uint256 _protocolFeeBps) external onlyRole(ADMIN_ROLE) {
        require(_protocolFeeBps <= 1000, "MultiAssetVault: Fee too high");
        protocolFeeBps = _protocolFeeBps;
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

