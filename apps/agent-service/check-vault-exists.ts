/**
 * Quick script to check if a vault exists for an IP Asset
 * Run: bun run check-vault-exists.ts
 */

import { createPublicClient, http, padHex } from 'viem';

const client = createPublicClient({
  chain: {
    id: 1315,
    name: 'Story Testnet',
    nativeCurrency: { name: 'IP', symbol: 'IP', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc-storyevm-testnet.aldebaranode.xyz'] } }
  },
  transport: http('https://rpc-storyevm-testnet.aldebaranode.xyz')
});

// Minimal ABI for ipToVault function
const ADLV_ABI = [{
  type: 'function',
  name: 'ipToVault',
  inputs: [{name: 'ipId', type: 'bytes32'}],
  outputs: [{name: '', type: 'address'}],
  stateMutability: 'view'
}];

const ipAssetId = '0x606a0a695b9818c022691582149d4c2dA1DFe0F7';
const adlvAddress = '0xFe9E0Dd8893F71303ACF8164462d323905199669';

// Pad the IP Asset address to bytes32
const ipIdBytes32 = padHex(ipAssetId as `0x${string}`, { size: 32 });

console.log('🔍 Checking vault existence...\n');
console.log(`📋 IP Asset ID: ${ipAssetId}`);
console.log(`🔢 Padded bytes32: ${ipIdBytes32}`);
console.log(`📍 ADLV Contract: ${adlvAddress}\n`);

try {
  const vaultAddress = await client.readContract({
    address: adlvAddress as `0x${string}`,
    abi: ADLV_ABI,
    functionName: 'ipToVault',
    args: [ipIdBytes32]
  });

  console.log('═══════════════════════════════════════════');
  console.log(`🏦 Vault Address: ${vaultAddress}`);
  console.log('═══════════════════════════════════════════\n');

  if (vaultAddress === '0x0000000000000000000000000000000000000000') {
    console.log('✅ No vault exists for this IP Asset - safe to create one!\n');
  } else {
    console.log('⚠️  A vault already exists for this IP Asset!');
    console.log(`🔗 View vault: https://aeneid.storyscan.io/address/${vaultAddress}\n`);
    console.log('💡 This explains why createVault is reverting!\n');
  }
} catch (error) {
  console.error('❌ Error checking vault:', error);
  process.exit(1);
}
