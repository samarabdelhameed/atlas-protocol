// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ILicensingModule
 * @notice Interface for Story Protocol Licensing Module
 * @dev Handles license minting with PIL (Programmable IP License) policies
 */
interface ILicensingModule {
    /**
     * @notice Mint a license for an IP Asset using a PIL policy
     * @param licensorIpId The IP Asset ID that owns the license
     * @param policyId The PIL policy ID (1 = Non-Commercial, 2 = Commercial, etc.)
     * @param amount Number of licenses to mint
     * @param receiver Address to receive the license tokens
     * @return licenseTokenIds Array of minted license token IDs
     */
    function mintLicense(
        address licensorIpId,
        uint256 policyId,
        uint256 amount,
        address receiver
    ) external payable returns (uint256[] memory licenseTokenIds);

    /**
     * @notice Attach license terms (PIL policy) to an IP Asset
     * @param ipId The IP Asset ID
     * @param policyId The PIL policy ID to attach
     * @return licenseTermsId The ID of the attached license terms
     */
    function attachLicenseTerms(
        address ipId,
        uint256 policyId
    ) external returns (uint256 licenseTermsId);

    /**
     * @notice Get license terms information
     * @param licenseTermsId The license terms ID
     * @return ipId The IP Asset ID
     * @return policyId The PIL policy ID
     * @return commercial Whether commercial use is allowed
     * @return royaltyPercentage Royalty percentage (basis points)
     */
    function getLicenseTerms(uint256 licenseTermsId)
        external
        view
        returns (
            address ipId,
            uint256 policyId,
            bool commercial,
            uint256 royaltyPercentage
        );

    /**
     * @notice Check if license is valid
     * @param licenseTokenId The license token ID
     * @return isValid True if license is valid
     */
    function isLicenseValid(uint256 licenseTokenId) external view returns (bool isValid);

    /**
     * @notice Get license information
     * @param licenseTokenId The license token ID
     * @return licensorIpId The licensor IP Asset ID
     * @return licenseTermsId The license terms ID
     * @return owner The current owner of the license
     * @return mintedAt Timestamp when license was minted
     */
    function getLicense(uint256 licenseTokenId)
        external
        view
        returns (
            address licensorIpId,
            uint256 licenseTermsId,
            address owner,
            uint256 mintedAt
        );
}

/**
 * @title PIL Policy Constants
 * @notice Pre-defined PIL policy IDs for Story Protocol
 */
library PILPolicies {
    uint256 public constant NON_COMMERCIAL_SOCIAL_REMIXING = 1;
    uint256 public constant COMMERCIAL_USE = 2;
    uint256 public constant COMMERCIAL_REMIX = 3;
    
    /**
     * @notice Get policy name
     * @param policyId The policy ID
     * @return name Policy name
     */
    function getPolicyName(uint256 policyId) internal pure returns (string memory name) {
        if (policyId == NON_COMMERCIAL_SOCIAL_REMIXING) {
            return "Non-Commercial Social Remixing";
        } else if (policyId == COMMERCIAL_USE) {
            return "Commercial Use";
        } else if (policyId == COMMERCIAL_REMIX) {
            return "Commercial Remix";
        } else {
            return "Custom Policy";
        }
    }
}

