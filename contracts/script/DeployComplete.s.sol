// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/IDO.sol";
import "../src/ADLV.sol";
import "../src/LoanNFT.sol";
import "../src/LendingModule.sol";
import "../src/CVSOracle.sol";

/**
 * @title DeployComplete
 * @notice Complete deployment with CVS Oracle integration
 * @dev Deploys all contracts and sets up CVS Oracle properly
 */
contract DeployCompleteScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address storyProtocolCore = vm.envAddress("STORY_PROTOCOL_CORE_ADDRESS");
        address backendWallet = vm.envAddress("BACKEND_WALLET_ADDRESS");

        require(storyProtocolCore != address(0), "STORY_PROTOCOL_CORE_ADDRESS not set");
        require(backendWallet != address(0), "BACKEND_WALLET_ADDRESS not set");

        console.log("==============================================");
        console.log("ATLAS PROTOCOL - COMPLETE DEPLOYMENT");
        console.log("==============================================");
        console.log("Deployer:", deployer);
        console.log("Story Protocol Core:", storyProtocolCore);
        console.log("Backend Wallet:", backendWallet);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy IDO (owned by deployer initially)
        console.log("1. Deploying IDO...");
        IDO ido = new IDO(deployer);
        console.log("   [OK] IDO:", address(ido));
        console.log("");

        // 2. Deploy CVS Oracle
        console.log("2. Deploying CVS Oracle...");
        CVSOracle cvsOracle = new CVSOracle(storyProtocolCore);
        console.log("   [OK] CVS Oracle:", address(cvsOracle));
        console.log("");

        // 3. Set CVS Oracle in IDO (while deployer still owns it)
        console.log("3. Setting CVS Oracle in IDO...");
        ido.setCVSOracle(address(cvsOracle));
        console.log("   [OK] CVS Oracle configured in IDO");
        console.log("");

        // 4. Add backend as operator in CVS Oracle
        console.log("4. Adding backend as operator in CVS Oracle...");
        cvsOracle.addOperator(backendWallet);
        console.log("   [OK] Backend wallet is operator");
        console.log("");

        // 5. Deploy Loan NFT
        console.log("5. Deploying Loan NFT...");
        LoanNFT loanNFT = new LoanNFT();
        console.log("   [OK] Loan NFT:", address(loanNFT));
        console.log("");

        // 6. Deploy Lending Module
        console.log("6. Deploying Lending Module...");
        LendingModule lendingModule = new LendingModule(
            address(ido),
            address(loanNFT)
        );
        console.log("   [OK] Lending Module:", address(lendingModule));
        console.log("");

        // 7. Deploy ADLV
        console.log("7. Deploying ADLV...");
        ADLV adlv = new ADLV(address(ido));
        console.log("   [OK] ADLV:", address(adlv));
        console.log("");

        // 8. Setup ownership and permissions
        console.log("8. Setting up ownership and permissions...");

        loanNFT.transferOwnership(address(lendingModule));
        console.log("   [OK] Loan NFT owned by Lending Module");

        lendingModule.setADLVContract(address(adlv));
        console.log("   [OK] Lending Module configured with ADLV");

        ido.transferOwnership(address(adlv));
        console.log("   [OK] IDO owned by ADLV");

        // 9. Set bridge agent for cross-chain transfers (Owlto)
        adlv.setBridgeAgent(backendWallet);
        console.log("   [OK] Bridge Agent set to:", backendWallet);
        console.log("");

        vm.stopBroadcast();

        console.log("==============================================");
        console.log("DEPLOYMENT COMPLETE!");
        console.log("==============================================");
        console.log("");
        console.log("Contract Addresses (update .env files):");
        console.log("  IDO_V3=", address(ido));
        console.log("  ADLV_V3=", address(adlv));
        console.log("  LENDING_MODULE_ADDRESS=", address(lendingModule));
        console.log("  LOAN_NFT_ADDRESS=", address(loanNFT));
        console.log("  CVS_ORACLE_ADDRESS=", address(cvsOracle));
        console.log("");
        console.log("Ownership:");
        console.log("  ADLV owner:", deployer);
        console.log("  IDO owner:", address(adlv));
        console.log("  Loan NFT owner:", address(lendingModule));
        console.log("  CVS Oracle owner:", deployer);
        console.log("  Bridge Agent:", backendWallet);
        console.log("");
        console.log("CVS Oracle Status:");
        console.log("  [OK] Integrated with IDO");
        console.log("  [OK] Backend is operator");
        console.log("  [OK] Ready for CVS sync");
        console.log("");
        console.log("Next Steps:");
        console.log("1. Update contracts/.env with new addresses");
        console.log("2. Update apps/agent-service/.env with new addresses");
        console.log("3. Update subgraph/subgraph.yaml with new addresses");
        console.log("4. Deploy subgraph with: goldsky subgraph deploy atlasprotocol/2.0.0");
        console.log("5. Restart backend service");
        console.log("==============================================");
    }
}
