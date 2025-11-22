/**
 * Goldsky Client - Fetch data from Atlas Protocol Subgraph
 * 
 * This client queries the Goldsky subgraph to get:
 * - Latest IP Assets
 * - Latest License Sales (minted licenses)
 * - CVS-related data
 */

import { graphqlClient, queries, getSubgraphEndpoint } from '@atlas-protocol/graphql-client';
import { gql } from 'graphql-request';

// Types for IP Assets
export interface IPAsset {
  id: string;
  ipId: string;
  name: string;
  creator: string;
  cvsScore: string;
  totalLicenseRevenue: string;
  totalUsageCount: string;
  totalRemixes: string;
  timestamp: string;
}

// Types for License Sales
export interface LicenseSale {
  id: string;
  licensee: string;
  salePrice: string;
  licenseType: string;
  cvsIncrement: string;
  creatorShare: string;
  vaultShare: string;
  protocolFee: string;
  timestamp: string;
  ipAsset: {
    id: string;
    name: string;
    creator: string;
  };
  vault: {
    id: string;
    currentCVS: string;
  };
}

/**
 * Fetch the latest 5 IP Assets from Goldsky subgraph
 * Note: Uses lowercase 'ipassets' as per GraphQL schema convention
 */
export async function fetchLatestIPAssets(): Promise<IPAsset[]> {
  const endpoint = getSubgraphEndpoint();
  console.log('🔍 Querying Goldsky endpoint:', endpoint);
  
  try {
    const query = gql`
      query GetLatestIPAssets {
        ipassets(
          first: 5
          orderBy: timestamp
          orderDirection: desc
        ) {
          id
          ipId
          name
          creator
          cvsScore
          totalLicenseRevenue
          totalUsageCount
          totalRemixes
          timestamp
        }
      }
    `;

    const response = await graphqlClient.request(query);
    
    console.log('✅ Goldsky Response:', JSON.stringify(response, null, 2));
    
    return response.ipassets || [];
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.error('⚠️  Subgraph not deployed yet. Returning empty array.');
      console.error('💡 Deploy subgraph first: cd subgraph && ./deploy-goldsky.sh');
      return [];
    }
    console.error('❌ Error fetching latest IP Assets from Goldsky:', error.message);
    // If IPAssets don't exist, try fetching from vaults instead
    if (error.message?.includes('ipassets')) {
      console.log('💡 IPAssets not available, fetching vaults instead...');
      return await fetchIPAssetsFromVaults();
    }
    throw error;
  }
}

/**
 * Fallback: Fetch IP Assets data from Vaults
 */
async function fetchIPAssetsFromVaults(): Promise<IPAsset[]> {
  try {
    const query = gql`
      query GetVaults {
        idovaults(
          first: 5
          orderBy: createdAt
          orderDirection: desc
        ) {
          id
          vaultAddress
          ipAsset
          currentCVS
          totalLicenseRevenue
          totalLoansIssued
          activeLoansCount
          createdAt
        }
      }
    `;

    const response = await graphqlClient.request(query);
    const vaults = response.idovaults || [];
    
    console.log('📊 Found vaults:', vaults.length);
    
    // Convert vaults to IPAsset format
    return vaults.map((vault: any) => ({
      id: vault.ipAsset || vault.id,
      ipId: vault.ipAsset || '',
      name: `Vault ${vault.vaultAddress?.slice(0, 10) || vault.id.slice(0, 10)}`,
      creator: '',
      cvsScore: vault.currentCVS || '0',
      totalLicenseRevenue: vault.totalLicenseRevenue || '0',
      totalUsageCount: vault.totalLoansIssued || '0',
      totalRemixes: vault.activeLoansCount || '0',
      timestamp: vault.createdAt || '0',
    }));
  } catch (error) {
    console.error('Error fetching from vaults:', error);
    return [];
  }
}

/**
 * Fetch the latest 5 License Sales (minted licenses) from Goldsky subgraph
 */
export async function fetchLatestLicenseSales(): Promise<LicenseSale[]> {
  const endpoint = getSubgraphEndpoint();
  console.log('🔍 Querying Goldsky endpoint for licenses:', endpoint);
  
  try {
    const query = gql`
      query GetLatestLicenseSales {
        dataLicenseSales(
          first: 5
          orderBy: timestamp
          orderDirection: desc
        ) {
          id
          licensee
          salePrice
          licenseType
          cvsIncrement
          creatorShare
          vaultShare
          protocolFee
          timestamp
          ipAsset
          vault
        }
      }
    `;

    const response = await graphqlClient.request(query);
    
    console.log('✅ Goldsky License Sales Response:', JSON.stringify(response, null, 2));
    
    // Transform response to match interface
    const sales = response.dataLicenseSales || [];
    return sales.map((sale: any) => {
      // ipAsset and vault are strings (IDs), not objects
      const ipAssetId = typeof sale.ipAsset === 'string' ? sale.ipAsset : sale.ipAsset?.id || '';
      const vaultId = typeof sale.vault === 'string' ? sale.vault : sale.vault?.id || '';
      
      return {
        ...sale,
        ipAsset: {
          id: ipAssetId || sale.ipAsset || '',
          name: ipAssetId ? `IP ${ipAssetId.slice(0, 10)}...` : 'Unknown IP',
          creator: '',
        },
        vault: {
          id: vaultId || sale.vault || '',
          currentCVS: '0',
        },
      };
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.error('⚠️  Subgraph not deployed yet. Returning empty array.');
      console.error('💡 Deploy subgraph first: cd subgraph && ./deploy-goldsky.sh');
      return [];
    }
    console.error('❌ Error fetching latest License Sales from Goldsky:', error.message);
    throw error;
  }
}

/**
 * Test function to verify Goldsky connection
 */
export async function testGoldskyConnection(): Promise<void> {
  const endpoint = getSubgraphEndpoint();
  console.log('\n🧪 Testing Goldsky Connection...');
  console.log('📍 Endpoint:', endpoint);
  console.log('💡 To set custom endpoint, set SUBGRAPH_URL environment variable\n');
  
  try {
    // Simple meta query to test connection
    const metaQuery = gql`
      query {
        _meta {
          block {
            number
            hash
          }
        }
      }
    `;
    
    const response = await graphqlClient.request(metaQuery);
    console.log('✅ Connection successful!');
    console.log('📊 Current block:', response._meta.block.number);
    console.log('🔗 Block hash:', response._meta.block.hash);
    
    return;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.error('❌ Subgraph not found (404)');
      console.error('\n📝 This means the subgraph hasn\'t been deployed to Goldsky yet.');
      console.error('\n🔧 To fix this:');
      console.error('   1. Deploy subgraph: cd subgraph && ./deploy-goldsky.sh');
      console.error('   2. Get endpoint from Goldsky dashboard');
      console.error('   3. Set SUBGRAPH_URL in apps/agent-service/.env');
      console.error('\n💡 For now, you can:');
      console.error('   - Use local indexer API (if running): http://localhost:3002');
      console.error('   - Or set SUBGRAPH_URL to your deployed endpoint');
    } else {
      console.error('❌ Connection failed:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
      }
    }
    throw error;
  }
}

