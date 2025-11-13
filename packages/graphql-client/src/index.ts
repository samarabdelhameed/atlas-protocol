/**
 * Atlas Protocol GraphQL Client
 * 
 * Shared GraphQL client for querying Goldsky subgraph
 * Used by both frontend (React hooks) and backend (Agent Service)
 */

// Client & Configuration
export {
  graphqlClient,
  createGraphQLClient,
  getSubgraphEndpoint,
  SUBGRAPH_ENDPOINTS,
} from './client';

// GraphQL Queries
export * as queries from './queries';

// React Hooks (for frontend)
export * from './hooks';

// Re-export graphql-request for direct use if needed
export { request, gql } from 'graphql-request';

