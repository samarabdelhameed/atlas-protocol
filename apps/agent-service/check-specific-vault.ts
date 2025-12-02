/**
 * Check vault for specific IP Asset
 */
import { createPublicClient, http, padHex } from 'viem';
import ADLV_ABI from './contracts/ADLV.json';

const client = createPublicClient({
  chain: {
    id: 1315,
    name: 'Story Testnet',
    nativeCurrency: { name: 'STORY', symbol: 'STORY', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc-storyevm-testnet.aldebaranode.xyz'] } }
  },
  transport: http('https://rpc-storyevm-testnet.aldebaranode.xyz')
});

const ipAssetId = '0xcCed9e1C5331Ac8c9B98B8DeDBdbF9cfD03aD60C';
const adlvAddress = '0xFe9E0Dd8893F71303ACF8164462d323905199669';

// Pad the IP Asset address to bytes32
const ipIdBytes32 = padHex(ipAssetId as `0x${string}`, { size: 32 });

console.log('🔍 Checking vault for IP Asset...\n');
console.log(`📋 IP Asset ID: ${ipAssetId}`);
console.log(`🔢 Padded bytes32: ${ipIdBytes32}`);
console.log(`📍 ADLV Contract: ${adlvAddress}\n`);

try {
  // Check ipToVault mapping
  const vaultAddress = await client.readContract({
    address: adlvAddress as `0x${string}`,
    abi: ADLV_ABI.abi,
    functionName: 'ipToVault',
    args: [ipIdBytes32]
  }) as `0x${string}`;

  console.log('═══════════════════════════════════════════');
  console.log(`🏦 Vault Address: ${vaultAddress}`);
  console.log('═══════════════════════════════════════════\n');

  if (vaultAddress === '0x0000000000000000000000000000000000000000') {
    console.log('❌ No vault exists for this IP Asset\n');
  } else {
    console.log('✅ Vault EXISTS!\n');

    // Get vault details
    const vaultData = await client.readContract({
      address: adlvAddress as `0x${string}`,
      abi: ADLV_ABI.abi,
      functionName: 'vaults',
      args: [vaultAddress]
    }) as any;

    console.log('📊 Vault Details:');
    console.log(`   Vault Address: ${vaultData.vaultAddress || vaultAddress}`);
    console.log(`   Creator: ${vaultData.creator}`);
    console.log(`   Total Liquidity: ${vaultData.totalLiquidity}`);
    console.log(`   Available Liquidity: ${vaultData.availableLiquidity}`);
    console.log(`   Total Loans: ${vaultData.totalLoansIssued}`);
    console.log(`   Active Loans: ${vaultData.activeLoansCount}`);
    console.log(`   Created At: ${new Date(Number(vaultData.createdAt) * 1000).toISOString()}`);
    console.log(`   Exists: ${vaultData.exists}\n`);

    // Now check if it's in the Goldsky subgraph
    console.log('🔍 Checking Goldsky subgraph...');
    const { fetchVaultsByCreator } = await import('./src/clients/goldskyClient.js');
    const vaults = await fetchVaultsByCreator(vaultData.creator);

    console.log(`\n📊 Goldsky found ${vaults.length} vault(s) for creator ${vaultData.creator}`);
    if (vaults.length > 0) {
      const found = vaults.find(v => v.vaultAddress.toLowerCase() === vaultAddress.toLowerCase());
      if (found) {
        console.log('✅ Vault IS indexed in Goldsky subgraph!');
      } else {
        console.log('⚠️  Vault NOT found in Goldsky (subgraph might be syncing)');
      }
    } else {
      console.log('⚠️  No vaults for this creator in Goldsky (subgraph might be syncing)');
    }
  }
} catch (error: any) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
