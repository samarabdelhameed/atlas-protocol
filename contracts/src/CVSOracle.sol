// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ICVSOracle.sol";
import "./interfaces/ISPGCVSOracle.sol";

/**
 * @title CVSOracle
 * @notice On-chain CVS Oracle for Story Protocol IP assets
 * @dev Provides real-time CVS data with confidence scores
 * Integrates with Story Protocol SPG Oracle for CVS V2 data
 */
contract CVSOracle is ICVSOracle {
    
    // ========================================
    // State Variables
    // ========================================
    
    address public owner;
    address public storyProtocolCore;
    ISPGCVSOracle public spgOracle; // Story Protocol SPG Oracle
    
    // Oracle operators (can update CVS)
    mapping(address => bool) public operators;
    
    // Enable/disable SPG Oracle integration
    bool public useSPGOracle;
    
    // CVS data structure
    struct CVSData {
        uint256 value;
        uint256 lastUpdated;
        uint256 confidence; // 0-10000 (100%)
        bool exists;
    }
    
    // CVS history entry
    struct CVSUpdate {
        uint256 value;
        uint256 timestamp;
        uint256 confidence;
    }
    
    // Mappings
    mapping(address => CVSData) public cvsData;
    mapping(address => CVSUpdate[]) public cvsHistory;
    
    // Constants
    uint256 public constant MAX_CONFIDENCE = 10000;
    uint256 public constant CVS_VALIDITY_PERIOD = 24 hours;
    
    // ========================================
    // Events
    // ========================================
    
    event CVSUpdated(
        address indexed ipId,
        uint256 oldValue,
        uint256 newValue,
        uint256 confidence,
        uint256 timestamp
    );
    
    event OperatorAdded(address indexed operator);
    event OperatorRemoved(address indexed operator);
    event StoryProtocolCoreUpdated(address indexed newCore);
    event SPGOracleUpdated(address indexed newSPGOracle);
    event SPGOracleUsageToggled(bool useSPGOracle);
    event CVSSyncedFromSPG(address indexed ipId, uint256 cvs, uint256 timestamp);
    
    // ========================================
    // Modifiers
    // ========================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyOperator() {
        require(operators[msg.sender] || msg.sender == owner, "Only operator");
        _;
    }
    
    // ========================================
    // Constructor
    // ========================================
    
    constructor(address _storyProtocolCore) {
        owner = msg.sender;
        storyProtocolCore = _storyProtocolCore;
        operators[msg.sender] = true;
        useSPGOracle = false; // Start disabled, enable after SPG Oracle is set
    }
    
    // ========================================
    // Oracle Functions
    // ========================================
    
    /**
     * @notice Get CVS value for an IP asset
     * @dev Fetches from SPG Oracle if enabled, otherwise returns cached value
     */
    function getCVS(address ipId) external view override returns (uint256 cvs) {
        // Try to fetch from SPG Oracle first (CVS V2 from Story Protocol)
        if (useSPGOracle && address(spgOracle) != address(0)) {
            try spgOracle.getCVSV2(ipId) returns (
                uint256 spgCVS,
                uint256 spgLastUpdated,
                uint256 spgConfidence,
                string memory
            ) {
                // If SPG Oracle has fresh data, use it
                if (spgCVS > 0 && spgConfidence > 0) {
                    // Check if SPG data is fresh (within validity period)
                    if (block.timestamp - spgLastUpdated <= CVS_VALIDITY_PERIOD) {
                        return spgCVS;
                    } else {
                        // SPG data is stale, return discounted value
                        return (spgCVS * 90) / 100; // 10% discount
                    }
                }
            } catch {
                // SPG Oracle failed, fall through to cached value
            }
        }
        
        // Fall back to cached value
        CVSData memory data = cvsData[ipId];
        
        if (!data.exists) {
            return 0;
        }
        
        // Check if data is stale
        if (block.timestamp - data.lastUpdated > CVS_VALIDITY_PERIOD) {
            // Return discounted value for stale data
            return (data.value * 90) / 100; // 10% discount
        }
        
        return data.value;
    }
    
    /**
     * @notice Get CVS value with metadata
     * @dev Fetches from SPG Oracle if enabled, otherwise returns cached value
     */
    function getCVSWithMetadata(address ipId) external view override returns (
        uint256 cvs,
        uint256 lastUpdated,
        uint256 confidence
    ) {
        // Try to fetch from SPG Oracle first (CVS V2 from Story Protocol)
        if (useSPGOracle && address(spgOracle) != address(0)) {
            try spgOracle.getCVSV2(ipId) returns (
                uint256 spgCVS,
                uint256 spgLastUpdated,
                uint256 spgConfidence,
                string memory
            ) {
                // If SPG Oracle has data, use it
                if (spgCVS > 0 && spgConfidence > 0) {
                    cvs = spgCVS;
                    lastUpdated = spgLastUpdated;
                    confidence = spgConfidence;
                    
                    // Adjust confidence for stale data
                    if (block.timestamp - spgLastUpdated > CVS_VALIDITY_PERIOD) {
                        confidence = (confidence * 80) / 100; // 20% confidence reduction
                    }
                    
                    return (cvs, lastUpdated, confidence);
                }
            } catch {
                // SPG Oracle failed, fall through to cached value
            }
        }
        
        // Fall back to cached value
        CVSData memory data = cvsData[ipId];
        
        if (!data.exists) {
            return (0, 0, 0);
        }
        
        cvs = data.value;
        lastUpdated = data.lastUpdated;
        confidence = data.confidence;
        
        // Adjust confidence for stale data
        if (block.timestamp - data.lastUpdated > CVS_VALIDITY_PERIOD) {
            confidence = (confidence * 80) / 100; // 20% confidence reduction
        }
        
        return (cvs, lastUpdated, confidence);
    }
    
    /**
     * @notice Update CVS value
     */
    function updateCVS(
        address ipId,
        uint256 newCVS,
        uint256 confidence
    ) external override onlyOperator {
        require(confidence <= MAX_CONFIDENCE, "Invalid confidence");
        
        uint256 oldValue = cvsData[ipId].value;
        
        cvsData[ipId] = CVSData({
            value: newCVS,
            lastUpdated: block.timestamp,
            confidence: confidence,
            exists: true
        });
        
        // Add to history
        cvsHistory[ipId].push(CVSUpdate({
            value: newCVS,
            timestamp: block.timestamp,
            confidence: confidence
        }));
        
        emit CVSUpdated(ipId, oldValue, newCVS, confidence, block.timestamp);
    }
    
    /**
     * @notice Batch update CVS values
     */
    function batchUpdateCVS(
        address[] calldata ipIds,
        uint256[] calldata values,
        uint256[] calldata confidences
    ) external onlyOperator {
        require(
            ipIds.length == values.length && values.length == confidences.length,
            "Array length mismatch"
        );
        
        for (uint256 i = 0; i < ipIds.length; i++) {
            this.updateCVS(ipIds[i], values[i], confidences[i]);
        }
    }
    
    /**
     * @notice Check if CVS data exists
     */
    function hasCVS(address ipId) external view override returns (bool exists) {
        return cvsData[ipId].exists;
    }
    
    /**
     * @notice Get CVS update history
     */
    function getCVSHistory(address ipId) external view override returns (
        uint256[] memory values,
        uint256[] memory timestamps
    ) {
        CVSUpdate[] memory history = cvsHistory[ipId];
        uint256 length = history.length;
        
        values = new uint256[](length);
        timestamps = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            values[i] = history[i].value;
            timestamps[i] = history[i].timestamp;
        }
        
        return (values, timestamps);
    }
    
    /**
     * @notice Get latest CVS updates (last N)
     */
    function getLatestUpdates(address ipId, uint256 count) external view returns (
        uint256[] memory values,
        uint256[] memory timestamps,
        uint256[] memory confidences
    ) {
        CVSUpdate[] memory history = cvsHistory[ipId];
        uint256 length = history.length;
        
        if (length == 0) {
            return (new uint256[](0), new uint256[](0), new uint256[](0));
        }
        
        uint256 returnCount = count > length ? length : count;
        values = new uint256[](returnCount);
        timestamps = new uint256[](returnCount);
        confidences = new uint256[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            uint256 index = length - returnCount + i;
            values[i] = history[index].value;
            timestamps[i] = history[index].timestamp;
            confidences[i] = history[index].confidence;
        }
        
        return (values, timestamps, confidences);
    }
    
    /**
     * @notice Check if CVS data is fresh
     */
    function isCVSFresh(address ipId) external view returns (bool fresh) {
        CVSData memory data = cvsData[ipId];
        
        if (!data.exists) {
            return false;
        }
        
        return block.timestamp - data.lastUpdated <= CVS_VALIDITY_PERIOD;
    }
    
    // ========================================
    // Admin Functions
    // ========================================
    
    function addOperator(address operator) external onlyOwner {
        operators[operator] = true;
        emit OperatorAdded(operator);
    }
    
    function removeOperator(address operator) external onlyOwner {
        operators[operator] = false;
        emit OperatorRemoved(operator);
    }
    
    function setStoryProtocolCore(address newCore) external onlyOwner {
        storyProtocolCore = newCore;
        emit StoryProtocolCoreUpdated(newCore);
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
    
    // ========================================
    // SPG Oracle Integration Functions
    // ========================================
    
    /**
     * @notice Set SPG Oracle address
     * @param _spgOracle Address of Story Protocol SPG Oracle contract
     */
    function setSPGOracle(address _spgOracle) external onlyOwner {
        spgOracle = ISPGCVSOracle(_spgOracle);
        emit SPGOracleUpdated(_spgOracle);
    }
    
    /**
     * @notice Toggle SPG Oracle usage
     * @param _useSPGOracle True to use SPG Oracle, false to use cached values only
     */
    function setUseSPGOracle(bool _useSPGOracle) external onlyOwner {
        useSPGOracle = _useSPGOracle;
        emit SPGOracleUsageToggled(_useSPGOracle);
    }
    
    /**
     * @notice Sync CVS from SPG Oracle and update local cache
     * @dev Called by operator to sync CVS V2 from Story Protocol
     * @param ipId The IP asset ID to sync
     */
    function syncCVSFromSPG(address ipId) external onlyOperator {
        require(address(spgOracle) != address(0), "SPG Oracle not set");
        
        try spgOracle.getCVSV2(ipId) returns (
            uint256 spgCVS,
            uint256 spgLastUpdated,
            uint256 spgConfidence,
            string memory
        ) {
            if (spgCVS > 0) {
                uint256 oldValue = cvsData[ipId].value;
                
                // Update local cache with SPG data
                cvsData[ipId] = CVSData({
                    value: spgCVS,
                    lastUpdated: spgLastUpdated > 0 ? spgLastUpdated : block.timestamp,
                    confidence: spgConfidence > 0 ? spgConfidence : MAX_CONFIDENCE,
                    exists: true
                });
                
                // Add to history
                cvsHistory[ipId].push(CVSUpdate({
                    value: spgCVS,
                    timestamp: block.timestamp,
                    confidence: spgConfidence > 0 ? spgConfidence : MAX_CONFIDENCE
                }));
                
                emit CVSUpdated(ipId, oldValue, spgCVS, spgConfidence, block.timestamp);
                emit CVSSyncedFromSPG(ipId, spgCVS, block.timestamp);
            }
        } catch {
            revert("Failed to sync from SPG Oracle");
        }
    }
    
    /**
     * @notice Batch sync CVS from SPG Oracle
     * @param ipIds Array of IP asset IDs to sync
     */
    function batchSyncCVSFromSPG(address[] calldata ipIds) external onlyOperator {
        require(address(spgOracle) != address(0), "SPG Oracle not set");
        
        for (uint256 i = 0; i < ipIds.length; i++) {
            this.syncCVSFromSPG(ipIds[i]);
        }
    }
}
