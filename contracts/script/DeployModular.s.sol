// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/StoryProtocolCore.sol";
import "../src/IDO.sol";
import "../src/ADLV.sol";
import "../src/LoanNFT.sol";
import "../src/LendingModule.sol";

/**
 * @title DeployModular
 * @notice Deploy modular architecture with separate lending module
 */
contract DeployModularScript is Script {
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("==============================================");
        console.log("DEPLOYING MODULAR ARCHITECTURE");
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
        
        // 3. Deploy Loan NFT
        console.log("3. Deploying Loan NFT...");
        LoanNFT loanNFT = new LoanNFT();
        console.log("   Loan NFT:", address(loanNFT));
        console.log("");
        
        // 4. Deploy Lending Module
        console.log("4. Deploying Lending Module...");
        LendingModule lendingModule = new LendingModule(
            address(ido),
            address(loanNFT)
        );
        console.log("   Lending Module:", address(lendingModule));
        console.log("");
        
        // 5. Deploy ADLV (Simple version)
        console.log("5. Deploying ADLV...");
        ADLV adlv = new ADLV(address(ido));
        console.log("   ADLV:", address(adlv));
        console.log("");
        
        // 6. Setup ownership
        console.log("6. Setting up ownership...");
        loanNFT.transferOwnership(address(lendingModule));
        console.log("   Loan NFT owner:", loanNFT.owner());
        
        lendingModule.setADLVContract(address(adlv));
        console.log("   Lending Module ADLV:", address(adlv));
        
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
        console.log("  Loan NFT:", address(loanNFT));
        console.log("  Lending Module:", address(lendingModule));
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
        console.log("  IP-Backed Lending (Modular)");
        console.log("  Loan NFTs");
        console.log("  Dynamic Interest Rates");
        console.log("  Health Factor Monitoring");
        console.log("  Liquidation System");
        console.log("==============================================");
    }
}
