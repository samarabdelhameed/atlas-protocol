/**
 * Check CVS On-Chain vs Subgraph
 *
 * This script checks if CVS values match between:
 * 1. On-chain IDO contract
 * 2. Goldsky subgraph
 *
 * Run: bun run check-cvs-onchain.ts <ipAssetAddress>
 */

import { createPublicClient, http, formatUnits } from 'viem';
import { fetchAllVaultsWithIPData } from './src/clients/goldskyClient.js';
import IDO_ABI from './contracts/IDO.json' assert { type: 'json' };

// Story Aeneid Testnet config
const storyAeneid = {
  id: 1315,
  name: 'Story Aeneid Testnet',
  network: 'story-aeneid',
  nativeCurrency: { name: 'IP', symbol: 'IP', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.ankr.com/story_testnet'] },
    public: { http: ['https://rpc.ankr.com/story_testnet'] },
  },
};

const IDO_ADDRESS = '0x4a875fD309C95DBFBcA6dFC3575517Ea7d5F6eC7' as `0x${string}`;
const RPC_URL = process.env.RPC_URL || 'https://rpc.ankr.com/story_testnet';

async function checkCVS() {
  const publicClient = createPublicClient({
    chain: storyAeneid,
    transport: http(RPC_URL),
  });

  console.log('\n🔍 Checking CVS values...\n');

  // Get IP asset from command line or use all from subgraph
  const targetIP = process.argv[2];

  if (targetIP) {
    console.log(`📍 Checking specific IP: ${targetIP}\n`);
    await checkSingleIP(publicClient, targetIP as `0x${string}`);
  } else {
    console.log('📍 Checking all IPs from subgraph\n');
    await checkAllIPs(publicClient);
  }
}

async function checkSingleIP(publicClient: any, ipId: `0x${string}`) {
  try {
    // Get CVS from IDO contract
    const onChainCVS = await publicClient.readContract({
      address: IDO_ADDRESS,
      abi: IDO_ABI.abi,
      functionName: 'getCVS',
      args: [ipId],
    }) as bigint;

    console.log(`IP Asset: ${ipId}`);
    console.log(`┌─ On-Chain (IDO Contract)`);
    console.log(`│  CVS: ${onChainCVS.toString()} Wei`);
    console.log(`│  CVS: ${formatUnits(onChainCVS, 18)} STORY`);
    console.log(`└─────────────────────────\n`);

    // Try to get from subgraph
    const vaults = await fetchAllVaultsWithIPData();
    const matchingVault = vaults.find(v =>
      (v.ipAsset?.toLowerCase() === ipId.toLowerCase()) ||
      (v.ipId?.toLowerCase() === ipId.toLowerCase())
    );

    if (matchingVault) {
      console.log(`Found in Subgraph:`);
      console.log(`┌─ Goldsky Subgraph`);
      console.log(`│  Vault: ${matchingVault.vaultAddress}`);
      console.log(`│  currentCVS: ${matchingVault.currentCVS} Wei`);
      console.log(`│  currentCVS: ${Number(matchingVault.currentCVS) / 1e18} STORY`);
      console.log(`└─────────────────────────\n`);

      // Compare
      const subgraphCVS = BigInt(matchingVault.currentCVS || '0');
      if (onChainCVS !== subgraphCVS) {
        console.log(`⚠️  MISMATCH DETECTED!`);
        console.log(`   On-Chain: ${formatUnits(onChainCVS, 18)} STORY`);
        console.log(`   Subgraph: ${formatUnits(subgraphCVS, 18)} STORY`);
        console.log(`   Difference: ${formatUnits(subgraphCVS - onChainCVS, 18)} STORY\n`);
      } else {
        console.log(`✅ Values match!\n`);
      }
    } else {
      console.log(`⚠️  Not found in subgraph\n`);
    }
  } catch (error) {
    console.error(`❌ Error:`, error);
  }
}

async function checkAllIPs(publicClient: any) {
  try {
    const vaults = await fetchAllVaultsWithIPData();
    console.log(`Found ${vaults.length} vaults in subgraph\n`);

    for (const vault of vaults) {
      const ipId = (vault.ipAsset || vault.ipId) as `0x${string}`;
      if (!ipId) continue;

      try {
        const onChainCVS = await publicClient.readContract({
          address: IDO_ADDRESS,
          abi: IDO_ABI.abi,
          functionName: 'getCVS',
          args: [ipId],
        }) as bigint;

        const subgraphCVS = BigInt(vault.currentCVS || '0');
        const matches = onChainCVS === subgraphCVS;

        console.log(`${matches ? '✅' : '⚠️ '} IP: ${ipId.slice(0, 10)}...${ipId.slice(-8)}`);
        console.log(`   Vault: ${vault.vaultAddress?.slice(0, 10)}...${vault.vaultAddress?.slice(-8)}`);
        console.log(`   On-Chain: ${formatUnits(onChainCVS, 18)} STORY`);
        console.log(`   Subgraph: ${formatUnits(subgraphCVS, 18)} STORY`);

        if (!matches) {
          console.log(`   ⚠️  Difference: ${formatUnits(subgraphCVS - onChainCVS, 18)} STORY`);
        }
        console.log();

      } catch (error: any) {
        console.error(`   ❌ Error reading CVS: ${error.message}\n`);
      }
    }
  } catch (error) {
    console.error(`❌ Error fetching vaults:`, error);
  }
}

checkCVS().catch(console.error);
