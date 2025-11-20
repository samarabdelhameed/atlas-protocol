// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../src/ADLVWithStory.sol";
import "../src/IDO.sol";

contract InteractWithContracts is Script {
    // Deployed contract addresses
    address constant ADLV_ADDRESS = 0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205;
    address constant IDO_ADDRESS = 0x75B0EF811CB728aFdaF395a0b17341fb426c26dD;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Interacting with contracts...");
        console.log("Deployer:", deployer);
        console.log("ADLV Address:", ADLV_ADDRESS);
        console.log("IDO Address:", IDO_ADDRESS);
        
        vm.startBroadcast(deployerPrivateKey);
        
        ADLVWithStory adlv = ADLVWithStory(payable(ADLV_ADDRESS));
        IDO ido = IDO(IDO_ADDRESS);
        
        // 1. Create a test IP in IDO
        bytes32 testIpId = bytes32(uint256(1));
        console.log("\n1. Setting CVS for test IP...");
        ido.setCVS(testIpId, 1000000 ether); // 1M CVS
        console.log("CVS set to 1,000,000");
        
        // 2. Create a vault
        console.log("\n2. Creating vault...");
        string memory storyIPId = "test-ip-001";
        address vaultAddress = adlv.createVault(testIpId, storyIPId);
        console.log("Vault created at:", vaultAddress);
        
        // 3. Deposit liquidity to vault
        console.log("\n3. Depositing liquidity...");
        uint256 depositAmount = 10 ether;
        adlv.deposit{value: depositAmount}(vaultAddress);
        console.log("Deposited:", depositAmount);
        
        // 4. Issue a loan
        console.log("\n4. Issuing loan...");
        uint256 loanAmount = 2 ether;
        uint256 duration = 30 days;
        uint256 collateral = 1 ether;
        uint256 loanId = adlv.issueLoan{value: collateral}(vaultAddress, loanAmount, duration);
        console.log("Loan issued with ID:", loanId);
        
        // 5. Sell a license
        console.log("\n5. Selling license...");
        uint256 licensePrice = 0.5 ether;
        adlv.sellLicense{value: licensePrice}(vaultAddress, "commercial", 365 days);
        console.log("License sold for:", licensePrice);
        
        vm.stopBroadcast();
        
        // Display final stats
        console.log("\n=== Final Stats ===");
        ADLVWithStory.Vault memory vault = adlv.getVault(vaultAddress);
        console.log("Total Liquidity:", vault.totalLiquidity);
        console.log("Available Liquidity:", vault.availableLiquidity);
        console.log("Total Loans Issued:", vault.totalLoansIssued);
        console.log("Active Loans:", vault.activeLoansCount);
        console.log("License Revenue:", vault.totalLicenseRevenue);
        console.log("Vault Counter:", adlv.vaultCounter());
        console.log("Loan Counter:", adlv.loanCounter());
    }
}
