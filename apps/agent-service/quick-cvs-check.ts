/**
 * Quick CVS Check - Simple diagnostic
 */

import { createPublicClient, http, formatUnits, parseAbi } from 'viem';

const RPC_URL = process.env.RPC_URL || 'https://rpc.ankr.com/story_testnet';
const IDO_ADDRESS = '0x4a875fD309C95DBFBcA6dFC3575517Ea7d5F6eC7' as `0x${string}`;

const IDO_ABI = parseAbi([
  'function getCVS(address ipId) external view returns (uint256)',
]);

const storyAeneid = {
  id: 1315,
  name: 'Story Aeneid Testnet',
  nativeCurrency: { name: 'IP', symbol: 'IP', decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
};

async function quickCheck() {
  const publicClient = createPublicClient({
    chain: storyAeneid,
    transport: http(RPC_URL),
  });

  console.log('\n🔍 Quick CVS Check\n');
  console.log(`IDO Contract: ${IDO_ADDRESS}`);
  console.log(`RPC: ${RPC_URL}\n`);

  // Test IP - replace with your actual IP address
  const testIPs = process.argv.slice(2);

  if (testIPs.length === 0) {
    console.log('Usage: bun run quick-cvs-check.ts <ipAddress1> [ipAddress2] ...');
    console.log('Example: bun run quick-cvs-check.ts 0x1234...\n');
    return;
  }

  for (const ipId of testIPs) {
    try {
      console.log(`Checking IP: ${ipId}`);

      const cvs = await publicClient.readContract({
        address: IDO_ADDRESS,
        abi: IDO_ABI,
        functionName: 'getCVS',
        args: [ipId as `0x${string}`],
      }) as bigint;

      console.log(`✅ CVS (Wei): ${cvs.toString()}`);
      console.log(`✅ CVS (STORY): ${formatUnits(cvs, 18)}\n`);

    } catch (error: any) {
      console.error(`❌ Error: ${error.message}\n`);
    }
  }
}

quickCheck().catch(console.error);
