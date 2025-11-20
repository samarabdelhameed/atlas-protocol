import { GraphQLClient } from 'graphql-request';

/**
 * Goldsky Subgraph Endpoint Configuration
 * 
 * NOTE: Subgraph is built and ready but not deployed yet.
 * For now, we use direct RPC calls to contracts.
 * After Goldsky deployment, update SUBGRAPH_URL in .env
 */
export const SUBGRAPH_ENDPOINTS = {
  // Production - Update after Goldsky deployment
  production: process.env.SUBGRAPH_URL || 'https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1',
  
  // Development/Testing - Use placeholder until deployed
  // To deploy: cd subgraph && goldsky subgraph deploy atlas-protocol/1.0.0 --path .
  development: process.env.SUBGRAPH_URL || 'https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1',
  
  // Story Testnet
  storyTestnet: process.env.SUBGRAPH_URL || 'https://api.goldsky.com/api/public/atlas-protocol/testnet/subgraphs/atlas-v1',
};

/**
 * Get the appropriate subgraph endpoint based on environment
 */
export function getSubgraphEndpoint(): string {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    return SUBGRAPH_ENDPOINTS.production;
  } else if (env === 'test') {
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

