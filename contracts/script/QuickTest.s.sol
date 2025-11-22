// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/StoryProtocolCore.sol";
import "../src/IDO.sol";
import "../src/ADLVWithStory.sol";

contract QuickTestScript is Script {
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        StoryProtocolCore storyCore = StoryProtocolCore(0xF3aeB434d099a78908659566E575a79278Ed8B45);
        ADLVWithStory adlv = ADLVWithStory(0xD13218C0F39f1F862F11014F4C9C9d33EE92A5C1);
        
        console.log("=== QUICK TEST ===");
        console.log("Deployer:", deployer);
        console.log("");
        
        // Test 1: Register IP
        console.log("1. Registering IP...");
        (uint256 tokenId, address ipId) = storyCore.mintAndRegisterIPAsset(
            address(0),
            deployer,
            "Test IP",
            keccak256("test-content"),
            ""
        );
        console.log("   IP registered! Token:", tokenId, "IP:", ipId);
        
        // Test 2: Set CVS
        console.log("2. Setting CVS...");
        bytes32 internalIPId = keccak256("test-ip-1");
        adlv.updateCVS(internalIPId, 1000000 ether);
        console.log("   CVS set to 1M IP");
        
        // Test 3: Create Vault
        console.log("3. Creating vault...");
        string memory storyIPId = addressToString(ipId);
        address vault = adlv.createVault(internalIPId, storyIPId);
        console.log("   Vault created:", vault);
        
        // Test 4: Set Royalty Policy
        console.log("4. Setting royalty policy...");
        storyCore.setRoyaltyPolicy(ipId, deployer, 3000);
        console.log("   Royalty policy set (30%)");
        
        // Test 5: Deposit
        console.log("5. Depositing liquidity...");
        adlv.deposit{value: 0.5 ether}(vault);
        console.log("   Deposited 0.5 IP");
        
        // Test 6: Attach License Terms
        console.log("6. Attaching license terms...");
        uint256 termsId = storyCore.attachLicenseTerms(ipId, true, 2000, 0.1 ether);
        console.log("   License terms attached! ID:", termsId);
        
        // Test 7: Mint License
        console.log("7. Minting license...");
        uint256 licenseId = storyCore.mintLicense{value: 0.1 ether}(termsId, ipId, deployer, 1);
        console.log("   License minted! ID:", licenseId);
        
        // Test 8: Register Derivative
        console.log("8. Registering derivative...");
        (uint256 derivTokenId, address derivIpId) = storyCore.registerDerivative(
            ipId,
            licenseId,
            deployer,
            "Derivative IP",
            keccak256("derivative-content")
        );
        console.log("   Derivative registered! Token:", derivTokenId, "IP:", derivIpId);
        
        // Test 9: Pay Royalty with Sharing
        console.log("9. Paying royalty with sharing...");
        storyCore.payRoyaltyWithSharing{value: 1 ether}(derivIpId, deployer);
        console.log("   Royalty paid! 1 IP shared between parent & derivative");
        
        // Test 10: Check Pending Revenue
        console.log("10. Checking pending revenue...");
        uint256 pending = storyCore.getPendingRevenue(deployer);
        console.log("   Pending revenue:", pending / 1 ether, "IP");
        
        // Test 11: Claim Revenue
        console.log("11. Claiming revenue...");
        uint256 claimed = storyCore.claimRevenue(ipId, deployer);
        console.log("   Revenue claimed:", claimed / 1 ether, "IP");
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("=== SUCCESS! ===");
        console.log("Parent IP:", ipId);
        console.log("Derivative IP:", derivIpId);
        console.log("Vault:", vault);
        console.log("Revenue Claimed:", claimed / 1 ether, "IP");
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
