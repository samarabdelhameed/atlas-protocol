/**
 * Test script to verify vault querying by creator address
 */
import { fetchVaultsByCreator } from './src/clients/goldskyClient.js';

// Test with a known vault creator address
// This is the backend signer address from previous testing
const testCreatorAddress = '0x7D4e2d9D7cf03199D5E41bAB5E9930a8d9A44FD7';

console.log('🧪 Testing vault query by creator address...');
console.log(`👤 Creator: ${testCreatorAddress}\n`);

try {
  const vaults = await fetchVaultsByCreator(testCreatorAddress);

  console.log(`\n✅ Query successful!`);
  console.log(`📊 Found ${vaults.length} vault(s)\n`);

  if (vaults.length > 0) {
    vaults.forEach((vault, index) => {
      console.log(`Vault ${index + 1}:`);
      console.log(`  Address: ${vault.vaultAddress}`);
      console.log(`  IP Asset: ${vault.ipAsset}`);
      console.log(`  CVS: ${vault.currentCVS}`);
      console.log(`  Liquidity: ${vault.totalLiquidity}`);
      console.log(`  Created: ${new Date(parseInt(vault.createdAt) * 1000).toISOString()}`);
      console.log('');
    });
  } else {
    console.log('ℹ️  No vaults found for this creator.');
    console.log('   This is expected if:');
    console.log('   - The creator has not created any vaults yet');
    console.log('   - The subgraph has not indexed recent vaults');
  }

  process.exit(0);
} catch (error: any) {
  console.error('\n❌ Test failed:', error.message);
  if (error.response?.status === 404) {
    console.error('\n💡 Subgraph not deployed. Deploy with:');
    console.error('   cd subgraph && ./deploy-goldsky.sh');
  }
  process.exit(1);
}
