import { GraphQLClient } from 'graphql-request';

// Resolve subgraph URL from Vite (browser) or Node environments
function resolveSubgraphUrl(): string | undefined {
  const viteUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env)
    ? (import.meta as any).env.VITE_SUBGRAPH_URL
    : undefined;
  const nodeUrl = (typeof process !== 'undefined' && process.env)
    ? process.env.SUBGRAPH_URL
    : undefined;
  return viteUrl || nodeUrl;
}

/**
 * Goldsky Subgraph Endpoint Configuration
 * 
 * NOTE: Subgraph is built and ready but not deployed yet.
 * For now, we use direct RPC calls to contracts.
 * After Goldsky deployment, update SUBGRAPH_URL in .env
 */
export const SUBGRAPH_ENDPOINTS = {
  // Production - Update after Goldsky deployment
  production: resolveSubgraphUrl() || 'https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1',
  
  // Development/Testing - Use placeholder until deployed
  // To deploy: cd subgraph && goldsky subgraph deploy atlas-protocol/1.0.0 --path .
  development: resolveSubgraphUrl() || 'https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1',
  
  // Story Testnet
  storyTestnet: resolveSubgraphUrl() || 'https://api.goldsky.com/api/public/atlas-protocol/testnet/subgraphs/atlas-v1',
};

/**
 * Get the appropriate subgraph endpoint based on environment
 */
export function getSubgraphEndpoint(): string {
  // Avoid direct window references for Node build compatibility
  const viteMode = (typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE) || undefined;
  const nodeMode = (typeof process !== 'undefined' && process.env?.NODE_ENV) || undefined;
  const mode = viteMode || nodeMode || 'development';
  
  if (mode === 'production') {
    return SUBGRAPH_ENDPOINTS.production;
  } else if (mode === 'test') {
    return SUBGRAPH_ENDPOINTS.storyTestnet;
  }
  
  return SUBGRAPH_ENDPOINTS.development;
}

/**
 * Create a GraphQL client instance
 */
export function createGraphQLClient(endpoint?: string): GraphQLClient {
  const url = endpoint || getSubgraphEndpoint();
  
  return new GraphQLClient(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Default client instance
 */
export const graphqlClient = createGraphQLClient();

