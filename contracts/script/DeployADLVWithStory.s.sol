// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {IDO} from "../src/IDO.sol";
import {ADLVWithStory} from "../src/ADLVWithStory.sol";

/**
 * @title DeployADLVWithStoryScript
 * @notice Deployment script for ADLV with Story Protocol integration
 */
contract DeployADLVWithStoryScript is Script {
    // Story Protocol Testnet addresses (official from docs)
    address constant STORY_SPG = 0x69415CE984A79a3Cfbe3F51024C63b6C107331e3;
    address constant STORY_IP_ASSET_REGISTRY = 0x292639452A975630802C17c9267169D93BD5a793;
    
    function run() external returns (IDO ido, ADLVWithStory adlv) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        string memory storyRpcUrl = vm.envString("STORY_PROTOCOL_RPC");
        
        console.log("==========================================");
        console.log("Atlas Protocol - Story Integration Deployment");
        console.log("==========================================");
        console.log("Deployer:", deployer);
        console.log("Network: Story Protocol Testnet");
        console.log("RPC URL:", storyRpcUrl);
        console.log("Story SPG:", STORY_SPG);
        console.log("Story IP Registry:", STORY_IP_ASSET_REGISTRY);
        console.log("==========================================\n");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy IDO contract
        console.log("Deploying IDO contract...");
        ido = new IDO(deployer);
        console.log("[OK] IDO deployed at:", address(ido));
        console.log("   Owner:", deployer);
        console.log("");

        // Deploy ADLV with Story Protocol integration
        console.log("Deploying ADLVWithStory contract...");
        adlv = new ADLVWithStory(
            address(ido),
            STORY_SPG,
            STORY_IP_ASSET_REGISTRY
        );
        console.log("[OK] ADLVWithStory deployed at:", address(adlv));
        console.log("   IDO Contract:", address(ido));
        console.log("   Story SPG:", STORY_SPG);
        console.log("   Story IP Registry:", STORY_IP_ASSET_REGISTRY);
        console.log("");

        // Transfer IDO ownership to ADLV
        console.log("Transferring IDO ownership to ADLVWithStory...");
        ido.transferOwnership(address(adlv));
        console.log("[OK] IDO ownership transferred");
        console.log("   New IDO Owner:", address(adlv));
        console.log("");

        // Verify setup
        console.log("Verifying contract setup...");
        require(ido.owner() == address(adlv), "IDO ownership transfer failed");
        require(address(adlv.idoContract()) == address(ido), "ADLV IDO reference incorrect");
        require(address(adlv.storySPG()) == STORY_SPG, "ADLV SPG reference incorrect");
        require(address(adlv.storyIPAssetRegistry()) == STORY_IP_ASSET_REGISTRY, "ADLV Registry reference incorrect");
        console.log("[OK] Contract setup verified");
        console.log("");

        vm.stopBroadcast();

        // Display deployment summary
        console.log("==========================================");
        console.log("Story Integration Deployment Summary");
        console.log("==========================================");
        console.log("Network: Story Protocol Testnet");
        console.log("IDO Contract:", address(ido));
        console.log("ADLVWithStory Contract:", address(adlv));
        console.log("IDO Owner:", ido.owner());
        console.log("Story SPG:", STORY_SPG);
        console.log("Story IP Registry:", STORY_IP_ASSET_REGISTRY);
        console.log("==========================================");
        console.log("\nAdd these addresses to your .env file:");
        console.log("IDO_ADDRESS=", address(ido));
        console.log("ADLV_WITH_STORY_ADDRESS=", address(adlv));
        console.log("STORY_SPG_ADDRESS=", STORY_SPG);
        console.log("STORY_IP_ASSET_REGISTRY=", STORY_IP_ASSET_REGISTRY);
        console.log("==========================================\n");
    }
}
