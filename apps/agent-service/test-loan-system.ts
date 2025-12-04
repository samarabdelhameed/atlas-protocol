/**
 * Test Script for Loan System
 *
 * Tests the IPFi loan management system
 */

import { LoanManager } from './src/services/loan-manager.js';
import { config } from './src/config/index.js';

const ADLV_ADDRESS = config.contracts.adlv;
const IDO_ADDRESS = config.contracts.ido;

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  data?: any;
}

const results: TestResult[] = [];

async function runTests() {
  console.log('🧪 Testing Atlas Protocol Loan System');
  console.log('═══════════════════════════════════════════\n');

  // Test 1: Initialize Loan Manager
  console.log('Test 1: Initialize Loan Manager');
  let loanManager: LoanManager;
  try {
    loanManager = new LoanManager(ADLV_ADDRESS, IDO_ADDRESS);

    results.push({
      test: 'LoanManager Initialization',
      status: 'PASS',
      message: 'LoanManager initialized successfully',
      data: {
        adlvAddress: ADLV_ADDRESS,
        idoAddress: IDO_ADDRESS,
        hasPrivateKey: !!config.privateKey,
      },
    });
    console.log('✅ PASS: LoanManager initialized\n');
    console.log(`   ADLV Contract: ${ADLV_ADDRESS}`);
    console.log(`   IDO Contract: ${IDO_ADDRESS}`);
    console.log(`   Has Private Key: ${config.privateKey ? '✅' : '❌'}\n`);
  } catch (error: any) {
    results.push({
      test: 'LoanManager Initialization',
      status: 'FAIL',
      message: error.message,
    });
    console.log(`❌ FAIL: ${error.message}\n`);
    return;
  }

  // Test 2: Check Contract Connectivity
  console.log('Test 2: Check Contract Connectivity');
  try {
    // Try to get a vault (even if it doesn't exist, contract should respond)
    const testAddress = '0x0000000000000000000000000000000000000001';
    await loanManager.getVault(testAddress);

    results.push({
      test: 'Contract Connectivity',
      status: 'PASS',
      message: 'Can connect to ADLV contract',
    });
    console.log('✅ PASS: Connected to ADLV contract\n');
  } catch (error: any) {
    // Contract calls might fail if no vault exists, but that's OK
    if (error.message && (error.message.includes('Vault not found') || error.message.includes('reverted'))) {
      results.push({
        test: 'Contract Connectivity',
        status: 'PASS',
        message: 'Contract is responding (vault not found is expected)',
      });
      console.log('✅ PASS: Contract is responding\n');
    } else {
      results.push({
        test: 'Contract Connectivity',
        status: 'FAIL',
        message: `Contract error: ${error.message}`,
      });
      console.log(`❌ FAIL: ${error.message}\n`);
    }
  }

  // Test 3: Get Vault by IP ID
  console.log('Test 3: Get Vault by IP ID');
  const testIpId = '0xCCED44C07dD7E02ab36F60ef3FA2a3dB13aDd60C'; // Real IP from Story testnet
  try {
    const vaultAddress = await loanManager.getVaultByIpId(testIpId);

    if (vaultAddress) {
      results.push({
        test: 'Get Vault by IP ID',
        status: 'PASS',
        message: `Found vault for IP: ${vaultAddress}`,
        data: { ipId: testIpId, vaultAddress },
      });
      console.log('✅ PASS: Vault found\n');
      console.log(`   IP ID: ${testIpId}`);
      console.log(`   Vault: ${vaultAddress}\n`);

      // Test 4: Get Vault Details
      console.log('Test 4: Get Vault Details');
      try {
        const vault = await loanManager.getVault(vaultAddress);

        results.push({
          test: 'Get Vault Details',
          status: 'PASS',
          message: 'Retrieved vault details',
          data: {
            ipId: vault.ipId,
            totalDeposits: vault.totalDeposits.toString(),
            availableLiquidity: vault.availableLiquidity.toString(),
            totalLoansIssued: vault.totalLoansIssued.toString(),
          },
        });
        console.log('✅ PASS: Vault details retrieved\n');
        console.log('   Vault Details:');
        console.log(`     IP ID: ${vault.ipId}`);
        console.log(`     Total Deposits: ${vault.totalDeposits.toString()}`);
        console.log(`     Available Liquidity: ${vault.availableLiquidity.toString()}`);
        console.log(`     Total Loans Issued: ${vault.totalLoansIssued.toString()}`);
        console.log(`     Active Loans: ${vault.activeLoans.toString()}\n`);

        // Test 5: Check Loan Eligibility
        console.log('Test 5: Check Loan Eligibility');
        try {
          const loanAmount = BigInt(100) * BigInt(10 ** 18); // 100 tokens
          const eligibility = await loanManager.checkLoanEligibility(vaultAddress, loanAmount);

          results.push({
            test: 'Loan Eligibility Check',
            status: 'PASS',
            message: eligibility.eligible ? 'Loan is eligible' : `Not eligible: ${eligibility.reason}`,
            data: {
              eligible: eligibility.eligible,
              currentCVS: eligibility.currentCVS.toString(),
              maxLoanAmount: eligibility.maxLoanAmount.toString(),
              availableLiquidity: eligibility.availableLiquidity.toString(),
              interestRate: eligibility.interestRate.toString(),
              requiredCollateral: eligibility.requiredCollateral.toString(),
            },
          });

          if (eligibility.eligible) {
            console.log('✅ PASS: Loan is eligible\n');
          } else {
            console.log(`⚠️  PASS: Eligibility check works (not eligible: ${eligibility.reason})\n`);
          }

          console.log('   Loan Eligibility Details:');
          console.log(`     Eligible: ${eligibility.eligible ? '✅' : '❌'}`);
          console.log(`     Current CVS: ${eligibility.currentCVS.toString()}`);
          console.log(`     Max Loan Amount: ${eligibility.maxLoanAmount.toString()}`);
          console.log(`     Available Liquidity: ${eligibility.availableLiquidity.toString()}`);
          console.log(`     Interest Rate: ${Number(eligibility.interestRate) / 100}%`);
          console.log(`     Required Collateral: ${eligibility.requiredCollateral.toString()}`);
          if (!eligibility.eligible) {
            console.log(`     Reason: ${eligibility.reason}`);
          }
          console.log('');
        } catch (error: any) {
          results.push({
            test: 'Loan Eligibility Check',
            status: 'FAIL',
            message: error.message,
          });
          console.log(`❌ FAIL: ${error.message}\n`);
        }
      } catch (error: any) {
        results.push({
          test: 'Get Vault Details',
          status: 'FAIL',
          message: error.message,
        });
        console.log(`❌ FAIL: ${error.message}\n`);
      }
    } else {
      results.push({
        test: 'Get Vault by IP ID',
        status: 'SKIP',
        message: 'No vault found for test IP (expected for new IP assets)',
        data: { ipId: testIpId },
      });
      console.log('⚠️  SKIP: No vault found for test IP\n');
      console.log('   This is expected if no vault has been created for this IP.\n');
      console.log('   To create a vault, use: POST /verify-vault with the IP ID\n');
    }
  } catch (error: any) {
    results.push({
      test: 'Get Vault by IP ID',
      status: 'FAIL',
      message: error.message,
    });
    console.log(`❌ FAIL: ${error.message}\n`);
  }

  // Test 6: Test Event Monitoring (start and stop)
  console.log('Test 6: Event Monitoring');
  try {
    loanManager.startMonitoring();

    // Wait a bit to ensure no errors
    await new Promise(resolve => setTimeout(resolve, 1000));

    loanManager.stopMonitoring();

    results.push({
      test: 'Event Monitoring',
      status: 'PASS',
      message: 'Event monitoring can start and stop without errors',
    });
    console.log('✅ PASS: Event monitoring works\n');
  } catch (error: any) {
    results.push({
      test: 'Event Monitoring',
      status: 'FAIL',
      message: error.message,
    });
    console.log(`❌ FAIL: ${error.message}\n`);
  }

  // Test 7: Vault Creation (requires private key)
  console.log('Test 7: Vault Creation Capability');
  if (!config.privateKey) {
    results.push({
      test: 'Vault Creation',
      status: 'SKIP',
      message: 'No private key configured. Set PRIVATE_KEY in .env to test vault creation.',
    });
    console.log('⚠️  SKIP: No private key configured\n');
    console.log('   To test vault creation, add PRIVATE_KEY to your .env file\n');
  } else {
    results.push({
      test: 'Vault Creation',
      status: 'SKIP',
      message: 'Private key present but skipping actual vault creation in test',
    });
    console.log('⚠️  SKIP: Private key present but not creating vault in automated test\n');
    console.log('   Vault creation can be tested manually via API: POST /verify-vault\n');
  }

  // Test 8: Cross-chain Transfer Configuration
  console.log('Test 8: Cross-chain Transfer Configuration');
  const hasOwltoKey = !!config.owlto.apiKey;

  if (hasOwltoKey) {
    results.push({
      test: 'Cross-chain Config',
      status: 'PASS',
      message: 'Owlto API key configured',
    });
    console.log('✅ PASS: Owlto Finance integration configured\n');
  } else {
    results.push({
      test: 'Cross-chain Config',
      status: 'SKIP',
      message: 'Owlto API key not configured (cross-chain transfers will be skipped)',
    });
    console.log('⚠️  SKIP: No Owlto API key (cross-chain transfers disabled)\n');
    console.log('   Set OWLTO_API_KEY in .env to enable IPFi cross-chain loans\n');
  }

  // Print Summary
  console.log('\n═══════════════════════════════════════════');
  console.log('📋 Test Summary');
  console.log('═══════════════════════════════════════════\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Skipped: ${skipped}`);
  console.log(`📊 Total: ${results.length}\n`);

  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️ ';
    console.log(`${icon} ${result.test}: ${result.message}`);
  });

  console.log('\n═══════════════════════════════════════════');
  console.log('💡 Configuration Status');
  console.log('═══════════════════════════════════════════\n');

  console.log(`Private Key: ${config.privateKey ? '✅ Configured' : '❌ Missing (vault operations disabled)'}`);
  console.log(`Owlto API Key: ${config.owlto.apiKey ? '✅ Configured' : '❌ Missing (cross-chain disabled)'}`);
  console.log(`Yakoa API Key: ${process.env.YAKOA_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`Yakoa Subdomain: ${process.env.YAKOA_SUBDOMAIN ? '✅ Configured' : '❌ Missing'}`);
  console.log('');
}

runTests().catch(console.error);
