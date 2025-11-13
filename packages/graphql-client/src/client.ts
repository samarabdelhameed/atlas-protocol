import { GraphQLClient } from 'graphql-request';

/**
 * Goldsky Subgraph Endpoint Configuration
 * Update this after deploying your subgraph to Goldsky
 */
export const SUBGRAPH_ENDPOINTS = {
  // Production - Update after Goldsky deployment
  production: process.env.SUBGRAPH_URL || 'https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1',
  
  // Development/Testing
  development: process.env.SUBGRAPH_URL || 'http://localhost:8000/subgraphs/name/atlas-protocol',
  
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
    // Add retry logic
    fetch: async (input, init) => {
      let retries = 3;
      while (retries > 0) {
        try {
          return await fetch(input, init);
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      throw new Error('Max retries exceeded');
    },
  });
}

/**
 * Default client instance
 */
export const graphqlClient = createGraphQLClient();

