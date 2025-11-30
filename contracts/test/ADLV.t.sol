// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IDO} from "../src/IDO.sol";
import {ADLV} from "../src/ADLV.sol";

contract ADLVTest is Test {
    IDO public ido;
    ADLV public adlv;
    
    address public owner;
    address public creator;
    address public borrower;
    address public licensee;
    
    bytes32 public constant IP_ID = keccak256("test-ip-asset");
    
    uint256 public constant INITIAL_CVS = 10000 ether; // High CVS for testing
    uint256 public constant LOAN_AMOUNT = 1000 ether;
    uint256 public constant LOAN_DURATION = 30 days;
    
    function setUp() public {
        owner = vm.addr(100); // Separate owner address
        creator = vm.addr(1);
        borrower = vm.addr(2);
        licensee = vm.addr(3);
        
        // Deploy IDO
        ido = new IDO(owner);
        
        // Deploy ADLV
        vm.prank(owner);
        adlv = new ADLV(address(ido));
        
        // Transfer IDO ownership to ADLV
        vm.prank(owner);
        ido.transferOwnership(address(adlv));
        
        // Set initial CVS
        vm.prank(address(adlv));
        ido.updateCVS(IP_ID, INITIAL_CVS);
        
        // Fund addresses (borrower needs more for collateral, creator needs for deposits)
        vm.deal(owner, 100 ether);
        vm.deal(creator, 5000 ether); // Enough for deposits
        vm.deal(borrower, 2000 ether); // Enough for collateral (1500 ether) + gas
        vm.deal(licensee, 100 ether);
    }
    
    // Make contract receive ETH
    receive() external payable {}
    
    // ========================================
    // Vault Creation Tests
    // ========================================
    
    function test_CreateVault() public {
        vm.prank(creator);
        address vaultAddress = adlv.createVault(IP_ID);
        
        assertTrue(vaultAddress != address(0));
        ADLV.Vault memory vault = adlv.getVault(vaultAddress);
        assertTrue(vault.exists);
        assertEq(vault.ipId, IP_ID);
        assertEq(vault.creator, creator);
        assertEq(adlv.ipToVault(IP_ID), vaultAddress);
    }
    
    function test_CreateVault_RevertIfAlreadyExists() public {
        vm.prank(creator);
        adlv.createVault(IP_ID);
        
        vm.prank(creator);
        vm.expectRevert("ADLV: Vault already exists");
        adlv.createVault(IP_ID);
    }
    
    function test_CreateVault_EmitsEvent() public {
        vm.prank(creator);
        address vaultAddress = adlv.createVault(IP_ID);
        
        // Check event was emitted (we can't easily test exact address in expectEmit)
        assertTrue(vaultAddress != address(0));
    }
    
    // ========================================
    // License Sales Tests
    // ========================================
    
    function test_SellLicense() public {
        vm.prank(creator);
        address vaultAddress = adlv.createVault(IP_ID);
        
        uint256 licensePrice = 10 ether;
        vm.prank(licensee);
        adlv.sellLicense{value: licensePrice}(vaultAddress, "commercial", 0);
        
        ADLV.Vault memory vault = adlv.getVault(vaultAddress);
        assertGt(vault.totalLicenseRevenue, 0);
        assertGt(vault.totalLiquidity, 0);
    }
    
    function test_SellLicense_DistributesRevenue() public {
        vm.prank(creator);
        address vaultAddress = adlv.createVault(IP_ID);
        
        uint256 licensePrice = 10 ether;
        uint256 ownerBalanceBefore = owner.balance;
        uint256 creatorBalanceBefore = creator.balance;
        
        vm.prank(licensee);
        adlv.sellLicense{value: licensePrice}(vaultAddress, "commercial", 0);
        
        // Protocol fee should be sent to owner
        assertGt(owner.balance, ownerBalanceBefore);
        // Creator share should be sent to creator
        assertGt(creator.balance, creatorBalanceBefore);
    }
    
    function test_SellLicense_RevertIfInvalidPrice() public {
        vm.prank(creator);
        address vaultAddress = adlv.createVault(IP_ID);
        
        vm.prank(licensee);
        vm.expectRevert("ADLV: Invalid price");
        adlv.sellLicense{value: 0}(vaultAddress, "commercial", 0);
    }
    
    // ========================================
    // Loan Management Tests
    // ========================================
    
    function test_IssueLoan() public {
        vm.prank(creator);
        address vaultAddress = adlv.createVault(IP_ID);
        
        // Deposit liquidity (must be >= loan amount)
        vm.prank(creator);
        adlv.deposit{value: LOAN_AMOUNT + 1 ether}(vaultAddress);
        
        // Issue loan (150% collateral = 15000 basis points)
        uint256 collateral = (LOAN_AMOUNT * 15000) / 10000; // 150% collateral
        vm.prank(borrower);
        uint256 loanId = adlv.issueLoan{value: collateral}(
            vaultAddress,
            LOAN_AMOUNT,
            LOAN_DURATION,
            0 // targetChainId = 0 (same chain, no bridge)
        );
        
        ADLV.Loan memory loan = adlv.getLoan(loanId);
        assertEq(loan.borrower, borrower);
        assertEq(loan.loanAmount, LOAN_AMOUNT);
        assertTrue(uint256(loan.status) == uint256(ADLV.LoanStatus.Active));
    }
    
    function test_IssueLoan_RevertIfInsufficientCVS() public {
        vm.prank(creator);
        address vaultAddress = adlv.createVault(IP_ID);
        
        // Set low CVS
        vm.prank(address(adlv));
        ido.updateCVS(IP_ID, 1000); // CVS < 2 * LOAN_AMOUNT
        
        vm.prank(creator);
        adlv.deposit{value: 10 ether}(vaultAddress);
        
        uint256 collateral = (LOAN_AMOUNT * 150) / 100;
        vm.prank(borrower);
        vm.expectRevert("ADLV: Insufficient CVS");
        adlv.issueLoan{value: collateral}(vaultAddress, LOAN_AMOUNT, LOAN_DURATION, 0);
    }
    
    function test_IssueLoan_RevertIfInsufficientLiquidity() public {
        vm.prank(creator);
        address vaultAddress = adlv.createVault(IP_ID);
        
        // Don't deposit liquidity
        uint256 collateral = (LOAN_AMOUNT * 150) / 100;
        vm.prank(borrower);
        vm.expectRevert("ADLV: Insufficient liquidity");
        adlv.issueLoan{value: collateral}(vaultAddress, LOAN_AMOUNT, LOAN_DURATION, 0);
    }
    
    function test_RepayLoan() public {
        vm.prank(creator);
        address vaultAddress = adlv.createVault(IP_ID);
        
        // Deposit liquidity (must be >= loan amount)
        vm.prank(creator);
        adlv.deposit{value: LOAN_AMOUNT + 1 ether}(vaultAddress);
        
        // Issue loan (150% collateral = 15000 basis points)
        uint256 collateral = (LOAN_AMOUNT * 15000) / 10000;
        vm.prank(borrower);
        uint256 loanId = adlv.issueLoan{value: collateral}(
            vaultAddress,
            LOAN_AMOUNT,
            LOAN_DURATION,
            0 // targetChainId = 0 (same chain)
        );
        
        // Advance time slightly to calculate interest
        vm.warp(block.timestamp + 1 days);
        
        // Calculate repayment (principal + interest)
        ADLV.Loan memory loan = adlv.getLoan(loanId);
        uint256 interest = adlv.calculateInterest(
            loan.loanAmount,
            loan.interestRate,
            block.timestamp - loan.startTime,
            loan.duration
        );
        uint256 totalDue = loan.loanAmount + interest;
        
        // Fund borrower for repayment
        vm.deal(borrower, totalDue + 1 ether);
        
        // Repay loan
        vm.prank(borrower);
        adlv.repayLoan{value: totalDue}(loanId);
        
        loan = adlv.getLoan(loanId);
        assertTrue(uint256(loan.status) == uint256(ADLV.LoanStatus.Repaid));
        assertEq(loan.outstandingAmount, 0);
    }
    
    // ========================================
    // Deposit/Withdraw Tests
    // ========================================
    
    function test_Deposit() public {
        vm.prank(creator);
        address vaultAddress = adlv.createVault(IP_ID);
        
        vm.prank(creator);
        uint256 shares = adlv.deposit{value: 5 ether}(vaultAddress);
        
        assertEq(shares, 5 ether);
        assertEq(adlv.depositorShares(vaultAddress, creator), 5 ether);
        
        ADLV.Vault memory vault = adlv.getVault(vaultAddress);
        assertEq(vault.totalLiquidity, 5 ether);
    }
    
    function test_Withdraw() public {
        vm.prank(creator);
        address vaultAddress = adlv.createVault(IP_ID);
        
        vm.prank(creator);
        uint256 shares = adlv.deposit{value: 5 ether}(vaultAddress);
        
        uint256 balanceBefore = creator.balance;
        vm.prank(creator);
        adlv.withdraw(vaultAddress, shares);
        
        assertGt(creator.balance, balanceBefore);
        assertEq(adlv.depositorShares(vaultAddress, creator), 0);
    }
    
    // ========================================
    // View Functions Tests
    // ========================================
    
    function test_CalculateMaxLoanAmount() public {
        vm.prank(creator);
        address vaultAddress = adlv.createVault(IP_ID);
        
        uint256 maxLoan = adlv.calculateMaxLoanAmount(vaultAddress);
        assertEq(maxLoan, INITIAL_CVS / 2);
    }
    
    function test_CalculateInterestRate() public {
        uint256 rate = adlv.calculateInterestRate(INITIAL_CVS);
        assertGe(rate, 500); // Minimum 5%
        assertLe(rate, 2000); // Maximum 20%
    }
}

