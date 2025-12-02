/**
 * Query vaults directly from ADLV contract to see what exists on-chain
 */
import { createPublicClient, http, parseAbiItem } from 'viem';
import ADLV_ABI from './contracts/ADLV.json';

const publicClient = createPublicClient({
  chain: {
    id: 1315,
    name: 'Story Testnet',
    nativeCurrency: { name: 'STORY', symbol: 'STORY', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc-storyevm-testnet.aldebaranode.xyz'] } }
  },
  transport: http('https://rpc-storyevm-testnet.aldebaranode.xyz')
});

const ADLV_ADDRESS = '0xFe9E0Dd8893F71303ACF8164462d323905199669';

console.log('🔍 Querying VaultCreated events from ADLV contract...\n');
console.log(`📋 Contract: ${ADLV_ADDRESS}\n`);

try {
  // Query VaultCreated events
  const logs = await publicClient.getLogs({
    address: ADLV_ADDRESS as `0x${string}`,
    event: parseAbiItem('event VaultCreated(bytes32 indexed ipId, address indexed vaultAddress, address indexed creator)'),
    fromBlock: 'earliest',
    toBlock: 'latest',
  });

  console.log(`✅ Found ${logs.length} VaultCreated event(s)\n`);

  if (logs.length > 0) {
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      console.log(`Vault ${i + 1}:`);
      console.log(`  Block: ${log.blockNumber}`);
      console.log(`  Vault Address: ${log.args.vaultAddress}`);
      console.log(`  Creator: ${log.args.creator}`);
      console.log(`  IP ID: ${log.args.ipId}`);
      console.log(`  Tx Hash: ${log.transactionHash}`);

      // Try to get vault details
      try {
        const vaultData = await publicClient.readContract({
          address: ADLV_ADDRESS as `0x${string}`,
          abi: ADLV_ABI.abi,
          functionName: 'vaults',
          args: [log.args.vaultAddress],
        }) as any;

        console.log(`  Vault Details:`);
        console.log(`    Total Liquidity: ${vaultData.totalLiquidity}`);
        console.log(`    Created At: ${new Date(Number(vaultData.createdAt) * 1000).toISOString()}`);
        console.log(`    Exists: ${vaultData.exists}`);
      } catch (error) {
        console.log(`  (Could not fetch vault details)`);
      }
      console.log('');
    }
  } else {
    console.log('ℹ️  No vaults found on-chain.');
    console.log('   This means no VaultCreated events have been emitted yet.');
  }

} catch (error: any) {
  console.error('❌ Error querying events:', error.message);
  process.exit(1);
}
