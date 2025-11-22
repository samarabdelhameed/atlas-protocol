// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ISPGCVSOracle
 * @notice Interface for Story Protocol SPG (Story Protocol Gateway) CVS Oracle
 * @dev SPG Oracle provides CVS V2 data from Story Protocol's official system
 */
interface ISPGCVSOracle {
    /**
     * @notice Get CVS V2 value for an IP asset from Story Protocol
     * @param ipId The IP asset ID (address format)
     * @return cvs The CVS V2 value from Story Protocol
     * @return lastUpdated Last update timestamp from Story Protocol
     * @return confidence Confidence score (0-10000)
     * @return source Source of the CVS data (e.g., "story-v2")
     */
    function getCVSV2(address ipId) external view returns (
        uint256 cvs,
        uint256 lastUpdated,
        uint256 confidence,
        string memory source
    );
    
    /**
     * @notice Check if CVS V2 data exists for IP asset
     * @param ipId The IP asset ID
     * @return exists True if CVS V2 data exists
     */
    function hasCVSV2(address ipId) external view returns (bool exists);
    
    /**
     * @notice Get CVS V2 update history from Story Protocol
     * @param ipId The IP asset ID
     * @return values Array of CVS values
     * @return timestamps Array of update timestamps
     */
    function getCVSV2History(address ipId) external view returns (
        uint256[] memory values,
        uint256[] memory timestamps
    );
}

