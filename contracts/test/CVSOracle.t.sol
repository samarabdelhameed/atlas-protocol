// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {CVSOracle} from "../src/CVSOracle.sol";
import {ISPGCVSOracle} from "../src/interfaces/ISPGCVSOracle.sol";

contract MockSPGOracle is ISPGCVSOracle {
    mapping(address => uint256) public cvsValues;
    mapping(address => uint256) public lastUpdated;
    mapping(address => uint256) public confidence;
    
    function setCVS(address ipId, uint256 value, uint256 updated, uint256 conf) external {
        cvsValues[ipId] = value;
        lastUpdated[ipId] = updated;
        confidence[ipId] = conf;
    }
    
    function getCVSV2(address ipId) external view returns (
        uint256 cvs,
        uint256 lastUpdatedTime,
        uint256 conf,
        string memory source
    ) {
        return (cvsValues[ipId], lastUpdated[ipId], confidence[ipId], "story-v2");
    }
    
    function hasCVSV2(address ipId) external view returns (bool) {
        return cvsValues[ipId] > 0;
    }
    
    function getCVSV2History(address ipId) external view returns (
        uint256[] memory values,
        uint256[] memory timestamps
    ) {
        values = new uint256[](1);
        timestamps = new uint256[](1);
        values[0] = cvsValues[ipId];
        timestamps[0] = lastUpdated[ipId];
    }
}

contract CVSOracleTest is Test {
    CVSOracle public cvsOracle;
    MockSPGOracle public mockSPG;
    address public operator;
    address public ipId;
    
    function setUp() public {
        operator = address(this);
        ipId = address(0x1234);
        
        // Deploy mock SPG Oracle
        mockSPG = new MockSPGOracle();
        
        // Deploy CVSOracle
        cvsOracle = new CVSOracle(address(0x5678)); // storyProtocolCore
        
        // Add operator
        cvsOracle.addOperator(operator);
    }
    
    function testGetCVSFromCache() public {
        // Update CVS manually
        cvsOracle.updateCVS(ipId, 1000, 10000);
        
        // Get CVS
        uint256 cvs = cvsOracle.getCVS(ipId);
        assertEq(cvs, 1000);
    }
    
    function testGetCVSFromSPGOracle() public {
        // Set up SPG Oracle
        cvsOracle.setSPGOracle(address(mockSPG));
        cvsOracle.setUseSPGOracle(true);
        
        // Set CVS in SPG Oracle
        mockSPG.setCVS(ipId, 2000, block.timestamp, 9500);
        
        // Get CVS - should fetch from SPG Oracle
        uint256 cvs = cvsOracle.getCVS(ipId);
        assertEq(cvs, 2000);
    }
    
    function testSyncCVSFromSPG() public {
        // Set up SPG Oracle
        cvsOracle.setSPGOracle(address(mockSPG));
        
        // Set CVS in SPG Oracle
        mockSPG.setCVS(ipId, 3000, block.timestamp, 10000);
        
        // Sync from SPG
        cvsOracle.syncCVSFromSPG(ipId);
        
        // Check that CVS was synced
        uint256 cvs = cvsOracle.getCVS(ipId);
        assertEq(cvs, 3000);
    }
    
    function testGetCVSWithMetadata() public {
        // Update CVS
        cvsOracle.updateCVS(ipId, 1500, 9000);
        
        // Get with metadata
        (uint256 cvs, uint256 lastUpdated, uint256 confidence) = cvsOracle.getCVSWithMetadata(ipId);
        
        assertEq(cvs, 1500);
        assertEq(confidence, 9000);
        assertGt(lastUpdated, 0);
    }
    
    function testBatchSyncCVSFromSPG() public {
        // Set up SPG Oracle
        cvsOracle.setSPGOracle(address(mockSPG));
        
        address[] memory ipIds = new address[](2);
        ipIds[0] = address(0x1111);
        ipIds[1] = address(0x2222);
        
        // Set CVS in SPG Oracle
        mockSPG.setCVS(ipIds[0], 1000, block.timestamp, 10000);
        mockSPG.setCVS(ipIds[1], 2000, block.timestamp, 10000);
        
        // Batch sync
        cvsOracle.batchSyncCVSFromSPG(ipIds);
        
        // Check synced values
        assertEq(cvsOracle.getCVS(ipIds[0]), 1000);
        assertEq(cvsOracle.getCVS(ipIds[1]), 2000);
    }
    
    function testFallbackToCacheWhenSPGFails() public {
        // Set up SPG Oracle but don't set any values
        cvsOracle.setSPGOracle(address(mockSPG));
        cvsOracle.setUseSPGOracle(true);
        
        // Set cache value
        cvsOracle.updateCVS(ipId, 500, 10000);
        
        // Get CVS - should fallback to cache
        uint256 cvs = cvsOracle.getCVS(ipId);
        assertEq(cvs, 500);
    }
}

