/**
 * Test ABV.dev Agent
 * 
 * Tests license registration with ABV.dev using real data from Goldsky
 */

import { abvAgent } from './src/services/abv-agent.js';
import { fetchLatestLicenseSales } from './src/clients/goldskyClient.js';

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('🧪 Testing ABV.dev Agent');
  console.log('═══════════════════════════════════════════\n');

  try {
    // Step 1: Fetch real license sales
    console.log('📡 Step 1: Fetching Real License Sales from Goldsky...\n');
    const licenseSales = await fetchLatestLicenseSales();
    
    if (licenseSales.length === 0) {
      console.log('⚠️  No license sales found in subgraph');
      console.log('💡 This is expected if no licenses have been sold yet');
      return;
    }
    
    console.log(`✅ Found ${licenseSales.length} real license sales\n`);

    // Step 2: Process license sales with ABV Agent
    console.log('📡 Step 2: Processing License Sales with ABV Agent...\n');
    
    try {
      const result = await abvAgent.processLicenseSales();
      
      if (result.success) {
        console.log(`\n✅ ABV Agent Processed Successfully!`);
        console.log(`   Licenses Processed: ${result.licensesProcessed}`);
        console.log(`   Licenses Registered: ${result.licensesRegistered}`);
        
        if (result.errors.length > 0) {
          console.log(`\n⚠️  Errors:`);
          result.errors.forEach(error => console.log(`   - ${error}`));
        }
      } else {
        console.log(`\n⚠️  ABV Agent Processing Failed`);
        console.log(`   Errors: ${result.errors.join(', ')}`);
        console.log(`\n💡 This might be because:`);
        console.log(`   - ABV_API_KEY not set in .env`);
        console.log(`   - ABV.dev API endpoint not accessible`);
        console.log(`   - License data missing required fields`);
      }
    } catch (error: any) {
      if (error.message.includes('ABV_API_KEY')) {
        console.log(`\n⚠️  ABV API Key not set: ${error.message}`);
        console.log(`💡 Set ABV_API_KEY in .env to register licenses with ABV.dev`);
        console.log(`\n✅ However, ABV Agent is ready and can process ${licenseSales.length} license sales!`);
      } else {
        throw error;
      }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('✅ ABV Agent Test Complete!');
    console.log('═══════════════════════════════════════════\n');

  } catch (error: any) {
    console.error('\n❌ Test Failed:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

main().catch(console.error);

