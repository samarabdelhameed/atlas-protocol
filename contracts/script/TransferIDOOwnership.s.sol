// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/IDO.sol";

/**
 * @title TransferIDOOwnership
 * @notice Transfer IDO ownership from old ADLV (v3) to new ADLV (v4)
 */
contract TransferIDOOwnershipScript is Script {
    function run() external {
        // Get deployer private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Addresses
        address idoAddress = 0xeF83DB9b011261Ad3a76ccE8B7E54B2c055300D8;
        address oldADLV = 0x793402b59d2ca4c501EDBa328347bbaF69a59f7b;
        address newADLV = 0x572C39bE4E794Fac01f0CdfAe2d2471C52E49713;
        
        console.log("===========================================");
        console.log("Transferring IDO Ownership");
        console.log("===========================================");
        console.log("IDO:", idoAddress);
        console.log("Old ADLV (v3):", oldADLV);
        console.log("New ADLV (v4):", newADLV);
        console.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Call transferOwnership on old ADLV to transfer IDO ownership
        // First, we need to call IDO.transferOwnership from old ADLV
        // But we can't do that directly, so we'll use the deployer
        
        // Actually, we need to call from old ADLV context
        // Let's just transfer ownership directly if we're the owner
        IDO ido = IDO(idoAddress);
        address currentOwner = ido.owner();
        
        console.log("Current IDO owner:", currentOwner);
        
        if (currentOwner == oldADLV) {
            console.log("ERROR: IDO owner is old ADLV. Need to call from old ADLV contract.");
            console.log("Solution: Deploy new IDO or use old ADLV to transfer ownership");
        } else if (currentOwner == vm.addr(deployerPrivateKey)) {
            console.log("Transferring ownership to new ADLV...");
            ido.transferOwnership(newADLV);
            console.log("SUCCESS: Ownership transferred!");
        } else {
            console.log("ERROR: You are not the owner");
        }
        
        vm.stopBroadcast();
    }
}
