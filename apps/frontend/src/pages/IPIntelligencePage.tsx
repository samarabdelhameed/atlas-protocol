/**
 * IP Intelligence Dashboard
 *
 * Comprehensive dashboard showing all licensed IP intelligence data:
 * - Originality scores from Yakoa
 * - Story Protocol usage stats (derivatives, licenses, transactions)
 * - Market metrics (sales, pricing, demand)
 * - CVS scores and vault financials
 * - Historical performance data
 */

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useLicenseAuth } from '../hooks/useLicenseAuth';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, DollarSign, ShieldCheck, Lock, GitBranch, FileText, Activity } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface IPAssetData {
  id: string;
  name: string;
  description: string;
  creator: string;
  ipHash: string;
  timestamp: string;
  commercialUse: boolean;
  derivatives: boolean;
  royaltyPercent: string;
  cvsScore: string;
  totalLicenseRevenue: string;
  totalUsageCount: string;
  totalRemixes: string;
  vault: {
    vaultAddress: string;
    currentCVS: string;
    maxLoanAmount: string;
    interestRate: string;
    totalLiquidity: string;
    utilizationRate: string;
  } | null;
  originality: {
    score: number;
    confidence: number;
    verified: boolean;
  } | null;
  marketMetrics: {
    totalLicensesSold: number;
    averagePrice: string;
    recentSales: Array<{
      buyer: string;
      price: string;
      timestamp: string;
    }>;
  };
  // NEW: Story Protocol on-chain usage stats
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
}

interface IPIntelligencePageProps {
  ipAssetId: string | null;
  onNavigate: (page: string) => void;
}

export default function IPIntelligencePage({ ipAssetId, onNavigate }: IPIntelligencePageProps) {
  const { address, isConnected } = useAccount();
  const { isAuthenticated, getAuthHeader } = useLicenseAuth();

  const [data, setData] = useState<IPAssetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && isAuthenticated && ipAssetId) {
      fetchIPAssetData();
    }
  }, [isConnected, isAuthenticated, ipAssetId]);

  const fetchIPAssetData = async () => {
    if (!ipAssetId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/ip-data/${ipAssetId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch IP asset data');
      }

      const ipData = await response.json();
      setData(ipData);
    } catch (err: any) {
      console.error('Error fetching IP asset data:', err);
      setError(err.message || 'Failed to load IP intelligence data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatEth = (wei: string) => {
    return (Number(wei) / 1e18).toFixed(4);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Convert bytes32 IP ID to clean address format
  const formatIpAssetId = (ipId: string) => {
    // If it has leading zeros (bytes32 format), extract the last 40 chars (20 bytes)
    if (ipId.startsWith('0x000000000000000000000000')) {
      return '0x' + ipId.slice(-40);
    }
    return ipId;
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

  if (!isConnected || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Lock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-4">
              Authentication Required
            </h1>
            <p className="text-gray-400 mb-8">
              Please authenticate to view IP intelligence data
            </p>
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 max-w-md mx-auto">
              <button
                onClick={() => onNavigate('my-licenses')}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-[0_0_30px_rgba(249,115,22,0.3)]"
              >
                Go to My Licenses
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading IP intelligence data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-red-400 mb-3">Error</h3>
            <p className="text-red-400/90 mb-6">{error}</p>
            <button
              onClick={() => onNavigate('my-licenses')}
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)]"
            >
              ← Back to My Licenses
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => onNavigate('my-licenses')}
            className="text-orange-500 hover:text-orange-400 font-medium mb-6 flex items-center gap-2 transition-colors"
          >
            ← Back to My Licenses
          </button>
          <h1 className="text-4xl font-bold text-white mb-3">{data.name}</h1>
          <p className="text-gray-400 text-lg mb-2">{data.description}</p>
          <p className="text-sm text-gray-500">
            Created {formatDate(data.timestamp)}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Originality Score */}
          {data.originality && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all group"
            >
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">
                  Originality Score
                </h3>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-400 mb-2">
                  {data.originality.score}
                </div>
                <p className="text-sm text-gray-500">out of 100</p>
                <div className="mt-4">
                  <p className="text-sm text-gray-400">
                    Confidence: {data.originality.confidence}%
                  </p>
                  {data.originality.verified && (
                    <span className="inline-flex items-center gap-1 mt-2 bg-green-500/20 text-green-400 text-xs font-medium px-2.5 py-1 rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* CVS Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all group"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">CVS Score</h3>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-400 mb-2">
                {formatCVS(data.cvsScore)}
              </div>
              <p className="text-sm text-gray-500">Collateral Value Score</p>
            </div>
          </motion.div>

          {/* Total Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-green-500/50 transition-all group"
          >
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">
                License Revenue
              </h3>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-green-400 mb-2">
                {formatEth(data.totalLicenseRevenue)}
              </div>
              <p className="text-sm text-gray-500">ETH</p>
              <p className="text-sm text-gray-400 mt-2">
                {data.totalUsageCount} licenses sold
              </p>
            </div>
          </motion.div>
        </div>

        {/* Story Protocol Usage Stats */}
        {data.storyProtocolStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-6 bg-gradient-to-br from-orange-900/20 to-amber-900/20 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-semibold text-white">
                Story Protocol Usage Analytics
              </h3>
              <span className="ml-2 bg-orange-500/20 text-orange-400 text-xs font-medium px-2 py-0.5 rounded-full">
                On-Chain
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-gray-900/40 rounded-xl p-4 border border-gray-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <GitBranch className="w-4 h-4 text-orange-400" />
                  <p className="text-sm text-gray-400">Direct Derivatives</p>
                </div>
                <p className="text-3xl font-bold text-white">
                  {data.storyProtocolStats.directDerivatives}
                </p>
              </div>
              <div className="bg-gray-900/40 rounded-xl p-4 border border-gray-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <GitBranch className="w-4 h-4 text-amber-400" />
                  <p className="text-sm text-gray-400">Total Descendants</p>
                </div>
                <p className="text-3xl font-bold text-white">
                  {data.storyProtocolStats.totalDescendants}
                </p>
              </div>
              <div className="bg-gray-900/40 rounded-xl p-4 border border-gray-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <p className="text-sm text-gray-400">License Tokens</p>
                </div>
                <p className="text-3xl font-bold text-white">
                  {data.storyProtocolStats.licenseTokensIssued}
                </p>
              </div>
              <div className="bg-gray-900/40 rounded-xl p-4 border border-gray-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-green-400" />
                  <p className="text-sm text-gray-400">Transactions</p>
                </div>
                <p className="text-3xl font-bold text-white">
                  {data.storyProtocolStats.totalTransactions}
                </p>
              </div>
            </div>

            {/* IP Lineage */}
            {(data.storyProtocolStats.parentIPs > 0 || data.storyProtocolStats.ancestorIPs > 0) && (
              <div className="mb-6 bg-gray-900/40 rounded-xl p-4 border border-gray-700/30">
                <h4 className="text-sm font-medium text-gray-400 mb-3">IP Lineage</h4>
                <div className="flex gap-6">
                  <div>
                    <span className="text-gray-500 text-sm">Parent IPs:</span>
                    <span className="ml-2 text-white font-semibold">{data.storyProtocolStats.parentIPs}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Ancestor IPs:</span>
                    <span className="ml-2 text-white font-semibold">{data.storyProtocolStats.ancestorIPs}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            {data.storyProtocolStats.recentTransactions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3">Recent On-Chain Activity</h4>
                <div className="space-y-2">
                  {data.storyProtocolStats.recentTransactions.slice(0, 5).map((tx, idx) => (
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
          </motion.div>
        )}

        {/* Market Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6">
            Market Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-2">Total Licenses Sold</p>
              <p className="text-3xl font-bold text-white">
                {data.marketMetrics.totalLicensesSold}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Average License Price</p>
              <p className="text-3xl font-bold text-white">
                {formatEth(data.marketMetrics.averagePrice)} ETH
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Total Remixes</p>
              <p className="text-3xl font-bold text-white">
                {data.totalRemixes}
              </p>
            </div>
          </div>

          {/* Recent Sales */}
          {data.marketMetrics.recentSales.length > 0 && (
            <div className="mt-8">
              <h4 className="text-sm font-medium text-white mb-4">
                Recent Sales
              </h4>
              <div className="space-y-2">
                {data.marketMetrics.recentSales.map((sale, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm bg-gray-900/50 border border-gray-700/30 p-4 rounded-xl"
                  >
                    <span className="text-gray-400 font-mono">
                      {sale.buyer.slice(0, 6)}...{sale.buyer.slice(-4)}
                    </span>
                    <span className="font-semibold text-green-400">
                      {formatEth(sale.price)} ETH
                    </span>
                    <span className="text-gray-500">
                      {formatDate(sale.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Vault Financials */}
        {data.vault && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-6">
              Vault Financials
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-2">Current CVS</p>
                <p className="text-2xl font-bold text-white">
                  {formatCVS(data.vault.currentCVS)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Max Loan Amount</p>
                <p className="text-2xl font-bold text-white">
                  {formatEth(data.vault.maxLoanAmount)} ETH
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Interest Rate</p>
                <p className="text-2xl font-bold text-white">
                  {Number(data.vault.interestRate) / 100}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Total Liquidity</p>
                <p className="text-2xl font-bold text-white">
                  {formatEth(data.vault.totalLiquidity)} ETH
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Licensing Terms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6">
            Licensing Terms
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-2">Commercial Use</p>
              <p className={`text-xl font-semibold ${data.commercialUse ? 'text-green-400' : 'text-red-400'}`}>
                {data.commercialUse ? '✓ Allowed' : '✗ Not Allowed'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Derivatives</p>
              <p className={`text-xl font-semibold ${data.derivatives ? 'text-green-400' : 'text-red-400'}`}>
                {data.derivatives ? '✓ Allowed' : '✗ Not Allowed'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Royalty Percentage</p>
              <p className="text-xl font-semibold text-white">
                {Number(data.royaltyPercent) / 100}%
              </p>
            </div>
          </div>
        </motion.div>

        {/* Technical Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-6 bg-gray-900/50 border border-gray-700/50 rounded-2xl p-6"
        >
          <h3 className="text-sm font-semibold text-gray-400 mb-4">
            Technical Details
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
              <span className="text-gray-500">IP Asset Address:</span>
              <span className="text-gray-300 font-mono break-all">{formatIpAssetId(data.id)}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
              <span className="text-gray-500">Creator:</span>
              <span className="text-gray-300 font-mono break-all">{data.creator}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
              <span className="text-gray-500">IP Hash:</span>
              <span className="text-gray-300 font-mono break-all">{formatIpAssetId(data.ipHash)}</span>
            </div>
            {data.vault && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                <span className="text-gray-500">Vault Address:</span>
                <span className="text-gray-300 font-mono break-all">
                  {data.vault.vaultAddress}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
