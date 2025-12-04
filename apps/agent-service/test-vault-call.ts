import { createPublicClient, createWalletClient, http, padHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import ADLV_ABI from './contracts/ADLV.json';

const privateKey = process.env.WALLET_PRIVATE_KEY as `0x${string}`;
const account = privateKeyToAccount(privateKey);

const publicClient = createPublicClient({
  chain: {
    id: 1315,
    name: 'Story Testnet',
    nativeCurrency: { name: 'IP', symbol: 'IP', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc-storyevm-testnet.aldebaranode.xyz'] } }
  },
  transport: http('https://rpc-storyevm-testnet.aldebaranode.xyz')
});

const walletClient = createWalletClient({
  account,
  chain: {
    id: 1315,
    name: 'Story Testnet',
    nativeCurrency: { name: 'IP', symbol: 'IP', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc-storyevm-testnet.aldebaranode.xyz'] } }
  },
  transport: http('https://rpc-storyevm-testnet.aldebaranode.xyz')
});

const ipAssetId = '0xcCed9e1C5331Ac8c9B98B8DeDBdbF9cfD03aD60C';
const adlvAddress = '0xFe9E0Dd8893F71303ACF8164462d323905199669';
const ipIdBytes32 = padHex(ipAssetId as `0x${string}`, { size: 32 });

console.log('🧪 Testing vault creation with detailed error...');
console.log(`📋 IP Asset ID: ${ipAssetId}`);
console.log(`🔢 Padded bytes32: ${ipIdBytes32}`);
console.log(`🔑 Account: ${account.address}\n`);

try {
  // Try to simulate the call first
  await publicClient.simulateContract({
    address: adlvAddress as `0x${string}`,
    abi: ADLV_ABI.abi,
    functionName: 'createVault',
    args: [ipIdBytes32, ipAssetId],
    account: account.address,
  });

  console.log('✅ Simulation successful - transaction should work!');
} catch (error: any) {
  console.error('❌ Simulation failed:');
  console.error('Error:', error.message);
  if (error.cause) {
    console.error('Cause:', error.cause);
  }
  if (error.data) {
    console.error('Data:', error.data);
  }
}
