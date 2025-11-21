// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title StoryProtocolCore
 * @notice Simplified Story Protocol implementation for testing
 * @dev This provides real on-chain Story Protocol functionality
 */
contract StoryProtocolCore {
    
    // ========================================
    // State Variables
    // ========================================
    
    uint256 public ipIdCounter;
    uint256 public licenseIdCounter;
    uint256 public licenseTermsIdCounter;
    
    // ========================================
    // Structs
    // ========================================
    
    struct IPAsset {
        address ipId;
        uint256 tokenId;
        address owner;
        string name;
        bytes32 contentHash;
        uint256 registeredAt;
        bool exists;
    }
    
    struct LicenseTerms {
        uint256 termsId;
        address ipId;
        bool commercial;
        uint256 royaltyPercentage;
        uint256 mintingFee;
        bool exists;
    }
    
    struct License {
        uint256 licenseId;
        address ipId;
        uint256 licenseTermsId;
        address licensee;
        uint256 amount;
        uint256 mintedAt;
        bool exists;
    }
    
    struct RoyaltyPolicy {
        address ipId;
        uint256 royaltyPercentage;
        address beneficiary;
        uint256 totalRevenue;
        uint256 claimedRevenue;
        bool exists;
    }
    
    struct DerivativeIP {
        address derivativeIpId;
        address parentIpId;
        uint256 licenseTokenId;
        uint256 registeredAt;
        bool exists;
    }
    
    // ========================================
    // Mappings
    // ========================================
    
    mapping(address => IPAsset) public ipAssets;
    mapping(uint256 => address) public tokenIdToIpId;
    mapping(uint256 => LicenseTerms) public licenseTerms;
    mapping(address => uint256) public ipDefaultTerms;
    mapping(uint256 => License) public licenses;
    mapping(address => uint256[]) public ipLicenses;
    
    // Royalty Module
    mapping(address => RoyaltyPolicy) public royaltyPolicies;
    mapping(address => uint256) public pendingRevenue;
    
    // Derivative IPs
    mapping(address => DerivativeIP) public derivatives;
    mapping(address => address[]) public ipDerivatives; // parent => derivatives[]
    mapping(address => address) public derivativeToParent; // derivative => parent
    
    // ========================================
    // Events (Story Protocol Compatible)
    // ========================================
    
    event IPAssetRegistered(
        address indexed ipId,
        uint256 indexed tokenId,
        address indexed owner,
        string name,
        bytes32 contentHash
    );
    
    event LicenseTermsAttached(
        address indexed ipId,
        uint256 indexed licenseTermsId,
        uint256 royaltyPercentage
    );
    
    event LicenseMinted(
        address indexed ipId,
        uint256 indexed licenseId,
        uint256 indexed licenseTermsId,
        address licensee,
        uint256 amount
    );
    
    event RoyaltyPolicySet(
        address indexed ipId,
        address indexed beneficiary,
        uint256 royaltyPercentage
    );
    
    event RoyaltyPaid(
        address indexed ipId,
        address indexed payer,
        uint256 amount
    );
    
    event RevenueClaimed(
        address indexed ipId,
        address indexed claimer,
        uint256 amount
    );
    
    event DerivativeIPRegistered(
        address indexed derivativeIpId,
        address indexed parentIpId,
        uint256 indexed licenseTokenId,
        address owner
    );
    
    // ========================================
    // SPG Functions (Story Protocol Gateway)
    // ========================================
    
    /**
     * @notice Mint NFT and register IP Asset
     * @dev Simulates Story Protocol SPG.mintAndRegisterIPAsset()
     */
    function mintAndRegisterIPAsset(
        address /* nftContract */,
        address recipient,
        string memory name,
        bytes32 contentHash,
        string memory /* uri */
    ) external returns (uint256 tokenId, address ipId) {
        ipIdCounter++;
        tokenId = ipIdCounter;
        
        // Generate deterministic IP ID
        ipId = address(uint160(uint256(keccak256(abi.encodePacked(
            block.timestamp,
            recipient,
            tokenId,
            name,
            contentHash
        )))));
        
        ipAssets[ipId] = IPAsset({
            ipId: ipId,
            tokenId: tokenId,
            owner: recipient,
            name: name,
            contentHash: contentHash,
            registeredAt: block.timestamp,
            exists: true
        });
        
        tokenIdToIpId[tokenId] = ipId;
        
        emit IPAssetRegistered(ipId, tokenId, recipient, name, contentHash);
        
        return (tokenId, ipId);
    }
    
    /**
     * @notice Check if IP is registered
     */
    function isRegistered(address ipId) external view returns (bool) {
        return ipAssets[ipId].exists;
    }
    
    /**
     * @notice Get IP Asset info
     */
    function getIPAsset(address ipId) external view returns (
        uint256 tokenId,
        address owner,
        string memory name,
        bytes32 contentHash,
        uint256 registeredAt
    ) {
        IPAsset memory asset = ipAssets[ipId];
        require(asset.exists, "IP not found");
        return (asset.tokenId, asset.owner, asset.name, asset.contentHash, asset.registeredAt);
    }
    
    // ========================================
    // IP Asset Registry Functions
    // ========================================
    
    /**
     * @notice Check if IP exists (by address)
     */
    function exists(address ipId) external view returns (bool) {
        return ipAssets[ipId].exists;
    }
    
    /**
     * @notice Check if IP exists (by string - for compatibility)
     */
    function exists(string calldata ipIdStr) external view returns (bool) {
        address ipId = parseAddress(ipIdStr);
        return ipAssets[ipId].exists;
    }
    
    /**
     * @notice Get IP owner (by address)
     */
    function ownerOf(address ipId) external view returns (address) {
        require(ipAssets[ipId].exists, "IP not found");
        return ipAssets[ipId].owner;
    }
    
    /**
     * @notice Get IP owner (by string - for compatibility)
     */
    function ownerOf(string calldata ipIdStr) external view returns (address) {
        address ipId = parseAddress(ipIdStr);
        require(ipAssets[ipId].exists, "IP not found");
        return ipAssets[ipId].owner;
    }
    
    /**
     * @notice Parse address from string
     */
    function parseAddress(string calldata str) internal pure returns (address) {
        bytes memory strBytes = bytes(str);
        require(strBytes.length == 42, "Invalid address length");
        require(strBytes[0] == '0' && strBytes[1] == 'x', "Invalid address format");
        
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
    
    // ========================================
    // Licensing Module Functions
    // ========================================
    
    /**
     * @notice Attach license terms to IP
     */
    function attachLicenseTerms(
        address ipId,
        bool commercial,
        uint256 royaltyPercentage,
        uint256 mintingFee
    ) external returns (uint256 licenseTermsId) {
        require(ipAssets[ipId].exists, "IP not found");
        
        licenseTermsIdCounter++;
        licenseTermsId = licenseTermsIdCounter;
        
        licenseTerms[licenseTermsId] = LicenseTerms({
            termsId: licenseTermsId,
            ipId: ipId,
            commercial: commercial,
            royaltyPercentage: royaltyPercentage,
            mintingFee: mintingFee,
            exists: true
        });
        
        ipDefaultTerms[ipId] = licenseTermsId;
        
        emit LicenseTermsAttached(ipId, licenseTermsId, royaltyPercentage);
        
        return licenseTermsId;
    }
    
    /**
     * @notice Mint license for IP
     */
    function mintLicense(
        uint256 licenseTermsId,
        address ipId,
        address licensee,
        uint256 amount
    ) external payable returns (uint256 licenseId) {
        require(licenseTerms[licenseTermsId].exists, "Terms not found");
        require(ipAssets[ipId].exists, "IP not found");
        
        licenseIdCounter++;
        licenseId = licenseIdCounter;
        
        licenses[licenseId] = License({
            licenseId: licenseId,
            ipId: ipId,
            licenseTermsId: licenseTermsId,
            licensee: licensee,
            amount: amount,
            mintedAt: block.timestamp,
            exists: true
        });
        
        ipLicenses[ipId].push(licenseId);
        
        emit LicenseMinted(ipId, licenseId, licenseTermsId, licensee, amount);
        
        return licenseId;
    }
    
    /**
     * @notice Get license info
     */
    function getLicense(uint256 licenseId) external view returns (
        address ipId,
        uint256 licenseTermsId,
        address licensee,
        uint256 amount,
        uint256 mintedAt
    ) {
        License memory license = licenses[licenseId];
        require(license.exists, "License not found");
        return (license.ipId, license.licenseTermsId, license.licensee, license.amount, license.mintedAt);
    }
    
    /**
     * @notice Get all licenses for IP
     */
    function getIPLicenses(address ipId) external view returns (uint256[] memory) {
        return ipLicenses[ipId];
    }
    
    /**
     * @notice Get license terms
     */
    function getLicenseTerms(uint256 licenseTermsId) external view returns (
        address ipId,
        bool commercial,
        uint256 royaltyPercentage,
        uint256 mintingFee
    ) {
        LicenseTerms memory terms = licenseTerms[licenseTermsId];
        require(terms.exists, "Terms not found");
        return (terms.ipId, terms.commercial, terms.royaltyPercentage, terms.mintingFee);
    }
    
    // ========================================
    // Royalty Module Functions
    // ========================================
    
    /**
     * @notice Set royalty policy for IP
     */
    function setRoyaltyPolicy(
        address ipId,
        address beneficiary,
        uint256 royaltyPercentage
    ) external {
        require(ipAssets[ipId].exists, "IP not found");
        require(ipAssets[ipId].owner == msg.sender, "Not IP owner");
        require(royaltyPercentage <= 10000, "Invalid percentage");
        
        royaltyPolicies[ipId] = RoyaltyPolicy({
            ipId: ipId,
            royaltyPercentage: royaltyPercentage,
            beneficiary: beneficiary,
            totalRevenue: 0,
            claimedRevenue: 0,
            exists: true
        });
        
        emit RoyaltyPolicySet(ipId, beneficiary, royaltyPercentage);
    }
    
    /**
     * @notice Pay royalty for IP usage
     */
    function payRoyaltyOnBehalf(
        address ipId,
        address payer
    ) external payable {
        require(ipAssets[ipId].exists, "IP not found");
        require(msg.value > 0, "Invalid amount");
        
        RoyaltyPolicy storage policy = royaltyPolicies[ipId];
        
        if (policy.exists) {
            policy.totalRevenue += msg.value;
            pendingRevenue[policy.beneficiary] += msg.value;
        } else {
            // If no policy, send to IP owner
            pendingRevenue[ipAssets[ipId].owner] += msg.value;
        }
        
        emit RoyaltyPaid(ipId, payer, msg.value);
    }
    
    /**
     * @notice Claim accumulated revenue
     */
    function claimRevenue(
        address ipId,
        address claimer
    ) external returns (uint256 claimableAmount) {
        require(ipAssets[ipId].exists, "IP not found");
        
        RoyaltyPolicy storage policy = royaltyPolicies[ipId];
        
        if (policy.exists) {
            require(policy.beneficiary == claimer, "Not beneficiary");
            claimableAmount = pendingRevenue[claimer];
        } else {
            require(ipAssets[ipId].owner == claimer, "Not owner");
            claimableAmount = pendingRevenue[claimer];
        }
        
        require(claimableAmount > 0, "No revenue to claim");
        
        pendingRevenue[claimer] = 0;
        
        if (policy.exists) {
            policy.claimedRevenue += claimableAmount;
        }
        
        payable(claimer).transfer(claimableAmount);
        
        emit RevenueClaimed(ipId, claimer, claimableAmount);
        
        return claimableAmount;
    }
    
    /**
     * @notice Get pending revenue for address
     */
    function getPendingRevenue(address account) external view returns (uint256) {
        return pendingRevenue[account];
    }
    
    /**
     * @notice Get royalty policy
     */
    function getRoyaltyPolicy(address ipId) external view returns (
        address beneficiary,
        uint256 royaltyPercentage,
        uint256 totalRevenue,
        uint256 claimedRevenue
    ) {
        RoyaltyPolicy memory policy = royaltyPolicies[ipId];
        require(policy.exists, "Policy not found");
        return (policy.beneficiary, policy.royaltyPercentage, policy.totalRevenue, policy.claimedRevenue);
    }
    
    // ========================================
    // Derivative IP Functions
    // ========================================
    
    /**
     * @notice Register derivative IP
     */
    function registerDerivative(
        address parentIpId,
        uint256 licenseTokenId,
        address owner,
        string memory name,
        bytes32 contentHash
    ) external returns (uint256 tokenId, address derivativeIpId) {
        require(ipAssets[parentIpId].exists, "Parent IP not found");
        require(licenses[licenseTokenId].exists, "License not found");
        require(licenses[licenseTokenId].ipId == parentIpId, "License not for parent IP");
        
        // Mint and register derivative IP
        (tokenId, derivativeIpId) = this.mintAndRegisterIPAsset(
            address(0),
            owner,
            name,
            contentHash,
            ""
        );
        
        // Create derivative relationship
        derivatives[derivativeIpId] = DerivativeIP({
            derivativeIpId: derivativeIpId,
            parentIpId: parentIpId,
            licenseTokenId: licenseTokenId,
            registeredAt: block.timestamp,
            exists: true
        });
        
        ipDerivatives[parentIpId].push(derivativeIpId);
        derivativeToParent[derivativeIpId] = parentIpId;
        
        emit DerivativeIPRegistered(derivativeIpId, parentIpId, licenseTokenId, owner);
        
        return (tokenId, derivativeIpId);
    }
    
    /**
     * @notice Check if IP is derivative
     */
    function isDerivative(address ipId) external view returns (bool) {
        return derivatives[ipId].exists;
    }
    
    /**
     * @notice Get parent IP
     */
    function getParentIP(address derivativeIpId) external view returns (address) {
        require(derivatives[derivativeIpId].exists, "Not a derivative");
        return derivatives[derivativeIpId].parentIpId;
    }
    
    /**
     * @notice Get all derivatives of IP
     */
    function getDerivatives(address parentIpId) external view returns (address[] memory) {
        return ipDerivatives[parentIpId];
    }
    
    /**
     * @notice Get derivative info
     */
    function getDerivativeInfo(address derivativeIpId) external view returns (
        address parentIpId,
        uint256 licenseTokenId,
        uint256 registeredAt
    ) {
        DerivativeIP memory derivative = derivatives[derivativeIpId];
        require(derivative.exists, "Not a derivative");
        return (derivative.parentIpId, derivative.licenseTokenId, derivative.registeredAt);
    }
    
    /**
     * @notice Pay royalty with parent revenue sharing
     */
    function payRoyaltyWithSharing(
        address ipId,
        address payer
    ) external payable {
        require(ipAssets[ipId].exists, "IP not found");
        require(msg.value > 0, "Invalid amount");
        
        // If derivative, share revenue with parent
        if (derivatives[ipId].exists) {
            address parentIpId = derivatives[ipId].parentIpId;
            
            // Get parent's royalty percentage (default 30% if no policy)
            uint256 parentShare = 3000; // 30%
            if (royaltyPolicies[parentIpId].exists) {
                parentShare = royaltyPolicies[parentIpId].royaltyPercentage;
            }
            
            uint256 parentAmount = (msg.value * parentShare) / 10000;
            uint256 derivativeAmount = msg.value - parentAmount;
            
            // Pay parent
            if (parentAmount > 0) {
                address parentBeneficiary = royaltyPolicies[parentIpId].exists 
                    ? royaltyPolicies[parentIpId].beneficiary 
                    : ipAssets[parentIpId].owner;
                pendingRevenue[parentBeneficiary] += parentAmount;
                
                if (royaltyPolicies[parentIpId].exists) {
                    royaltyPolicies[parentIpId].totalRevenue += parentAmount;
                }
                
                emit RoyaltyPaid(parentIpId, payer, parentAmount);
            }
            
            // Pay derivative
            if (derivativeAmount > 0) {
                address derivativeBeneficiary = royaltyPolicies[ipId].exists 
                    ? royaltyPolicies[ipId].beneficiary 
                    : ipAssets[ipId].owner;
                pendingRevenue[derivativeBeneficiary] += derivativeAmount;
                
                if (royaltyPolicies[ipId].exists) {
                    royaltyPolicies[ipId].totalRevenue += derivativeAmount;
                }
                
                emit RoyaltyPaid(ipId, payer, derivativeAmount);
            }
        } else {
            // Regular royalty payment
            this.payRoyaltyOnBehalf{value: msg.value}(ipId, payer);
        }
    }
}
