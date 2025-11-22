// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICVSOracle
 * @notice Interface for Story Protocol CVS Oracle
 * @dev CVS (Content Valuation Score) Oracle for IP assets
 */
interface ICVSOracle {
    /**
     * @notice Get CVS value for an IP asset
     * @param ipId The IP asset ID
     * @return cvs The CVS value
     */
    function getCVS(address ipId) external view returns (uint256 cvs);
    
    /**
     * @notice Get CVS value with metadata
     * @param ipId The IP asset ID
     * @return cvs The CVS value
     * @return lastUpdated Last update timestamp
     * @return confidence Confidence score (0-10000)
     */
    function getCVSWithMetadata(address ipId) external view returns (
        uint256 cvs,
        uint256 lastUpdated,
        uint256 confidence
    );
    
    /**
     * @notice Update CVS value (oracle only)
     * @param ipId The IP asset ID
     * @param newCVS New CVS value
     * @param confidence Confidence score
     */
    function updateCVS(
        address ipId,
        uint256 newCVS,
        uint256 confidence
    ) external;
    
    /**
     * @notice Check if CVS data exists for IP
     * @param ipId The IP asset ID
     * @return exists True if CVS data exists
     */
    function hasCVS(address ipId) external view returns (bool exists);
    
    /**
     * @notice Get CVS update history
     * @param ipId The IP asset ID
     * @return values Array of CVS values
     * @return timestamps Array of update timestamps
     */
    function getCVSHistory(address ipId) external view returns (
        uint256[] memory values,
        uint256[] memory timestamps
    );
}
