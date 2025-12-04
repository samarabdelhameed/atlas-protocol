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
  privateKey: process.env.PRIVATE_KEY || process.env.WALLET_PRIVATE_KEY || '',
  
  // Contract Addresses
  contracts: {
    adlv: (process.env.ADLV_ADDRESS || process.env.ADLV_CONTRACT_ADDRESS || '') as `0x${string}`,
    ido: (process.env.IDO_ADDRESS || process.env.IDO_CONTRACT_ADDRESS || '') as `0x${string}`,
  },
  
  // Chain Configuration
  chain: {
    id: parseInt(process.env.CHAIN_ID || '8453'), // Base mainnet
    name: process.env.CHAIN_NAME || 'Base',
  },

  // Yakoa Configuration
  yakoa: {
    apiKey: process.env.YAKOA_API_KEY || '',
    apiUrl: process.env.YAKOA_API_URL || 'https://api.yakoa.com/v1/verify',
  },

  // Database Configuration
  database: {
    path: process.env.DB_PATH || './data/licenses.db',
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'default-dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Story Protocol License Terms
  storyLicenseTerms: {
    standard: process.env.STORY_PROTOCOL_LICENSE_TERMS_ID_STANDARD || '1',
    commercial: process.env.STORY_PROTOCOL_LICENSE_TERMS_ID_COMMERCIAL || '2',
    exclusive: process.env.STORY_PROTOCOL_LICENSE_TERMS_ID_EXCLUSIVE || '3',
  },
};

