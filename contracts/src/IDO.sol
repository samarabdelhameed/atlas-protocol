// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IDO (IP Data Oracle)
 * @notice Stores and tracks the dynamic Collateral Value Score (CVS) for each IP Asset.
 * The CVS is calculated off-chain by the Agent Service and updated by the ADLV contract.
 */
contract IDO is Ownable {
    // 1. تخزين CVS لكل IP Asset ID
    mapping(bytes32 => uint256) public ipAssetCVS; // maps ipId to its current CVS score

    // 2. تتبع إجمالي الإيرادات المجمعة من التراخيص
    mapping(bytes32 => uint256) public totalLicenseRevenue; // maps ipId to total revenue collected

    event CVSUpdated(bytes32 indexed ipId, uint256 newCVS, uint256 oldCVS);
    event RevenueCollected(bytes32 indexed ipId, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

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
     * @param ipId The ID of the IP Asset.
     * @return The current CVS score.
     */
    function getCVS(bytes32 ipId) external view returns (uint256) {
        return ipAssetCVS[ipId];
    }
}
