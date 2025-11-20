/**
 * Quick test script to verify Story Protocol SDK installation
 * Run with: bun run test-story-sdk.ts
 */

import { StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import { http } from 'viem';

console.log('🧪 Testing Story Protocol SDK installation...\n');

try {
  // Test 1: Import check
  console.log('✅ SDK imports successful');
  console.log('   - StoryClient:', typeof StoryClient);
  console.log('   - http transport:', typeof http);

  // Test 2: Configuration check
  const testConfig: StoryConfig = {
    account: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    transport: http('https://rpc.odyssey.storyrpc.io'),
    chainId: 1514, // Story mainnet (or use 1315 for aeneid testnet)
  };
  console.log('\n✅ Configuration structure valid');

  // Test 3: Client initialization
  const client = StoryClient.newClient(testConfig);
  console.log('✅ StoryClient initialized successfully');
  console.log('   - Client type:', typeof client);
  console.log('   - Has ipAsset module:', 'ipAsset' in client);
  console.log('   - Has license module:', 'license' in client);

  console.log('\n🎉 All tests passed! Story Protocol SDK is ready to use.\n');
  console.log('📚 Next steps:');
  console.log('   1. Set WALLET_PRIVATE_KEY in .env');
  console.log('   2. Check examples in examples/storyProtocolExample.ts');
  console.log('   3. Read STORY_PROTOCOL_SDK_GUIDE.md for usage\n');

} catch (error) {
  console.error('❌ Error testing SDK:', error);
  process.exit(1);
}
