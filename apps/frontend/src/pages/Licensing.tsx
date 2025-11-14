import { motion } from 'framer-motion';
import { Brain, Sparkles, Database, Zap, CheckCircle2, Star, TrendingUp, Shield, Users, Activity } from 'lucide-react';
import { useState } from 'react';

interface LicensingProps {
  onNavigate?: (page: string) => void;
}

export default function Licensing({ onNavigate }: LicensingProps = {}) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);

  const tiers = [
    {
      id: 'basic',
      name: 'Basic Access',
      price: '$500',
      period: '/month',
      color: 'from-orange-500 to-amber-600',
      cvsImpact: '+25',
      features: [
        'Access to 10 IP datasets',
        'Basic usage analytics',
        'Standard API access',
        'Email support',
        'Monthly updates',
        'Human-verified provenance',
      ],
      popular: false,
    },
    {
      id: 'commercial',
      name: 'Commercial',
      price: '$1,500',
      period: '/month',
      color: 'from-amber-500 to-orange-600',
      cvsImpact: '+80',
      features: [
        'Access to 50+ IP datasets',
        'Advanced analytics dashboard',
        'Priority API access',
        'Dedicated support',
        'Real-time updates',
        'Commercial usage rights',
        'Custom integrations',
        'World ID verified sources',
      ],
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      color: 'from-orange-600 to-red-600',
      cvsImpact: '+200',
      features: [
        'Unlimited IP dataset access',
        'Full analytics suite',
        'Dedicated infrastructure',
        '24/7 premium support',
        'Real-time streaming',
        'White-label options',
        'Custom contracts',
        'On-premise deployment',
        'Direct creator partnerships',
      ],
      popular: false,
    },
  ];

  const dataMetrics = [
    { label: 'Total IP Assets', value: '12,453', icon: Database, color: 'from-orange-500 to-amber-600' },
    { label: 'Human-Verified Creators', value: '3,842', icon: Users, color: 'from-orange-600 to-red-600' },
    { label: 'Goldsky Indexed Events', value: '847K', icon: Activity, color: 'from-green-500 to-emerald-600' },
  ];

  const recentPurchases = [
    { company: 'OpenAI Labs', tier: 'Enterprise', date: '2 hours ago', amount: '$5,000', cvsImpact: '+200', creator: 'Alice Studio' },
    { company: 'AI Research Co', tier: 'Commercial', date: '5 hours ago', amount: '$1,500', cvsImpact: '+80', creator: 'Bob AI Art' },
    { company: 'DataTech AI', tier: 'Commercial', date: '1 day ago', amount: '$1,500', cvsImpact: '+80', creator: 'Carol Music' },
    { company: 'Neural Systems', tier: 'Basic', date: '2 days ago', amount: '$500', cvsImpact: '+25', creator: 'David Stories' },
  ];

  const handlePurchase = (tier: any) => {
    setSelectedTier(tier.id);
    setPurchaseDetails({
      tier: tier.name,
      price: tier.price,
      cvsImpact: tier.cvsImpact,
      txHash: '0x' + Math.random().toString(16).substr(2, 40),
      creatorWallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      estimatedIndexing: '~30 seconds',
    });
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl flex items-center justify-center"
          >
            <Brain className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-5xl font-bold text-white mb-4">GenAI Data Licensing Portal</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            <span className="text-orange-400 font-semibold">Human-verified IP data</span> for compliant AI training •
            Powered by <span className="text-amber-400 font-semibold">World ID</span> & <span className="text-green-400 font-semibold">abv.dev</span>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {dataMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative group"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${metric.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity rounded-2xl`} />
                <div className="relative bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 group-hover:border-orange-500/50 transition-all">
                  <div className={`w-12 h-12 bg-gradient-to-br ${metric.color} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{metric.value}</div>
                  <div className="text-sm text-gray-400">{metric.label}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">Choose Your Plan</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -10 }}
                className="relative group"
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="px-4 py-1 bg-gradient-to-b from-orange-950/40 to-transparent border-2 border-orange-500 text-white text-sm font-bold rounded-full flex items-center gap-1 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                      <Star className="w-4 h-4" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div
                  className={`absolute inset-0 bg-gradient-to-br ${tier.color} opacity-0 group-hover:opacity-10 blur-2xl transition-all duration-500 rounded-3xl`}
                />

                <div
                  className={`relative bg-gray-800/50 backdrop-blur-xl border-2 rounded-3xl p-8 transition-all ${
                    tier.popular
                      ? 'border-orange-500/50'
                      : 'border-gray-700/50 group-hover:border-gray-600/50'
                  }`}
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${tier.color} rounded-2xl flex items-center justify-center mb-4`}>
                    <Brain className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>

                  <div className="flex items-baseline gap-1 mb-2">
                    <span className={`text-5xl font-bold bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}>
                      {tier.price}
                    </span>
                    <span className="text-gray-400 text-lg">{tier.period}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-6 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm font-bold">Creator CVS Impact: {tier.cvsImpact} pts</span>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {tier.features.map((feature, idx) => (
                      <motion.li
                        key={feature}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 + idx * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${tier.popular ? 'text-orange-400' : 'text-amber-400'}`} />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePurchase(tier)}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                      tier.popular
                        ? 'bg-gradient-to-b from-orange-950/40 to-transparent border-2 border-orange-500 text-white shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)]'
                        : 'bg-gradient-to-b from-gray-950/40 to-transparent border-2 border-gray-600 text-white shadow-[0_0_15px_rgba(156,163,175,0.2)] hover:shadow-[0_0_25px_rgba(156,163,175,0.4)]'
                    }`}
                  >
                    {tier.price === 'Custom' ? 'Contact Sales' : 'Purchase License'}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Recent License Purchases</h2>
              <p className="text-gray-400 text-sm">Real-time marketplace activity indexed by Goldsky</p>
            </div>
          </div>

          <div className="space-y-4">
            {recentPurchases.map((purchase, index) => (
              <motion.div
                key={purchase.company}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.01 }}
                className="flex items-center justify-between p-6 bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-orange-500/30 transition-all"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold">{purchase.company}</h3>
                    <p className="text-gray-400 text-sm">{purchase.tier} Tier → {purchase.creator}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-green-400 font-bold text-sm mb-1">{purchase.cvsImpact} CVS</div>
                    <div className="text-gray-500 text-xs">Creator Impact</div>
                  </div>
                  <div className="text-right">
                    <div className="text-orange-400 font-bold text-lg">{purchase.amount}</div>
                    <div className="text-gray-500 text-sm">{purchase.date}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-orange-500/30 rounded-2xl p-8"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">How Atlas Protocol Works</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                When you purchase a license, the <span className="text-orange-400 font-semibold">LicensingAgent</span> automatically
                splits revenue via <span className="text-amber-400 font-semibold">ADLV.depositLicenseRevenue()</span>,
                increasing the creator's CVS (Content Value Score). All transactions are indexed
                by <span className="text-green-400 font-semibold">Goldsky</span> and the license is registered as a derivative IP asset
                on Story Protocol via <span className="text-green-400 font-semibold">abv.dev</span>, ensuring full provenance and compliance.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                  <div className="text-orange-400 font-bold mb-1">Step 1</div>
                  <div className="text-gray-300 text-sm">Select tier & purchase</div>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                  <div className="text-amber-400 font-bold mb-1">Step 2</div>
                  <div className="text-gray-300 text-sm">LicensingAgent splits revenue</div>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                  <div className="text-green-400 font-bold mb-1">Step 3</div>
                  <div className="text-gray-300 text-sm">CVS updated via Goldsky</div>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                  <div className="text-green-400 font-bold mb-1">Step 4</div>
                  <div className="text-gray-300 text-sm">License registered on-chain</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {selectedTier && purchaseDetails && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          onClick={() => {
            setSelectedTier(null);
            setPurchaseDetails(null);
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Purchase Confirmed!</h3>
              <p className="text-gray-400">Your license is being processed on-chain</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <span className="text-gray-400">License Tier</span>
                <span className="text-white font-bold">{purchaseDetails.tier}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <span className="text-gray-400">Amount</span>
                <span className="text-orange-400 font-bold">{purchaseDetails.price}</span>
              </div>
              <div className="flex justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                <span className="text-gray-400">Creator CVS Impact</span>
                <span className="text-green-400 font-bold">{purchaseDetails.cvsImpact} pts</span>
              </div>
              <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-400 text-sm">Transaction Hash</span>
                  <span className="text-amber-400 text-xs font-mono">{purchaseDetails.txHash.slice(0, 10)}...{purchaseDetails.txHash.slice(-8)}</span>
                </div>
              </div>
              <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-400 text-sm">Creator Wallet</span>
                  <span className="text-white text-xs font-mono">{purchaseDetails.creatorWallet.slice(0, 6)}...{purchaseDetails.creatorWallet.slice(-4)}</span>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-violet-500/10 to-pink-500/10 rounded-lg border border-orange-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-orange-400" />
                  <span className="text-orange-400 text-sm font-bold">On-Chain Registration</span>
                </div>
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>Contract Call:</span>
                    <span className="text-amber-400 font-mono">ADLV.depositLicenseRevenue()</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Registry:</span>
                    <span className="text-green-400">abv.dev (Story Protocol)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Indexing:</span>
                    <span className="text-green-400">Goldsky ({purchaseDetails.estimatedIndexing})</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedTier(null);
                setPurchaseDetails(null);
              }}
              className="w-full py-3 bg-gradient-to-b from-orange-950/40 to-transparent border-2 border-orange-500 text-white rounded-2xl font-bold shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
