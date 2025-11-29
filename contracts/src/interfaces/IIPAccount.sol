// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IIPAccount
 * @notice Interface for Story Protocol IPAccount (Smart Contract Account)
 * @dev IPAccount is the execution layer for IP Assets in Story Protocol
 * Each IP Asset has an associated IPAccount that acts as the "owner" and executor
 */
interface IIPAccount {
    /**
     * @notice Execute a transaction on behalf of the IPAccount
     * @dev This is the primary method for executing operations related to the IP Asset
     * @param target Target contract address to call
     * @param data Encoded function call data
     * @param value ETH value to send with the call
     * @return result Return data from the call
     */
    function execute(
        address target,
        bytes calldata data,
        uint256 value
    ) external payable returns (bytes memory result);

    /**
     * @notice Get the IP Asset ID associated with this IPAccount
     * @return ipId The IP Asset ID (address)
     */
    function ipId() external view returns (address ipId);

    /**
     * @notice Check if the IPAccount has permission for a specific operation
     * @param caller Address trying to execute
     * @param target Target contract address
     * @param data Function call data
     * @return hasPermission True if caller has permission
     */
    function hasPermission(
        address caller,
        address target,
        bytes calldata data
    ) external view returns (bool hasPermission);
}

