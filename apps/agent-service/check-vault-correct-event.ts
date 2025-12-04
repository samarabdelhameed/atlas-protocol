/**
 * Query VaultCreated event with CORRECT signature
 */
import { createPublicClient, http, parseAbiItem, padHex } from 'viem';

const client = createPublicClient({
  chain: {
    id: 1315,
    name: 'Story Testnet',
    nativeCurrency: { name: 'IP', symbol: 'IP', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc-storyevm-testnet.aldebaranode.xyz'] } }
  },
  transport: http('https://rpc-storyevm-testnet.aldebaranode.xyz')
});

const ipAssetId = '0xcCed9e1C5331Ac8c9B98B8DeDBdbF9cfD03aD60C';
const ipIdBytes32 = padHex(ipAssetId as `0x${string}`, { size: 32 });
const adlvAddress = '0xFe9E0Dd8893F71303ACF8164462d323905199669';

console.log('🔍 Querying VaultCreated events (CORRECT signature)...\n');
console.log(`📋 IP Asset: ${ipAssetId}`);
console.log(`📋 IP ID (bytes32): ${ipIdBytes32}\n`);

try {
  // Query with correct event signature: vaultAddress, ipId, creator, initialCVS
  const logs = await client.getLogs({
    address: adlvAddress as `0x${string}`,
    event: parseAbiItem('event VaultCreated(address indexed vaultAddress, bytes32 indexed ipId, address indexed creator, uint256 initialCVS)'),
    args: {
      ipId: ipIdBytes32
    },
    fromBlock: 'earliest',
    toBlock: 'latest',
  });

  if (logs.length === 0) {
    console.log('❌ Still no VaultCreated event found');

    // Try querying all events without filter
    console.log('\n🔍 Querying ALL VaultCreated events...');
    const allLogs = await client.getLogs({
      address: adlvAddress as `0x${string}`,
      event: parseAbiItem('event VaultCreated(address indexed vaultAddress, bytes32 indexed ipId, address indexed creator, uint256 initialCVS)'),
      fromBlock: 'earliest',
      toBlock: 'latest',
    });

    console.log(`   Found ${allLogs.length} total VaultCreated event(s)\n`);

    if (allLogs.length > 0) {
      console.log('Other vaults created:');
      allLogs.forEach((log, i) => {
        console.log(`\nVault ${i + 1}:`);
        console.log(`   Vault: ${log.args.vaultAddress}`);
        console.log(`   IP ID: ${log.args.ipId}`);
        console.log(`   Creator: ${log.args.creator}`);
        console.log(`   Block: ${log.blockNumber}`);
      });
    }
  } else {
    console.log(`✅ Found ${logs.length} VaultCreated event(s)!\n`);

    for (const log of logs) {
      console.log('═══════════════════════════════════════════');
      console.log('📊 Vault Creation Event:');
      console.log(`   Block: ${log.blockNumber}`);
      console.log(`   Vault Address: ${log.args.vaultAddress}`);
      console.log(`   Creator: ${log.args.creator}`);
      console.log(`   IP ID: ${log.args.ipId}`);
      console.log(`   Initial CVS: ${log.args.initialCVS}`);
      console.log(`   Tx Hash: ${log.transactionHash}`);
      console.log('═══════════════════════════════════════════\n');

      // Check Goldsky
      console.log('🔍 Checking Goldsky subgraph...');
      const { fetchVaultsByCreator } = await import('./src/clients/goldskyClient.js');
      const vaults = await fetchVaultsByCreator(log.args.creator as string);

      console.log(`\n📊 Goldsky Results:`);
      console.log(`   Total vaults for ${log.args.creator}: ${vaults.length}`);

      if (vaults.length > 0) {
        const found = vaults.find(v =>
          v.vaultAddress.toLowerCase() === (log.args.vaultAddress as string).toLowerCase()
        );

        if (found) {
          console.log('   ✅ Vault IS indexed in Goldsky!');
        } else {
          console.log('   ⚠️  Vault NOT in Goldsky yet (might be syncing)');
        }
      } else {
        console.log('   ⚠️  No vaults for this creator in Goldsky');
      }
    }
  }
} catch (error: any) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
