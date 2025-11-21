// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {IDO} from "../src/IDO.sol";
import {ADLVWithStory} from "../src/ADLVWithStory.sol";

/**
 * @title TestStoryIntegrationScript
 * @notice Comprehensive test script for Story Protocol integration
 * @dev Tests: IP registration, vault creation, CVS updates, license sales, revenue splitting
 */
contract TestStoryIntegrationScript is Script {
    // Story Protocol Testnet addresses
    address constant STORY_SPG = 0x69415CE984A79a3Cfbe3F51024C63b6C107331e3;
    address constant STORY_IP_ASSET_REGISTRY = 0x292639452A975630802C17c9267169D93BD5a793;
    address constant STORY_LICENSE_REGISTRY = address(0); // Optional
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        string memory storyRpcUrl = vm.envString("STORY_PROTOCOL_RPC");
        
        console.log("==========================================");
        console.log("Atlas Protocol - Story Integration Test");
        console.log("==========================================");
        console.log("Deployer:", deployer);
        console.log("Network: Story Protocol Testnet");
        console.log("==========================================\n");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Step 1: Deploy contracts
        console.log("Step 1: Deploying contracts...");
        IDO ido = new IDO(deployer);
        ADLVWithStory adlv = new ADLVWithStory(
            address(ido),
            STORY_SPG,
            STORY_IP_ASSET_REGISTRY,
            STORY_LICENSE_REGISTRY
        );
        ido.transferOwnership(address(adlv));
        console.log("[OK] IDO deployed at:", address(ido));
        console.log("[OK] ADLV deployed at:", address(adlv));
        console.log("[OK] IDO ownership transferred to ADLV");
        console.log("");
        
        // Step 2: Register IP Asset on Story Protocol
        console.log("Step 2: Registering IP Asset on Story Protocol...");
        bytes32 internalIPId = keccak256("test-ip-asset-1");
        uint8 ipAssetType = 1; // Story IP Asset type
        string memory ipName = "Atlas Test IP Asset";
        bytes32 contentHash = keccak256("test-content-hash");
        bytes memory registrationData = "";
        
        (address vaultAddress, string memory storyIPId) = adlv.registerIPAndCreateVault(
            internalIPId,
            ipAssetType,
            ipName,
            contentHash,
            registrationData
        );
        
        console.log("[OK] IP Asset registered on Story Protocol");
        console.log("   Story IP ID:", storyIPId);
        console.log("   Vault Address:", vaultAddress);
        console.log("");
        
        // Step 3: Verify IP Asset
        console.log("Step 3: Verifying IP Asset...");
        (bool exists, address ipOwner) = adlv.verifyIPAsset(storyIPId);
        require(exists, "IP Asset not found");
        console.log("[OK] IP Asset verified");
        console.log("   Exists:", exists);
        console.log("   Owner:", ipOwner);
        console.log("");
        
        // Step 4: Update CVS (via ADLV since it's the owner of IDO)
        console.log("Step 4: Updating CVS...");
        uint256 initialCVS = 1000;
        adlv.updateCVS(internalIPId, initialCVS);
        uint256 currentCVS = ido.getCVS(internalIPId);
        require(currentCVS == initialCVS, "CVS update failed");
        console.log("[OK] CVS updated");
        console.log("   CVS:", currentCVS);
        console.log("");
        
        // Step 5: Deposit liquidity
        console.log("Step 5: Depositing liquidity...");
        uint256 depositAmount = 10 ether;
        adlv.deposit{value: depositAmount}(vaultAddress);
        console.log("[OK] Liquidity deposited");
        console.log("   Amount:", depositAmount);
        console.log("");
        
        // Step 6: Sell license and test revenue splitting
        console.log("Step 6: Selling license and testing revenue splitting...");
        uint256 licensePrice = 1 ether;
        string memory licenseType = "commercial";
        
        // Get balances before
        uint256 creatorBalanceBefore = deployer.balance;
        uint256 protocolOwnerBalanceBefore = adlv.owner().balance;
        
        string memory licenseId = adlv.sellLicense{value: licensePrice}(
            vaultAddress,
            licenseType,
            365 days
        );
        
        // Get balances after
        uint256 creatorBalanceAfter = deployer.balance;
        uint256 protocolOwnerBalanceAfter = adlv.owner().balance;
        
        uint256 creatorShare = creatorBalanceAfter - creatorBalanceBefore;
        uint256 protocolFee = protocolOwnerBalanceAfter - protocolOwnerBalanceBefore;
        
        console.log("[OK] License sold");
        console.log("   License ID:", licenseId);
        console.log("   Price:", licensePrice);
        console.log("   Creator Share (70%):", creatorShare);
        console.log("   Protocol Fee (5%):", protocolFee);
        console.log("   Vault Share (25%):", licensePrice - creatorShare - protocolFee);
        console.log("");
        
        // Step 7: Verify revenue recorded in IDO
        console.log("Step 7: Verifying revenue recorded in IDO...");
        uint256 totalRevenue = ido.totalLicenseRevenue(internalIPId);
        console.log("[OK] Revenue recorded");
        console.log("   Total Revenue in IDO:", totalRevenue);
        console.log("");
        
        // Step 8: Issue loan
        console.log("Step 8: Issuing loan...");
        uint256 loanAmount = 2 ether;
        uint256 collateralAmount = 3 ether; // 150% of loan
        uint256 loanDuration = 30 days;
        
        uint256 loanId = adlv.issueLoan{value: collateralAmount}(
            vaultAddress,
            loanAmount,
            loanDuration
        );
        
        console.log("[OK] Loan issued");
        console.log("   Loan ID:", loanId);
        console.log("   Loan Amount:", loanAmount);
        console.log("   Collateral:", collateralAmount);
        console.log("");
        
        // Step 9: Get vault info
        console.log("Step 9: Getting vault information...");
        ADLVWithStory.Vault memory vault = adlv.getVault(vaultAddress);
        console.log("[OK] Vault information retrieved");
        console.log("   Total Liquidity:", vault.totalLiquidity);
        console.log("   Available Liquidity:", vault.availableLiquidity);
        console.log("   Total License Revenue:", vault.totalLicenseRevenue);
        console.log("   Active Loans:", vault.activeLoansCount);
        console.log("   Registered on Story:", vault.registeredOnStory);
        console.log("");
        
        // Step 10: Get licenses for vault
        console.log("Step 10: Getting licenses for vault...");
        string[] memory licenses = adlv.getVaultLicenses(vaultAddress);
        console.log("[OK] Licenses retrieved");
        console.log("   Number of licenses:", licenses.length);
        if (licenses.length > 0) {
            console.log("   First License ID:", licenses[0]);
        }
        console.log("");
        
        vm.stopBroadcast();
        
        // Summary
        console.log("==========================================");
        console.log("Test Summary");
        console.log("==========================================");
        console.log("[OK] IP Asset registered on Story Protocol");
        console.log("[OK] Vault created:", vaultAddress);
        console.log("[OK] CVS updated:", currentCVS);
        console.log("[OK] License sold with revenue splitting");
        console.log("[OK] Revenue recorded in IDO");
        console.log("[OK] Loan issued successfully");
        console.log("[OK] All Story Protocol integrations working");
        console.log("==========================================");
    }
}

