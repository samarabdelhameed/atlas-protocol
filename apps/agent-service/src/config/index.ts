/**
 * Configuration for Agent Service
 */

export const config = {
  // RPC Configuration
  rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
  
  // Story Protocol
  storyProtocol: {
    apiKey: process.env.STORY_PROTOCOL_API_KEY || '',
    rpcUrl: process.env.STORY_PROTOCOL_RPC || '',
  },
  
  // ABV.dev Integration
  abv: {
    apiKey: process.env.ABV_API_KEY || '',
  },
  
  // Owlto Finance
  owlto: {
    apiKey: process.env.OWLTO_API_KEY || '',
    bridgeUrl: process.env.OWLTO_BRIDGE_URL || '',
  },
  
  // World ID
  worldId: {
    appId: process.env.WORLD_ID_APP_ID || '',
    action: process.env.WORLD_ID_ACTION || 'atlas-verification',
  },
  
  // Private Key (for testing)
  privateKey: process.env.PRIVATE_KEY || '',
};

