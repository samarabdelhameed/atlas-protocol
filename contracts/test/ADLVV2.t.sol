// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ADLVWithStoryV2.sol";
import "../src/IDO.sol";
import "../src/LoanNFT.sol";

contract ADLVV2Test is Test {
    ADLVWithStoryV2 public adlv;
    IDO public ido;
    LoanNFT public loanNFT;
    
    address public owner;
    address public creator;
    address public user1;
    address public user2;
    
    // Mock Story Protocol addresses
    address public storySPG;
    address public storyIPAssetRegistry;
    address public storyLicenseRegistry;
    address public storyLicensingModule;
    
    function setUp() public {
        owner = address(this);
        creator = makeAddr("creator");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        // Deploy mock Story Protocol contracts
        storySPG = makeAddr("storySPG");
        storyIPAssetRegistry = makeAddr("storyIPAssetRegistry");
        storyLicenseRegistry = makeAddr("storyLicenseRegistry");
        storyLicensingModule = makeAddr("storyLicensingModule");
        
        // Deploy contracts
        ido = new IDO(owner);
        loanNFT = new LoanNFT();
        
        adlv = new ADLVWithStoryV2(
            address(ido),
            storySPG,
            storyIPAssetRegistry,
            storyLicenseRegistry,
            address(loanNFT),
            address(0),
            storyLicensingModule
        );
        
        // Setup
        ido.transferOwnership(address(adlv));
        loanNFT.transferOwnership(address(adlv));
        
        // Fund test accounts
        vm.deal(creator, 100 ether);
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
    }
    
    function testDeployment() public {
        assertEq(address(adlv.idoContract()), address(ido));
        assertEq(address(adlv.loanNFT()), address(loanNFT));
        assertTrue(address(adlv.licenseMetaTx()) != address(0));
        assertTrue(address(adlv.royaltyModule()) != address(0));
        assertTrue(adlv.permitEnabled());
        assertTrue(adlv.metaTxEnabled());
    }
    
    function testCreateVaultShareToken() public {
        // Create vault
        bytes32 ipId = keccak256("test-ip");
        vm.prank(creator);
        address vaultAddress = adlv.createVault(ipId, "");
        
        // Create share token
        vm.prank(creator);
        address shareToken = adlv.createVaultShareToken(vaultAddress);
        
        assertTrue(shareToken != address(0));
        assertEq(address(adlv.vaultShareTokens(vaultAddress)), shareToken);
    }
    
    function testDepositWithPermit() public {
        // Create vault and share token
        bytes32 ipId = keccak256("test-ip");
        vm.prank(creator);
        address vaultAddress = adlv.createVault(ipId, "");
        
        vm.prank(creator);
        address shareToken = adlv.createVaultShareToken(vaultAddress);
        require(shareToken != address(0), "Share token should be created");
        
        // Deposit with permit
        uint256 depositAmount = 1 ether;
        
        vm.prank(user1);
        uint256 shares = adlv.depositWithPermit{value: depositAmount}(
            vaultAddress,
            depositAmount,
            block.timestamp + 1 hours,
            0, 0, 0 // Mock signature
        );
        
        assertTrue(shares > 0);
    }
    
    function testMetaTxNonce() public {
        uint256 nonce = adlv.getMetaTxNonce(user1);
        assertEq(nonce, 0);
    }
    
    function testRoyaltyModuleIntegration() public {
        assertTrue(address(adlv.royaltyModule()) != address(0));
    }
    
    function testPermitToggle() public {
        assertTrue(adlv.permitEnabled());
        
        adlv.setPermitEnabled(false);
        assertFalse(adlv.permitEnabled());
        
        adlv.setPermitEnabled(true);
        assertTrue(adlv.permitEnabled());
    }
    
    function testMetaTxToggle() public {
        assertTrue(adlv.metaTxEnabled());
        
        adlv.setMetaTxEnabled(false);
        assertFalse(adlv.metaTxEnabled());
        
        adlv.setMetaTxEnabled(true);
        assertTrue(adlv.metaTxEnabled());
    }
}
