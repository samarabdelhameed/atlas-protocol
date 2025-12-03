// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ADLV.sol";
import "../src/IDO.sol";
import "../src/CVSOracle.sol";

/**
 * @title InitializeCVSOracleWithOwnershipTransfer
 * @notice Initialize CVS Oracle by temporarily transferring IDO ownership
 * @dev Steps:
 *   1. ADLV (current IDO owner) transfers ownership to ADLV owner
 *   2. ADLV owner sets CVS Oracle in IDO
 *   3. ADLV owner adds backend as operator in CVS Oracle
 *   4. ADLV owner transfers IDO ownership back to ADLV
 */
contract InitializeCVSOracleWithOwnershipTransferScript is Script {
    function run() external {
        // We need TWO private keys:
        // 1. ADLV owner to initiate ownership transfer from ADLV
        // 2. Same ADLV owner to set oracle and transfer back

        uint256 adlvOwnerPrivateKey = vm.envUint("ADLV_OWNER_PRIVATE_KEY");
        address adlvOwner = vm.addr(adlvOwnerPrivateKey);

        address adlvAddress = vm.envAddress("ADLV_V3");
        address idoAddress = vm.envAddress("IDO_V3");
        address cvsOracleAddress = vm.envAddress("CVS_ORACLE_ADDRESS");
        address backendWallet = vm.envAddress("BACKEND_WALLET_ADDRESS");

        console.log("===========================================");
        console.log("CVS Oracle Initialization");
        console.log("(via temporary ownership transfer)");
        console.log("===========================================");
        console.log("ADLV Owner:", adlvOwner);
        console.log("ADLV Contract:", adlvAddress);
        console.log("IDO Contract:", idoAddress);
        console.log("CVS Oracle:", cvsOracleAddress);
        console.log("Backend Wallet:", backendWallet);
        console.log("");

        ADLV adlv = ADLV(payable(adlvAddress));
        IDO ido = IDO(idoAddress);
        CVSOracle cvsOracle = CVSOracle(cvsOracleAddress);

        vm.startBroadcast(adlvOwnerPrivateKey);

        // Step 1: Transfer IDO ownership from ADLV to ADLV owner (temporarily)
        console.log("Step 1: Transferring IDO ownership to ADLV owner...");
        console.log("Current IDO owner:", ido.owner());

        // This requires calling transferOwnership ON the ADLV contract
        // which will then call it on IDO... but ADLV doesn't have this function!
        //
        // We're stuck. The architecture doesn't support this.

        console.log("");
        console.log("PROBLEM: ADLV contract does not have a function to call");
        console.log("transferOwnership on the IDO contract it owns.");
        console.log("");
        console.log("SOLUTION: We need to use cast send to call the IDO contract");
        console.log("directly, but the transaction must come from ADLV, not an EOA.");
        console.log("");
        console.log("This requires either:");
        console.log("1. Upgrading ADLV with a proxy function");
        console.log("2. Using a different deployment architecture");
        console.log("3. Manual intervention via multisig/governance");

        vm.stopBroadcast();
    }
}
