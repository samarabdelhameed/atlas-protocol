// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ADLVWithStoryV2.sol";
import "../src/IDO.sol";
import "../src/LoanNFT.sol";

/**
 * @title DeployADLVV2
 * @notice Deployment script for ADLV V2 with:
 *         - EIP-2612 Permit support
 *         - Meta-transactions for licenses
 *         - Full Story Protocol royalty streams
 */
contract DeployADLVV2 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying ADLV V2 with account:", deployer);
        console.log("Account balance:", deployer.balance);
        
        // Story Protocol addresses (Story Testnet)
        address storySPG = vm.envOr("STORY_SPG_ADDRESS", address(0x1234567890123456789012345678901234567890));
        address storyIPAssetRegistry = vm.envOr("STORY_IP_ASSET_REGISTRY", address(0x2345678901234567890123456789012345678901));
        address storyLicenseRegistry = vm.envOr("STORY_LICENSE_REGISTRY", address(0x3456789012345678901234567890123456789012));
        
        console.log("Story SPG:", storySPG);
        console.log("Story IP Asset Registry:", storyIPAssetRegistry);
        console.log("Story License Registry:", storyLicenseRegistry);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy IDO (IP Data Oracle)
        console.log("\n1. Deploying IDO...");
        IDO ido = new IDO(deployer);
        console.log("IDO deployed at:", address(ido));
        
        // 2. Deploy Loan NFT
        console.log("\n2. Deploying Loan NFT...");
        LoanNFT loanNFT = new LoanNFT();
        console.log("Loan NFT deployed at:", address(loanNFT));
        
        // 3. Deploy ADLV V2
        console.log("\n3. Deploying ADLV V2...");
        ADLVWithStoryV2 adlv = new ADLVWithStoryV2(
            address(ido),
            storySPG,
            storyIPAssetRegistry,
            storyLicenseRegistry,
            address(loanNFT),
            address(0) // Lending module (optional)
        );
        console.log("ADLV V2 deployed at:", address(adlv));
        
        // 4. Set ADLV as IDO owner
        console.log("\n4. Transferring IDO ownership to ADLV...");
        ido.transferOwnership(address(adlv));
        console.log("IDO ownership transferred");
        
        // 5. Transfer Loan NFT ownership to ADLV (so ADLV can mint)
        console.log("\n5. Transferring Loan NFT ownership to ADLV...");
        loanNFT.transferOwnership(address(adlv));
        console.log("Loan NFT ownership transferred to ADLV");
        
        vm.stopBroadcast();
        
        // Print deployment summary
        console.log("\n========================================");
        console.log("DEPLOYMENT SUMMARY - ADLV V2");
        console.log("========================================");
        console.log("IDO:", address(ido));
        console.log("Loan NFT:", address(loanNFT));
        console.log("ADLV V2:", address(adlv));
        console.log("License MetaTx:", address(adlv.licenseMetaTx()));
        console.log("Royalty Module:", address(adlv.royaltyModule()));
        console.log("========================================");
        console.log("\nFeatures Enabled:");
        console.log("- EIP-2612 Permit for vault shares");
        console.log("- Meta-transactions for licenses");
        console.log("- Story Protocol royalty streams");
        console.log("- Derivative IP licensing");
        console.log("========================================");
        
        // Save deployment addresses
        string memory deploymentInfo = string(abi.encodePacked(
            "IDO=", vm.toString(address(ido)), "\n",
            "LOAN_NFT=", vm.toString(address(loanNFT)), "\n",
            "ADLV_V2=", vm.toString(address(adlv)), "\n",
            "LICENSE_METATX=", vm.toString(address(adlv.licenseMetaTx())), "\n",
            "ROYALTY_MODULE=", vm.toString(address(adlv.royaltyModule())), "\n"
        ));
        
        vm.writeFile("./deployment-v2.txt", deploymentInfo);
        console.log("\nDeployment addresses saved to deployment-v2.txt");
    }
}
