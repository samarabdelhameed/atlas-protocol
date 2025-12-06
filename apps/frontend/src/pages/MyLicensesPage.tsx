/**
 * My Licenses Page
 *
 * Shows all licenses purchased by the connected user and provides
 * access to the IP intelligence data they've licensed.
 */

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useLicenseAuth } from '../hooks/useLicenseAuth';
import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle, XCircle, BarChart3, TrendingUp, DollarSign, Code, GitBranch, Activity } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface License {
  id: string;
  ipAssetId: string;
  ipAssetName: string;
  purchasedAt: string;
  pricePaid: string;
  licenseType: string;
  duration: string;
  expiresAt: string;
  isActive: boolean;
  transactionHash: string;
}

interface UsageData {
  ipId: string;
  ipAssetName: string;

  // Global usage metrics
  globalUsage: {
    totalDetections: number;
    authorizedUses: number;
    unauthorizedUses: number;
    platforms: string[];
    derivatives: number;
    lastDetectedAt: string | null;
  };

  // Yakoa infringement intelligence
  infringements: Array<{
    brand_id: string;
    detected_at: string;
    status: string;
    context?: string;
  }>;

  // Yakoa authorized usages
  authorizations: Array<{
    brand_id: string;
    authorized_at: string;
    context?: string;
  }>;

  // Story Protocol derivatives
  derivatives: Array<{
    childIpId: string;
    childName?: string;
    creator: string;
    createdAt: string;
    royaltiesPaid?: string;
  }>;

  // Provenance & verification
  provenance: {
    yakoaScore: number;
    verified: boolean;
    confidence: number;
    status: 'verified' | 'unverified' | 'pending' | 'unavailable';
    infringementCount: number;
    authorizationCount: number;
  };

  // CVS score
  cvs: {
    currentScore: string;
    rank: number;
    history: Array<{ timestamp: string; score: string }>;
  };

  // License sales summary
  licensingSummary: {
    totalLicensesSold: number;
    activeLicenses: number;
    totalRevenue: string;
    licenseTypeBreakdown: {
      standard: number;
      commercial: number;
      exclusive: number;
    };
  };

  // Story Protocol on-chain usage stats
  storyProtocolStats?: {
    directDerivatives: number;
    totalDescendants: number;
    parentIPs: number;
    ancestorIPs: number;
    licensesAttached: number;
    licenseTokensIssued: number;
    totalTransactions: number;
    recentTransactions: Array<{
      txHash: string;
      eventType: string;
      blockNumber: number;
      createdAt: string;
    }>;
  };

  // Mock Usage Analytics (for hackathon demo)
  mockUsageAnalytics?: {
    apiCalls: {
      total: number;
      last24h: number;
      last7d: number;
      last30d: number;
    };
    contentAccess: {
      downloads: number;
      views: number;
      uniqueUsers: number;
    };
    geographicDistribution: Array<{
      country: string;
      percentage: number;
      accessCount: number;
    }>;
    platformUsage: Array<{
      platform: string;
      usageCount: number;
      lastAccessed: string;
    }>;
    aiTrainingDetection: {
      foundInDatasets: number;
      datasetNames: string[];
      estimatedModelsUsingIP: number;
    };
    usageTrend: Array<{
      date: string;
      apiCalls: number;
      downloads: number;
    }>;
  };
}

interface MyLicensesPageProps {
  onNavigate: (page: string, ipAssetId?: string) => void;
}

export default function MyLicensesPage({ onNavigate }: MyLicensesPageProps) {
  const { address, isConnected } = useAccount();
  const { isAuthenticated, isAuthenticating, authenticate, error: authError, token } = useLicenseAuth();

  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tab management
  const [activeTab, setActiveTab] = useState<'licenses' | 'analytics' | 'sdk'>('licenses');

  // Usage analytics state
  const [selectedLicenseForAnalytics, setSelectedLicenseForAnalytics] = useState<string | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [isLoadingUsageData, setIsLoadingUsageData] = useState(false);
  const [usageDataError, setUsageDataError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address && isAuthenticated) {
      fetchLicenses();
    }
  }, [isConnected, address, isAuthenticated]);

  // Fetch usage data when license is selected for analytics
  useEffect(() => {
    if (selectedLicenseForAnalytics && token) {
      fetchUsageData(selectedLicenseForAnalytics);
    }
  }, [selectedLicenseForAnalytics, token]);

  const fetchLicenses = async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${BACKEND_URL}/api/licenses/${address}`, {
        signal: controller.signal,
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch licenses: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setLicenses(data.licenses || []);
    } catch (err: any) {
      console.error('Error fetching licenses:', err);
      if (err.name === 'AbortError') {
        setError('Request timed out. Please check your connection and try again.');
      } else {
        setError(err.message || 'Failed to load licenses');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsageData = async (ipAssetId: string) => {
    if (!token) {
      setUsageDataError('Authentication required');
      return;
    }

    setIsLoadingUsageData(true);
    setUsageDataError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/usage-data/${ipAssetId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You need an active license to view usage data');
        }
        throw new Error('Failed to fetch usage data');
      }

      const data = await response.json();
      setUsageData(data);
    } catch (err: any) {
      console.error('Error fetching usage data:', err);
      setUsageDataError(err.message || 'Failed to load usage data');
    } finally {
      setIsLoadingUsageData(false);
    }
  };

  const handleAuthenticate = async () => {
    const success = await authenticate();
    if (success) {
      fetchLicenses();
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (priceWei: string) => {
    const priceEth = Number(priceWei) / 1e18;
    return `${priceEth.toFixed(4)} ETH`;
  };

  // Format CVS score to readable number (always in wei from subgraph)
  const formatCVS = (cvsWei: string) => {
    const cvs = Number(cvsWei) / 1e18; // Convert from wei
    if (cvs >= 1000000) {
      return (cvs / 1000000).toFixed(2) + 'M';
    }
    if (cvs >= 1000) {
      return (cvs / 1000).toFixed(2) + 'K';
    }
    if (cvs >= 1) {
      return cvs.toFixed(2);
    }
    return cvs.toFixed(4);
  };

  // Format large numbers with K/M suffixes
  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  };

  // Format revenue in IP tokens with compact display
  const formatRevenue = (revenueWei: string) => {
    const tokens = Number(revenueWei) / 1e18;
    if (tokens >= 1000) {
      return (tokens / 1000).toFixed(2) + 'K';
    }
    if (tokens >= 1) {
      return tokens.toFixed(2);
    }
    return tokens.toFixed(4);
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry < 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  // Convert bytes32 IP ID to clean address format
  const formatIpAssetId = (ipId: string) => {
    // If it has leading zeros (bytes32 format), extract the last 40 chars (20 bytes)
    if (ipId.startsWith('0x000000000000000000000000')) {
      return '0x' + ipId.slice(-40);
    }
    return ipId;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <FileText className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-4">My Licenses</h1>
            <p className="text-gray-400 mb-8">
              Connect your wallet to view your licensed IP data
            </p>
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 max-w-md mx-auto">
              <p className="text-gray-300">
                Please connect your wallet to access your licenses
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">My Licenses</h1>
            <p className="text-gray-400 mb-8">
              Sign a message to securely access your licensed data
            </p>
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 max-w-md mx-auto">
              <p className="text-gray-300 mb-6">
                To protect your licensed IP intelligence data, we use wallet signature
                authentication. This is free and doesn't require a transaction.
              </p>
              <button
                onClick={handleAuthenticate}
                disabled={isAuthenticating}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_30px_rgba(249,115,22,0.3)]"
              >
                {isAuthenticating ? 'Authenticating...' : 'Sign Message to Continue'}
              </button>
              {authError && (
                <p className="text-red-400 text-sm mt-4">{authError}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Licenses</h1>
          <p className="text-gray-400">
            Access the IP intelligence data you've licensed
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('licenses')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'licenses'
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]'
                : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              My Licenses
            </span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]'
                : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Usage Analytics
            </span>
          </button>
          <button
            onClick={() => setActiveTab('sdk')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'sdk'
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]'
                : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              SDK Usage
            </span>
          </button>
        </div>

        {/* Licenses Tab Content */}
        {activeTab === 'licenses' && (
          <>
            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-gray-400 mt-4">Loading your licenses...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && licenses.length === 0 && (
              <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-12 text-center">
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  No licenses yet
                </h3>
                <p className="text-gray-400 mb-6">
                  You haven't purchased any IP data licenses yet.
                </p>
                <button
                  onClick={() => onNavigate('licensing')}
                  className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-[0_0_30px_rgba(249,115,22,0.3)]"
                >
                  Browse Available Licenses
                </button>
              </div>
            )}

            {/* Licenses List */}
            {!isLoading && licenses.length > 0 && (
          <div className="space-y-4">
            {licenses.map((license, index) => (
              <motion.div
                key={license.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-orange-500/50 transition-all group"
              >
                <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-white">
                        {license.ipAssetName || `IP Asset ${formatIpAssetId(license.ipAssetId).slice(0, 10)}...`}
                      </h3>
                      {license.isActive && !isExpired(license.expiresAt) ? (
                        <span className="flex items-center gap-1 bg-green-500/20 text-green-400 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 bg-gray-700/50 text-gray-400 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" />
                          Expired
                        </span>
                      )}
                      {isExpiringSoon(license.expiresAt) && (
                        <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          Expiring Soon
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                      <div>
                        <p className="text-gray-500">License Type</p>
                        <p className="text-white font-medium">{license.licenseType}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Price Paid</p>
                        <p className="text-white font-medium">{formatPrice(license.pricePaid)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Purchased</p>
                        <p className="text-white font-medium">{formatDate(license.purchasedAt)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Expires</p>
                        <p className="text-white font-medium">{formatDate(license.expiresAt)}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs text-gray-500">IP Asset ID</p>
                      <p className="text-xs text-gray-400 font-mono break-all">{formatIpAssetId(license.ipAssetId)}</p>
                    </div>
                  </div>

                  <div className="lg:ml-4">
                    <button
                      onClick={() => onNavigate('ip-intelligence', license.ipAssetId)}
                      disabled={!license.isActive || isExpired(license.expiresAt)}
                      className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] group-hover:shadow-[0_0_30px_rgba(249,115,22,0.4)]"
                    >
                      View Data
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
            )}
          </>
        )}

        {/* Analytics Tab Content */}
        {activeTab === 'analytics' && (
          <div>
            {/* License Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select a license to view analytics
              </label>
              <select
                value={selectedLicenseForAnalytics || ''}
                onChange={(e) => setSelectedLicenseForAnalytics(e.target.value || null)}
                className="w-full max-w-lg px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option value="">-- Choose a licensed IP asset --</option>
                {licenses
                  .filter((l) => l.isActive && !isExpired(l.expiresAt))
                  .map((license) => (
                    <option key={license.id} value={license.ipAssetId}>
                      {license.ipAssetName || `IP Asset ${formatIpAssetId(license.ipAssetId).slice(0, 10)}...`} - {license.licenseType}
                    </option>
                  ))}
              </select>
            </div>

            {/* Usage Data Loading State */}
            {isLoadingUsageData && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-gray-400 mt-4">Loading usage analytics...</p>
              </div>
            )}

            {/* Usage Data Error State */}
            {usageDataError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                <p className="text-red-400">{usageDataError}</p>
              </div>
            )}

            {/* Usage Data Display */}
            {!isLoadingUsageData && usageData && (
              <div className="space-y-6">
                {/* Overview Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-400 text-sm">Total Licenses</p>
                      <FileText className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">{formatNumber(usageData.licensingSummary.totalLicensesSold)}</p>
                    <p className="text-sm text-green-400 mt-1">{formatNumber(usageData.licensingSummary.activeLicenses)} active</p>
                  </div>

                  <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-400 text-sm">Total Revenue</p>
                      <DollarSign className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">
                      {formatRevenue(usageData.licensingSummary.totalRevenue)}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">IP tokens</p>
                  </div>

                  <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-400 text-sm">Provenance Score</p>
                      <CheckCircle className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">{usageData.provenance.yakoaScore}/100</p>
                    <p className="text-sm text-gray-400 mt-1 capitalize">{usageData.provenance.status}</p>
                  </div>

                  <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-400 text-sm">CVS Score</p>
                      <TrendingUp className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">{formatCVS(usageData.cvs.currentScore)}</p>
                    {usageData.cvs.rank > 0 && (
                      <p className="text-sm text-gray-400 mt-1">Rank #{formatNumber(usageData.cvs.rank)}</p>
                    )}
                  </div>
                </div>

                {/* License Type Breakdown */}
                <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">License Type Distribution</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-900/50 p-4 rounded-xl text-center">
                      <p className="text-gray-400 text-sm mb-2">Standard</p>
                      <p className="text-3xl font-bold text-white">{formatNumber(usageData.licensingSummary.licenseTypeBreakdown.standard)}</p>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-xl text-center">
                      <p className="text-gray-400 text-sm mb-2">Commercial</p>
                      <p className="text-3xl font-bold text-white">{formatNumber(usageData.licensingSummary.licenseTypeBreakdown.commercial)}</p>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-xl text-center">
                      <p className="text-gray-400 text-sm mb-2">Exclusive</p>
                      <p className="text-3xl font-bold text-white">{formatNumber(usageData.licensingSummary.licenseTypeBreakdown.exclusive)}</p>
                    </div>
                  </div>
                </div>

                {/* Story Protocol Usage Stats */}
                {usageData.storyProtocolStats && (
                  <div className="bg-gradient-to-br from-orange-900/20 to-amber-900/20 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Activity className="w-5 h-5 text-orange-400" />
                      <h3 className="text-xl font-bold text-white">
                        Story Protocol Usage Stats
                      </h3>
                      <span className="ml-2 bg-orange-500/20 text-orange-400 text-xs font-medium px-2 py-0.5 rounded-full">
                        On-Chain
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-900/40 rounded-xl p-4 border border-gray-700/30">
                        <div className="flex items-center gap-2 mb-2">
                          <GitBranch className="w-4 h-4 text-orange-400" />
                          <p className="text-sm text-gray-400">Direct Derivatives</p>
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {formatNumber(usageData.storyProtocolStats.directDerivatives)}
                        </p>
                      </div> 
                      <div className="bg-gray-900/40 rounded-xl p-4 border border-gray-700/30">
                        <div className="flex items-center gap-2 mb-2">
                          <GitBranch className="w-4 h-4 text-amber-400" />
                          <p className="text-sm text-gray-400">Total Descendants</p>
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {formatNumber(usageData.storyProtocolStats.totalDescendants)}
                        </p>
                      </div>
                      <div className="bg-gray-900/40 rounded-xl p-4 border border-gray-700/30">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-blue-400" />
                          <p className="text-sm text-gray-400">License Tokens</p>
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {formatNumber(usageData.storyProtocolStats.licenseTokensIssued)}
                        </p>
                      </div>
                      <div className="bg-gray-900/40 rounded-xl p-4 border border-gray-700/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-4 h-4 text-green-400" />
                          <p className="text-sm text-gray-400">Transactions</p>
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {formatNumber(usageData.storyProtocolStats.totalTransactions)}
                        </p>
                      </div>
                    </div>

                    {/* IP Lineage */}
                    {(usageData.storyProtocolStats.parentIPs > 0 || usageData.storyProtocolStats.ancestorIPs > 0) && (
                      <div className="mb-6 bg-gray-900/40 rounded-xl p-4 border border-gray-700/30">
                        <h4 className="text-sm font-medium text-gray-400 mb-3">IP Lineage</h4>
                        <div className="flex gap-6">
                          <div>
                            <span className="text-gray-500 text-sm">Parent IPs:</span>
                            <span className="ml-2 text-white font-semibold">{usageData.storyProtocolStats.parentIPs}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-sm">Ancestor IPs:</span>
                            <span className="ml-2 text-white font-semibold">{usageData.storyProtocolStats.ancestorIPs}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recent Transactions */}
                    {usageData.storyProtocolStats.recentTransactions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-3">Recent On-Chain Activity</h4>
                        <div className="space-y-2">
                          {usageData.storyProtocolStats.recentTransactions.slice(0, 5).map((tx, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-sm bg-gray-900/50 border border-gray-700/30 p-3 rounded-lg"
                            >
                              <span className="bg-orange-500/20 text-orange-400 text-xs font-medium px-2 py-0.5 rounded">
                                {tx.eventType}
                              </span>
                              <span className="text-gray-400 font-mono text-xs">
                                {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                              </span>
                              <span className="text-gray-500 text-xs">
                                Block #{tx.blockNumber}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Usage Analytics Section (Mock Data for Hackathon) */}
                {usageData.mockUsageAnalytics && (
                  <div className="p-6 bg-gray-900/30 border-t border-gray-700/50">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full">
                        <span className="text-orange-400 text-xs font-medium">📊 Usage Analytics</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white">Platform Usage Data</h3>
                    </div>

                    {/* API Calls & Content Access Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
                        <p className="text-sm text-gray-400 mb-1">Total API Calls</p>
                        <p className="text-2xl font-bold text-white">{formatNumber(usageData.mockUsageAnalytics.apiCalls.total)}</p>
                        <p className="text-xs text-green-400">+{formatNumber(usageData.mockUsageAnalytics.apiCalls.last24h)} today</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
                        <p className="text-sm text-gray-400 mb-1">Downloads</p>
                        <p className="text-2xl font-bold text-white">{formatNumber(usageData.mockUsageAnalytics.contentAccess.downloads)}</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
                        <p className="text-sm text-gray-400 mb-1">Total Views</p>
                        <p className="text-2xl font-bold text-white">{formatNumber(usageData.mockUsageAnalytics.contentAccess.views)}</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
                        <p className="text-sm text-gray-400 mb-1">Unique Users</p>
                        <p className="text-2xl font-bold text-white">{formatNumber(usageData.mockUsageAnalytics.contentAccess.uniqueUsers)}</p>
                      </div>
                    </div>

                    {/* Geographic Distribution */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Geographic Distribution</h4>
                      <div className="space-y-2">
                        {usageData.mockUsageAnalytics.geographicDistribution.map((geo, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <span className="text-white text-sm w-32">{geo.country}</span>
                            <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-orange-500/80 to-orange-400/60"
                                style={{ width: `${geo.percentage}%` }}
                              />
                            </div>
                            <span className="text-gray-400 text-sm w-16 text-right">{geo.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Platform Usage */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-400 mb-3">AI Platform Usage</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {usageData.mockUsageAnalytics.platformUsage.map((platform, idx) => (
                          <div key={idx} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/30">
                            <p className="text-white text-sm font-medium truncate">{platform.platform}</p>
                            <p className="text-orange-400 font-bold">{formatNumber(platform.usageCount)} uses</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Training Detection */}
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-400">AI Training Dataset Detection</h4>
                        {usageData.mockUsageAnalytics.aiTrainingDetection.foundInDatasets > 0 ? (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                            ⚠️ Detected
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                            ✓ Not Found
                          </span>
                        )}
                      </div>
                      {usageData.mockUsageAnalytics.aiTrainingDetection.foundInDatasets > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-300">
                            Found in <span className="text-amber-400 font-semibold">{usageData.mockUsageAnalytics.aiTrainingDetection.foundInDatasets}</span> training datasets
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {usageData.mockUsageAnalytics.aiTrainingDetection.datasetNames.map((name, idx) => (
                              <span key={idx} className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded">
                                {name}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">
                            Estimated {usageData.mockUsageAnalytics.aiTrainingDetection.estimatedModelsUsingIP} models may be using this IP
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty State for Analytics */}
            {!selectedLicenseForAnalytics && !isLoadingUsageData && (
              <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-12 text-center">
                <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  No license selected
                </h3>
                <p className="text-gray-400">
                  Select a license from the dropdown above to view usage analytics
                </p>
              </div>
            )}
          </div>
        )}

        {/* SDK Usage Tab Content */}
        {activeTab === 'sdk' && (
          <div className="space-y-6">
            {/* Introduction */}
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Programmatic Access via SDK</h2>
              <p className="text-gray-300 mb-4">
                Access your licensed IP intelligence data programmatically using the Atlas Protocol SDK.
                The SDK provides a simple, type-safe interface to query global usage data, infringement
                detection, derivative works, and more.
              </p>
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                <p className="text-cyan-300 text-sm">
                  <strong>Note:</strong> You must have an active license for an IP asset to access its usage data via the SDK.
                </p>
              </div>
            </div>

            {/* Installation */}
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">1. Installation</h3>
              <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm">
                <code className="text-green-400">npm install @atlas-protocol/sdk</code>
              </div>
              <p className="text-gray-400 text-sm mt-2">or</p>
              <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm mt-2">
                <code className="text-green-400">yarn add @atlas-protocol/sdk</code>
              </div>
            </div>

            {/* Authentication */}
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">2. Authentication</h3>
              <p className="text-gray-300 mb-4">
                Authenticate using your wallet to prove license ownership:
              </p>
              <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                <pre className="text-gray-300">
{`import { AtlasClient } from '@atlas-protocol/sdk';
import { privateKeyToAccount } from 'viem/accounts';

// Initialize with your wallet
const account = privateKeyToAccount('0x...');
const client = new AtlasClient({
  account,
  backendUrl: '${BACKEND_URL}',
});

// Authenticate (signs a message to prove ownership)
await client.authenticate();`}
                </pre>
              </div>
            </div>

            {/* Fetching Usage Data */}
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">3. Fetching Usage Data</h3>
              <p className="text-gray-300 mb-4">
                Query comprehensive usage intelligence for licensed IP assets:
              </p>
              <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                <pre className="text-gray-300">
{`// Get global usage data for an IP asset
const usageData = await client.getUsageData('0xIPAssetAddress...');

console.log(usageData);
// {
//   ipId: '0x...',
//   ipAssetName: 'My IP Asset',
//   globalUsage: {
//     totalDetections: 42,
//     authorizedUses: 35,
//     unauthorizedUses: 7,
//     platforms: ['TikTok', 'Instagram', 'YouTube'],
//     derivatives: 5,
//     lastDetectedAt: '2024-12-04T10:30:00Z'
//   },
//   infringements: [...],
//   authorizations: [...],
//   derivatives: [...],
//   provenance: {
//     yakoaScore: 92,
//     verified: true,
//     confidence: 0.95,
//     status: 'verified'
//   },
//   cvs: { currentScore: '1250000000000000000', rank: 42 },
//   licensingSummary: { ... },
//   storyProtocolStats: {
//     directDerivatives: 3,
//     totalDescendants: 8,
//     licenseTokensIssued: 15,
//     totalTransactions: 47
//   },
//   mockUsageAnalytics: {
//     apiCalls: { total: 25000, last24h: 850 },
//     contentAccess: { downloads: 3200, views: 18500 },
//     geographicDistribution: [{ country: 'US', percentage: 45 }],
//     platformUsage: [{ platform: 'OpenAI GPT-4', usageCount: 1200 }],
//     aiTrainingDetection: { foundInDatasets: 2, datasetNames: ['LAION-5B'] }
//   }
// }`}
                </pre>
              </div>
            </div>

            {/* Response Fields */}
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">4. Response Fields</h3>
              <div className="space-y-3">
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <p className="text-orange-400 font-semibold">globalUsage</p>
                  <p className="text-gray-400 text-sm">Where and how your IP is being used worldwide</p>
                </div>
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <p className="text-orange-400 font-semibold">infringements</p>
                  <p className="text-gray-400 text-sm">Detected unauthorized uses via Yakoa AI</p>
                </div>
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <p className="text-orange-400 font-semibold">authorizations</p>
                  <p className="text-gray-400 text-sm">Legitimate authorized uses across platforms</p>
                </div>
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <p className="text-orange-400 font-semibold">derivatives</p>
                  <p className="text-gray-400 text-sm">On-chain derivative works and remixes</p>
                </div>
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <p className="text-orange-400 font-semibold">provenance</p>
                  <p className="text-gray-400 text-sm">Originality score and verification status</p>
                </div>
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <p className="text-orange-400 font-semibold">cvs</p>
                  <p className="text-gray-400 text-sm">Content Value Score from Story Protocol</p>
                </div>
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <p className="text-orange-400 font-semibold">storyProtocolStats</p>
                  <p className="text-gray-400 text-sm">On-chain derivatives, license tokens, and transactions from Story Protocol API</p>
                </div>
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <p className="text-purple-400 font-semibold">mockUsageAnalytics</p>
                  <p className="text-gray-400 text-sm">Platform usage data: API calls, downloads, geographic distribution, AI training detection</p>
                </div>
              </div>
            </div>

            {/* Additional Resources */}
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Additional Resources</h3>
              <div className="space-y-2">
                <a
                  href="https://github.com/atlas-protocol/sdk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-orange-400 hover:text-orange-300 transition-colors"
                >
                  → SDK Documentation
                </a>
                <a
                  href="https://github.com/atlas-protocol/examples"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-orange-400 hover:text-orange-300 transition-colors"
                >
                  → Code Examples
                </a>
                <a
                  href="https://docs.atlas-protocol.com/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-orange-400 hover:text-orange-300 transition-colors"
                >
                  → API Reference
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
