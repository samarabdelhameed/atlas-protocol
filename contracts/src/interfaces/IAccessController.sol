// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAccessController
 * @notice Interface for Story Protocol AccessController
 * @dev AccessController manages permissions for IPAccount operations
 */
interface IAccessController {
    /**
     * @notice Permission types
     */
    enum Permission {
        ALLOW,
        DENY,
        ABSTAIN
    }

    /**
     * @notice Set batch permissions for IPAccount
     * @param ipId The IP Asset ID (IPAccount address)
     * @param to Target contract/module address
     * @param functionSelectors Array of function selectors (bytes4)
     * @param permissions Array of permission types
     */
    function setBatchPermissions(
        address ipId,
        address to,
        bytes4[] calldata functionSelectors,
        Permission[] calldata permissions
    ) external;

    /**
     * @notice Set single permission
     * @param ipId The IP Asset ID (IPAccount address)
     * @param to Target contract/module address
     * @param functionSelector Function selector (bytes4)
     * @param permission Permission type
     */
    function setPermission(
        address ipId,
        address to,
        bytes4 functionSelector,
        Permission permission
    ) external;

    /**
     * @notice Check if caller has permission
     * @param ipId The IP Asset ID (IPAccount address)
     * @param caller Caller address
     * @param to Target contract/module address
     * @param functionSelector Function selector (bytes4)
     * @return hasPermission True if caller has permission
     */
    function hasPermission(
        address ipId,
        address caller,
        address to,
        bytes4 functionSelector
    ) external view returns (bool hasPermission);

    /**
     * @notice Get permission for a specific function
     * @param ipId The IP Asset ID (IPAccount address)
     * @param to Target contract/module address
     * @param functionSelector Function selector (bytes4)
     * @return permission The permission type
     */
    function getPermission(
        address ipId,
        address to,
        bytes4 functionSelector
    ) external view returns (Permission permission);
}

