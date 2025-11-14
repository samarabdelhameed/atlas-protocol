// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {IDO} from "../src/IDO.sol";
import {ADLV} from "../src/ADLV.sol";

contract DeployScript is Script {
    function run() external returns (IDO ido, ADLV adlv) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy IDO
        address deployer = vm.addr(deployerPrivateKey);
        ido = new IDO(deployer);
        console.log("IDO deployed at:", address(ido));

        // Deploy ADLV
        adlv = new ADLV(address(ido));
        console.log("ADLV deployed at:", address(adlv));

        // Transfer IDO ownership to ADLV
        ido.transferOwnership(address(adlv));
        console.log("IDO ownership transferred to ADLV");

        vm.stopBroadcast();
    }
}

