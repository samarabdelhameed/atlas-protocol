/**
 * Test Script for CVS Update Flow
 * 
 * Tests the complete flow:
 * 1. Fetch Yakoa originality score
 * 2. Fetch license sales from Goldsky
 * 3. Calculate CVS
 * 4. Update CVS on-chain
 * 
 * Run: bun run test-cvs-update.ts <ipAssetId>
 */

import { cvsCalculator } from './src/services/cvs-calculator.js';
import { cvsUpdater } from './src/services/cvs-updater.js';
import { fetchOriginalityScore } from './src/clients/yakoaClient.js';

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('🧪 Testing CVS Update Flow');
  console.log('═══════════════════════════════════════════\n');

  // Get IP Asset ID from command line or use default
  const ipAssetId = process.argv[2] || '0x0000000000000000000000000000000000000000000000000000000000000001';
  
  console.log(`📋 IP Asset ID: ${ipAssetId}\n`);

  try {
    // Step 1: Test Yakoa Score
    console.log('📡 Step 1: Fetching Yakoa Originality Score...\n');
    const yakoaScore = await fetchOriginalityScore(ipAssetId);
    console.log(`✅ Yakoa Score for ${ipAssetId.slice(0, 20)}...: ${yakoaScore.score}/100`);
    console.log(`   Confidence: ${yakoaScore.confidence}%`);
    console.log(`   Verified: ${yakoaScore.verified ? 'Yes' : 'No'}\n`);

    // Step 2: Calculate CVS
    console.log('📡 Step 2: Calculating CVS...\n');
    const calculation = await cvsCalculator.calculateCVS(ipAssetId);
    
    console.log(`\n✅ CVS Calculated: ${calculation.calculatedCVS.toString()}`);
    console.log(`\n📊 Breakdown:`);
    console.log(`   Base: ${calculation.breakdown.baseCVS.toString()}`);
    console.log(`   Revenue: ${calculation.breakdown.revenueComponent.toString()}`);
    console.log(`   Originality: ${calculation.breakdown.originalityComponent.toString()}`);
    console.log(`   License Sales: ${calculation.breakdown.licenseSalesComponent.toString()}\n`);

    // Step 3: Update CVS on-chain
    console.log('📡 Step 3: Updating CVS on-chain...\n');
    const updateResult = await cvsUpdater.updateCVSOnChain(ipAssetId);
    
    if (updateResult.success) {
      console.log(`\n✅ CVS Updated on-chain successfully!`);
      console.log(`   Transaction Hash: ${updateResult.transactionHash}`);
      console.log(`   Old CVS: ${updateResult.oldCVS.toString()}`);
      console.log(`   New CVS: ${updateResult.newCVS.toString()}`);
    } else {
      console.error(`\n❌ Failed to update CVS on-chain: ${updateResult.error}`);
      console.log(`\n💡 Note: This might be because:`);
      console.log(`   - PRIVATE_KEY not set in .env`);
      console.log(`   - IDO_ADDRESS or ADLV_ADDRESS not set`);
      console.log(`   - Insufficient funds for gas`);
      console.log(`   - Contract not deployed or not accessible`);
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('✅ CVS Update Flow Test Complete!');
    console.log('═══════════════════════════════════════════\n');

  } catch (error: any) {
    console.error('\n❌ Test Failed:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);

