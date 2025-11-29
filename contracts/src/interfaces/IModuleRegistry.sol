// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IModuleRegistry
 * @notice Interface for Story Protocol Module Registry
 * @dev Modules must be registered to be recognized by Story Protocol
 * This enables modules to interact with IPAssets and IPAccounts
 */
interface IModuleRegistry {
    /**
     * @notice Module registration information
     */
    struct ModuleInfo {
        address moduleAddress;
        string name;
        string description;
        string version;
        bool active;
        address owner;
        uint256 registeredAt;
        bytes4[] functionSelectors; // Functions this module can execute
    }

    /**
     * @notice Register a module with Story Protocol
     * @param moduleAddress The module contract address
     * @param name Module name
     * @param description Module description
     * @param version Module version
     * @param functionSelectors Array of function selectors this module uses
     * @return moduleId The registered module ID
     */
    function registerModule(
        address moduleAddress,
        string calldata name,
        string calldata description,
        string calldata version,
        bytes4[] calldata functionSelectors
    ) external returns (uint256 moduleId);

    /**
     * @notice Get module information
     * @param moduleId The module ID
     * @return info Module information struct
     */
    function getModule(uint256 moduleId) external view returns (ModuleInfo memory info);

    /**
     * @notice Get module by address
     * @param moduleAddress The module address
     * @return moduleId The module ID
     * @return info Module information struct
     */
    function getModuleByAddress(address moduleAddress) external view returns (uint256 moduleId, ModuleInfo memory info);

    /**
     * @notice Check if module is registered
     * @param moduleAddress The module address
     * @return isRegistered True if module is registered
     */
    function isModuleRegistered(address moduleAddress) external view returns (bool isRegistered);

    /**
     * @notice Deactivate a module
     * @param moduleId The module ID
     */
    function deactivateModule(uint256 moduleId) external;

    /**
     * @notice Reactivate a module
     * @param moduleId The module ID
     */
    function reactivateModule(uint256 moduleId) external;

    /**
     * @notice Get all modules
     * @return modules Array of module IDs
     */
    function getAllModules() external view returns (uint256[] memory modules);

    /**
     * @notice Event emitted when module is registered
     */
    event ModuleRegistered(
        uint256 indexed moduleId,
        address indexed moduleAddress,
        string name,
        address indexed owner
    );

    /**
     * @notice Event emitted when module is deactivated
     */
    event ModuleDeactivated(uint256 indexed moduleId, address indexed moduleAddress);

    /**
     * @notice Event emitted when module is reactivated
     */
    event ModuleReactivated(uint256 indexed moduleId, address indexed moduleAddress);
}

