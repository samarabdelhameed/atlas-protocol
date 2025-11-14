// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IDO} from "../src/IDO.sol";

contract IDOTest is Test {
    IDO public ido;
    address public owner;
    address public adlv;
    address public user;
    
    bytes32 public constant IP_ID = keccak256("test-ip-asset");
    
    function setUp() public {
        owner = address(this);
        adlv = vm.addr(1);
        user = vm.addr(2);
        
        ido = new IDO(owner);
        
        // Transfer ownership to ADLV contract
        ido.transferOwnership(adlv);
    }
    
    function test_InitialState() public {
        assertEq(ido.owner(), adlv);
        assertEq(ido.getCVS(IP_ID), 0);
        assertEq(ido.totalLicenseRevenue(IP_ID), 0);
    }
    
    function test_UpdateCVS_OnlyOwner() public {
        vm.prank(adlv);
        ido.updateCVS(IP_ID, 1000);
        
        assertEq(ido.getCVS(IP_ID), 1000);
    }
    
    function test_UpdateCVS_RevertIfNotOwner() public {
        vm.prank(user);
        vm.expectRevert();
        ido.updateCVS(IP_ID, 1000);
    }
    
    function test_UpdateCVS_EmitsEvent() public {
        vm.prank(adlv);
        vm.expectEmit(true, false, false, true);
        emit IDO.CVSUpdated(IP_ID, 1000, 0);
        ido.updateCVS(IP_ID, 1000);
    }
    
    function test_RecordRevenue_OnlyOwner() public {
        vm.prank(adlv);
        ido.recordRevenue(IP_ID, 500);
        
        assertEq(ido.totalLicenseRevenue(IP_ID), 500);
    }
    
    function test_RecordRevenue_Accumulates() public {
        vm.startPrank(adlv);
        ido.recordRevenue(IP_ID, 500);
        ido.recordRevenue(IP_ID, 300);
        vm.stopPrank();
        
        assertEq(ido.totalLicenseRevenue(IP_ID), 800);
    }
    
    function test_RecordRevenue_EmitsEvent() public {
        vm.prank(adlv);
        vm.expectEmit(true, false, false, true);
        emit IDO.RevenueCollected(IP_ID, 500);
        ido.recordRevenue(IP_ID, 500);
    }
    
    function test_RecordRevenue_RevertIfNotOwner() public {
        vm.prank(user);
        vm.expectRevert();
        ido.recordRevenue(IP_ID, 500);
    }
    
    function test_GetCVS_ReturnsCurrentValue() public {
        vm.prank(adlv);
        ido.updateCVS(IP_ID, 2500);
        
        assertEq(ido.getCVS(IP_ID), 2500);
    }
    
    function test_UpdateCVS_MultipleIPs() public {
        bytes32 ipId1 = keccak256("ip-1");
        bytes32 ipId2 = keccak256("ip-2");
        
        vm.startPrank(adlv);
        ido.updateCVS(ipId1, 1000);
        ido.updateCVS(ipId2, 2000);
        vm.stopPrank();
        
        assertEq(ido.getCVS(ipId1), 1000);
        assertEq(ido.getCVS(ipId2), 2000);
    }
}

