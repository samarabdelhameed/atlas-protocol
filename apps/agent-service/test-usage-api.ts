/**
 * Test Script for Usage Data API
 *
 * Tests the global IP usage intelligence API endpoint
 */

const API_URL = 'http://localhost:3001';

// Test data - use a real IP asset ID from Story Protocol
const TEST_IP_ASSET = '0xCCED44C07dD7E02ab36F60ef3FA2a3dB13aDd60C'; // Real IP from Story testnet

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  data?: any;
}

const results: TestResult[] = [];

async function runTests() {
  console.log('🧪 Testing Atlas Protocol Usage Data API');
  console.log('═══════════════════════════════════════════\n');

  let authToken: string | null = null;
  let testAddress: string | null = null;

  // Test 1: Health Check
  console.log('Test 1: Health Check');
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();

    if (response.ok && data.status === 'ok') {
      results.push({
        test: 'Health Check',
        status: 'PASS',
        message: 'API is reachable',
        data,
      });
      console.log('✅ PASS: API is healthy\n');
    } else {
      results.push({
        test: 'Health Check',
        status: 'FAIL',
        message: 'API returned unexpected status',
        data,
      });
      console.log('❌ FAIL: Unexpected response\n');
    }
  } catch (error: any) {
    results.push({
      test: 'Health Check',
      status: 'FAIL',
      message: error.message,
    });
    console.log(`❌ FAIL: ${error.message}\n`);
    console.log('⚠️  Server may not be running. Start it with: cd apps/agent-service && bun run index.ts\n');
    return;
  }

  // Test 2: Authentication Challenge
  console.log('Test 2: Generate Authentication Challenge');
  try {
    testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'; // Test address

    const response = await fetch(`${API_URL}/api/auth/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: testAddress }),
    });

    const data = await response.json();

    if (response.ok && data.message) {
      results.push({
        test: 'Auth Challenge',
        status: 'PASS',
        message: 'Challenge generated successfully',
        data: { messageLength: data.message.length },
      });
      console.log('✅ PASS: Challenge message generated\n');
    } else {
      results.push({
        test: 'Auth Challenge',
        status: 'FAIL',
        message: 'Failed to generate challenge',
        data,
      });
      console.log('❌ FAIL: Challenge generation failed\n');
    }
  } catch (error: any) {
    results.push({
      test: 'Auth Challenge',
      status: 'FAIL',
      message: error.message,
    });
    console.log(`❌ FAIL: ${error.message}\n`);
  }

  // Test 3: Usage Data Without Auth (should fail)
  console.log('Test 3: Usage Data Without Authentication (should fail)');
  try {
    const response = await fetch(`${API_URL}/api/usage-data/${TEST_IP_ASSET}`);
    const data = await response.json();

    if (response.status === 401) {
      results.push({
        test: 'Usage Data - No Auth',
        status: 'PASS',
        message: 'Correctly rejected unauthenticated request',
        data,
      });
      console.log('✅ PASS: Authentication required (as expected)\n');
    } else {
      results.push({
        test: 'Usage Data - No Auth',
        status: 'FAIL',
        message: 'Should have rejected unauthenticated request',
        data,
      });
      console.log('❌ FAIL: Should require authentication\n');
    }
  } catch (error: any) {
    results.push({
      test: 'Usage Data - No Auth',
      status: 'FAIL',
      message: error.message,
    });
    console.log(`❌ FAIL: ${error.message}\n`);
  }

  // Test 4: Check Database for Test License
  console.log('Test 4: Check for Test License in Database');
  try {
    const response = await fetch(`${API_URL}/licenses/metadata`);
    const data = await response.json();

    if (response.ok) {
      const hasTestData = data.licenses && data.licenses.length > 0;

      if (hasTestData) {
        results.push({
          test: 'Database License Check',
          status: 'PASS',
          message: `Found ${data.count} licenses in database`,
          data: { count: data.count, sample: data.licenses[0] },
        });
        console.log(`✅ PASS: Found ${data.count} licenses\n`);
        console.log('Sample license:');
        console.log(JSON.stringify(data.licenses[0], null, 2));
        console.log('');
      } else {
        results.push({
          test: 'Database License Check',
          status: 'SKIP',
          message: 'No licenses in database. Add test data to fully test API.',
        });
        console.log('⚠️  SKIP: No licenses found. You can add test data via POST /licenses/metadata\n');
      }
    } else {
      results.push({
        test: 'Database License Check',
        status: 'FAIL',
        message: 'Failed to fetch licenses',
        data,
      });
      console.log('❌ FAIL: Could not fetch licenses\n');
    }
  } catch (error: any) {
    results.push({
      test: 'Database License Check',
      status: 'FAIL',
      message: error.message,
    });
    console.log(`❌ FAIL: ${error.message}\n`);
  }

  // Test 5: Test Usage Data Service (direct import)
  console.log('Test 5: Test Usage Data Service Directly');
  try {
    const { getUsageData } = await import('./src/services/usage-data-service.js');

    console.log(`📊 Fetching usage data for: ${TEST_IP_ASSET}`);
    const usageData = await getUsageData(TEST_IP_ASSET);

    if (usageData) {
      const hasValidStructure =
        usageData.globalUsage !== undefined &&
        usageData.provenance !== undefined &&
        usageData.licensingSummary !== undefined;

      if (hasValidStructure) {
        results.push({
          test: 'Usage Data Service',
          status: 'PASS',
          message: 'Service returned valid data structure',
          data: {
            totalDetections: usageData.globalUsage.totalDetections,
            authorizedUses: usageData.globalUsage.authorizedUses,
            unauthorizedUses: usageData.globalUsage.unauthorizedUses,
            yakoaScore: usageData.provenance.yakoaScore,
            cvsScore: usageData.cvs.currentScore,
          },
        });
        console.log('✅ PASS: Usage data structure is valid\n');
        console.log('📊 Global Usage Intelligence:');
        console.log(`   Total Detections: ${usageData.globalUsage.totalDetections}`);
        console.log(`   Authorized Uses: ${usageData.globalUsage.authorizedUses}`);
        console.log(`   Unauthorized Uses: ${usageData.globalUsage.unauthorizedUses}`);
        console.log(`   Platforms: ${usageData.globalUsage.platforms.join(', ') || 'None'}`);
        console.log(`   Derivatives: ${usageData.globalUsage.derivatives}`);
        console.log('');
        console.log('🔍 Provenance:');
        console.log(`   Yakoa Score: ${usageData.provenance.yakoaScore}/100`);
        console.log(`   Status: ${usageData.provenance.status}`);
        console.log(`   Verified: ${usageData.provenance.verified}`);
        console.log('');
        console.log('📈 CVS Score:');
        console.log(`   Current: ${usageData.cvs.currentScore}`);
        console.log(`   Rank: ${usageData.cvs.rank > 0 ? `#${usageData.cvs.rank}` : 'N/A'}`);
        console.log('');
        console.log('💰 Licensing Summary:');
        console.log(`   Total Licenses Sold: ${usageData.licensingSummary.totalLicensesSold}`);
        console.log(`   Active Licenses: ${usageData.licensingSummary.activeLicenses}`);
        console.log(`   Total Revenue: ${usageData.licensingSummary.totalRevenue}`);
        console.log('');
      } else {
        results.push({
          test: 'Usage Data Service',
          status: 'FAIL',
          message: 'Invalid data structure returned',
          data: usageData,
        });
        console.log('❌ FAIL: Invalid data structure\n');
      }
    } else {
      results.push({
        test: 'Usage Data Service',
        status: 'FAIL',
        message: 'Service returned null',
      });
      console.log('❌ FAIL: Service returned null\n');
    }
  } catch (error: any) {
    results.push({
      test: 'Usage Data Service',
      status: 'FAIL',
      message: error.message,
    });
    console.log(`❌ FAIL: ${error.message}\n`);
  }

  // Test 6: Test Yakoa Integration
  console.log('Test 6: Test Yakoa Client');
  try {
    const { fetchOriginalityScore } = await import('./src/clients/yakoaClient.js');

    // Use Story Protocol token ID format
    const tokenId = TEST_IP_ASSET;
    console.log(`🔍 Fetching Yakoa score for token: ${tokenId}`);

    const yakoaScore = await fetchOriginalityScore(tokenId);

    if (yakoaScore) {
      results.push({
        test: 'Yakoa Integration',
        status: 'PASS',
        message: 'Yakoa API integration working',
        data: yakoaScore,
      });
      console.log('✅ PASS: Yakoa integration working\n');
      console.log('Yakoa Response:');
      console.log(JSON.stringify(yakoaScore, null, 2));
      console.log('');
    } else {
      results.push({
        test: 'Yakoa Integration',
        status: 'SKIP',
        message: 'Yakoa returned no data (may need valid subdomain/API key)',
      });
      console.log('⚠️  SKIP: Yakoa returned no data (check YAKOA_SUBDOMAIN and YAKOA_API_KEY)\n');
    }
  } catch (error: any) {
    results.push({
      test: 'Yakoa Integration',
      status: 'SKIP',
      message: `Yakoa error: ${error.message}`,
    });
    console.log(`⚠️  SKIP: ${error.message}\n`);
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

  console.log('');
}

runTests().catch(console.error);
