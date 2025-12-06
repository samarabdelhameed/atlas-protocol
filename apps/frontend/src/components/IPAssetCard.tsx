import { motion } from 'framer-motion';
import { useState } from 'react';
import { X, ExternalLink, Info } from 'lucide-react';

interface IPAssetCardProps {
  vaultAddress: string;
  ipId: string;
  metadata: {
    name: string;
    description: string;
    thumbnailURI?: string;
    category?: string;
  };
  cvsScore: string;
  totalLicensesSold: number;
  totalRevenue: string;
  onBuyLicense: (vaultAddress: string, ipId: string) => void;
}

export default function IPAssetCard({
  vaultAddress,
  ipId,
  metadata,
  cvsScore,
  totalLicensesSold,
  totalRevenue,
  onBuyLicense,
}: IPAssetCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-cyan-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:shadow-[0_0_50px_rgba(6,182,212,0.3)] transition-all duration-300"
      >
        {/* Thumbnail */}
        {metadata.thumbnailURI ? (
          <img
            src={metadata.thumbnailURI}
            alt={metadata.name}
            className="w-full h-48 object-cover rounded-xl mb-4"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-xl mb-4 flex items-center justify-center">
            <div className="text-cyan-500/50 text-6xl">🎨</div>
          </div>
        )}

        {/* Category Badge */}
        {metadata.category && (
          <div className="inline-block px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full mb-3 font-medium">
            {metadata.category}
          </div>
        )}

        {/* Title */}
        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-2">
          {metadata.name}
        </h3>

        {/* Description with View Details */}
        <div className="mb-4">
          <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
            {metadata.description || 'No description available'}
          </p>
          {metadata.description && metadata.description.length > 100 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(true);
              }}
              className="text-cyan-400 text-xs mt-1 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <Info className="w-3 h-3" />
              View Details
            </button>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-cyan-500/10 rounded-lg p-2.5 border border-cyan-500/20">
            <div className="text-cyan-400 text-xs mb-1 font-medium">CVS Score</div>
            <div className="text-white font-bold text-base truncate" title={`${(Number(cvsScore) / 1e18).toFixed(4)} IP`}>
              {(() => {
                const cvsInStory = Number(cvsScore) / 1e18;
                return cvsInStory >= 1000000
                  ? `${(cvsInStory / 1000000).toFixed(1)}M`
                  : cvsInStory >= 1000
                  ? `${(cvsInStory / 1000).toFixed(1)}K`
                  : cvsInStory >= 1
                  ? cvsInStory.toFixed(2)
                  : cvsInStory.toFixed(4);
              })()}
            </div>
          </div>
          <div className="bg-orange-500/10 rounded-lg p-2.5 border border-orange-500/20">
            <div className="text-orange-400 text-xs mb-1 font-medium">Licenses</div>
            <div className="text-white font-bold text-base">{totalLicensesSold}</div>
          </div>
          <div className="bg-green-500/10 rounded-lg p-2.5 border border-green-500/20">
            <div className="text-green-400 text-xs mb-1 font-medium">Revenue</div>
            <div className="text-white font-bold text-base truncate" title={`${(Number(totalRevenue) / 1e18).toFixed(4)} IP`}>
              {(Number(totalRevenue) / 1e18).toFixed(2)}
            </div>
          </div>
        </div>

        {/* IP ID (truncated) */}
        <div className="text-gray-500 text-xs mb-4 font-mono bg-gray-800/50 px-2 py-1 rounded">
          IP: {ipId ? `${ipId.slice(0, 10)}...${ipId.slice(-8)}` : 'N/A'}
        </div>

        {/* Buy Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onBuyLicense(vaultAddress, ipId)}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] transition-all duration-300"
        >
          Buy Usage Analytics License
        </motion.button>
      </motion.div>

      {/* Details Modal */}
      {showDetails && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowDetails(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900 border border-cyan-500/30 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-[0_0_50px_rgba(6,182,212,0.3)]"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                {metadata.name}
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Thumbnail in Modal */}
            {metadata.thumbnailURI && (
              <img
                src={metadata.thumbnailURI}
                alt={metadata.name}
                className="w-full h-48 object-cover rounded-xl mb-4"
              />
            )}

            {/* Category */}
            {metadata.category && (
              <div className="inline-block px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full mb-4 font-medium">
                {metadata.category}
              </div>
            )}

            {/* Full Description */}
            <div className="mb-6">
              <h4 className="text-gray-400 text-sm font-medium mb-2">Description</h4>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {metadata.description || 'No description available'}
              </p>
            </div>

            {/* IP Asset Info */}
            <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
              <h4 className="text-gray-400 text-sm font-medium mb-3">Asset Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">IP Asset ID</span>
                  <span className="text-white font-mono text-xs">{ipId ? `${ipId.slice(0, 14)}...${ipId.slice(-10)}` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Vault Address</span>
                  <span className="text-white font-mono text-xs">{vaultAddress.slice(0, 10)}...{vaultAddress.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">CVS Score</span>
                  <span className="text-cyan-400 font-bold">{(Number(cvsScore) / 1e18).toFixed(4)} IP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Total Revenue</span>
                  <span className="text-green-400 font-bold">{(Number(totalRevenue) / 1e18).toFixed(4)} IP</span>
                </div>
              </div>
            </div>

            {/* View on Explorer Link */}
            <a
              href={`https://aeneid.storyscan.io/address/${ipId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm mb-4 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View on Story Explorer
            </a>

            {/* Buy License Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowDetails(false);
                onBuyLicense(vaultAddress, ipId);
              }}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] transition-all duration-300"
            >
              Buy Usage Analytics License
            </motion.button>
          </motion.div>
        </div>
      )}
    </>
  );
}

