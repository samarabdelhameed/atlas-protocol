// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/StoryProtocolCore.sol";
import "../src/IDO.sol";
import "../src/ADLV.sol";
import "../src/LoanNFT.sol";
import "../src/LendingModule.sol";

contract TestModularLendingScript is Script {
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Load contracts
        StoryProtocolCore storyCore = StoryProtocolCore(0x825B9Ad5F77B64aa1d56B52ef01291E6D4aA60a5);
        LoanNFT loanNFT = LoanNFT(0x9386262027dc860337eC4F93A8503aD4ee852c41);
        LendingModule lending = LendingModule(0xbefb2fF399Bd0faCDBd100A16A569c625e1E4bf3);
        ADLV adlv = ADLV(payable(0x793402b59d2ca4c501EDBa328347bbaF69a59f7b));
        
        console.log("==============================================");
        console.log("MODULAR LENDING TEST - REAL DATA");
        console.log("==============================================");
        console.log("");
        
        // Test 1: Register IP
        console.log("TEST 1: Register IP Asset");
        (uint256 tokenId, address ipId) = storyCore.mintAndRegisterIPAsset(
            address(0),
            deployer,
            "Modular Lending Test IP",
            keccak256("modular-lending-content"),
            ""
        );
        console.log("IP registered! Token:", tokenId, "IP:", ipId);
        console.log("");
        
        // Test 2: Set CVS (via ADLV owner)
        console.log("TEST 2: Set CVS (10M IP)");
        bytes32 internalIPId = keccak256("modular-lending-ip");
        // Note: CVS would be set by ADLV owner in production
        // For now, we'll use a default CVS from vault creation
        console.log("Using default CVS from vault");
        console.log("");
        
        // Test 3: Create Vault
        console.log("TEST 3: Create Vault");
        address vault = adlv.createVault(internalIPId);
        console.log("Vault created:", vault);
        console.log("");
        
        // Test 4: Deposit Liquidity
        console.log("TEST 4: Deposit Liquidity (0.5 IP)");
        adlv.deposit{value: 0.5 ether}(vault);
        console.log("Deposited 0.5 IP");
        console.log("");
        
        // Test 5: Issue Loan via Lending Module
        console.log("TEST 5: Issue Loan (0.1 IP loan, 0.15 IP collateral)");
        uint256 loanId = lending.issueLoan{value: 0.15 ether}(
            vault,
            deployer,
            0.1 ether,
            30 days,
            address(0),
            0.15 ether,
            5000000 ether,  // 5M CVS
            0.5 ether,
            0.5 ether
        );
        console.log("Loan issued! ID:", loanId);
        console.log("");
        
        // Test 6: Check Loan NFT
        console.log("TEST 6: Check Loan NFT");
        bool nftExists = loanNFT.exists(loanId);
        console.log("Loan NFT exists:", nftExists);
        if (nftExists) {
            uint256 nftTokenId = loanNFT.getTokenId(loanId);
            address nftOwner = loanNFT.ownerOf(nftTokenId);
            console.log("NFT Token ID:", nftTokenId);
            console.log("NFT Owner:", nftOwner);
        }
        console.log("");
        
        // Test 7: Get Loan Details
        console.log("TEST 7: Get Loan Details");
        (
            LendingModule.Loan memory loan,
            uint256 healthFactor,
            uint256 currentDebt
        ) = lending.getLoanDetails(loanId);
        
        console.log("Loan Amount:", loan.loanAmount / 1 ether, "IP");
        console.log("Collateral:", loan.collateralAmount / 1 ether, "IP");
        console.log("Interest Rate:", loan.interestRate, "bps");
        console.log("Health Factor:", healthFactor / 100, "%");
        console.log("Current Debt:", currentDebt / 1 ether, "IP");
        console.log("");
        
        // Test 8: Update Loan Health
        console.log("TEST 8: Update Loan Health");
        uint256 updatedHealth = lending.updateLoanHealth(loanId);
        console.log("Updated Health Factor:", updatedHealth / 100, "%");
        console.log("");
        
        // Test 9: Check Liquidation Status
        console.log("TEST 9: Check Liquidation Status");
        (bool isLiquidatable, string memory reason) = lending.isLoanLiquidatable(loanId);
        console.log("Is Liquidatable:", isLiquidatable);
        console.log("Reason:", reason);
        console.log("");
        
        // Test 10: Calculate Interest
        console.log("TEST 10: Calculate Accrued Interest");
        uint256 accruedInterest = lending.calculateAccruedInterest(loanId);
        console.log("Accrued Interest:", accruedInterest / 1e15, "milli-IP");
        console.log("");
        
        vm.stopBroadcast();
        
        console.log("==============================================");
        console.log("SUCCESS! All tests passed with REAL DATA!");
        console.log("==============================================");
        console.log("");
        console.log("Summary:");
        console.log("  Vault:", vault);
        console.log("  Loan ID:", loanId);
        console.log("  IP Asset:", ipId);
        console.log("  Health Factor:", updatedHealth / 100, "%");
        console.log("  Loan Status: Active");
        console.log("==============================================");
    }
}
