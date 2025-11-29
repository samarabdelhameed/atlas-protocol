// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/interfaces/IModuleRegistry.sol";
import "../src/LendingModule.sol";
import "../src/ADLVWithStory.sol";

/**
 * @title RegisterModule
 * @notice Register Atlas Protocol modules with Story Protocol Module Registry
 * @dev This script registers all Atlas Protocol modules for Story Protocol integration
 */
contract RegisterModuleScript is Script {
    
    // Story Protocol Module Registry (update with actual address)
    address constant MODULE_REGISTRY = address(0); // TODO: Get from Story Protocol docs
    
    // Atlas Protocol Contracts (v3)
    address constant LENDING_MODULE = 0xbefb2fF399Bd0faCDBd100A16A569c625e1E4bf3;
    address constant ADLV_V3 = 0x793402b59d2ca4c501EDBa328347bbaF69a59f7b;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("==============================================");
        console.log("REGISTERING ATLAS PROTOCOL MODULES");
        console.log("==============================================");
        console.log("Deployer:", deployer);
        console.log("Module Registry:", MODULE_REGISTRY);
        console.log("");
        
        require(MODULE_REGISTRY != address(0), "Module Registry address not set");
        
        IModuleRegistry moduleRegistry = IModuleRegistry(MODULE_REGISTRY);
        
        // 1. Register Lending Module
        console.log("1. Registering Lending Module...");
        _registerLendingModule(moduleRegistry);
        console.log("");
        
        // 2. Register ADLV Module
        console.log("2. Registering ADLV Module...");
        _registerADLVModule(moduleRegistry);
        console.log("");
        
        console.log("==============================================");
        console.log("✅ Module Registration Complete!");
        console.log("==============================================");
        
        vm.stopBroadcast();
    }
    
    function _registerLendingModule(IModuleRegistry moduleRegistry) internal {
        // Function selectors for Lending Module
        bytes4[] memory selectors = new bytes4[](6);
        selectors[0] = LendingModule.issueLoan.selector;
        selectors[1] = LendingModule.repayLoan.selector;
        selectors[2] = LendingModule.liquidateLoan.selector;
        selectors[3] = LendingModule.updateLoanHealth.selector;
        selectors[4] = LendingModule.getLoan.selector;
        selectors[5] = LendingModule.calculateInterestRate.selector;
        
        uint256 moduleId = moduleRegistry.registerModule(
            LENDING_MODULE,
            "Atlas Lending Module",
            "IP-backed lending module with dynamic interest rates based on CVS. Supports ETH and IP asset collateral. Features loan NFTs, health factor monitoring, and automatic liquidation.",
            "1.0.0",
            selectors
        );
        
        console.log("   ✅ Lending Module registered with ID:", moduleId);
        console.log("   Address:", LENDING_MODULE);
        console.log("   Functions:", selectors.length);
    }
    
    function _registerADLVModule(IModuleRegistry moduleRegistry) internal {
        // Function selectors for ADLV Module
        bytes4[] memory selectors = new bytes4[](12);
        selectors[0] = ADLVWithStory.createVault.selector;
        selectors[1] = ADLVWithStory.registerIPAndCreateVault.selector;
        selectors[2] = ADLVWithStory.setRoyaltyPolicy.selector;
        selectors[3] = ADLVWithStory.claimRoyalties.selector;
        selectors[4] = ADLVWithStory.registerDerivativeIP.selector;
        selectors[5] = ADLVWithStory.sellLicense.selector;
        selectors[6] = ADLVWithStory.sellLicenseWithSharing.selector;
        selectors[7] = ADLVWithStory.deposit.selector;
        selectors[8] = ADLVWithStory.withdraw.selector;
        selectors[9] = ADLVWithStory.issueLoan.selector;
        selectors[10] = ADLVWithStory.repayLoan.selector;
        selectors[11] = ADLVWithStory.liquidateLoan.selector;
        
        uint256 moduleId = moduleRegistry.registerModule(
            ADLV_V3,
            "Atlas ADLV Module",
            "Atlas Decentralized Liquidity Vault - IP-backed vault system with licensing, lending, and Story Protocol integration. Features revenue distribution, derivative IP registration, and comprehensive IP asset management.",
            "3.0.0",
            selectors
        );
        
        console.log("   ✅ ADLV Module registered with ID:", moduleId);
        console.log("   Address:", ADLV_V3);
        console.log("   Functions:", selectors.length);
    }
}

/**
 * @title GetModuleRegistryAddress
 * @notice Helper script to get Module Registry address from Story Protocol
 */
contract GetModuleRegistryAddress is Script {
    function run() external view {
        console.log("==============================================");
        console.log("MODULE REGISTRY ADDRESS LOCATION");
        console.log("==============================================");
        console.log("");
        console.log("1. Check Story Protocol Documentation:");
        console.log("   https://docs.story.foundation/");
        console.log("");
        console.log("2. Check Story Protocol Core Contract:");
        console.log("   0x825B9Ad5F77B64aa1d56B52ef01291E6D4aA60a5");
        console.log("");
        console.log("3. Query via cast:");
        console.log("   cast call 0x825B9Ad5F77B64aa1d56B52ef01291E6D4aA60a5 \\");
        console.log("     \"moduleRegistry()(address)\" \\");
        console.log("     --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz");
        console.log("");
        console.log("4. Update RegisterModule.s.sol with the address");
        console.log("");
    }
}

