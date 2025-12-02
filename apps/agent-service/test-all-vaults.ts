/**
 * Test script to query all vaults from Goldsky
 */
import { graphqlClient, getSubgraphEndpoint } from '@atlas-protocol/graphql-client';
import { gql } from 'graphql-request';

console.log('🧪 Testing Goldsky - Query all vaults...\n');

const endpoint = getSubgraphEndpoint();
console.log(`📍 Endpoint: ${endpoint}\n`);

try {
  const query = gql`
    query GetAllVaults {
      idovaults(
        first: 10
        orderBy: createdAt
        orderDirection: desc
      ) {
        id
        vaultAddress
        ipAsset
        creator
        currentCVS
        totalLiquidity
        createdAt
      }
    }
  `;

  const response = await graphqlClient.request(query);
  const vaults = response.idovaults || [];

  console.log(`✅ Query successful!`);
  console.log(`📊 Found ${vaults.length} total vault(s) in subgraph\n`);

  if (vaults.length > 0) {
    vaults.forEach((vault: any, index: number) => {
      console.log(`Vault ${index + 1}:`);
      console.log(`  Address: ${vault.vaultAddress}`);
      console.log(`  Creator: ${vault.creator}`);
      console.log(`  IP Asset: ${vault.ipAsset}`);
      console.log(`  CVS: ${vault.currentCVS}`);
      console.log(`  Created: ${new Date(parseInt(vault.createdAt) * 1000).toISOString()}`);
      console.log('');
    });
  } else {
    console.log('ℹ️  No vaults found in subgraph.');
    console.log('   This could mean:');
    console.log('   - No vaults have been created yet');
    console.log('   - The subgraph needs to be redeployed');
    console.log('   - The subgraph is not syncing events');
  }

  process.exit(0);
} catch (error: any) {
  console.error('❌ Query failed:', error.message);
  if (error.response) {
    console.error('Response status:', error.response.status);
  }
  process.exit(1);
}
