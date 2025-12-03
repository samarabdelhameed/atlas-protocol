// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CVSOracle.sol";

/**
 * @title DeployCVSOracle
 * @notice Deploy CVS Oracle contract
 * @dev Integrates with Story Protocol Core for CVS data
 */
contract DeployCVSOracleScript is Script {
    function run() external {
        // Get deployer private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Get Story Protocol Core address
        address storyProtocolCore = vm.envAddress("STORY_PROTOCOL_CORE_ADDRESS");

        require(storyProtocolCore != address(0), "STORY_PROTOCOL_CORE_ADDRESS not set in .env");

        console.log("===========================================");
        console.log("Deploying CVS Oracle");
        console.log("===========================================");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("Story Protocol Core:", storyProtocolCore);
        console.log("Network:", block.chainid);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy CVS Oracle
        CVSOracle cvsOracle = new CVSOracle(storyProtocolCore);

        vm.stopBroadcast();

        console.log("===========================================");
        console.log("Deployment Complete!");
        console.log("===========================================");
        console.log("CVS Oracle Address:", address(cvsOracle));
        console.log("");
        console.log("Update your .env files:");
        console.log("CVS_ORACLE_ADDRESS=%s", address(cvsOracle));
        console.log("");
        console.log("Next steps:");
        console.log("1. Add to backend .env:");
        console.log("   CVS_ORACLE_ADDRESS=%s", address(cvsOracle));
        console.log("   CVS_SYNC_INTERVAL_MS=300000");
        console.log("");
        console.log("2. Initialize oracle in IDO contract:");
        console.log("   IDO.setCVSOracle(%s)", address(cvsOracle));
        console.log("");
        console.log("3. Add operator permission:");
        console.log("   CVSOracle.addOperator(<backend_wallet_address>)");
        console.log("");
        console.log("4. Enable in subgraph.yaml (line 57):");
        console.log("   address: \"%s\"", address(cvsOracle));
        console.log("");
        console.log("Verify with:");
        console.log("forge verify-contract %s src/CVSOracle.sol:CVSOracle --chain-id %s --constructor-args $(cast abi-encode \"constructor(address)\" %s)", address(cvsOracle), block.chainid, storyProtocolCore);
    }
}
