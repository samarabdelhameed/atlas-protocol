// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IStoryProtocolSPG.sol";
import "./interfaces/IStoryProtocolIPAssetRegistry.sol";

/**
 * @title StoryRoyaltyModule
 * @notice Advanced royalty streaming and derivative licensing via Story Protocol
 * @dev Implements full Story Protocol licensing workflow:
 *      1. Create derivative IP licenses
 *      2. Register derivatives on Story Licensing Hub
 *      3. Stream revenue back to IP owners
 */
contract StoryRoyaltyModule {
    // ========================================
    // State Variables
    // ========================================
    
    IStoryProtocolSPG public storySPG;
    IStoryProtocolIPAssetRegistry public storyIPAssetRegistry;
    
    address public owner;
    
    // Royalty policy per IP
    struct RoyaltyPolicy {
        address beneficiary;
        uint256 royaltyPercentage; // basis points (e.g., 1000 = 10%)
        uint256 totalEarned;
        uint256 totalClaimed;
        bool exists;
    }
    
    // Derivative license tracking
    struct DerivativeLicense {
        address parentIpId;
        address derivativeIpId;
        uint256 licenseId;
        address licensee;
        uint256 royaltyShare; // basis points
        uint256 totalRevenue;
        uint256 createdAt;
        bool active;
    }
    
    // Revenue stream tracking
    struct RevenueStream {
        address ipId;
        address beneficiary;
        uint256 totalRevenue;
        uint256 claimedAmount;
        uint256 pendingAmount;
        uint256 lastClaimTime;
    }
    
    // ========================================
    // Mappings
    // ========================================
    
    mapping(address => RoyaltyPolicy) public royaltyPolicies;
    mapping(uint256 => DerivativeLicense) public derivativeLicenses;
    mapping(address => RevenueStream) public revenueStreams;
    mapping(address => uint256[]) public ipDerivatives; // Parent IP => derivative license IDs
    mapping(address => address) public derivativeToParent; // Derivative IP => Parent IP
    
    uint256 public derivativeLicenseCounter;
    
    // ========================================
    // Events
    // ========================================
    
    event RoyaltyPolicySet(
        address indexed ipId,
        address indexed beneficiary,
        uint256 royaltyPercentage
    );
    
    event DerivativeLicenseCreated(
        uint256 indexed licenseId,
        address indexed parentIpId,
        address indexed derivativeIpId,
        address licensee,
        uint256 royaltyShare
    );
    
    event DerivativeRegistered(
        address indexed derivativeIpId,
        address indexed parentIpId,
        uint256 indexed licenseId
    );
    
    event RevenueStreamed(
        address indexed ipId,
        address indexed beneficiary,
        uint256 amount
    );
    
    event RoyaltyClaimed(
        address indexed ipId,
        address indexed claimer,
        uint256 amount
    );
    
    event DerivativeRevenueShared(
        address indexed derivativeIpId,
        address indexed parentIpId,
        uint256 derivativeAmount,
        uint256 parentAmount
    );
    
    // ========================================
    // Modifiers
    // ========================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Royalty: Only owner");
        _;
    }
    
    // ========================================
    // Constructor
    // ========================================
    
    constructor(
        address _storySPG,
        address _storyIPAssetRegistry
    ) {
        require(_storySPG != address(0), "Royalty: Invalid SPG");
        require(_storyIPAssetRegistry != address(0), "Royalty: Invalid registry");
        
        storySPG = IStoryProtocolSPG(_storySPG);
        storyIPAssetRegistry = IStoryProtocolIPAssetRegistry(_storyIPAssetRegistry);
        owner = msg.sender;
    }
    
    // ========================================
    // Royalty Policy Management
    // ========================================
    
    /**
     * @notice Set royalty policy for IP asset
     * @param ipId IP asset address
     * @param beneficiary Royalty beneficiary
     * @param royaltyPercentage Royalty percentage (basis points)
     */
    function setRoyaltyPolicy(
        address ipId,
        address beneficiary,
        uint256 royaltyPercentage
    ) external {
        require(beneficiary != address(0), "Royalty: Invalid beneficiary");
        require(royaltyPercentage <= 10000, "Royalty: Invalid percentage");
        
        // Verify IP ownership
        address ipOwner = storyIPAssetRegistry.ownerOf(_addressToString(ipId));
        require(ipOwner == msg.sender, "Royalty: Not IP owner");
        
        royaltyPolicies[ipId] = RoyaltyPolicy({
            beneficiary: beneficiary,
            royaltyPercentage: royaltyPercentage,
            totalEarned: 0,
            totalClaimed: 0,
            exists: true
        });
        
        // Set on Story Protocol
        storySPG.setRoyaltyPolicy(ipId, beneficiary, royaltyPercentage);
        
        emit RoyaltyPolicySet(ipId, beneficiary, royaltyPercentage);
    }
    
    /**
     * @notice Get royalty policy for IP
     * @param ipId IP asset address
     * @return policy Royalty policy
     */
    function getRoyaltyPolicy(address ipId) external view returns (RoyaltyPolicy memory policy) {
        return royaltyPolicies[ipId];
    }
    
    // ========================================
    // Derivative Licensing
    // ========================================
    
    /**
     * @notice Create derivative license from parent IP
     * @param parentIpId Parent IP asset address
     * @param licensee License recipient
     * @param royaltyShare Royalty share for parent (basis points)
     * @return licenseId Created license ID
     */
    function createDerivativeLicense(
        address parentIpId,
        address licensee,
        uint256 royaltyShare,
        bytes calldata /* licenseTerms */
    ) external returns (uint256 licenseId) {
        require(licensee != address(0), "Royalty: Invalid licensee");
        require(royaltyShare <= 10000, "Royalty: Invalid royalty share");
        
        // Verify parent IP ownership
        address ipOwner = storyIPAssetRegistry.ownerOf(_addressToString(parentIpId));
        require(ipOwner == msg.sender, "Royalty: Not IP owner");
        
        licenseId = derivativeLicenseCounter++;
        
        derivativeLicenses[licenseId] = DerivativeLicense({
            parentIpId: parentIpId,
            derivativeIpId: address(0), // Set when derivative is registered
            licenseId: licenseId,
            licensee: licensee,
            royaltyShare: royaltyShare,
            totalRevenue: 0,
            createdAt: block.timestamp,
            active: true
        });
        
        ipDerivatives[parentIpId].push(licenseId);
        
        emit DerivativeLicenseCreated(
            licenseId,
            parentIpId,
            address(0),
            licensee,
            royaltyShare
        );
        
        return licenseId;
    }
    
    /**
     * @notice Register derivative IP on Story Protocol
     * @param parentIpId Parent IP asset address
     * @param licenseId License ID from parent
     * @param derivativeName Derivative IP name
     * @param derivativeHash Derivative content hash
     * @return derivativeIpId Registered derivative IP address
     * @return tokenId Story Protocol token ID
     */
    function registerDerivativeIP(
        address parentIpId,
        uint256 licenseId,
        string calldata derivativeName,
        bytes32 derivativeHash
    ) external returns (address derivativeIpId, uint256 tokenId) {
        DerivativeLicense storage license = derivativeLicenses[licenseId];
        require(license.active, "Royalty: License not active");
        require(license.licensee == msg.sender, "Royalty: Not licensee");
        require(license.parentIpId == parentIpId, "Royalty: Invalid parent");
        
        // Register derivative on Story Protocol
        (tokenId, derivativeIpId) = storySPG.registerDerivative(
            parentIpId,
            licenseId,
            msg.sender,
            derivativeName,
            derivativeHash
        );
        
        // Update license with derivative IP
        license.derivativeIpId = derivativeIpId;
        
        // Link derivative to parent
        derivativeToParent[derivativeIpId] = parentIpId;
        
        // Initialize revenue stream for derivative
        revenueStreams[derivativeIpId] = RevenueStream({
            ipId: derivativeIpId,
            beneficiary: msg.sender,
            totalRevenue: 0,
            claimedAmount: 0,
            pendingAmount: 0,
            lastClaimTime: block.timestamp
        });
        
        emit DerivativeRegistered(derivativeIpId, parentIpId, licenseId);
        
        return (derivativeIpId, tokenId);
    }
    
    /**
     * @notice Get all derivative licenses for parent IP
     * @param parentIpId Parent IP asset address
     * @return licenseIds Array of license IDs
     */
    function getDerivativeLicenses(address parentIpId) external view returns (uint256[] memory) {
        return ipDerivatives[parentIpId];
    }
    
    /**
     * @notice Check if IP is a derivative
     * @param ipId IP asset address
     * @return isDeriv True if derivative
     * @return parentIpId Parent IP address
     */
    function isDerivative(address ipId) external view returns (bool isDeriv, address parentIpId) {
        parentIpId = derivativeToParent[ipId];
        isDeriv = parentIpId != address(0);
        return (isDeriv, parentIpId);
    }
    
    // ========================================
    // Revenue Streaming
    // ========================================
    
    /**
     * @notice Stream revenue to IP asset
     * @param ipId IP asset address
     * @param amount Revenue amount
     */
    function streamRevenue(address ipId, uint256 amount) external payable {
        require(msg.value >= amount, "Royalty: Insufficient payment");
        
        RevenueStream storage stream = revenueStreams[ipId];
        
        // Initialize stream if not exists
        if (stream.ipId == address(0)) {
            RoyaltyPolicy memory policy = royaltyPolicies[ipId];
            address beneficiary = policy.exists ? policy.beneficiary : storyIPAssetRegistry.ownerOf(_addressToString(ipId));
            
            stream.ipId = ipId;
            stream.beneficiary = beneficiary;
        }
        
        stream.totalRevenue += amount;
        stream.pendingAmount += amount;
        
        // If derivative, share revenue with parent
        address parentIpId = derivativeToParent[ipId];
        if (parentIpId != address(0)) {
            _shareDerivativeRevenue(ipId, parentIpId, amount);
        }
        
        emit RevenueStreamed(ipId, stream.beneficiary, amount);
    }
    
    /**
     * @notice Share derivative revenue with parent IP
     * @param derivativeIpId Derivative IP address
     * @param parentIpId Parent IP address
     * @param amount Total revenue amount
     */
    function _shareDerivativeRevenue(
        address derivativeIpId,
        address parentIpId,
        uint256 amount
    ) internal {
        // Find license to get royalty share
        uint256[] memory licenses = ipDerivatives[parentIpId];
        uint256 royaltyShare = 0;
        
        for (uint256 i = 0; i < licenses.length; i++) {
            DerivativeLicense memory license = derivativeLicenses[licenses[i]];
            if (license.derivativeIpId == derivativeIpId) {
                royaltyShare = license.royaltyShare;
                break;
            }
        }
        
        if (royaltyShare > 0) {
            uint256 parentAmount = (amount * royaltyShare) / 10000;
            uint256 derivativeAmount = amount - parentAmount;
            
            // Stream to parent
            RevenueStream storage parentStream = revenueStreams[parentIpId];
            if (parentStream.ipId == address(0)) {
                RoyaltyPolicy memory policy = royaltyPolicies[parentIpId];
                address beneficiary = policy.exists ? policy.beneficiary : storyIPAssetRegistry.ownerOf(_addressToString(parentIpId));
                
                parentStream.ipId = parentIpId;
                parentStream.beneficiary = beneficiary;
            }
            
            parentStream.totalRevenue += parentAmount;
            parentStream.pendingAmount += parentAmount;
            
            emit DerivativeRevenueShared(derivativeIpId, parentIpId, derivativeAmount, parentAmount);
        }
    }
    
    /**
     * @notice Claim pending royalties
     * @param ipId IP asset address
     * @return claimedAmount Amount claimed
     */
    function claimRoyalties(address ipId) external returns (uint256 claimedAmount) {
        RevenueStream storage stream = revenueStreams[ipId];
        require(stream.ipId != address(0), "Royalty: No revenue stream");
        require(stream.beneficiary == msg.sender, "Royalty: Not beneficiary");
        require(stream.pendingAmount > 0, "Royalty: No pending amount");
        
        claimedAmount = stream.pendingAmount;
        stream.claimedAmount += claimedAmount;
        stream.pendingAmount = 0;
        stream.lastClaimTime = block.timestamp;
        
        // Update royalty policy
        RoyaltyPolicy storage policy = royaltyPolicies[ipId];
        if (policy.exists) {
            policy.totalClaimed += claimedAmount;
        }
        
        // Transfer funds
        payable(msg.sender).transfer(claimedAmount);
        
        emit RoyaltyClaimed(ipId, msg.sender, claimedAmount);
        
        return claimedAmount;
    }
    
    /**
     * @notice Get pending revenue for IP
     * @param ipId IP asset address
     * @return pendingAmount Pending revenue amount
     */
    function getPendingRevenue(address ipId) external view returns (uint256 pendingAmount) {
        return revenueStreams[ipId].pendingAmount;
    }
    
    /**
     * @notice Get revenue stream details
     * @param ipId IP asset address
     * @return stream Revenue stream struct
     */
    function getRevenueStream(address ipId) external view returns (RevenueStream memory stream) {
        return revenueStreams[ipId];
    }
    
    /**
     * @notice Get total revenue for IP (including derivatives)
     * @param ipId IP asset address
     * @return totalRevenue Total revenue earned
     * @return derivativeRevenue Revenue from derivatives
     */
    function getTotalRevenue(address ipId) external view returns (
        uint256 totalRevenue,
        uint256 derivativeRevenue
    ) {
        totalRevenue = revenueStreams[ipId].totalRevenue;
        
        // Add derivative revenue
        uint256[] memory licenses = ipDerivatives[ipId];
        for (uint256 i = 0; i < licenses.length; i++) {
            DerivativeLicense memory license = derivativeLicenses[licenses[i]];
            if (license.derivativeIpId != address(0)) {
                derivativeRevenue += revenueStreams[license.derivativeIpId].totalRevenue;
            }
        }
        
        return (totalRevenue, derivativeRevenue);
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
    
    // ========================================
    // Admin Functions
    // ========================================
    
    function setStorySPG(address _storySPG) external onlyOwner {
        require(_storySPG != address(0), "Royalty: Invalid SPG");
        storySPG = IStoryProtocolSPG(_storySPG);
    }
    
    function setStoryIPAssetRegistry(address _registry) external onlyOwner {
        require(_registry != address(0), "Royalty: Invalid registry");
        storyIPAssetRegistry = IStoryProtocolIPAssetRegistry(_registry);
    }
    
    receive() external payable {}
}
