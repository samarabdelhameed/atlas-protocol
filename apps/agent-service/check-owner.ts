import { createPublicClient, http } from 'viem';

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

const ERC6551_ABI = [{
  "inputs": [],
  "name": "token",
  "outputs": [
    {"internalType": "uint256", "name": "chainId", "type": "uint256"},
    {"internalType": "address", "name": "tokenContract", "type": "address"},
    {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
  ],
  "stateMutability": "view",
  "type": "function"
}];

const ERC721_ABI = [{
  "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
  "name": "ownerOf",
  "outputs": [{"internalType": "address", "name": "", "type": "address"}],
  "stateMutability": "view",
  "type": "function"
}];

console.log('🔍 Checking IP Asset owner...');
console.log(`📋 IP Asset ID: ${ipAssetId}\n`);

try {
  const [chainId, tokenContract, tokenId] = await client.readContract({
    address: ipAssetId as `0x${string}`,
    abi: ERC6551_ABI,
    functionName: 'token',
  }) as [bigint, `0x${string}`, bigint];

  const owner = await client.readContract({
    address: tokenContract,
    abi: ERC721_ABI,
    functionName: 'ownerOf',
    args: [tokenId],
  }) as `0x${string}`;

  console.log('✅ IP Asset Details:');
  console.log(`   NFT Contract: ${tokenContract}`);
  console.log(`   Token ID: ${tokenId}`);
  console.log(`   Owner: ${owner}\n`);

  const signerAddress = '0x7D4e2d9D7cf03199D5E41bAB5E9930a8d9A44FD7';
  console.log(`🔑 Backend Signer: ${signerAddress}`);

  if (owner.toLowerCase() === signerAddress.toLowerCase()) {
    console.log('✅ Signer IS the owner - should work!');
  } else {
    console.log('⚠️  Signer is NOT the owner!');
    console.log('   The contract might require the owner to create the vault.');
  }
} catch (error) {
  console.error('❌ Error:', error);
}
