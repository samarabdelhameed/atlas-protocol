import { motion } from 'framer-motion';

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-cyan-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:shadow-[0_0_50px_rgba(6,182,212,0.3)] transition-all duration-300 cursor-pointer"
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

      {/* Description */}
      <p className="text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed">
        {metadata.description}
      </p>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-cyan-500/10 rounded-lg p-3 border border-cyan-500/20">
          <div className="text-cyan-400 text-xs mb-1 font-medium">CVS Score</div>
          <div className="text-white font-bold text-lg">
            {Number(cvsScore).toLocaleString()}
          </div>
        </div>
        <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
          <div className="text-orange-400 text-xs mb-1 font-medium">Licenses Sold</div>
          <div className="text-white font-bold text-lg">{totalLicensesSold}</div>
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
  );
}
