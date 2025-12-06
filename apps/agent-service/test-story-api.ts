/**
 * Test Story Protocol API Client
 * 
 * Tests the new usage analytics integration with Story Protocol's REST API
 */

import { 
  getIPAsset, 
  getDerivatives, 
  getLicenseTokens, 
  getTransactions, 
  getIPUsageStats 
} from './src/clients/storyProtocolApiClient.js';

async function testStoryProtocolAPI() {
  console.log('═══════════════════════════════════════════');
  console.log('🧪 Testing Story Protocol API Client');
  console.log('═══════════════════════════════════════════\n');

  // Use a sample IP Asset ID from Story Protocol testnet
  // You can replace this with an actual IP Asset ID from your system
  const sampleIpId = '0x72247ab0a14e30f49fe160d6a4cda055fdcc19e7';

  try {
    // Test 1: Get IP Asset Details
    console.log('📡 Test 1: Fetching IP Asset Details...');
    const asset = await getIPAsset(sampleIpId);
    
    if (asset) {
      console.log('✅ IP Asset found:');
      console.log(`   ID: ${asset.ipId}`);
      console.log(`   Name: ${asset.name || asset.title}`);
      console.log(`   Owner: ${asset.ownerAddress}`);
      console.log(`   Children (Direct Derivatives): ${asset.childrenCount}`);
      console.log(`   Descendants (All Derivatives): ${asset.descendantsCount}`);
      console.log(`   Parents: ${asset.parentsCount}`);
      console.log(`   Licenses Attached: ${asset.licenses?.length || 0}`);
    } else {
      console.log('⚠️  IP Asset not found (this is expected if using demo ID)');
    }
    console.log('');

    // Test 2: Get Derivatives
    console.log('📡 Test 2: Fetching Derivatives (Edges)...');
    const derivativesResult = await getDerivatives(sampleIpId);
    console.log(`✅ Found ${derivativesResult.edges.length} derivatives`);
    console.log(`   Total: ${derivativesResult.pagination.total}`);
    if (derivativesResult.edges.length > 0) {
      console.log(`   First derivative: ${derivativesResult.edges[0]?.childIpId}`);
    }
    console.log('');

    // Test 3: Get License Tokens
    console.log('📡 Test 3: Fetching License Tokens...');
    const licenseTokensResult = await getLicenseTokens(sampleIpId);
    console.log(`✅ Found ${licenseTokensResult.tokens.length} license tokens`);
    console.log(`   Total: ${licenseTokensResult.pagination.total}`);
    if (licenseTokensResult.tokens.length > 0) {
      console.log(`   First token owner: ${licenseTokensResult.tokens[0]?.owner}`);
    }
    console.log('');

    // Test 4: Get Transactions
    console.log('📡 Test 4: Fetching Transactions...');
    const transactionsResult = await getTransactions(sampleIpId, { limit: 5 });
    console.log(`✅ Found ${transactionsResult.transactions.length} recent transactions`);
    console.log(`   Total: ${transactionsResult.pagination.total}`);
    if (transactionsResult.transactions.length > 0) {
      const tx = transactionsResult.transactions[0];
      console.log(`   Latest: ${tx?.eventType} at block ${tx?.blockNumber}`);
    }
    console.log('');

    // Test 5: Get Full Usage Stats
    console.log('📡 Test 5: Fetching Complete Usage Stats...');
    const stats = await getIPUsageStats(sampleIpId);
    
    if (stats) {
      console.log('✅ Complete Usage Stats:');
      console.log('─────────────────────────────────────────');
      console.log(`   IP Asset: ${stats.name}`);
      console.log(`   Owner: ${stats.owner}`);
      console.log('');
      console.log('   📊 Derivative Metrics:');
      console.log(`      Direct Derivatives: ${stats.directDerivatives}`);
      console.log(`      Total Descendants:  ${stats.totalDescendants}`);
      console.log(`      Parent IPs:         ${stats.parentIPs}`);
      console.log(`      Ancestor IPs:       ${stats.ancestorIPs}`);
      console.log('');
      console.log('   🎫 License Metrics:');
      console.log(`      Licenses Attached:      ${stats.licensesAttached}`);
      console.log(`      License Tokens Issued:  ${stats.licenseTokensIssued}`);
      console.log('');
      console.log('   📜 Transaction Metrics:');
      console.log(`      Total Transactions: ${stats.totalTransactions}`);
      if (stats.recentTransactions.length > 0) {
        console.log('      Recent Activity:');
        stats.recentTransactions.slice(0, 3).forEach(tx => {
          console.log(`         - ${tx.eventType} (block ${tx.blockNumber})`);
        });
      }
    } else {
      console.log('⚠️  Could not fetch usage stats (IP asset may not exist)');
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('✅ Story Protocol API Test Complete!');
    console.log('═══════════════════════════════════════════\n');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testStoryProtocolAPI();
