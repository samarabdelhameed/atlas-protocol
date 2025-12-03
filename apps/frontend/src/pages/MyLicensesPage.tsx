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
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

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

interface MyLicensesPageProps {
  onNavigate: (page: string, ipAssetId?: string) => void;
}

export default function MyLicensesPage({ onNavigate }: MyLicensesPageProps) {
  const { address, isConnected } = useAccount();
  const { isAuthenticated, isAuthenticating, authenticate, error: authError } = useLicenseAuth();

  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address && isAuthenticated) {
      fetchLicenses();
    }
  }, [isConnected, address, isAuthenticated]);

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
      </div>
    </div>
  );
}
