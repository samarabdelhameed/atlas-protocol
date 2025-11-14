// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {IDO} from "../src/IDO.sol";
import {ADLV} from "../src/ADLV.sol";

/**
 * @title DeployToStoryScript
 * @notice Deployment script specifically for Story Protocol testnet
 * @dev Deploys IDO and ADLV contracts on Story Protocol network
 */
contract DeployToStoryScript is Script {
    function run() external returns (IDO ido, ADLV adlv) {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Story Protocol RPC URL (should be in .env as STORY_PROTOCOL_RPC)
        string memory storyRpcUrl = vm.envString("STORY_PROTOCOL_RPC");
        
        console.log("==========================================");
        console.log("Atlas Protocol - Story Protocol Deployment");
        console.log("==========================================");
        console.log("Deployer:", deployer);
        console.log("Network: Story Protocol Testnet");
        console.log("RPC URL:", storyRpcUrl);
        console.log("==========================================\n");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy IDO contract
        console.log("Deploying IDO contract to Story Protocol...");
        ido = new IDO(deployer);
        console.log("[OK] IDO deployed at:", address(ido));
        console.log("   Owner:", deployer);
        console.log("");

        // Deploy ADLV contract
        console.log("Deploying ADLV contract to Story Protocol...");
        adlv = new ADLV(address(ido));
        console.log("[OK] ADLV deployed at:", address(adlv));
        console.log("   IDO Contract:", address(ido));
        console.log("");

        // Transfer IDO ownership to ADLV
        console.log("Transferring IDO ownership to ADLV...");
        ido.transferOwnership(address(adlv));
        console.log("[OK] IDO ownership transferred to ADLV");
        console.log("   New IDO Owner:", address(adlv));
        console.log("");

        // Verify setup
        console.log("Verifying contract setup...");
        require(ido.owner() == address(adlv), "IDO ownership transfer failed");
        require(adlv.idoContract() == address(ido), "ADLV IDO reference incorrect");
        console.log("[OK] Contract setup verified");
        console.log("");

        vm.stopBroadcast();

        // Display deployment summary
        console.log("==========================================");
        console.log("Story Protocol Deployment Summary");
        console.log("==========================================");
        console.log("Network: Story Protocol Testnet");
        console.log("IDO Contract:", address(ido));
        console.log("ADLV Contract:", address(adlv));
        console.log("IDO Owner:", ido.owner());
        console.log("==========================================");
        console.log("\nAdd these addresses to your .env file:");
        console.log("IDO_ADDRESS=", address(ido));
        console.log("ADLV_ADDRESS=", address(adlv));
        console.log("STORY_PROTOCOL_RPC=", storyRpcUrl);
        console.log("==========================================\n");
    }
}

