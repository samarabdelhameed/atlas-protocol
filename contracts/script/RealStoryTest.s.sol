// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ADLVWithStory.sol";
import "../src/IDO.sol";
import "../src/StoryProtocolCore.sol";

/**
 * @title RealStoryTest
 * @notice REAL Story Protocol Integration Test - Broadcasts to chain
 */
contract RealStoryTestScript is Script {
    address constant STORY_PROTOCOL_CORE = 0xB915De53a6Fe9a9dBBBf0818981D0bbAd20E4815;
    address constant IDO_ADDRESS = 0xBB0c4629d572Ba140a06d404e6Ff5c65554AfbdD;
    address constant ADLV_ADDRESS = 0x1bc89DB4589C669D8dA9ECA1BD00dB98b08155b2;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        ADLVWithStory adlv = ADLVWithStory(payable(ADLV_ADDRESS));
        StoryProtocolCore storyCore = StoryProtocolCore(STORY_PROTOCOL_CORE);
        
        console.log("==============================================");
        console.log("REAL Story Protocol Integration Test");
        console.log("==============================================");
        console.log("Deployer:", deployer);
        console.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Test data
        bytes32 testIPId = keccak256(abi.encodePacked("REAL_IP_", block.timestamp));
        string memory testIPName = "Real IP Asset - Story Protocol";
        bytes32 testIPHash = keccak256("ipfs://QmRealTest");
        
        // 1. Set CVS
        console.log("1. Setting CVS (3,000,000 IP)...");
        uint256 cvsValue = 3000000 ether;
        adlv.updateCVS(testIPId, cvsValue);
        console.log("CVS set!");
        
        // 2. Register IP on Story Protocol
        console.log("2. Registering IP on Story Protocol...");
        (uint256 tokenId, address ipId) = storyCore.mintAndRegisterIPAsset(
            address(0),
            deployer,
            testIPName,
            testIPHash,
            ""
        );
        console.log("IP registered! Token ID:", tokenId);
        console.log("IP ID:", ipId);
        
        // 3. Create Vault
        console.log("3. Creating Vault...");
        string memory storyIPId = addressToString(ipId);
        address vaultAddress = adlv.createVault(testIPId, storyIPId);
        console.log("Vault created:", vaultAddress);
        
        // 4. Deposit
        console.log("4. Depositing 0.5 IP...");
        adlv.deposit{value: 0.5 ether}(vaultAddress);
        console.log("Deposited!");
        
        // 5. Sell License
        console.log("5. Selling license (0.3 IP)...");
        adlv.sellLicense{value: 0.3 ether}(vaultAddress, "commercial", 365 days);
        console.log("License sold!");
        
        // 6. Attach License Terms on Story
        console.log("6. Attaching license terms on Story Protocol...");
        uint256 licenseTermsId = storyCore.attachLicenseTerms(ipId, true, 1000, 0.01 ether);
        console.log("License terms attached! ID:", licenseTermsId);
        
        // 7. Mint Story License
        console.log("7. Minting Story Protocol license...");
        uint256 storyLicenseId = storyCore.mintLicense{value: 0.01 ether}(
            licenseTermsId,
            ipId,
            deployer,
            1
        );
        console.log("Story license minted! ID:", storyLicenseId);
        
        // 8. Issue Loan
        console.log("8. Issuing loan (0.2 IP)...");
        uint256 loanId = adlv.issueLoan{value: 0.3 ether}(vaultAddress, 0.2 ether, 30 days);
        console.log("Loan issued! ID:", loanId);
        
        vm.stopBroadcast();
        
        // Final Stats
        console.log("");
        console.log("==============================================");
        console.log("SUCCESS! All transactions confirmed on-chain!");
        console.log("==============================================");
        console.log("Story Protocol Core:", STORY_PROTOCOL_CORE);
        console.log("IP ID:", ipId);
        console.log("Token ID:", tokenId);
        console.log("Vault:", vaultAddress);
        console.log("CVS:", cvsValue / 1 ether, "IP");
        console.log("License Terms ID:", licenseTermsId);
        console.log("Story License ID:", storyLicenseId);
        console.log("Loan ID:", loanId);
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
