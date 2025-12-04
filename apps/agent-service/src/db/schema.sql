-- ============================================
-- Atlas Protocol - License Metadata Database
-- ============================================
-- This schema stores license purchase metadata
-- that is not captured on-chain (buyer info, etc.)

-- License Metadata Table
CREATE TABLE IF NOT EXISTS license_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_hash TEXT UNIQUE NOT NULL,
  vault_address TEXT NOT NULL,
  ip_id TEXT NOT NULL,
  licensee_address TEXT NOT NULL,

  -- Buyer Information (off-chain only)
  buyer_name TEXT NOT NULL,
  buyer_organization TEXT NOT NULL,
  buyer_email TEXT NOT NULL,

  -- License Details
  tier_id TEXT NOT NULL,
  tier_name TEXT NOT NULL,
  license_type TEXT NOT NULL CHECK(license_type IN ('standard', 'commercial', 'exclusive')),
  amount TEXT NOT NULL,

  -- Timestamps
  purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT 1,

  -- Constraints
  CONSTRAINT unique_license UNIQUE (vault_address, licensee_address, transaction_hash)
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Index for querying licenses by user
CREATE INDEX IF NOT EXISTS idx_licensee ON license_metadata(licensee_address);

-- Index for querying licenses by vault
CREATE INDEX IF NOT EXISTS idx_vault ON license_metadata(vault_address);

-- Index for querying licenses by IP ID
CREATE INDEX IF NOT EXISTS idx_ip_id ON license_metadata(ip_id);

-- Index for querying by transaction hash
CREATE INDEX IF NOT EXISTS idx_tx_hash ON license_metadata(transaction_hash);

-- Index for expiration queries
CREATE INDEX IF NOT EXISTS idx_expires ON license_metadata(expires_at);

-- Composite index for active license lookups
CREATE INDEX IF NOT EXISTS idx_active ON license_metadata(is_active, expires_at);

-- Composite index for user + IP queries (license verification)
CREATE INDEX IF NOT EXISTS idx_user_ip ON license_metadata(licensee_address, ip_id, is_active, expires_at);

-- ============================================
-- Admin Analytics View
-- ============================================

CREATE VIEW IF NOT EXISTS license_analytics AS
SELECT
  vault_address,
  ip_id,
  COUNT(*) as total_licenses,
  SUM(CAST(amount AS REAL)) as total_revenue,
  COUNT(CASE WHEN is_active = 1 AND expires_at > datetime('now') THEN 1 END) as active_licenses,
  COUNT(DISTINCT licensee_address) as unique_licensees,
  MAX(purchased_at) as last_sale,
  MIN(purchased_at) as first_sale
FROM license_metadata
GROUP BY vault_address, ip_id;

-- ============================================
-- License Status View (for easy monitoring)
-- ============================================

CREATE VIEW IF NOT EXISTS license_status AS
SELECT
  id,
  transaction_hash,
  vault_address,
  ip_id,
  licensee_address,
  buyer_organization,
  tier_name,
  amount,
  purchased_at,
  expires_at,
  CASE
    WHEN is_active = 0 THEN 'Inactive'
    WHEN expires_at <= datetime('now') THEN 'Expired'
    ELSE 'Active'
  END as status,
  julianday(expires_at) - julianday('now') as days_remaining
FROM license_metadata
ORDER BY purchased_at DESC;
