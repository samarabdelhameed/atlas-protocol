/**
 * Database Schema for Indexer
 * Stores indexed events from ADLV and IDO contracts
 */

import Database from 'better-sqlite3';
import { join } from 'path';

export interface VaultRow {
  id: number;
  vaultAddress: string;
  ipId: string;
  creator: string;
  initialCVS: string;
  currentCVS: string;
  totalLiquidity: string;
  availableLiquidity: string;
  totalLoansIssued: string;
  activeLoansCount: number;
  totalLicenseRevenue: string;
  createdAt: number;
  updatedAt: number;
  blockNumber: number;
  txHash: string;
}

export interface LicenseSaleRow {
  id: number;
  vaultAddress: string;
  ipId: string;
  licensee: string;
  salePrice: string;
  licenseType: string;
  cvsIncrement: string;
  creatorShare: string;
  vaultShare: string;
  protocolFee: string;
  blockNumber: number;
  txHash: string;
  timestamp: number;
}

export interface LoanRow {
  id: number;
  loanId: string;
  vaultAddress: string;
  borrower: string;
  loanAmount: string;
  collateralAmount: string;
  interestRate: string;
  duration: number;
  cvsAtIssuance: string;
  status: string;
  repaidAmount: string;
  outstandingAmount: string;
  startTime: number;
  endTime: number;
  blockNumber: number;
  txHash: string;
  issuedAt: number;
}

export interface CVSUpdateRow {
  id: number;
  vaultAddress: string;
  ipId: string;
  oldCVS: string;
  newCVS: string;
  blockNumber: number;
  txHash: string;
  timestamp: number;
}

export class IndexerDatabase {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const path = dbPath || join(process.cwd(), 'data', 'indexer.db');
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.initializeTables();
  }

  private initializeTables() {
    // Vaults table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS vaults (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vaultAddress TEXT UNIQUE NOT NULL,
        ipId TEXT NOT NULL,
        creator TEXT NOT NULL,
        initialCVS TEXT NOT NULL,
        currentCVS TEXT NOT NULL,
        totalLiquidity TEXT DEFAULT '0',
        availableLiquidity TEXT DEFAULT '0',
        totalLoansIssued TEXT DEFAULT '0',
        activeLoansCount INTEGER DEFAULT 0,
        totalLicenseRevenue TEXT DEFAULT '0',
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        blockNumber INTEGER NOT NULL,
        txHash TEXT NOT NULL
      )
    `);

    // License Sales table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS license_sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vaultAddress TEXT NOT NULL,
        ipId TEXT NOT NULL,
        licensee TEXT NOT NULL,
        salePrice TEXT NOT NULL,
        licenseType TEXT NOT NULL,
        cvsIncrement TEXT NOT NULL,
        creatorShare TEXT NOT NULL,
        vaultShare TEXT NOT NULL,
        protocolFee TEXT NOT NULL,
        blockNumber INTEGER NOT NULL,
        txHash TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      )
    `);

    // Loans table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS loans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        loanId TEXT UNIQUE NOT NULL,
        vaultAddress TEXT NOT NULL,
        borrower TEXT NOT NULL,
        loanAmount TEXT NOT NULL,
        collateralAmount TEXT NOT NULL,
        interestRate TEXT NOT NULL,
        duration INTEGER NOT NULL,
        cvsAtIssuance TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Active',
        repaidAmount TEXT DEFAULT '0',
        outstandingAmount TEXT NOT NULL,
        startTime INTEGER NOT NULL,
        endTime INTEGER NOT NULL,
        blockNumber INTEGER NOT NULL,
        txHash TEXT NOT NULL,
        issuedAt INTEGER NOT NULL
      )
    `);

    // CVS Updates table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cvs_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vaultAddress TEXT NOT NULL,
        ipId TEXT NOT NULL,
        oldCVS TEXT NOT NULL,
        newCVS TEXT NOT NULL,
        blockNumber INTEGER NOT NULL,
        txHash TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      )
    `);

    // Indexing progress table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS indexing_progress (
        id INTEGER PRIMARY KEY,
        lastIndexedBlock INTEGER NOT NULL DEFAULT 0,
        updatedAt INTEGER NOT NULL
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_vaults_address ON vaults(vaultAddress);
      CREATE INDEX IF NOT EXISTS idx_vaults_ipId ON vaults(ipId);
      CREATE INDEX IF NOT EXISTS idx_license_sales_vault ON license_sales(vaultAddress);
      CREATE INDEX IF NOT EXISTS idx_loans_vault ON loans(vaultAddress);
      CREATE INDEX IF NOT EXISTS idx_loans_borrower ON loans(borrower);
      CREATE INDEX IF NOT EXISTS idx_cvs_updates_vault ON cvs_updates(vaultAddress);
    `);
  }

  // Vault operations
  insertVault(vault: Omit<VaultRow, 'id'>) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO vaults (
        vaultAddress, ipId, creator, initialCVS, currentCVS,
        totalLiquidity, availableLiquidity, totalLoansIssued,
        activeLoansCount, totalLicenseRevenue, createdAt, updatedAt,
        blockNumber, txHash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      vault.vaultAddress,
      vault.ipId,
      vault.creator,
      vault.initialCVS,
      vault.currentCVS,
      vault.totalLiquidity,
      vault.availableLiquidity,
      vault.totalLoansIssued,
      vault.activeLoansCount,
      vault.totalLicenseRevenue,
      vault.createdAt,
      vault.updatedAt,
      vault.blockNumber,
      vault.txHash
    );
  }

  getVault(vaultAddress: string): VaultRow | undefined {
    const stmt = this.db.prepare('SELECT * FROM vaults WHERE vaultAddress = ?');
    return stmt.get(vaultAddress) as VaultRow | undefined;
  }

  getAllVaults(): VaultRow[] {
    const stmt = this.db.prepare('SELECT * FROM vaults ORDER BY createdAt DESC');
    return stmt.all() as VaultRow[];
  }

  // License sales operations
  insertLicenseSale(sale: Omit<LicenseSaleRow, 'id'>) {
    const stmt = this.db.prepare(`
      INSERT INTO license_sales (
        vaultAddress, ipId, licensee, salePrice, licenseType,
        cvsIncrement, creatorShare, vaultShare, protocolFee,
        blockNumber, txHash, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      sale.vaultAddress,
      sale.ipId,
      sale.licensee,
      sale.salePrice,
      sale.licenseType,
      sale.cvsIncrement,
      sale.creatorShare,
      sale.vaultShare,
      sale.protocolFee,
      sale.blockNumber,
      sale.txHash,
      sale.timestamp
    );
  }

  getLicenseSales(vaultAddress?: string): LicenseSaleRow[] {
    if (vaultAddress) {
      const stmt = this.db.prepare(
        'SELECT * FROM license_sales WHERE vaultAddress = ? ORDER BY timestamp DESC'
      );
      return stmt.all(vaultAddress) as LicenseSaleRow[];
    }
    const stmt = this.db.prepare('SELECT * FROM license_sales ORDER BY timestamp DESC LIMIT 100');
    return stmt.all() as LicenseSaleRow[];
  }

  // Loan operations
  insertLoan(loan: Omit<LoanRow, 'id'>) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO loans (
        loanId, vaultAddress, borrower, loanAmount, collateralAmount,
        interestRate, duration, cvsAtIssuance, status, repaidAmount,
        outstandingAmount, startTime, endTime, blockNumber, txHash, issuedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      loan.loanId,
      loan.vaultAddress,
      loan.borrower,
      loan.loanAmount,
      loan.collateralAmount,
      loan.interestRate,
      loan.duration,
      loan.cvsAtIssuance,
      loan.status,
      loan.repaidAmount,
      loan.outstandingAmount,
      loan.startTime,
      loan.endTime,
      loan.blockNumber,
      loan.txHash,
      loan.issuedAt
    );
  }

  getLoan(loanId: string): LoanRow | undefined {
    const stmt = this.db.prepare('SELECT * FROM loans WHERE loanId = ?');
    return stmt.get(loanId) as LoanRow | undefined;
  }

  getLoans(vaultAddress?: string): LoanRow[] {
    if (vaultAddress) {
      const stmt = this.db.prepare(
        'SELECT * FROM loans WHERE vaultAddress = ? ORDER BY issuedAt DESC'
      );
      return stmt.all(vaultAddress) as LoanRow[];
    }
    const stmt = this.db.prepare('SELECT * FROM loans ORDER BY issuedAt DESC LIMIT 100');
    return stmt.all() as LoanRow[];
  }

  // CVS updates operations
  insertCVSUpdate(update: Omit<CVSUpdateRow, 'id'>) {
    const stmt = this.db.prepare(`
      INSERT INTO cvs_updates (
        vaultAddress, ipId, oldCVS, newCVS, blockNumber, txHash, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      update.vaultAddress,
      update.ipId,
      update.oldCVS,
      update.newCVS,
      update.blockNumber,
      update.txHash,
      update.timestamp
    );
  }

  getCVSUpdates(vaultAddress?: string): CVSUpdateRow[] {
    if (vaultAddress) {
      const stmt = this.db.prepare(
        'SELECT * FROM cvs_updates WHERE vaultAddress = ? ORDER BY timestamp DESC'
      );
      return stmt.all(vaultAddress) as CVSUpdateRow[];
    }
    const stmt = this.db.prepare('SELECT * FROM cvs_updates ORDER BY timestamp DESC LIMIT 100');
    return stmt.all() as CVSUpdateRow[];
  }

  // Indexing progress
  getLastIndexedBlock(): number {
    const stmt = this.db.prepare('SELECT lastIndexedBlock FROM indexing_progress WHERE id = 1');
    const result = stmt.get() as { lastIndexedBlock: number } | undefined;
    return result?.lastIndexedBlock || 11122612; // Start from IDO deployment block
  }

  updateLastIndexedBlock(blockNumber: number) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO indexing_progress (id, lastIndexedBlock, updatedAt)
      VALUES (1, ?, ?)
    `);
    stmt.run(blockNumber, Date.now());
  }

  // Stats
  getStats() {
    const vaultCount = this.db.prepare('SELECT COUNT(*) as count FROM vaults').get() as { count: number };
    const loanCount = this.db.prepare('SELECT COUNT(*) as count FROM loans').get() as { count: number };
    const licenseCount = this.db.prepare('SELECT COUNT(*) as count FROM license_sales').get() as { count: number };
    const cvsUpdateCount = this.db.prepare('SELECT COUNT(*) as count FROM cvs_updates').get() as { count: number };

    return {
      vaults: vaultCount.count,
      loans: loanCount.count,
      licenseSales: licenseCount.count,
      cvsUpdates: cvsUpdateCount.count,
    };
  }

  close() {
    this.db.close();
  }
}


