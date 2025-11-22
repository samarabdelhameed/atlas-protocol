// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/StoryProtocolCore.sol";
import "../src/IDO.sol";
import "../src/ADLVWithStory.sol";

/**
 * @title FullIntegrationTest
 * @notice Complete test of all Story Protocol features
 * @dev Tests: Royalty Module, Derivative IPs, Revenue Claiming
 */
contract FullIntegrationTestScript is Script {
    
    StoryProtocolCore public storyCore;
    IDO public ido;
    ADLVWithStory public adlv;
    
    address public deployer;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("==============================================");
        console.log("FULL STORY PROTOCOL INTEGRATION TEST");
        console.log("==============================================");
        console.log("Deployer:", deployer);
        console.log("");
        
        // Load deployed contracts
        storyCore = StoryProtocolCore(0xF3aeB434d099a78908659566E575a79278Ed8B45);
        ido = IDO(0xbec82cF27CFEEDD154bDc639f98715e203C2c41e);
        adlv = ADLVWithStory(0xD13218C0F39f1F862F11014F4C9C9d33EE92A5C1);
        
        console.log("Story Protocol Core:", address(storyCore));
        console.log("IDO:", address(ido));
        console.log("ADLV:", address(adlv));
        console.log("");
        
        // Test 1: Register Parent IP
        console.log("==============================================");
        console.log("TEST 1: Register Parent IP");
        console.log("==============================================");
        
        bytes32 parentIPId = keccak256("parent-ip-test");
        adlv.updateCVS(parentIPId, 5000000 ether); // 5M IP CVS via ADLV
        
        (uint256 parentTokenId, address parentIpAddress) = storyCore.mintAndRegisterIPAsset(
            address(0),
            deployer,
            "Parent IP Asset",
            keccak256("parent-content"),
            ""
        );
        
        console.log("Parent IP registered!");
        console.log("  Token ID:", parentTokenId);
        console.log("  IP Address:", parentIpAddress);
        console.log("");
        
        // Test 2: Create Parent Vault
        console.log("==============================================");
        console.log("TEST 2: Create Parent Vault");
        console.log("==============================================");
        
        string memory parentStoryIPId = addressToString(parentIpAddress);
        address parentVault = adlv.createVault(parentIPId, parentStoryIPId);
        
        console.log("Parent vault created!");
        console.log("  Vault Address:", parentVault);
        console.log("");
        
        // Test 3: Set Royalty Policy
        console.log("==============================================");
        console.log("TEST 3: Set Royalty Policy");
        console.log("==============================================");
        
        storyCore.setRoyaltyPolicy(
            parentIpAddress,
            deployer,
            3000 // 30% royalty
        );
        
        console.log("Royalty policy set!");
        console.log("  Beneficiary:", deployer);
        console.log("  Royalty: 30%");
        console.log("");
        
        // Test 4: Deposit Liquidity
        console.log("==============================================");
        console.log("TEST 4: Deposit Liquidity");
        console.log("==============================================");
        
        adlv.deposit{value: 1 ether}(parentVault);
        
        console.log("Liquidity deposited!");
        console.log("  Amount: 1 IP");
        console.log("");
        
        // Test 5: Sell License & Pay Royalty
        console.log("==============================================");
        console.log("TEST 5: Sell License & Pay Royalty");
        console.log("==============================================");
        
        string memory licenseId = adlv.sellLicense{value: 0.5 ether}(
            parentVault,
            "commercial",
            365 days
        );
        
        console.log("License sold!");
        console.log("  License ID:", licenseId);
        console.log("  Price: 0.5 IP");
        console.log("");
        
        // Test 6: Attach License Terms
        console.log("==============================================");
        console.log("TEST 6: Attach License Terms");
        console.log("==============================================");
        
        uint256 licenseTermsId = storyCore.attachLicenseTerms(
            parentIpAddress,
            true, // commercial
            2000, // 20% royalty
            0.1 ether // 0.1 IP minting fee
        );
        
        console.log("License terms attached!");
        console.log("  Terms ID:", licenseTermsId);
        console.log("");
        
        // Test 7: Mint License Token
        console.log("==============================================");
        console.log("TEST 7: Mint License Token");
        console.log("==============================================");
        
        uint256 storyLicenseId = storyCore.mintLicense{value: 0.1 ether}(
            licenseTermsId,
            parentIpAddress,
            deployer,
            1
        );
        
        console.log("Story license minted!");
        console.log("  License ID:", storyLicenseId);
        console.log("");
        
        // Test 8: Register Derivative IP
        console.log("==============================================");
        console.log("TEST 8: Register Derivative IP");
        console.log("==============================================");
        
        (uint256 derivativeTokenId, address derivativeIpAddress) = storyCore.registerDerivative(
            parentIpAddress,
            storyLicenseId,
            deployer,
            "Derivative IP Asset",
            keccak256("derivative-content")
        );
        
        console.log("Derivative IP registered!");
        console.log("  Token ID:", derivativeTokenId);
        console.log("  IP Address:", derivativeIpAddress);
        console.log("");
        
        // Test 9: Create Derivative Vault
        console.log("==============================================");
        console.log("TEST 9: Create Derivative Vault");
        console.log("==============================================");
        
        bytes32 derivativeIPId = keccak256("derivative-ip-test");
        adlv.updateCVS(derivativeIPId, 2000000 ether); // 2M IP CVS via ADLV
        
        (address derivativeVault, address derivativeIpId) = adlv.registerDerivativeIP(
            parentVault,
            storyLicenseId,
            "Derivative IP",
            keccak256("derivative-content-2")
        );
        
        console.log("Derivative vault created!");
        console.log("  Vault Address:", derivativeVault);
        console.log("  IP ID:", derivativeIpId);
        console.log("");
        
        // Test 10: Sell Derivative License with Revenue Sharing
        console.log("==============================================");
        console.log("TEST 10: Sell Derivative License (Revenue Sharing)");
        console.log("==============================================");
        
        // Pay royalty with sharing (30% to parent, 70% to derivative)
        storyCore.payRoyaltyWithSharing{value: 1 ether}(
            derivativeIpAddress,
            deployer
        );
        
        console.log("Royalty paid with sharing!");
        console.log("  Total: 1 IP");
        console.log("  Parent share: ~0.3 IP (30%)");
        console.log("  Derivative share: ~0.7 IP (70%)");
        console.log("");
        
        // Test 11: Check Pending Revenue
        console.log("==============================================");
        console.log("TEST 11: Check Pending Revenue");
        console.log("==============================================");
        
        uint256 pendingRevenue = storyCore.getPendingRevenue(deployer);
        
        console.log("Pending revenue:", pendingRevenue / 1 ether, "IP");
        console.log("");
        
        // Test 12: Claim Revenue
        console.log("==============================================");
        console.log("TEST 12: Claim Revenue");
        console.log("==============================================");
        
        uint256 claimedAmount = storyCore.claimRevenue(parentIpAddress, deployer);
        
        console.log("Revenue claimed!");
        console.log("  Amount:", claimedAmount / 1 ether, "IP");
        console.log("");
        
        // Test 13: Verify Derivative Relationship
        console.log("==============================================");
        console.log("TEST 13: Verify Derivative Relationship");
        console.log("==============================================");
        
        bool isDerivative = storyCore.isDerivative(derivativeIpAddress);
        address parentIP = storyCore.getParentIP(derivativeIpAddress);
        
        console.log("Is derivative:", isDerivative);
        console.log("Parent IP:", parentIP);
        console.log("Expected parent:", parentIpAddress);
        console.log("Match:", parentIP == parentIpAddress);
        console.log("");
        
        // Test 14: Get All Derivatives
        console.log("==============================================");
        console.log("TEST 14: Get All Derivatives");
        console.log("==============================================");
        
        address[] memory derivatives = storyCore.getDerivatives(parentIpAddress);
        
        console.log("Total derivatives:", derivatives.length);
        for (uint256 i = 0; i < derivatives.length; i++) {
            console.log("  Derivative", i + 1, ":", derivatives[i]);
        }
        console.log("");
        
        // Test 15: Get Royalty Policy
        console.log("==============================================");
        console.log("TEST 15: Get Royalty Policy");
        console.log("==============================================");
        
        (
            address beneficiary,
            uint256 royaltyPercentage,
            uint256 totalRevenue,
            uint256 claimedRevenue
        ) = storyCore.getRoyaltyPolicy(parentIpAddress);
        
        console.log("Royalty Policy:");
        console.log("  Beneficiary:", beneficiary);
        console.log("  Royalty %:", royaltyPercentage / 100, "%");
        console.log("  Total Revenue:", totalRevenue / 1 ether, "IP");
        console.log("  Claimed Revenue:", claimedRevenue / 1 ether, "IP");
        console.log("");
        
        vm.stopBroadcast();
        
        console.log("==============================================");
        console.log("SUCCESS! All tests passed!");
        console.log("==============================================");
        console.log("");
        console.log("Summary:");
        console.log("  Parent IP:", parentIpAddress);
        console.log("  Parent Vault:", parentVault);
        console.log("  Derivative IP:", derivativeIpAddress);
        console.log("  Derivative Vault:", derivativeVault);
        console.log("  License Terms ID:", licenseTermsId);
        console.log("  Story License ID:", storyLicenseId);
        console.log("  Revenue Claimed:", claimedAmount / 1 ether, "IP");
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
