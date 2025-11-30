// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ADLV.sol";

/**
 * @title DeployADLVOnly
 * @notice Deploy only ADLV contract (with cross-chain support)
 * @dev Use existing IDO contract
 */
contract DeployADLVOnlyScript is Script {
    function run() external {
        // Get deployer private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Get existing IDO address
        address idoAddress = vm.envAddress("IDO_V3");
        
        require(idoAddress != address(0), "IDO_V3 address not set in .env");
        
        console.log("===========================================");
        console.log("Deploying ADLV with Cross-Chain Support");
        console.log("===========================================");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("IDO Address:", idoAddress);
        console.log("Network:", block.chainid);
        console.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy ADLV
        ADLV adlv = new ADLV(idoAddress);
        
        vm.stopBroadcast();
        
        console.log("===========================================");
        console.log("Deployment Complete!");
        console.log("===========================================");
        console.log("ADLV Address:", address(adlv));
        console.log("");
        console.log("Update your .env files:");
        console.log("ADLV_V3=%s", address(adlv));
        console.log("VITE_ADLV_CONTRACT_ADDRESS=%s", address(adlv));
        console.log("");
        console.log("Verify with:");
        console.log("forge verify-contract %s src/ADLV.sol:ADLV --chain-id %s --constructor-args $(cast abi-encode \"constructor(address)\" %s)", address(adlv), block.chainid, idoAddress);
    }
}
