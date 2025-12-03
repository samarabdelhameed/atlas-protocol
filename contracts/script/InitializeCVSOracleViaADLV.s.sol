// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ADLV.sol";
import "../src/IDO.sol";
import "../src/CVSOracle.sol";

/**
 * @title InitializeCVSOracleViaADLV
 * @notice Initialize CVS Oracle by calling through ADLV contract
 * @dev ADLV owns the IDO contract, so we need ADLV owner to run this
 */
contract InitializeCVSOracleViaADLVScript is Script {
    function run() external {
        // Get owner private key (ADLV owner, not deployer)
        uint256 ownerPrivateKey = vm.envUint("ADLV_OWNER_PRIVATE_KEY");
        address owner = vm.addr(ownerPrivateKey);

        // Get contract addresses
        address adlvAddress = vm.envAddress("ADLV_V3");
        address idoAddress = vm.envAddress("IDO_V3");
        address cvsOracleAddress = vm.envAddress("CVS_ORACLE_ADDRESS");
        address backendWallet = vm.envAddress("BACKEND_WALLET_ADDRESS");

        require(adlvAddress != address(0), "ADLV_V3 not set in .env");
        require(idoAddress != address(0), "IDO_V3 not set in .env");
        require(cvsOracleAddress != address(0), "CVS_ORACLE_ADDRESS not set in .env");
        require(backendWallet != address(0), "BACKEND_WALLET_ADDRESS not set in .env");

        console.log("===========================================");
        console.log("Initializing CVS Oracle via ADLV");
        console.log("===========================================");
        console.log("ADLV Owner:", owner);
        console.log("ADLV Contract:", adlvAddress);
        console.log("IDO Contract:", idoAddress);
        console.log("CVS Oracle:", cvsOracleAddress);
        console.log("Backend Wallet:", backendWallet);
        console.log("");

        ADLV adlv = ADLV(payable(adlvAddress));
        IDO ido = IDO(idoAddress);
        CVSOracle cvsOracle = CVSOracle(cvsOracleAddress);

        // Verify owner
        address adlvOwner = adlv.owner();
        console.log("ADLV contract owner:", adlvOwner);
        require(owner == adlvOwner, "Caller is not ADLV owner");

        // Verify IDO owner is ADLV
        address idoOwner = ido.owner();
        console.log("IDO contract owner:", idoOwner);
        require(idoOwner == adlvAddress, "IDO owner is not ADLV");

        vm.startBroadcast(ownerPrivateKey);

        // Step 1: Call IDO.setCVSOracle through a direct call
        // Since we can't add functions to deployed contracts, we'll call IDO directly
        // But we need to be the owner... which is ADLV contract
        // This won't work without upgrading ADLV

        console.log("ERROR: Cannot call setCVSOracle without upgrading ADLV contract");
        console.log("The IDO contract is owned by ADLV, not by an EOA");
        console.log("");
        console.log("OPTIONS:");
        console.log("1. Transfer IDO ownership to ADLV owner temporarily");
        console.log("2. Upgrade ADLV contract with setCVSOracle proxy function");
        console.log("3. Deploy new contracts with proper architecture");

        vm.stopBroadcast();
    }
}
