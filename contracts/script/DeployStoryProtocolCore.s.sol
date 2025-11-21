// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {StoryProtocolCore} from "../src/StoryProtocolCore.sol";

/**
 * @title DeployStoryProtocolCoreScript
 * @notice Deploy Story Protocol Core for testing
 */
contract DeployStoryProtocolCoreScript is Script {
    
    function run() external returns (StoryProtocolCore storyCore) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("==========================================");
        console.log("Story Protocol Core Deployment");
        console.log("==========================================");
        console.log("Deployer:", deployer);
        console.log("Network: Story Testnet");
        console.log("==========================================\n");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Story Protocol Core
        console.log("Deploying StoryProtocolCore...");
        storyCore = new StoryProtocolCore();
        console.log("[OK] StoryProtocolCore deployed at:", address(storyCore));
        console.log("");

        vm.stopBroadcast();

        // Display deployment summary
        console.log("==========================================");
        console.log("Deployment Summary");
        console.log("==========================================");
        console.log("StoryProtocolCore:", address(storyCore));
        console.log("==========================================");
        console.log("\nUpdate your .env file:");
        console.log("STORY_SPG_ADDRESS=", address(storyCore));
        console.log("STORY_IP_ASSET_REGISTRY=", address(storyCore));
        console.log("STORY_LICENSING_MODULE=", address(storyCore));
        console.log("==========================================\n");
    }
}
