// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
    
    // ========================================
    // Royalty Module Functions
    // ========================================
    
    /**
     * @notice Set royalty policy for IP
     * @param ipId The IP Asset ID
     * @param beneficiary The royalty beneficiary
     * @param royaltyPercentage Royalty percentage (basis points)
     */
    function setRoyaltyPolicy(
        address ipId,
        address beneficiary,
        uint256 royaltyPercentage
    ) external;
    
    /**
     * @notice Pay royalty for IP usage
     * @param ipId The IP Asset ID
     * @param payer The payer address
     */
    function payRoyaltyOnBehalf(
        address ipId,
        address payer
    ) external payable;
    
    /**
     * @notice Claim accumulated revenue
     * @param ipId The IP Asset ID
     * @param claimer The claimer address
     * @return claimableAmount Amount claimed
     */
    function claimRevenue(
        address ipId,
        address claimer
    ) external returns (uint256 claimableAmount);
    
    /**
     * @notice Get pending revenue for address
     * @param account The account address
     * @return pendingAmount Pending revenue amount
     */
    function getPendingRevenue(
        address account
    ) external view returns (uint256 pendingAmount);
    
    // ========================================
    // Derivative IP Functions
    // ========================================
    
    /**
     * @notice Register derivative IP
     * @param parentIpId Parent IP Asset ID
     * @param licenseTokenId License token ID
     * @param owner Owner of derivative
     * @param name Derivative IP name
     * @param contentHash Derivative content hash
     * @return tokenId Token ID
     * @return derivativeIpId Derivative IP ID
     */
    function registerDerivative(
        address parentIpId,
        uint256 licenseTokenId,
        address owner,
        string memory name,
        bytes32 contentHash
    ) external returns (uint256 tokenId, address derivativeIpId);
    
    /**
     * @notice Pay royalty with parent revenue sharing
     * @param ipId The IP Asset ID
     * @param payer The payer address
     */
    function payRoyaltyWithSharing(
        address ipId,
        address payer
    ) external payable;
}


