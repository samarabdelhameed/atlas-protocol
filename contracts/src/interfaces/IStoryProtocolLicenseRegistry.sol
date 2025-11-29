// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IStoryProtocolLicenseRegistry
 * @notice Interface for Story Protocol License Registry
 * @dev Manages licensing of IP Assets on Story Protocol
 */
interface IStoryProtocolLicenseRegistry {
    /**
     * @notice Register a license for an IP Asset
     * @param ipId The IP Asset ID
     * @param licenseType Type of license (e.g., "exclusive", "commercial", "derivative")
     * @param licensee Address of the licensee
     * @param terms License terms (encoded as bytes)
     * @param price License price
     * @return licenseId The registered license ID
     */
    function registerLicense(
        string calldata ipId,
        string calldata licenseType,
        address licensee,
        bytes calldata terms,
        uint256 price
    ) external returns (string memory licenseId);

    /**
     * @notice Get license information
     * @param licenseId The license ID
     * @return ipId The IP Asset ID
     * @return licenseType The license type
     * @return licensee The licensee address
     * @return licensor The licensor address
     * @return price The license price
     * @return registeredAt Timestamp of registration
     */
    function getLicense(string calldata licenseId)
        external
        view
        returns (
            string memory ipId,
            string memory licenseType,
            address licensee,
            address licensor,
            uint256 price,
            uint256 registeredAt
        );

    /**
     * @notice Check if a license exists
     * @param licenseId The license ID
     * @return exists True if the license exists
     */
    function licenseExists(string calldata licenseId) external view returns (bool exists);

    /**
     * @notice Get all licenses for an IP Asset
     * @param ipId The IP Asset ID
     * @return licenseIds Array of license IDs
     */
    function getLicensesForIP(string calldata ipId) external view returns (string[] memory licenseIds);

    /**
     * @notice Revoke a license
     * @param licenseId The license ID to revoke
     */
    function revokeLicense(string calldata licenseId) external;
}


