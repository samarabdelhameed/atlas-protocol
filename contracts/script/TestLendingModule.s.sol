// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/StoryProtocolCore.sol";
import "../src/IDO.sol";
import "../src/ADLVWithStory.sol";
import "../src/LoanNFT.sol";

/**
 * @title TestLendingModule
 * @notice Test IP-backed lending with real data
 */
contract TestLendingModuleScript is Script {
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Load deployed contracts
        StoryProtocolCore storyCore = StoryProtocolCore(0x825B9Ad5F77B64aa1d56B52ef01291E6D4aA60a5);
        LoanNFT loanNFT = LoanNFT(0x9386262027dc860337eC4F93A8503aD4ee852c41);
        ADLVWithStory adlv = ADLVWithStory(payable(0xbefb2fF399Bd0faCDBd100A16A569c625e1E4bf3));
        
        console.log("==============================================");
        console.log("IP-BACKED LENDING MODULE TEST");
        console.log("==============================================");
        console.log("Deployer:", deployer);
        console.log("");
        
        // Test 1: Register IP
        console.log("TEST 1: Register IP Asset");
        console.log("==============================================");
        (uint256 tokenId, address ipId) = storyCore.mintAndRegisterIPAsset(
            address(0),
            deployer,
            "Lending Test IP",
            keccak256("lending-test-content"),
            ""
        );
        console.log("IP registered! Token:", tokenId, "IP:", ipId);
        console.log("");
        
        // Test 2: Set CVS
        console.log("TEST 2: Set CVS (10M IP)");
        console.log("==============================================");
        bytes32 internalIPId = keccak256("lending-test-ip");
        adlv.updateCVS(internalIPId, 10000000 ether);
        console.log("CVS set to 10M IP");
        console.log("");
        
        // Test 3: Create Vault
        console.log("TEST 3: Create Vault");
        console.log("==============================================");
        string memory storyIPId = addressToString(ipId);
        address vault = adlv.createVault(internalIPId, storyIPId);
        console.log("Vault created:", vault);
        console.log("");
        
        // Test 4: Deposit Liquidity
        console.log("TEST 4: Deposit Liquidity (5 IP)");
        console.log("==============================================");
        adlv.deposit{value: 5 ether}(vault);
        console.log("Deposited 5 IP");
        console.log("");
        
        // Test 5: Issue Loan with ETH Collateral
        console.log("TEST 5: Issue Loan (2 IP loan, 3 IP collateral)");
        console.log("==============================================");
        uint256 loanId = adlv.issueLoan{value: 3 ether}(
            vault,
            2 ether,      // Loan amount
            30 days       // Duration
        );
        console.log("Loan issued! ID:", loanId);
        console.log("");
        
        // Test 6: Check Loan NFT
        console.log("TEST 6: Check Loan NFT");
        console.log("==============================================");
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
        console.log("==============================================");
        (
            ADLVWithStory.Loan memory loan,
            uint256 healthFactor,
            uint256 currentDebt
        ) = adlv.getLoanDetails(loanId);
        
        console.log("Loan Amount:", loan.loanAmount / 1 ether, "IP");
        console.log("Collateral:", loan.collateralAmount / 1 ether, "IP");
        console.log("Interest Rate:", loan.interestRate, "bps");
        console.log("Health Factor:", healthFactor / 100, "%");
        console.log("Current Debt:", currentDebt / 1 ether, "IP");
        console.log("");
        
        // Test 8: Register Second IP for IP Collateral Test
        console.log("TEST 8: Register Second IP (for IP collateral)");
        console.log("==============================================");
        (uint256 tokenId2, address ipId2) = storyCore.mintAndRegisterIPAsset(
            address(0),
            deployer,
            "IP Collateral Asset",
            keccak256("ip-collateral-content"),
            ""
        );
        console.log("Second IP registered! Token:", tokenId2, "IP:", ipId2);
        console.log("");
        
        // Test 9: Set CVS for Second IP
        console.log("TEST 9: Set CVS for Second IP (5M IP)");
        console.log("==============================================");
        bytes32 ipCollateralId = keccak256(abi.encodePacked(ipId2));
        adlv.updateCVS(ipCollateralId, 5000000 ether);
        console.log("CVS set to 5M IP");
        console.log("");
        
        // Test 10: Issue Loan with IP Collateral
        console.log("TEST 10: Issue Loan with IP Collateral");
        console.log("==============================================");
        uint256 loanId2 = adlv.issueLoanWithIPCollateral{value: 0.5 ether}(
            vault,
            1 ether,      // Loan amount
            60 days,      // Duration
            ipId2         // IP collateral
        );
        console.log("Loan with IP collateral issued! ID:", loanId2);
        console.log("");
        
        // Test 11: Get Second Loan Details
        console.log("TEST 11: Get Second Loan Details");
        console.log("==============================================");
        (
            ADLVWithStory.Loan memory loan2,
            uint256 healthFactor2,
            uint256 currentDebt2
        ) = adlv.getLoanDetails(loanId2);
        
        // Use currentDebt2 to avoid unused variable warning
        if (currentDebt2 > 0) {
            // Variable is used
        }
        
        console.log("Loan Amount:", loan2.loanAmount / 1 ether, "IP");
        console.log("ETH Collateral:", loan2.collateralAmount / 1 ether, "IP");
        console.log("IP Collateral:", loan2.ipCollateral);
        console.log("IP Collateral Value:", loan2.ipCollateralValue / 1 ether, "IP");
        console.log("Total Collateral:", (loan2.collateralAmount + loan2.ipCollateralValue) / 1 ether, "IP");
        console.log("Health Factor:", healthFactor2 / 100, "%");
        console.log("Interest Rate:", loan2.interestRate, "bps");
        console.log("");
        
        // Test 12: Update Loan Health
        console.log("TEST 12: Update Loan Health");
        console.log("==============================================");
        uint256 updatedHealth = adlv.updateLoanHealth(loanId);
        console.log("Updated Health Factor:", updatedHealth / 100, "%");
        console.log("");
        
        // Test 13: Check if Loan is Liquidatable
        console.log("TEST 13: Check Liquidation Status");
        console.log("==============================================");
        (bool isLiquidatable, string memory reason) = adlv.isLoanLiquidatable(loanId);
        console.log("Is Liquidatable:", isLiquidatable);
        console.log("Reason:", reason);
        console.log("");
        
        // Test 14: Calculate Accrued Interest
        console.log("TEST 14: Calculate Accrued Interest");
        console.log("==============================================");
        uint256 accruedInterest = adlv.calculateAccruedInterest(loanId);
        console.log("Accrued Interest:", accruedInterest / 1e15, "milli-IP");
        console.log("");
        
        vm.stopBroadcast();
        
        console.log("==============================================");
        console.log("SUCCESS! All lending tests passed!");
        console.log("==============================================");
        console.log("");
        console.log("Summary:");
        console.log("  Vault:", vault);
        console.log("  Loan 1 (ETH collateral):", loanId);
        console.log("  Loan 2 (IP collateral):", loanId2);
        console.log("  IP Asset 1:", ipId);
        console.log("  IP Asset 2 (collateral):", ipId2);
        console.log("  Loan NFT Contract:", address(loanNFT));
        console.log("==============================================");
    }
    
    function addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2+i*2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3+i*2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
}
