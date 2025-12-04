/**
 * TypeScript types for License Metadata Database
 */

export interface LicenseMetadata {
  transactionHash: string;
  vaultAddress: string;
  ipId: string;
  licenseeAddress: string;
  buyerName: string;
  buyerOrganization: string;
  buyerEmail: string;
  tierId: string;
  tierName: string;
  licenseType: 'standard' | 'commercial' | 'exclusive';
  amount: string;
  expiresAt: string; // ISO 8601 datetime
}

export interface LicenseRecord extends LicenseMetadata {
  id: number;
  purchased_at: string;
  is_active: boolean | number; // SQLite returns numbers for booleans
}

export interface LicenseAnalytics {
  vault_address: string;
  ip_id: string;
  total_licenses: number;
  total_revenue: number;
  active_licenses: number;
  unique_licensees: number;
  last_sale: string;
  first_sale: string;
}

export interface LicenseStatus {
  id: number;
  transaction_hash: string;
  vault_address: string;
  ip_id: string;
  licensee_address: string;
  buyer_organization: string;
  tier_name: string;
  amount: string;
  purchased_at: string;
  expires_at: string;
  status: 'Active' | 'Expired' | 'Inactive';
  days_remaining: number;
}

export interface ProvenanceData {
  score: number;
  originality: number;
  confidence: number;
  status: 'verified' | 'unverified' | 'pending' | 'error';
  timestamp: number;
  details?: {
    similarity?: number;
    uniqueness?: number;
    originality?: number;
  };
}
