// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/StoryProtocolCore.sol";
import "../src/IDO.sol";
import "../src/ADLVWithStory.sol";

/**
 * @title DeployComplete
 * @notice Deploy all contracts with full Story Protocol integration
 */
contract DeployCompleteScript is Script {
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("==============================================");
        console.log("DEPLOYING COMPLETE STORY PROTOCOL INTEGRATION");
        console.log("==============================================");
        console.log("Deployer:", deployer);
        console.log("");
        
        // 1. Deploy Story Protocol Core
        console.log("1. Deploying Story Protocol Core...");
        StoryProtocolCore storyCore = new StoryProtocolCore();
        console.log("   Story Protocol Core:", address(storyCore));
        console.log("");
        
        // 2. Deploy IDO
        console.log("2. Deploying IDO...");
        IDO ido = new IDO(deployer);
        console.log("   IDO:", address(ido));
        console.log("");
        
        // 3. Deploy ADLV with Story Integration
        console.log("3. Deploying ADLV with Story Integration...");
        ADLVWithStory adlv = new ADLVWithStory(
            address(ido),
            address(storyCore), // SPG
            address(storyCore), // IP Asset Registry
            address(0)          // License Registry (optional)
        );
        console.log("   ADLV:", address(adlv));
        console.log("");
        
        // 4. Transfer IDO ownership to ADLV
        console.log("4. Transferring IDO ownership to ADLV...");
        ido.transferOwnership(address(adlv));
        console.log("   IDO owner:", ido.owner());
        console.log("");
        
        vm.stopBroadcast();
        
        console.log("==============================================");
        console.log("DEPLOYMENT COMPLETE!");
        console.log("==============================================");
        console.log("");
        console.log("Contract Addresses:");
        console.log("  Story Protocol Core:", address(storyCore));
        console.log("  IDO:", address(ido));
        console.log("  ADLV:", address(adlv));
        console.log("");
        console.log("Features:");
        console.log("  IP Asset Registration");
        console.log("  License Terms Management");
        console.log("  License Minting");
        console.log("  Royalty Module");
        console.log("  Derivative IP Support");
        console.log("  Revenue Claiming");
        console.log("  Revenue Sharing");
        console.log("==============================================");
        console.log("");
        console.log("Next Steps:");
        console.log("1. Update .env with new addresses");
        console.log("2. Run: forge script script/FullIntegrationTest.s.sol --broadcast");
        console.log("3. Verify contracts on explorer");
        console.log("==============================================");
    }
}
