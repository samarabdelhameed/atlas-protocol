// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VaultSharesERC20
 * @notice ERC20 token with EIP-2612 Permit support for vault shares
 * @dev Enables gasless approvals via signatures
 */
contract VaultSharesERC20 is ERC20, ERC20Permit, Ownable {
    address public vault;
    
    constructor(
        string memory name,
        string memory symbol,
        address _vault,
        address initialOwner
    ) ERC20(name, symbol) ERC20Permit(name) Ownable(initialOwner) {
        vault = _vault;
    }
    
    /**
     * @notice Mint shares to depositor
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @notice Burn shares from holder
     * @param from Holder address
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}
