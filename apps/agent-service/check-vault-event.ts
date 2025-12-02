/**
 * Query VaultCreated event for specific vault
 */
import { createPublicClient, http, parseAbiItem, padHex } from 'viem';

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
const ipIdBytes32 = padHex(ipAssetId as `0x${string}`, { size: 32 });
const adlvAddress = '0xFe9E0Dd8893F71303ACF8164462d323905199669';

console.log('🔍 Querying VaultCreated event...\n');
console.log(`📋 IP Asset: ${ipAssetId}`);
console.log(`📋 IP ID (bytes32): ${ipIdBytes32}\n`);

try {
  const logs = await client.getLogs({
    address: adlvAddress as `0x${string}`,
    event: parseAbiItem('event VaultCreated(bytes32 indexed ipId, address indexed vaultAddress, address indexed creator)'),
    args: {
      ipId: ipIdBytes32
    },
    fromBlock: 'earliest',
    toBlock: 'latest',
  });

  if (logs.length === 0) {
    console.log('❌ No VaultCreated event found for this IP Asset');
    console.log('   This suggests the vault might not have been created properly.');
  } else {
    console.log(`✅ Found ${logs.length} VaultCreated event(s)\n`);

    for (const log of logs) {
      console.log('═══════════════════════════════════════════');
      console.log('📊 Vault Creation Event:');
      console.log(`   Block: ${log.blockNumber}`);
      console.log(`   Vault Address: ${log.args.vaultAddress}`);
      console.log(`   Creator: ${log.args.creator}`);
      console.log(`   IP ID: ${log.args.ipId}`);
      console.log(`   Tx Hash: ${log.transactionHash}`);
      console.log('═══════════════════════════════════════════\n');

      // Check if this vault is in Goldsky
      console.log('🔍 Checking Goldsky subgraph for this creator...');
      const { fetchVaultsByCreator } = await import('./src/clients/goldskyClient.js');
      const vaults = await fetchVaultsByCreator(log.args.creator as string);

      console.log(`\n📊 Goldsky Results:`);
      console.log(`   Total vaults for creator: ${vaults.length}`);

      if (vaults.length > 0) {
        const found = vaults.find(v =>
          v.vaultAddress.toLowerCase() === (log.args.vaultAddress as string).toLowerCase()
        );

        if (found) {
          console.log('   ✅ This vault IS indexed in Goldsky!');
          console.log(`   Vault Address: ${found.vaultAddress}`);
          console.log(`   CVS: ${found.currentCVS}`);
          console.log(`   Liquidity: ${found.totalLiquidity}`);
        } else {
          console.log('   ⚠️  This specific vault NOT found in Goldsky');
          console.log('   Other vaults found:');
          vaults.forEach(v => console.log(`      - ${v.vaultAddress}`));
        }
      } else {
        console.log('   ⚠️  No vaults found for this creator in Goldsky');
        console.log('   Possible reasons:');
        console.log('      - Subgraph is still syncing');
        console.log('      - Subgraph needs redeployment');
      }
    }
  }
} catch (error: any) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
