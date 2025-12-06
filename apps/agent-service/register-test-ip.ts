/**
 * Quick script to register a test IP asset for vault creation testing
 * Run: bun run register-test-ip.ts
 */

import { StoryClient, type StoryConfig } from '@story-protocol/core-sdk';
import { http, createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Yakoa registration types
interface YakoaRegisterRequest {
  id: string;
  registration_tx: {
    chain: string;
    block_number: number;
    hash: string;
  };
  creator_id: string;
  metadata: {
    name?: string;
    description?: string;
    image?: string;
  };
  media: Array<{
    media_id: string;
    url: string;
  }>;
}

async function registerWithYakoa(request: YakoaRegisterRequest): Promise<void> {
  const apiKey = process.env.YAKOA_API_KEY;
  const subdomain = process.env.YAKOA_SUBDOMAIN || 'docs-demo';
  const network = process.env.YAKOA_NETWORK || 'docs-demo';

  if (!apiKey) {
    console.warn('⚠️ YAKOA_API_KEY not set. Skipping Yakoa registration.');
    return;
  }

  const baseUrl = `https://${subdomain}.ip-api-sandbox.yakoa.io`;
  const endpoint = `${baseUrl}/${network}/token`;

  console.log(`\n📝 Registering with Yakoa: ${request.id}`);
  console.log(`📡 Yakoa API Endpoint: ${endpoint}`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Yakoa registration failed: ${response.status} - ${errorText}`);
    return;
  }

  const data = await response.json() as { id: string };
  console.log('✅ Token registered with Yakoa!');
  console.log(`   ID: ${data.id}`);
}

// Normalize token ID to 40-char hex (remove padding)
function normalizeTokenId(tokenId: string): string {
  const hex = tokenId.toLowerCase().replace(/^0x/, '');
  if (hex.length === 64) {
    return `0x${hex.slice(-40)}`;
  }
  if (hex.length > 40) {
    return `0x${hex.slice(-40)}`;
  }
  return `0x${hex}`;
}

// Story Aeneid testnet chain config
const storyAeneid = {
  id: 1315,
  name: 'Story Aeneid Testnet',
  network: 'story-aeneid',
  nativeCurrency: { name: 'IP', symbol: 'IP', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.odyssey.storyrpc.io'] },
    public: { http: ['https://rpc.odyssey.storyrpc.io'] },
  },
} as const;

async function registerTestIPAsset(
  customName?: string,
  customDescription?: string
) {
  console.log('🎯 Registering Test IP Asset on Story Protocol...\n');

  // Get private key from environment
  const privateKey = process.env.WALLET_PRIVATE_KEY as `0x${string}`;
  if (!privateKey || privateKey === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    console.error('❌ Please set WALLET_PRIVATE_KEY in .env file');
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey);
  console.log(`📝 Using account: ${account.address}\n`);

  // Create public client to get block number
  const publicClient = createPublicClient({
    chain: storyAeneid,
    transport: http(process.env.STORY_RPC_URL || 'https://rpc.odyssey.storyrpc.io'),
  });

  // Initialize Story Client
  const config: StoryConfig = {
    account,
    transport: http(process.env.STORY_RPC_URL || 'https://rpc.odyssey.storyrpc.io'),
    chainId: 'aeneid', // Story Aeneid testnet
  };

  const client = StoryClient.newClient(config);
  console.log('✅ Story Client initialized\n');

  // Use provided name/description or defaults
  const assetName = customName || `Atlas IP Asset - ${Date.now()}`;
  const assetDescription = customDescription || 'IP Asset registered via Atlas Protocol for usage analytics licensing';

  try {
    // Create a simple SPG NFT and register it as an IP Asset
    console.log('🎨 Creating and registering IP Asset via SPG...');
    console.log(`   Name: ${assetName}`);
    console.log(`   Description: ${assetDescription}\n`);
    
    // Use Story's default SPG NFT contract
    const SPG_NFT_CONTRACT = '0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc' as const;
    
    // Create metadata JSON and convert to base64 data URI
    const ipMetadataJson = JSON.stringify({
      name: assetName,
      description: assetDescription,
      creator: account.address,
      createdAt: new Date().toISOString(),
      platform: 'Atlas Protocol',
    });
    
    // Use data URI instead of hosting metadata
    const ipMetadataURI = `data:application/json;base64,${Buffer.from(ipMetadataJson).toString('base64')}`;
    
    // Simple hash of the metadata (for verification)
    const textEncoder = new TextEncoder();
    const data = textEncoder.encode(ipMetadataJson);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const ipMetadataHash = `0x${hashArray.map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;
    
    const response = await client.ipAsset.mintAndRegisterIp({
      spgNftContract: SPG_NFT_CONTRACT,
      ipMetadata: {
        ipMetadataURI,
        ipMetadataHash,
        nftMetadataURI: ipMetadataURI, // Same metadata for NFT
        nftMetadataHash: ipMetadataHash,
      },
    });

    console.log('\n✅ IP Asset Registered Successfully!\n');
    console.log('═══════════════════════════════════════════');
    console.log(`📋 IP Asset ID: ${response.ipId}`);
    console.log(`📛 Name: ${assetName}`);
    console.log(`🎫 NFT Token ID: ${response.tokenId}`);
    console.log(`🔗 Transaction: https://aeneid.storyscan.io/tx/${response.txHash}`);
    console.log('═══════════════════════════════════════════\n');

    console.log('💡 Use this IP Asset ID in your vault creation flow!\n');

    // Get the block number from the transaction
    const txReceipt = await publicClient.getTransactionReceipt({ hash: response.txHash as `0x${string}` });
    const blockNumber = Number(txReceipt.blockNumber);

    // Register with Yakoa for IP infringement tracking
    const normalizedId = normalizeTokenId(response.ipId!);
    await registerWithYakoa({
      id: normalizedId,
      registration_tx: {
        chain: 'story-aeneid',
        block_number: blockNumber,
        hash: response.txHash!,
      },
      creator_id: account.address.toLowerCase(),
      metadata: {
        name: assetName,
        description: assetDescription,
      },
      media: [], // No media for test assets
    });
    
    return response.ipId;
  } catch (error) {
    console.error('❌ Error registering IP Asset:', error);
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        console.error('\n💰 You need testnet tokens! Get them from:');
        console.error('   https://faucet.story.foundation\n');
      } else if (error.message.includes('nonce')) {
        console.error('\n⚠️  Nonce error - try again in a moment\n');
      }
    }
    
    process.exit(1);
  }
}

// Parse CLI arguments
const args = process.argv.slice(2);
const nameArg = args.find(a => a.startsWith('--name='))?.split('=')[1];
const descArg = args.find(a => a.startsWith('--description='))?.split('=')[1];

if (args.includes('--help')) {
  console.log(`
Usage: bun run register-test-ip.ts [options]

Options:
  --name="My IP Asset"           Custom name for the IP asset
  --description="Description"    Custom description for the IP asset
  --help                         Show this help message

Examples:
  bun run register-test-ip.ts
  bun run register-test-ip.ts --name="My Music Album" --description="Original compositions for licensing"
  `);
  process.exit(0);
}

// Run the script with optional custom name/description
registerTestIPAsset(nameArg, descArg);
