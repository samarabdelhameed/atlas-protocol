/**
 * API endpoints for Indexer Service
 * Provides GraphQL-like query interface for indexed data
 */

import type { IndexerDatabase } from '../database/schema.js';

export class IndexerAPI {
  private db: IndexerDatabase;
  private server: any;

  constructor(db: IndexerDatabase) {
    this.db = db;
  }

  /**
   * Start HTTP server with API endpoints using Bun.serve
   */
  start(port: number = 3002) {
    if (this.server) {
      console.log('⚠️  Indexer API server already running');
      return;
    }

    this.server = Bun.serve({
      port: port,
      fetch: async (req: Request) => {
        const url = new URL(req.url);
        const path = url.pathname;
        const method = req.method;
        const params = Object.fromEntries(url.searchParams);

        // CORS headers
        const headers = {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json',
        };

        if (method === 'OPTIONS') {
          return new Response(null, { status: 200, headers });
        }

        // Parse JSON body for POST requests
        let body = params;
        if (method === 'POST') {
          try {
            body = await req.json();
          } catch (error) {
            return this.sendErrorResponse(400, 'Invalid JSON', headers);
          }
        }

        try {
          return this.handleRequest(path, method, body, headers);
        } catch (error: any) {
          return this.sendErrorResponse(500, error.message, headers);
        }
      },
    });

    console.log(`📡 Indexer API server running on http://localhost:${port}`);
    return this.server;
  }

  /**
   * Handle HTTP requests
   */
  private handleRequest(path: string, method: string, params: any, headers: any): Response {
    // GraphQL-like query endpoint
    if (path === '/query' && method === 'POST') {
      return this.handleGraphQLQuery(params, headers);
    }

    // REST endpoints
    switch (path) {
      case '/api/stats':
        return this.handleStats(headers);
      case '/api/vaults':
        return this.handleVaults(params, headers);
      case '/api/vault':
        return this.handleVault(params.address, headers);
      case '/api/loans':
        return this.handleLoans(params.vaultAddress, headers);
      case '/api/license-sales':
        return this.handleLicenseSales(params.vaultAddress, headers);
      case '/api/cvs-updates':
        return this.handleCVSUpdates(params.vaultAddress, headers);
      default:
        return this.sendErrorResponse(404, 'Not found', headers);
    }
  }

  /**
   * Handle GraphQL-like query
   */
  private handleGraphQLQuery(params: any, headers: any): Response {
    const query = params.query || '';
    
    // Simple query parser (basic implementation)
    if (query.includes('vaults')) {
      const vaults = this.db.getAllVaults();
      return this.sendJSONResponse({ data: { vaults } }, headers);
    } else if (query.includes('loans')) {
      const loans = this.db.getLoans();
      return this.sendJSONResponse({ data: { loans } }, headers);
    } else if (query.includes('licenseSales')) {
      const licenseSales = this.db.getLicenseSales();
      return this.sendJSONResponse({ data: { licenseSales } }, headers);
    } else if (query.includes('stats')) {
      const stats = this.db.getStats();
      return this.sendJSONResponse({ data: { stats } }, headers);
    } else {
      return this.sendJSONResponse({ data: {} }, headers);
    }
  }

  /**
   * Get protocol statistics
   */
  private handleStats(headers: any): Response {
    const stats = this.db.getStats();
    return this.sendJSONResponse(stats, headers);
  }

  /**
   * Get all vaults or specific vault
   */
  private handleVaults(params: any, headers: any): Response {
    if (params.address) {
      const vault = this.db.getVault(params.address);
      if (vault) {
        return this.sendJSONResponse(vault, headers);
      } else {
        return this.sendErrorResponse(404, 'Vault not found', headers);
      }
    } else {
      const vaults = this.db.getAllVaults();
      return this.sendJSONResponse(vaults, headers);
    }
  }

  /**
   * Get single vault
   */
  private handleVault(address: string, headers: any): Response {
    if (!address) {
      return this.sendErrorResponse(400, 'Address required', headers);
    }

    const vault = this.db.getVault(address);
    if (vault) {
      return this.sendJSONResponse(vault, headers);
    } else {
      return this.sendErrorResponse(404, 'Vault not found', headers);
    }
  }

  /**
   * Get loans
   */
  private handleLoans(vaultAddress?: string, headers?: any): Response {
    const loans = this.db.getLoans(vaultAddress);
    return this.sendJSONResponse(loans, headers || {});
  }

  /**
   * Get license sales
   */
  private handleLicenseSales(vaultAddress?: string, headers?: any): Response {
    const sales = this.db.getLicenseSales(vaultAddress);
    return this.sendJSONResponse(sales, headers || {});
  }

  /**
   * Get CVS updates
   */
  private handleCVSUpdates(vaultAddress?: string, headers?: any): Response {
    const updates = this.db.getCVSUpdates(vaultAddress);
    return this.sendJSONResponse(updates, headers || {});
  }

  /**
   * Send JSON response
   */
  private sendJSONResponse(data: any, headers: any): Response {
    return new Response(JSON.stringify(data, null, 2), {
      status: 200,
      headers,
    });
  }

  /**
   * Send error response
   */
  private sendErrorResponse(status: number, message: string, headers: any): Response {
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers,
    });
  }

  /**
   * Stop server
   */
  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}

