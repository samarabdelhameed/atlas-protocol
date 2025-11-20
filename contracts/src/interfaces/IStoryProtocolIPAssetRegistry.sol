// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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

