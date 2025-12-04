import Database from 'better-sqlite3';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { config } from '../config/index.js';
import type { LicenseMetadata, LicenseRecord, LicenseAnalytics } from './types.js';

class LicenseDatabase {
  public db: Database.Database;

  constructor(dbPath: string = config.database.path) {
    // Ensure data directory exists
    const dataDir = dirname(dbPath);
    if (!existsSync(dataDir)) {
      console.log(`📁 Creating database directory: ${dataDir}`);
      try {
        mkdirSync(dataDir, { recursive: true });
      } catch (error: any) {
        console.error(`❌ Failed to create database directory: ${error.message}`);
        throw error;
      }
    }

    console.log(`🗄️  Initializing SQLite database at: ${dbPath}`);

    try {
      this.db = new Database(dbPath);

      // Enable WAL mode for better concurrency
      this.db.pragma('journal_mode = WAL');

      this.initialize();

      console.log('✅ Database initialized successfully');
    } catch (error: any) {
      console.error('❌ Failed to initialize database:', error.message);
      throw error;
    }
  }

  private initialize() {
    try {
      // Read schema file - use import.meta.dir for Bun/ESM
      const schemaPath = join(import.meta.dir, 'schema.sql');

      if (!existsSync(schemaPath)) {
        throw new Error(`Schema file not found at ${schemaPath}`);
      }

      console.log(`📄 Loading schema from: ${schemaPath}`);
      const schema = readFileSync(schemaPath, 'utf-8');

      // Execute schema
      this.db.exec(schema);

      console.log('✅ Database schema created/verified');
    } catch (error: any) {
      console.error('❌ Failed to initialize database schema:', error.message);
      throw error;
    }
  }

  /**
   * Insert license metadata
   * Returns license ID or existing ID if duplicate
   */
  insertLicense(metadata: LicenseMetadata): number | bigint {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO license_metadata (
          transaction_hash, vault_address, ip_id, licensee_address,
          buyer_name, buyer_organization, buyer_email,
          tier_id, tier_name, license_type, amount, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        metadata.transactionHash,
        metadata.vaultAddress.toLowerCase(),
        metadata.ipId.toLowerCase(),
        metadata.licenseeAddress.toLowerCase(),
        metadata.buyerName,
        metadata.buyerOrganization,
        metadata.buyerEmail,
        metadata.tierId,
        metadata.tierName,
        metadata.licenseType,
        metadata.amount,
        metadata.expiresAt
      );

      return result.lastInsertRowid;
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        console.warn(`⚠️  License already exists: ${metadata.transactionHash}`);
        // Return existing ID
        const existing = this.db.prepare(
          'SELECT id FROM license_metadata WHERE transaction_hash = ?'
        ).get(metadata.transactionHash) as { id: number } | undefined;
        return existing?.id || 0;
      }
      throw error;
    }
  }

  // Get licenses by user address
  getLicensesByUser(address: string): LicenseRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM license_metadata
      WHERE licensee_address = ?
      ORDER BY purchased_at DESC
    `);
    return stmt.all(address.toLowerCase()) as LicenseRecord[];
  }

  /**
   * Check if user has active license for IP asset
   */
  hasActiveLicense(address: string, ipId: string): boolean {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM license_metadata
      WHERE licensee_address = ?
        AND ip_id = ?
        AND is_active = 1
        AND expires_at > datetime('now')
    `);
    const result = stmt.get(address.toLowerCase(), ipId.toLowerCase()) as { count: number };
    return result.count > 0;
  }

  /**
   * Get license by transaction hash
   */
  getLicenseByTxHash(txHash: string): LicenseRecord | null {
    const stmt = this.db.prepare(`
      SELECT * FROM license_metadata
      WHERE transaction_hash = ?
    `);
    return stmt.get(txHash) as LicenseRecord | null;
  }

  /**
   * Get license count for IP asset
   */
  getLicenseCount(ipId: string): { total: number; active: number } {
    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = 1 AND expires_at > datetime('now') THEN 1 END) as active
      FROM license_metadata
      WHERE ip_id = ?
    `);
    return stmt.get(ipId.toLowerCase()) as { total: number; active: number };
  }

  // Admin: Get all licenses with filters
  getAllLicenses(filters?: {
    ipId?: string;
    vaultAddress?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
  }): LicenseRecord[] {
    let query = 'SELECT * FROM license_metadata WHERE 1=1';
    const params: any[] = [];

    if (filters?.ipId) {
      query += ' AND ip_id = ?';
      params.push(filters.ipId);
    }
    if (filters?.vaultAddress) {
      query += ' AND vault_address = ?';
      params.push(filters.vaultAddress);
    }
    if (filters?.startDate) {
      query += ' AND purchased_at >= ?';
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      query += ' AND purchased_at <= ?';
      params.push(filters.endDate);
    }
    if (filters?.isActive !== undefined) {
      query += ' AND is_active = ? AND expires_at > datetime(\'now\')';
      params.push(filters.isActive ? 1 : 0);
    }

    query += ' ORDER BY purchased_at DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as LicenseRecord[];
  }

  /**
   * Admin: Get analytics
   */
  getAnalytics(): LicenseAnalytics[] {
    return this.db.prepare('SELECT * FROM license_analytics').all() as LicenseAnalytics[];
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      console.log('🗄️  Database connection closed');
    }
  }
}

// Export singleton instance
export const licenseDb = new LicenseDatabase();

// Graceful shutdown handlers
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  licenseDb.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  licenseDb.close();
  process.exit(0);
});
