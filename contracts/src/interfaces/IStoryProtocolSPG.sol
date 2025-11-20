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
}

