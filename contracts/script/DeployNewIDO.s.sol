// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/IDO.sol";

/**
 * @title DeployNewIDO
 * @notice Deploy new IDO with ADLV v4 as owner
 */
contract DeployNewIDOScript is Script {
    function run() external {
        // Get deployer private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address newADLV = 0xFe9E0Dd8893F71303ACF8164462d323905199669;
        
        console.log("===========================================");
        console.log("Deploying New IDO for ADLV v4");
        console.log("===========================================");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("ADLV v4:", newADLV);
        console.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy IDO with ADLV as initial owner
        IDO ido = new IDO(newADLV);
        
        vm.stopBroadcast();
        
        console.log("===========================================");
        console.log("Deployment Complete!");
        console.log("===========================================");
        console.log("IDO Address:", address(ido));
        console.log("Owner:", ido.owner());
        console.log("");
        console.log("Next steps:");
        console.log("1. Update ADLV to use new IDO:");
        console.log("   cast send %s \"setIDOContract(address)\" %s", newADLV, address(ido));
        console.log("");
        console.log("2. Update .env files:");
        console.log("   IDO_V4=%s", address(ido));
        console.log("");
    }
}
