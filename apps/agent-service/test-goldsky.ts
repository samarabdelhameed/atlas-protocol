/**
 * Test Script for Goldsky Client
 * 
 * Run this to test fetching data from Goldsky subgraph:
 * bun run test-goldsky.ts
 */

import {
  fetchLatestIPAssets,
  fetchLatestLicenseSales,
  testGoldskyConnection,
} from './src/clients/goldskyClient.js';

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('🧪 Testing Goldsky Client');
  console.log('═══════════════════════════════════════════\n');

  try {
    // Test 1: Connection Test
    console.log('📡 Step 1: Testing Goldsky Connection...\n');
    try {
      await testGoldskyConnection();
      console.log('\n');
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('\n⚠️  Subgraph not deployed yet. Continuing with tests anyway...\n');
      } else {
        throw error;
      }
    }

    // Test 2: Fetch Latest IP Assets
    console.log('📡 Step 2: Fetching Latest 5 IP Assets...\n');
    let ipAssets: any[] = [];
    try {
      ipAssets = await fetchLatestIPAssets();
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('⚠️  Subgraph not available, skipping IP Assets fetch\n');
      } else {
        throw error;
      }
    }
    
    if (ipAssets.length === 0) {
      console.log('⚠️  No IP Assets found in subgraph (subgraph might be empty or not synced yet)');
    } else {
      console.log(`✅ Found ${ipAssets.length} IP Assets:\n`);
      ipAssets.forEach((asset, index) => {
        console.log(`${index + 1}. ${asset.name || 'Unnamed'}`);
        console.log(`   IP ID: ${asset.ipId}`);
        console.log(`   Creator: ${asset.creator}`);
        console.log(`   CVS Score: ${asset.cvsScore}`);
        console.log(`   Total Revenue: ${asset.totalLicenseRevenue}`);
        console.log(`   Total Remixes: ${asset.totalRemixes}`);
        console.log(`   Total Usage: ${asset.totalUsageCount}`);
        console.log(`   Timestamp: ${new Date(Number(asset.timestamp) * 1000).toISOString()}`);
        console.log('');
      });
    }

    console.log('\n');

    // Test 3: Fetch Latest License Sales
    console.log('📡 Step 3: Fetching Latest 5 License Sales...\n');
    let licenseSales: any[] = [];
    try {
      licenseSales = await fetchLatestLicenseSales();
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('⚠️  Subgraph not available, skipping License Sales fetch\n');
      } else {
        throw error;
      }
    }
    
    if (licenseSales.length === 0) {
      console.log('⚠️  No License Sales found in subgraph (subgraph might be empty or not synced yet)');
    } else {
      console.log(`✅ Found ${licenseSales.length} License Sales:\n`);
      licenseSales.forEach((sale, index) => {
        const salePriceEth = (Number(sale.salePrice) / 1e18).toFixed(4);
        const cvsIncrementEth = (Number(sale.cvsIncrement) / 1e18).toFixed(4);
        const creatorShareEth = (Number(sale.creatorShare) / 1e18).toFixed(4);
        const vaultShareEth = (Number(sale.vaultShare) / 1e18).toFixed(4);
        const protocolFeeEth = (Number(sale.protocolFee) / 1e18).toFixed(4);
        
        console.log(`${index + 1}. License Sale #${sale.id.slice(0, 20)}...`);
        console.log(`   IP Asset ID: ${sale.ipAsset.id || 'N/A'}`);
        console.log(`   Licensee: ${sale.licensee}`);
        console.log(`   License Type: ${sale.licenseType}`);
        console.log(`   Sale Price: ${salePriceEth} ETH (${sale.salePrice} wei)`);
        console.log(`   CVS Increment: ${cvsIncrementEth} ETH (${sale.cvsIncrement} wei)`);
        console.log(`   Creator Share: ${creatorShareEth} ETH (70%)`);
        console.log(`   Vault Share: ${vaultShareEth} ETH (25%)`);
        console.log(`   Protocol Fee: ${protocolFeeEth} ETH (5%)`);
        console.log(`   Vault ID: ${sale.vault.id || 'N/A'}`);
        console.log(`   Timestamp: ${new Date(Number(sale.timestamp) * 1000).toISOString()}`);
        console.log('');
      });
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('✅ Goldsky Client Test Complete!');
    console.log('═══════════════════════════════════════════\n');

  } catch (error: any) {
    console.error('\n❌ Test Failed:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2));
    }
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);

