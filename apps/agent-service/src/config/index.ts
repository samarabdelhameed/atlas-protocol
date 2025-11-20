/**
 * Configuration for Agent Service
 */

export const config = {
  // RPC Configuration
  rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
  
  // Story Protocol
  storyProtocol: {
    apiKey: process.env.STORY_PROTOCOL_API_KEY || '',
    rpcUrl: process.env.STORY_PROTOCOL_RPC || 'https://rpc-storyevm-testnet.aldebaranode.xyz',
    apiUrl: process.env.STORY_PROTOCOL_API_URL || 'https://api.story.foundation/v1',
    chainId: parseInt(process.env.STORY_PROTOCOL_CHAIN_ID || '1315'),
    contracts: {
      ipAssetRegistry: process.env.STORY_PROTOCOL_IP_ASSET_REGISTRY || '',
      licensingModule: process.env.STORY_PROTOCOL_LICENSING_MODULE || '',
      registry: process.env.STORY_PROTOCOL_REGISTRY || '',
    },
  },
  
  // ABV.dev Integration
  abv: {
    apiKey: process.env.ABV_API_KEY || '',
  },
  
  // Owlto Finance
  owlto: {
    apiKey: process.env.OWLTO_API_KEY || '',
    bridgeUrl: process.env.OWLTO_BRIDGE_URL || 'https://api.owlto.finance/api/v2/bridge',
    slippage: process.env.OWLTO_SLIPPAGE || '0.5',
    referralCode: process.env.OWLTO_REFERRAL_CODE || '',
  },
  
  // World ID
  worldId: {
    appId: process.env.WORLD_ID_APP_ID || '',
    action: process.env.WORLD_ID_ACTION || 'atlas-verification',
    actionId: process.env.WORLD_ID_ACTION_ID || process.env.WORLD_ID_ACTION || 'atlas-verification',
  },
  
  // Private Key (for testing)
  privateKey: process.env.PRIVATE_KEY || '',
  
  // Contract Addresses
  contracts: {
    adlv: process.env.ADLV_ADDRESS || '' as `0x${string}`,
    ido: process.env.IDO_ADDRESS || '' as `0x${string}`,
  },
  
  // Chain Configuration
  chain: {
    id: parseInt(process.env.CHAIN_ID || '8453'), // Base mainnet
    name: process.env.CHAIN_NAME || 'Base',
  },
};

