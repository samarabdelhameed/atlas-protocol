// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ICVSOracle.sol";

/**
 * @title IDO (IP Data Oracle)
 * @notice Stores and tracks the dynamic Collateral Value Score (CVS) for each IP Asset.
 * @dev Integrates with on-chain CVS Oracle for real-time data
 */
contract IDO is Ownable {
    // 1. Store CVS for each IP Asset ID (fallback/cache)
    mapping(bytes32 => uint256) public ipAssetCVS; // maps ipId to its current CVS score

    // 2. Track total revenue collected from licenses
    mapping(bytes32 => uint256) public totalLicenseRevenue; // maps ipId to total revenue collected
    
    // 3. CVS Oracle integration
    ICVSOracle public cvsOracle;
    bool public useOracle; // Toggle between oracle and manual updates

    event CVSUpdated(bytes32 indexed ipId, uint256 newCVS, uint256 oldCVS);
    event RevenueCollected(bytes32 indexed ipId, uint256 amount);
    event CVSOracleUpdated(address indexed newOracle);
    event OracleUsageToggled(bool useOracle);

    constructor(address initialOwner) Ownable(initialOwner) {
        useOracle = false; // Start with manual mode
    }

    /**
     * @notice Updates the CVS for a specific IP Asset.
     * @dev ONLY callable by the owner (which will be the ADLV contract).
     * @param ipId The ID of the IP Asset.
     * @param newCVS The newly calculated CVS score.
     */
    function updateCVS(bytes32 ipId, uint256 newCVS) external onlyOwner {
        uint256 oldCVS = ipAssetCVS[ipId];
        ipAssetCVS[ipId] = newCVS;
        emit CVSUpdated(ipId, newCVS, oldCVS);
    }

    /**
     * @notice Records revenue collected from data licensing.
     * @dev ONLY callable by the owner (the ADLV contract).
     * @param ipId The ID of the IP Asset.
     * @param amount The revenue amount to record.
     */
    function recordRevenue(bytes32 ipId, uint256 amount) external onlyOwner {
        totalLicenseRevenue[ipId] += amount;
        emit RevenueCollected(ipId, amount);
    }

    /**
     * @notice Gets the current CVS score for an IP Asset.
     * @dev Fetches from oracle if enabled, otherwise returns cached value
     * @param ipId The ID of the IP Asset.
     * @return The current CVS score.
     */
    function getCVS(bytes32 ipId) external view returns (uint256) {
        // If oracle is enabled and available, fetch from oracle
        if (useOracle && address(cvsOracle) != address(0)) {
            address ipAddress = address(uint160(uint256(ipId)));
            
            try cvsOracle.getCVS(ipAddress) returns (uint256 oracleCVS) {
                // If oracle has data, use it
                if (oracleCVS > 0) {
                    return oracleCVS;
                }
            } catch {
                // Oracle failed, fall back to cached value
            }
        }
        
        // Return cached value
        return ipAssetCVS[ipId];
    }
    
    /**
     * @notice Gets CVS with metadata from oracle
     * @param ipId The ID of the IP Asset
     * @return cvs The CVS value
     * @return lastUpdated Last update timestamp
     * @return confidence Confidence score
     */
    function getCVSWithMetadata(bytes32 ipId) external view returns (
        uint256 cvs,
        uint256 lastUpdated,
        uint256 confidence
    ) {
        if (useOracle && address(cvsOracle) != address(0)) {
            address ipAddress = address(uint160(uint256(ipId)));
            
            try cvsOracle.getCVSWithMetadata(ipAddress) returns (
                uint256 oracleCVS,
                uint256 updated,
                uint256 conf
            ) {
                if (oracleCVS > 0) {
                    return (oracleCVS, updated, conf);
                }
            } catch {}
        }
        
        // Return cached value with default metadata
        return (ipAssetCVS[ipId], block.timestamp, 10000);
    }
    
    /**
     * @notice Set CVS Oracle address
     * @param _cvsOracle Address of CVS Oracle contract
     */
    function setCVSOracle(address _cvsOracle) external onlyOwner {
        cvsOracle = ICVSOracle(_cvsOracle);
        emit CVSOracleUpdated(_cvsOracle);
    }
    
    /**
     * @notice Toggle oracle usage
     * @param _useOracle True to use oracle, false for manual
     */
    function setUseOracle(bool _useOracle) external onlyOwner {
        useOracle = _useOracle;
        emit OracleUsageToggled(_useOracle);
    }
    
    /**
     * @notice Get total revenue for IP
     * @param ipId The ID of the IP Asset
     * @return Total revenue collected
     */
    function getTotalRevenue(bytes32 ipId) external view returns (uint256) {
        return totalLicenseRevenue[ipId];
    }
}
