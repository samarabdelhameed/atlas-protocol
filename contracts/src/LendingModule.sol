// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IDO.sol";
import "./interfaces/ILoanNFT.sol";

/**
 * @title LendingModule
 * @notice IP-backed lending module with dynamic interest rates
 */
contract LendingModule {
    
    // ========================================
    // State Variables
    // ========================================
    
    IDO public idoContract;
    address public loanNFT;
    address public adlvContract;
    address public owner;
    
    uint256 public loanCounter;
    uint256 public liquidationFeeBps = 500; // 5%
    uint256 public constant MIN_HEALTH_FACTOR = 10000; // 100%
    uint256 public constant LIQUIDATION_THRESHOLD = 8000; // 80%
    uint256 public constant MIN_CVS_RATIO = 2;
    
    // ========================================
    // Structs
    // ========================================
    
    struct Loan {
        uint256 loanId;
        address vaultAddress;
        address borrower;
        uint256 loanAmount;
        uint256 collateralAmount;
        address ipCollateral;
        uint256 ipCollateralValue;
        uint256 interestRate;
        uint256 duration;
        uint256 cvsAtIssuance;
        uint256 startTime;
        uint256 endTime;
        uint256 repaidAmount;
        uint256 outstandingAmount;
        uint256 accruedInterest;
        uint256 healthFactor;
        uint256 liquidationThreshold;
        LoanStatus status;
    }
    
    struct LoanTerms {
        uint256 minLoanAmount;
        uint256 maxLoanAmount;
        uint256 minDuration;
        uint256 maxDuration;
        uint256 minCollateralRatio;
        uint256 liquidationPenalty;
        uint256 baseInterestRate;
        bool allowIPCollateral;
    }
    
    enum LoanStatus {
        Pending,
        Active,
        Repaid,
        Defaulted,
        Liquidated
    }
    
    enum InterestRateModel {
        Fixed,
        Variable,
        Dynamic
    }
    
    // ========================================
    // Mappings
    // ========================================
    
    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public vaultLoans;
    mapping(address => uint256[]) public borrowerLoans;
    mapping(address => LoanTerms) public vaultLoanTerms;
    mapping(uint256 => address) public loanToIPCollateral;
    mapping(address => uint256[]) public ipCollateralLoans;
    
    LoanTerms public defaultLoanTerms;
    InterestRateModel public interestRateModel;
    
    // ========================================
    // Events
    // ========================================
    
    event LoanIssued(
        address indexed vaultAddress,
        address indexed borrower,
        uint256 indexed loanId,
        uint256 amount,
        uint256 collateral,
        uint256 interestRate,
        uint256 duration
    );
    
    event LoanRepaid(
        address indexed vaultAddress,
        address indexed borrower,
        uint256 indexed loanId,
        uint256 amount
    );
    
    event LoanLiquidated(
        address indexed vaultAddress,
        address indexed borrower,
        uint256 indexed loanId
    );
    
    event LoanHealthUpdated(
        uint256 indexed loanId,
        uint256 healthFactor,
        uint256 currentCVS
    );
    
    event IPCollateralAdded(
        uint256 indexed loanId,
        address indexed ipAsset,
        uint256 cvsValue
    );
    
    // ========================================
    // Modifiers
    // ========================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyADLV() {
        require(msg.sender == adlvContract, "Only ADLV");
        _;
    }
    
    // ========================================
    // Constructor
    // ========================================
    
    constructor(address _idoContract, address _loanNFT) {
        idoContract = IDO(_idoContract);
        loanNFT = _loanNFT;
        owner = msg.sender;
        
        defaultLoanTerms = LoanTerms({
            minLoanAmount: 0.01 ether,
            maxLoanAmount: 1000 ether,
            minDuration: 7 days,
            maxDuration: 365 days,
            minCollateralRatio: 15000,
            liquidationPenalty: 1000,
            baseInterestRate: 1000,
            allowIPCollateral: true
        });
        
        interestRateModel = InterestRateModel.Dynamic;
    }
    
    function setADLVContract(address _adlvContract) external onlyOwner {
        adlvContract = _adlvContract;
    }
    
    // ========================================
    // Lending Functions
    // ========================================
    
    function issueLoan(
        address vaultAddress,
        address borrower,
        uint256 loanAmount,
        uint256 duration,
        address ipCollateral,
        uint256 ethCollateral,
        uint256 currentCVS,
        uint256 availableLiquidity,
        uint256 totalLiquidity
    ) external payable onlyADLV returns (uint256 loanId) {
        LoanTerms memory terms = vaultLoanTerms[vaultAddress].minLoanAmount > 0 
            ? vaultLoanTerms[vaultAddress] 
            : defaultLoanTerms;
        
        require(loanAmount >= terms.minLoanAmount, "Loan amount too small");
        require(loanAmount <= terms.maxLoanAmount, "Loan amount too large");
        require(duration >= terms.minDuration, "Duration too short");
        require(duration <= terms.maxDuration, "Duration too long");
        require(currentCVS >= loanAmount * MIN_CVS_RATIO, "Insufficient CVS");
        
        uint256 totalCollateralValue = ethCollateral;
        uint256 ipCollateralVal = 0;
        
        if (ipCollateral != address(0)) {
            require(terms.allowIPCollateral, "IP collateral not allowed");
            bytes32 ipCollateralId = keccak256(abi.encodePacked(ipCollateral));
            ipCollateralVal = idoContract.getCVS(ipCollateralId);
            totalCollateralValue += ipCollateralVal;
        }
        
        uint256 requiredCollateral = (loanAmount * terms.minCollateralRatio) / 10000;
        require(totalCollateralValue >= requiredCollateral, "Insufficient collateral");
        
        uint256 interestRate = _calculateDynamicInterestRate(
            currentCVS,
            availableLiquidity,
            totalLiquidity
        );
        
        uint256 healthFactor = (totalCollateralValue * 10000) / loanAmount;
        uint256 liquidationThreshold = (loanAmount * LIQUIDATION_THRESHOLD) / 10000;
        
        loanId = loanCounter++;
        
        loans[loanId] = Loan({
            loanId: loanId,
            vaultAddress: vaultAddress,
            borrower: borrower,
            loanAmount: loanAmount,
            collateralAmount: ethCollateral,
            ipCollateral: ipCollateral,
            ipCollateralValue: ipCollateralVal,
            interestRate: interestRate,
            duration: duration,
            cvsAtIssuance: currentCVS,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            repaidAmount: 0,
            outstandingAmount: loanAmount,
            accruedInterest: 0,
            healthFactor: healthFactor,
            liquidationThreshold: liquidationThreshold,
            status: LoanStatus.Active
        });
        
        vaultLoans[vaultAddress].push(loanId);
        borrowerLoans[borrower].push(loanId);
        
        if (ipCollateral != address(0)) {
            loanToIPCollateral[loanId] = ipCollateral;
            ipCollateralLoans[ipCollateral].push(loanId);
            emit IPCollateralAdded(loanId, ipCollateral, ipCollateralVal);
        }
        
        if (loanNFT != address(0)) {
            try ILoanNFT(loanNFT).mint(borrower, loanId) {} catch {}
        }
        
        emit LoanIssued(
            vaultAddress,
            borrower,
            loanId,
            loanAmount,
            totalCollateralValue,
            interestRate,
            duration
        );
        
        return loanId;
    }
    
    function repayLoan(uint256 loanId, uint256 repaymentAmount) external onlyADLV returns (
        uint256 totalRepaid,
        uint256 collateralReturned,
        bool fullyRepaid
    ) {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Active, "Loan not active");
        
        uint256 interest = calculateAccruedInterest(loanId);
        uint256 totalDue = loan.loanAmount + interest;
        
        if (repaymentAmount >= totalDue - loan.repaidAmount) {
            loan.repaidAmount = totalDue;
            loan.outstandingAmount = 0;
            loan.status = LoanStatus.Repaid;
            collateralReturned = loan.collateralAmount;
            fullyRepaid = true;
            
            if (loanNFT != address(0)) {
                try ILoanNFT(loanNFT).burn(ILoanNFT(loanNFT).getTokenId(loanId)) {} catch {}
            }
        } else {
            loan.repaidAmount += repaymentAmount;
            loan.outstandingAmount = totalDue - loan.repaidAmount;
            fullyRepaid = false;
        }
        
        totalRepaid = repaymentAmount;
        
        emit LoanRepaid(loan.vaultAddress, loan.borrower, loanId, repaymentAmount);
        
        return (totalRepaid, collateralReturned, fullyRepaid);
    }
    
    function liquidateLoan(uint256 loanId) external returns (
        uint256 collateralAmount,
        uint256 protocolFee,
        uint256 liquidationReward
    ) {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Active, "Loan not active");
        
        uint256 healthFactor = updateLoanHealth(loanId);
        
        require(
            healthFactor < MIN_HEALTH_FACTOR || block.timestamp > loan.endTime,
            "Loan not liquidatable"
        );
        
        loan.status = LoanStatus.Liquidated;
        
        uint256 totalDebt = loan.outstandingAmount + loan.accruedInterest;
        uint256 liquidationPenalty = (totalDebt * defaultLoanTerms.liquidationPenalty) / 10000;
        protocolFee = (loan.collateralAmount * liquidationFeeBps) / 10000;
        
        collateralAmount = loan.collateralAmount - protocolFee;
        liquidationReward = liquidationPenalty;
        
        if (loanNFT != address(0)) {
            try ILoanNFT(loanNFT).burn(ILoanNFT(loanNFT).getTokenId(loanId)) {} catch {}
        }
        
        emit LoanLiquidated(loan.vaultAddress, loan.borrower, loanId);
        
        return (collateralAmount, protocolFee, liquidationReward);
    }
    
    function updateLoanHealth(uint256 loanId) public returns (uint256 healthFactor) {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Active, "Loan not active");
        
        uint256 currentCollateralValue = loan.collateralAmount;
        
        if (loan.ipCollateral != address(0)) {
            bytes32 ipCollateralId = keccak256(abi.encodePacked(loan.ipCollateral));
            uint256 currentIPValue = idoContract.getCVS(ipCollateralId);
            currentCollateralValue += currentIPValue;
        }
        
        uint256 accruedInterest = calculateAccruedInterest(loanId);
        uint256 totalDebt = loan.outstandingAmount + accruedInterest;
        
        healthFactor = (currentCollateralValue * 10000) / totalDebt;
        loan.healthFactor = healthFactor;
        loan.accruedInterest = accruedInterest;
        
        bytes32 ipId = keccak256(abi.encodePacked(loan.vaultAddress));
        uint256 currentCVS = idoContract.getCVS(ipId);
        
        emit LoanHealthUpdated(loanId, healthFactor, currentCVS);
        
        return healthFactor;
    }
    
    function calculateAccruedInterest(uint256 loanId) public view returns (uint256 interest) {
        Loan memory loan = loans[loanId];
        
        if (loan.status != LoanStatus.Active) {
            return loan.accruedInterest;
        }
        
        uint256 timeElapsed = block.timestamp - loan.startTime;
        uint256 principal = loan.outstandingAmount;
        uint256 annualRate = loan.interestRate;
        
        interest = (principal * annualRate * timeElapsed) / (10000 * 365 days);
        
        return interest;
    }
    
    function _calculateDynamicInterestRate(
        uint256 cvs,
        uint256 availableLiquidity,
        uint256 totalLiquidity
    ) internal view returns (uint256 rate) {
        if (interestRateModel == InterestRateModel.Fixed) {
            return defaultLoanTerms.baseInterestRate;
        }
        
        uint256 baseRate = defaultLoanTerms.baseInterestRate;
        
        if (interestRateModel == InterestRateModel.Variable) {
            if (totalLiquidity == 0) return baseRate;
            
            uint256 utilization = ((totalLiquidity - availableLiquidity) * 10000) / totalLiquidity;
            rate = baseRate + (baseRate * 2 * utilization) / 10000;
            
        } else {
            if (totalLiquidity == 0) return baseRate;
            
            uint256 utilization = ((totalLiquidity - availableLiquidity) * 10000) / totalLiquidity;
            uint256 cvsDiscount = cvs / 1000000 ether;
            if (cvsDiscount > 500) cvsDiscount = 500;
            
            uint256 utilizationPremium = (baseRate * utilization) / 10000;
            
            rate = baseRate + utilizationPremium;
            if (rate > cvsDiscount) {
                rate -= cvsDiscount;
            } else {
                rate = baseRate / 2;
            }
        }
        
        if (rate < 100) rate = 100;
        if (rate > 10000) rate = 10000;
        
        return rate;
    }
    
    // ========================================
    // View Functions
    // ========================================
    
    function getLoan(uint256 loanId) external view returns (Loan memory) {
        return loans[loanId];
    }
    
    function getLoanDetails(uint256 loanId) external view returns (
        Loan memory loan,
        uint256 currentHealth,
        uint256 currentDebt
    ) {
        loan = loans[loanId];
        
        if (loan.status == LoanStatus.Active) {
            uint256 accruedInterest = calculateAccruedInterest(loanId);
            currentDebt = loan.outstandingAmount + accruedInterest;
            
            uint256 currentCollateralValue = loan.collateralAmount;
            if (loan.ipCollateral != address(0)) {
                bytes32 ipCollateralId = keccak256(abi.encodePacked(loan.ipCollateral));
                currentCollateralValue += idoContract.getCVS(ipCollateralId);
            }
            
            currentHealth = (currentCollateralValue * 10000) / currentDebt;
        } else {
            currentHealth = loan.healthFactor;
            currentDebt = loan.outstandingAmount + loan.accruedInterest;
        }
        
        return (loan, currentHealth, currentDebt);
    }
    
    function isLoanLiquidatable(uint256 loanId) external view returns (
        bool isLiquidatable,
        string memory reason
    ) {
        Loan memory loan = loans[loanId];
        
        if (loan.status != LoanStatus.Active) {
            return (false, "Loan not active");
        }
        
        uint256 accruedInterest = calculateAccruedInterest(loanId);
        uint256 totalDebt = loan.outstandingAmount + accruedInterest;
        
        uint256 currentCollateralValue = loan.collateralAmount;
        if (loan.ipCollateral != address(0)) {
            bytes32 ipCollateralId = keccak256(abi.encodePacked(loan.ipCollateral));
            currentCollateralValue += idoContract.getCVS(ipCollateralId);
        }
        
        uint256 healthFactor = (currentCollateralValue * 10000) / totalDebt;
        
        if (healthFactor < MIN_HEALTH_FACTOR) {
            return (true, "Undercollateralized");
        }
        
        if (block.timestamp > loan.endTime) {
            return (true, "Loan expired");
        }
        
        return (false, "Loan healthy");
    }
    
    function getVaultLoans(address vaultAddress) external view returns (uint256[] memory) {
        return vaultLoans[vaultAddress];
    }
    
    function getBorrowerLoans(address borrower) external view returns (uint256[] memory) {
        return borrowerLoans[borrower];
    }
    
    function getLoansByIPCollateral(address ipAsset) external view returns (uint256[] memory) {
        return ipCollateralLoans[ipAsset];
    }
}
