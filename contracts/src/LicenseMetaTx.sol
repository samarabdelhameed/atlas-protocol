// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title LicenseMetaTx
 * @notice Meta-transaction support for license purchases
 * @dev Enables gasless license purchases via EIP-712 signatures
 */
contract LicenseMetaTx is EIP712 {
    using ECDSA for bytes32;
    
    // Typehash for license purchase
    bytes32 public constant LICENSE_PURCHASE_TYPEHASH = keccak256(
        "LicensePurchase(address vaultAddress,string licenseType,uint256 duration,uint256 price,uint256 nonce,uint256 deadline)"
    );
    
    // Nonces for replay protection
    mapping(address => uint256) public nonces;
    
    constructor() EIP712("ADLVLicenseMetaTx", "1") {}
    
    /**
     * @notice Verify license purchase signature
     * @param vaultAddress Vault address
     * @param licenseType License type
     * @param duration License duration
     * @param price License price
     * @param deadline Signature deadline
     * @param signature EIP-712 signature
     * @return signer Address that signed the message
     */
    function verifyLicensePurchase(
        address vaultAddress,
        string calldata licenseType,
        uint256 duration,
        uint256 price,
        uint256 deadline,
        bytes calldata signature
    ) public view returns (address signer) {
        require(block.timestamp <= deadline, "MetaTx: Signature expired");
        
        bytes32 structHash = keccak256(
            abi.encode(
                LICENSE_PURCHASE_TYPEHASH,
                vaultAddress,
                keccak256(bytes(licenseType)),
                duration,
                price,
                nonces[signer],
                deadline
            )
        );
        
        bytes32 hash = _hashTypedDataV4(structHash);
        signer = hash.recover(signature);
        
        return signer;
    }
    
    /**
     * @notice Execute license purchase with meta-transaction
     * @param vaultAddress Vault address
     * @param licenseType License type
     * @param duration License duration
     * @param price License price
     * @param deadline Signature deadline
     * @param signature EIP-712 signature
     */
    function executeLicensePurchase(
        address vaultAddress,
        string calldata licenseType,
        uint256 duration,
        uint256 price,
        uint256 deadline,
        bytes calldata signature
    ) external payable returns (address signer) {
        require(msg.value >= price, "MetaTx: Insufficient payment");
        
        signer = verifyLicensePurchase(
            vaultAddress,
            licenseType,
            duration,
            price,
            deadline,
            signature
        );
        
        // Increment nonce
        nonces[signer]++;
        
        return signer;
    }
    
    /**
     * @notice Get current nonce for address
     * @param user User address
     * @return Current nonce
     */
    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }
}
