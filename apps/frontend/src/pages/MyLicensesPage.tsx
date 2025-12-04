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
import { FileText, Clock, CheckCircle, XCircle, BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';

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
  totalLicensesSold: number;
  totalRevenue: string;
  activeLicenses: number;
  provenance: {
    score: number;
    originality: number;
    confidence: number;
    status: 'verified' | 'unverified' | 'pending' | 'unavailable';
  };
  cvs: {
    currentScore: string;
    rank: number;
    history: Array<{ timestamp: string; score: string }>;
  };
  recentPurchases: Array<{
    licensee: string;
    amount: string;
    purchasedAt: string;
    tierName: string;
  }>;
  licenseTypeBreakdown: {
    standard: number;
    commercial: number;
    exclusive: number;
  };
  revenueByMonth: Array<{
    month: string;
    revenue: string;
    licenses: number;
  }>;
  analytics: {
    uniqueLicensees: number;
    averagePrice: string;
    last7Days: {
      newLicenses: number;
      revenue: string;
    };
    last30Days: {
      newLicenses: number;
      revenue: string;
    };
  };
}

interface MyLicensesPageProps {
  onNavigate: (page: string, ipAssetId?: string) => void;
}

export default function MyLicensesPage({ onNavigate }: MyLicensesPageProps) {
  const { address, isConnected } = useAccount();
  const { isAuthenticated, isAuthenticating, authenticate, error: authError, authToken } = useLicenseAuth();

  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tab management
  const [activeTab, setActiveTab] = useState<'licenses' | 'analytics'>('licenses');

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
    if (selectedLicenseForAnalytics && authToken) {
      fetchUsageData(selectedLicenseForAnalytics);
    }
  }, [selectedLicenseForAnalytics, authToken]);

  const fetchLicenses = async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/licenses/${address}`);

      if (!response.ok) {
        throw new Error('Failed to fetch licenses');
      }

      const data = await response.json();
      setLicenses(data.licenses || []);
    } catch (err: any) {
      console.error('Error fetching licenses:', err);
      setError(err.message || 'Failed to load licenses');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsageData = async (ipAssetId: string) => {
    if (!authToken) {
      setUsageDataError('Authentication required');
      return;
    }

    setIsLoadingUsageData(true);
    setUsageDataError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/usage-data/${ipAssetId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
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
                    <p className="text-3xl font-bold text-white">{usageData.totalLicensesSold}</p>
                    <p className="text-sm text-green-400 mt-1">{usageData.activeLicenses} active</p>
                  </div>

                  <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-400 text-sm">Total Revenue</p>
                      <DollarSign className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">
                      {(Number(usageData.totalRevenue) / 1e18).toFixed(4)}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">STORY tokens</p>
                  </div>

                  <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-400 text-sm">Provenance Score</p>
                      <CheckCircle className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">{usageData.provenance.score}/100</p>
                    <p className="text-sm text-gray-400 mt-1 capitalize">{usageData.provenance.status}</p>
                  </div>

                  <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-400 text-sm">CVS Score</p>
                      <TrendingUp className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">{usageData.cvs.currentScore}</p>
                    {usageData.cvs.rank > 0 && (
                      <p className="text-sm text-gray-400 mt-1">Rank #{usageData.cvs.rank}</p>
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-900/50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span className="text-gray-400 text-sm">Last 7 Days</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-300">New Licenses</span>
                          <span className="text-white font-bold">{usageData.analytics.last7Days.newLicenses}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Revenue</span>
                          <span className="text-orange-400 font-bold">
                            {(Number(usageData.analytics.last7Days.revenue) / 1e18).toFixed(4)} STORY
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-900/50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span className="text-gray-400 text-sm">Last 30 Days</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-300">New Licenses</span>
                          <span className="text-white font-bold">{usageData.analytics.last30Days.newLicenses}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Revenue</span>
                          <span className="text-orange-400 font-bold">
                            {(Number(usageData.analytics.last30Days.revenue) / 1e18).toFixed(4)} STORY
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* License Type Breakdown */}
                <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">License Type Distribution</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-900/50 p-4 rounded-xl text-center">
                      <p className="text-gray-400 text-sm mb-2">Standard</p>
                      <p className="text-3xl font-bold text-white">{usageData.licenseTypeBreakdown.standard}</p>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-xl text-center">
                      <p className="text-gray-400 text-sm mb-2">Commercial</p>
                      <p className="text-3xl font-bold text-white">{usageData.licenseTypeBreakdown.commercial}</p>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-xl text-center">
                      <p className="text-gray-400 text-sm mb-2">Exclusive</p>
                      <p className="text-3xl font-bold text-white">{usageData.licenseTypeBreakdown.exclusive}</p>
                    </div>
                  </div>
                </div>

                {/* User Metrics */}
                <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">User Metrics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-900/50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-orange-500" />
                        <span className="text-gray-400 text-sm">Unique Licensees</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{usageData.analytics.uniqueLicensees}</p>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-orange-500" />
                        <span className="text-gray-400 text-sm">Average Price</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {(Number(usageData.analytics.averagePrice) / 1e18).toFixed(4)} STORY
                      </p>
                    </div>
                  </div>
                </div>
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
      </div>
    </div>
  );
}
