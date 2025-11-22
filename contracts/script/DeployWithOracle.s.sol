// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/StoryProtocolCore.sol";
import "../src/IDO.sol";
import "../src/ADLV.sol";
import "../src/LoanNFT.sol";
import "../src/LendingModule.sol";
import "../src/CVSOracle.sol";

/**
 * @title DeployWithOracle
 * @notice Deploy complete system with CVS Oracle integration
 */
contract DeployWithOracleScript is Script {
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("==============================================");
        console.log("DEPLOYING WITH CVS ORACLE INTEGRATION");
        console.log("==============================================");
        console.log("Deployer:", deployer);
        console.log("");
        
        // 1. Deploy Story Protocol Core
        console.log("1. Deploying Story Protocol Core...");
        StoryProtocolCore storyCore = new StoryProtocolCore();
        console.log("   Story Protocol Core:", address(storyCore));
        
        // 2. Deploy CVS Oracle
        console.log("2. Deploying CVS Oracle...");
        CVSOracle cvsOracle = new CVSOracle(address(storyCore));
        console.log("   CVS Oracle:", address(cvsOracle));
        
        // 3. Deploy IDO
        console.log("3. Deploying IDO...");
        IDO ido = new IDO(deployer);
        console.log("   IDO:", address(ido));
        
        // 4. Connect IDO to Oracle
        console.log("4. Connecting IDO to Oracle...");
        ido.setCVSOracle(address(cvsOracle));
        ido.setUseOracle(true);
        console.log("   Oracle connected and enabled");
        
        // 5. Deploy Loan NFT
        console.log("5. Deploying Loan NFT...");
        LoanNFT loanNFT = new LoanNFT();
        console.log("   Loan NFT:", address(loanNFT));
        
        // 6. Deploy Lending Module
        console.log("6. Deploying Lending Module...");
        LendingModule lendingModule = new LendingModule(
            address(ido),
            address(loanNFT)
        );
        console.log("   Lending Module:", address(lendingModule));
        
        // 7. Deploy ADLV
        console.log("7. Deploying ADLV...");
        ADLV adlv = new ADLV(address(ido));
        console.log("   ADLV:", address(adlv));
        
        // 8. Setup ownership
        console.log("8. Setting up ownership...");
        loanNFT.transferOwnership(address(lendingModule));
        lendingModule.setADLVContract(address(adlv));
        ido.transferOwnership(address(adlv));
        console.log("   Ownership configured");
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("==============================================");
        console.log("DEPLOYMENT COMPLETE!");
        console.log("==============================================");
        console.log("");
        console.log("Contract Addresses:");
        console.log("  Story Protocol Core:", address(storyCore));
        console.log("  CVS Oracle:", address(cvsOracle));
        console.log("  IDO:", address(ido));
        console.log("  Loan NFT:", address(loanNFT));
        console.log("  Lending Module:", address(lendingModule));
        console.log("  ADLV:", address(adlv));
        console.log("");
        console.log("Features:");
        console.log("  IP Asset Registration");
        console.log("  On-chain CVS Oracle (NEW!)");
        console.log("  Real-time CVS Updates (NEW!)");
        console.log("  CVS Confidence Scores (NEW!)");
        console.log("  CVS History Tracking (NEW!)");
        console.log("  IP-Backed Lending");
        console.log("  Loan NFTs");
        console.log("  Dynamic Interest Rates");
        console.log("==============================================");
    }
}
