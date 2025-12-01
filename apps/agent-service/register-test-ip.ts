/**
 * Quick script to register a test IP asset for vault creation testing
 * Run: bun run register-test-ip.ts
 */

import { StoryClient, type StoryConfig } from '@story-protocol/core-sdk';
import { http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

async function registerTestIPAsset() {
  console.log('🎯 Registering Test IP Asset on Story Protocol...\n');

  // Get private key from environment
  const privateKey = process.env.WALLET_PRIVATE_KEY as `0x${string}`;
  if (!privateKey || privateKey === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    console.error('❌ Please set WALLET_PRIVATE_KEY in .env file');
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey);
  console.log(`📝 Using account: ${account.address}\n`);

  // Initialize Story Client
  const config: StoryConfig = {
    account,
    transport: http(process.env.STORY_RPC_URL || 'https://rpc-storyevm-testnet.aldebaranode.xyz'),
    chainId: 'aeneid', // Story Aeneid testnet
  };

  const client = StoryClient.newClient(config);
  console.log('✅ Story Client initialized\n');

  try {
    // Create a simple SPG NFT and register it as an IP Asset
    console.log('🎨 Creating and registering IP Asset via SPG...');
    
    // Use Story's default SPG NFT contract
    const SPG_NFT_CONTRACT = '0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc' as const;
    
    const response = await client.ipAsset.mintAndRegisterIp({
      spgNftContract: SPG_NFT_CONTRACT,
      ipMetadata: {
        ipMetadataURI: '',
        ipMetadataHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        nftMetadataURI: '',
        nftMetadataHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      },
    });

    console.log('\n✅ IP Asset Registered Successfully!\n');
    console.log('═══════════════════════════════════════════');
    console.log(`📋 IP Asset ID: ${response.ipId}`);
    console.log(`🎫 NFT Token ID: ${response.tokenId}`);
    console.log(`🔗 Transaction: https://aeneid.storyscan.io/tx/${response.txHash}`);
    console.log('═══════════════════════════════════════════\n');

    console.log('💡 Use this IP Asset ID in your vault creation flow!\n');
    
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

// Run the script
registerTestIPAsset();
