// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ADLV.sol";
import "../src/IDO.sol";
import "../src/CVSOracle.sol";

/**
 * @title InitializeCVSOracle_Simple
 * @notice Simple initialization for CVS Oracle
 * @dev Run this with the ADLV owner's private key
 */
contract InitializeCVSOracle_SimpleScript is Script {
    function run() external {
        // Get deployer private key (should be ADLV owner)
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Get contract addresses from environment
        address adlvAddress = vm.envAddress("ADLV_V3");
        address idoAddress = vm.envAddress("IDO_V3");
        address cvsOracleAddress = vm.envAddress("CVS_ORACLE_ADDRESS");
        address backendWallet = vm.envAddress("BACKEND_WALLET_ADDRESS");

        require(adlvAddress != address(0), "ADLV_V3 not set in .env");
        require(idoAddress != address(0), "IDO_V3 not set in .env");
        require(cvsOracleAddress != address(0), "CVS_ORACLE_ADDRESS not set in .env");
        require(backendWallet != address(0), "BACKEND_WALLET_ADDRESS not set in .env");

        console.log("===========================================");
        console.log("Initializing CVS Oracle Integration");
        console.log("===========================================");
        console.log("Deployer:", deployer);
        console.log("ADLV Contract:", adlvAddress);
        console.log("IDO Contract:", idoAddress);
        console.log("CVS Oracle:", cvsOracleAddress);
        console.log("Backend Wallet:", backendWallet);
        console.log("");

        ADLV adlv = ADLV(payable(adlvAddress));
        IDO ido = IDO(idoAddress);
        CVSOracle cvsOracle = CVSOracle(cvsOracleAddress);

        // Check ownership
        address adlvOwner = adlv.owner();
        address idoOwner = ido.owner();

        console.log("Current ADLV owner:", adlvOwner);
        console.log("Current IDO owner:", idoOwner);
        console.log("");

        if (deployer != adlvOwner) {
            console.log("ERROR: You are not the ADLV owner!");
            console.log("  Your address:", deployer);
            console.log("  ADLV owner:", adlvOwner);
            console.log("");
            console.log("Please run this script with the ADLV owner's private key.");
            return;
        }

        if (idoOwner != adlvAddress) {
            console.log("WARNING: IDO is not owned by ADLV!");
            console.log("  Expected:", adlvAddress);
            console.log("  Actual:", idoOwner);
            console.log("");
        }

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Set CVS Oracle in IDO contract (through ADLV)
        // Since ADLV owns IDO but doesn't have a proxy function,
        // we need to check if we can call it directly

        if (idoOwner == deployer) {
            // If deployer owns IDO directly, we can set it
            console.log("Step 1: Setting CVS Oracle in IDO contract...");
            ido.setCVSOracle(cvsOracleAddress);
            console.log("[OK] CVS Oracle set in IDO contract");
        } else {
            console.log("Step 1: SKIPPED - Cannot set CVS Oracle in IDO");
            console.log("  Reason: IDO is owned by ADLV contract, not by EOA");
            console.log("  This requires ADLV contract upgrade");
        }

        console.log("");

        // Step 2: Add backend wallet as operator in CVS Oracle
        console.log("Step 2: Adding backend wallet as operator...");
        cvsOracle.addOperator(backendWallet);
        console.log("[OK] Backend wallet added as operator");

        vm.stopBroadcast();

        console.log("");
        console.log("===========================================");
        console.log("Initialization Complete!");
        console.log("===========================================");
        console.log("");
        console.log("Status:");
        console.log("  [OK] CVS Oracle deployed");
        console.log("  [OK] Backend is operator");
        if (idoOwner == deployer) {
            console.log("  [OK] IDO integrated with oracle");
        } else {
            console.log("  [SKIP] IDO integration (requires ADLV upgrade)");
        }
        console.log("");
        console.log("Next steps:");
        console.log("1. Deploy updated subgraph (v1.2.0)");
        console.log("2. Update backend SUBGRAPH_URL");
        console.log("3. Restart backend service");
        console.log("4. Verify CVS sync service activates");
    }
}
