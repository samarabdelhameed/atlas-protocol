// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/IDO.sol";
import "../src/CVSOracle.sol";

/**
 * @title InitializeCVSOracle
 * @notice Initialize CVS Oracle in IDO contract and add operator permissions
 */
contract InitializeCVSOracleScript is Script {
    function run() external {
        // Get deployer private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Get contract addresses from environment
        address idoAddress = vm.envAddress("IDO_V3");
        address cvsOracleAddress = vm.envAddress("CVS_ORACLE_ADDRESS");
        address backendWallet = vm.envAddress("BACKEND_WALLET_ADDRESS");

        require(idoAddress != address(0), "IDO_V3 not set in .env");
        require(cvsOracleAddress != address(0), "CVS_ORACLE_ADDRESS not set in .env");
        require(backendWallet != address(0), "BACKEND_WALLET_ADDRESS not set in .env");

        console.log("===========================================");
        console.log("Initializing CVS Oracle Integration");
        console.log("===========================================");
        console.log("Deployer:", deployer);
        console.log("IDO Contract:", idoAddress);
        console.log("CVS Oracle:", cvsOracleAddress);
        console.log("Backend Wallet:", backendWallet);
        console.log("");

        IDO ido = IDO(idoAddress);
        CVSOracle cvsOracle = CVSOracle(cvsOracleAddress);

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Set CVS Oracle in IDO contract
        console.log("Step 1: Setting CVS Oracle in IDO contract...");
        ido.setCVSOracle(cvsOracleAddress);
        console.log("[OK] CVS Oracle set in IDO contract");

        // Step 2: Add backend wallet as operator in CVS Oracle
        console.log("");
        console.log("Step 2: Adding backend wallet as operator...");
        cvsOracle.addOperator(backendWallet);
        console.log("[OK] Backend wallet added as operator");

        vm.stopBroadcast();

        console.log("");
        console.log("===========================================");
        console.log("Initialization Complete!");
        console.log("===========================================");
        console.log("");
        console.log("Next steps:");
        console.log("1. Update backend .env SUBGRAPH_URL to v1.2.0 (when deployed)");
        console.log("2. Restart backend service");
        console.log("3. Verify CVS sync service activates");
        console.log("");
        console.log("The backend will now:");
        console.log("- Fetch CVS from Story Protocol every 5 minutes");
        console.log("- Update CVS on-chain via the oracle");
        console.log("- Track CVS history in the subgraph");
    }
}
