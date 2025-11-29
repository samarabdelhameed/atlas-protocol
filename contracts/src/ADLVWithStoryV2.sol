// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ADLVWithStory.sol";
import "./VaultSharesERC20.sol";
import "./LicenseMetaTx.sol";
import "./StoryRoyaltyModule.sol";

/**
 * @title ADLVWithStoryV2
 * @notice Enhanced ADLV with:
 *         - EIP-2612 Permit for vault shares (gasless approvals)
 *         - Meta-transactions for licenses (gasless purchases)
 *         - Full Story Protocol royalty streams
 *         - Derivative IP licensing with revenue sharing
 */
contract ADLVWithStoryV2 is ADLVWithStory {
    // ========================================
    // New State Variables
    // ========================================
    
    /// @notice Vault shares token per vault
    mapping(address => VaultSharesERC20) public vaultShareTokens;
    
    /// @notice License meta-transaction handler
    LicenseMetaTx public licenseMetaTx;
    
    /// @notice Story royalty module
    StoryRoyaltyModule public royaltyModule;
    
    /// @notice Enable/disable permit functionality
    bool public permitEnabled = true;
    
    /// @notice Enable/disable meta-transactions
    bool public metaTxEnabled = true;
    
    // ========================================
    // Events
    // ========================================
    
    event VaultShareTokenCreated(
        address indexed vaultAddress,
        address indexed shareToken,
        string name,
        string symbol
    );
    
    event DepositWithPermit(
        address indexed vaultAddress,
        address indexed depositor,
        uint256 amount,
        uint256 shares
    );
    
    event LicensePurchasedWithMetaTx(
        address indexed vaultAddress,
        address indexed buyer,
        address indexed relayer,
        string licenseId,
        uint256 price
    );
    
    event RoyaltyStreamInitialized(
        address indexed vaultAddress,
        address indexed ipId,
        address beneficiary
    );
    
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
    ) ADLVWithStory(
        _idoContract,
        _storySPG,
        _storyIPAssetRegistry,
        _storyLicenseRegistry,
        _loanNFT,
        _lendingModule,
        _storyLicensingModule
    ) {
        // Deploy meta-transaction handler
        licenseMetaTx = new LicenseMetaTx();
        
        // Deploy royalty module
        royaltyModule = new StoryRoyaltyModule(_storySPG, _storyIPAssetRegistry);
    }
    
    // ========================================
    // Vault Shares with EIP-2612 Permit
    // ========================================
    
    /**
     * @notice Create ERC20 share token for vault
     * @param vaultAddress The vault address
     * @return shareToken The created share token address
     */
    function createVaultShareToken(
        address vaultAddress
    ) external vaultExists(vaultAddress) returns (address shareToken) {
        require(address(vaultShareTokens[vaultAddress]) == address(0), "ADLV: Token exists");
        
        Vault memory vault = vaults[vaultAddress];
        
        string memory name = string(abi.encodePacked("ADLV Vault Share - ", _bytes32ToString(vault.ipId)));
        string memory symbol = string(abi.encodePacked("vADLV-", _addressToShortString(vaultAddress)));
        
        VaultSharesERC20 token = new VaultSharesERC20(name, symbol, vaultAddress, address(this));
        vaultShareTokens[vaultAddress] = token;
        
        emit VaultShareTokenCreated(vaultAddress, address(token), name, symbol);
        
        return address(token);
    }
    
    /**
     * @notice Deposit with EIP-2612 permit (gasless approval)
     * @param vaultAddress The vault address
     * @param amount Amount to deposit
     * @return shares Minted shares
     */
    function depositWithPermit(
        address vaultAddress,
        uint256 amount,
        uint256 /* deadline */,
        uint8 /* v */,
        bytes32 /* r */,
        bytes32 /* s */
    ) external payable vaultExists(vaultAddress) returns (uint256 shares) {
        require(permitEnabled, "ADLV: Permit disabled");
        require(msg.value >= amount, "ADLV: Insufficient payment");
        
        VaultSharesERC20 shareToken = vaultShareTokens[vaultAddress];
        require(address(shareToken) != address(0), "ADLV: No share token");
        
        // Deposit normally
        shares = this.deposit{value: amount}(vaultAddress);
        
        // Mint share tokens instead of internal accounting
        shareToken.mint(msg.sender, shares);
        
        emit DepositWithPermit(vaultAddress, msg.sender, amount, shares);
        
        return shares;
    }
    
    /**
     * @notice Withdraw using share tokens with permit
     * @param vaultAddress The vault address
     * @param shares Shares to withdraw
     * @param deadline Permit deadline
     * @param v Signature v
     * @param r Signature r
     * @param s Signature s
     */
    function withdrawWithPermit(
        address vaultAddress,
        uint256 shares,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external vaultExists(vaultAddress) {
        require(permitEnabled, "ADLV: Permit disabled");
        
        VaultSharesERC20 shareToken = vaultShareTokens[vaultAddress];
        require(address(shareToken) != address(0), "ADLV: No share token");
        
        // Use permit to approve
        shareToken.permit(msg.sender, address(this), shares, deadline, v, r, s);
        
        // Burn share tokens
        shareToken.burn(msg.sender, shares);
        
        // Withdraw normally
        this.withdraw(vaultAddress, shares);
    }
    
    // ========================================
    // License Meta-Transactions
    // ========================================
    
    /**
     * @notice Purchase license with meta-transaction (gasless)
     * @param vaultAddress The vault address
     * @param licenseType License type
     * @param duration License duration
     * @param price License price
     * @param deadline Signature deadline
     * @param signature EIP-712 signature
     * @return licenseId Created license ID
     */
    function purchaseLicenseWithMetaTx(
        address vaultAddress,
        string calldata licenseType,
        uint256 duration,
        uint256 price,
        uint256 deadline,
        bytes calldata signature
    ) external payable vaultExists(vaultAddress) returns (string memory licenseId) {
        require(metaTxEnabled, "ADLV: MetaTx disabled");
        require(msg.value >= price, "ADLV: Insufficient payment");
        
        // Verify signature and get buyer
        address buyer = licenseMetaTx.executeLicensePurchase{value: price}(
            vaultAddress,
            licenseType,
            duration,
            price,
            deadline,
            signature
        );
        
        // Execute license sale
        licenseId = this.sellLicense{value: price}(vaultAddress, licenseType, duration);
        
        emit LicensePurchasedWithMetaTx(vaultAddress, buyer, msg.sender, licenseId, price);
        
        return licenseId;
    }
    
    /**
     * @notice Get nonce for meta-transaction
     * @param user User address
     * @return nonce Current nonce
     */
    function getMetaTxNonce(address user) external view returns (uint256 nonce) {
        return licenseMetaTx.getNonce(user);
    }
    
    // ========================================
    // Story Protocol Royalty Streams
    // ========================================
    
    /**
     * @notice Initialize royalty stream for vault
     * @param vaultAddress The vault address
     * @param beneficiary Royalty beneficiary
     * @param royaltyPercentage Royalty percentage (basis points)
     */
    function initializeRoyaltyStream(
        address vaultAddress,
        address beneficiary,
        uint256 royaltyPercentage
    ) external vaultExists(vaultAddress) {
        Vault storage vault = vaults[vaultAddress];
        require(vault.creator == msg.sender, "ADLV: Only creator");
        require(vault.registeredOnStory, "ADLV: Not on Story");
        
        address ipId = _parseStoryIPId(vault.storyIPId);
        
        // Set royalty policy on royalty module
        royaltyModule.setRoyaltyPolicy(ipId, beneficiary, royaltyPercentage);
        
        emit RoyaltyStreamInitialized(vaultAddress, ipId, beneficiary);
    }
    
    /**
     * @notice Create derivative license
     * @param vaultAddress Parent vault address
     * @param licensee License recipient
     * @param royaltyShare Royalty share for parent (basis points)
     * @param licenseTerms License terms
     * @return licenseId Created license ID
     */
    function createDerivativeLicense(
        address vaultAddress,
        address licensee,
        uint256 royaltyShare,
        bytes calldata licenseTerms
    ) external vaultExists(vaultAddress) returns (uint256 licenseId) {
        Vault storage vault = vaults[vaultAddress];
        require(vault.creator == msg.sender, "ADLV: Only creator");
        require(vault.registeredOnStory, "ADLV: Not on Story");
        
        address parentIpId = _parseStoryIPId(vault.storyIPId);
        
        // Create derivative license on royalty module
        licenseId = royaltyModule.createDerivativeLicense(
            parentIpId,
            licensee,
            royaltyShare,
            licenseTerms
        );
        
        return licenseId;
    }
    
    /**
     * @notice Register derivative IP and create vault
     * @param parentVaultAddress Parent vault address
     * @param licenseId License ID from parent
     * @param derivativeName Derivative IP name
     * @param derivativeHash Derivative content hash
     * @return derivativeVaultAddress Created derivative vault
     * @return derivativeIpId Derivative IP address
     */
    function registerDerivativeIPWithRoyalty(
        address parentVaultAddress,
        uint256 licenseId,
        string calldata derivativeName,
        bytes32 derivativeHash
    ) external vaultExists(parentVaultAddress) returns (
        address derivativeVaultAddress,
        address derivativeIpId
    ) {
        Vault storage parentVault = vaults[parentVaultAddress];
        require(parentVault.registeredOnStory, "ADLV: Parent not on Story");
        
        address parentIpId = _parseStoryIPId(parentVault.storyIPId);
        
        // Register derivative on royalty module
        (derivativeIpId, ) = royaltyModule.registerDerivativeIP(
            parentIpId,
            licenseId,
            derivativeName,
            derivativeHash
        );
        
        // Create internal IP ID for derivative
        bytes32 derivativeInternalId = keccak256(abi.encodePacked(
            "derivative",
            parentVault.ipId,
            licenseId,
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
     * @notice Stream revenue to vault's IP
     * @param vaultAddress The vault address
     */
    function streamRevenueToIP(
        address vaultAddress
    ) external payable vaultExists(vaultAddress) {
        require(msg.value > 0, "ADLV: Invalid amount");
        
        Vault storage vault = vaults[vaultAddress];
        require(vault.registeredOnStory, "ADLV: Not on Story");
        
        address ipId = _parseStoryIPId(vault.storyIPId);
        
        // Stream revenue through royalty module
        royaltyModule.streamRevenue{value: msg.value}(ipId, msg.value);
    }
    
    /**
     * @notice Claim royalties from Story Protocol
     * @param vaultAddress The vault address
     * @return claimedAmount Amount claimed
     */
    function claimRoyaltiesFromStory(
        address vaultAddress
    ) external vaultExists(vaultAddress) returns (uint256 claimedAmount) {
        Vault storage vault = vaults[vaultAddress];
        require(vault.creator == msg.sender, "ADLV: Only creator");
        require(vault.registeredOnStory, "ADLV: Not on Story");
        
        address ipId = _parseStoryIPId(vault.storyIPId);
        
        // Claim from royalty module
        claimedAmount = royaltyModule.claimRoyalties(ipId);
        
        emit RoyaltiesClaimed(vaultAddress, msg.sender, claimedAmount);
        
        return claimedAmount;
    }
    
    /**
     * @notice Get pending royalties
     * @param vaultAddress The vault address
     * @return pendingAmount Pending royalties
     */
    function getPendingRoyalties(
        address vaultAddress
    ) external view vaultExists(vaultAddress) returns (uint256 pendingAmount) {
        Vault memory vault = vaults[vaultAddress];
        
        if (!vault.registeredOnStory) {
            return 0;
        }
        
        address ipId = _parseStoryIPId(vault.storyIPId);
        return royaltyModule.getPendingRevenue(ipId);
    }
    
    /**
     * @notice Get total revenue including derivatives
     * @param vaultAddress The vault address
     * @return totalRevenue Total revenue
     * @return derivativeRevenue Revenue from derivatives
     */
    function getTotalRevenueWithDerivatives(
        address vaultAddress
    ) external view vaultExists(vaultAddress) returns (
        uint256 totalRevenue,
        uint256 derivativeRevenue
    ) {
        Vault memory vault = vaults[vaultAddress];
        
        if (!vault.registeredOnStory) {
            return (vault.totalLicenseRevenue, 0);
        }
        
        address ipId = _parseStoryIPId(vault.storyIPId);
        return royaltyModule.getTotalRevenue(ipId);
    }
    
    /**
     * @notice Get derivative licenses for vault
     * @param vaultAddress The vault address
     * @return licenseIds Array of license IDs
     */
    function getDerivativeLicensesForVault(
        address vaultAddress
    ) external view vaultExists(vaultAddress) returns (uint256[] memory licenseIds) {
        Vault memory vault = vaults[vaultAddress];
        
        if (!vault.registeredOnStory) {
            return new uint256[](0);
        }
        
        address ipId = _parseStoryIPId(vault.storyIPId);
        return royaltyModule.getDerivativeLicenses(ipId);
    }
    
    // ========================================
    // Admin Functions
    // ========================================
    
    function setPermitEnabled(bool _enabled) external onlyOwner {
        permitEnabled = _enabled;
    }
    
    function setMetaTxEnabled(bool _enabled) external onlyOwner {
        metaTxEnabled = _enabled;
    }
    
    function setRoyaltyModule(address _royaltyModule) external onlyOwner {
        require(_royaltyModule != address(0), "ADLV: Invalid address");
        royaltyModule = StoryRoyaltyModule(payable(_royaltyModule));
    }
    
    // ========================================
    // Helper Functions
    // ========================================
    
    function _bytes32ToString(bytes32 _bytes32) internal pure returns (string memory) {
        uint8 i = 0;
        while(i < 32 && _bytes32[i] != 0) {
            i++;
        }
        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }
    
    function _addressToShortString(address _addr) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(8);
        uint160 value = uint160(_addr);
        for (uint256 i = 0; i < 4; i++) {
            str[i*2] = alphabet[uint8(value >> (4 * (7 - i*2))) & 0xf];
            str[i*2+1] = alphabet[uint8(value >> (4 * (6 - i*2))) & 0xf];
        }
        return string(str);
    }
}
