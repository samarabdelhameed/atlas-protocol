import { motion } from 'framer-motion';
import { TrendingUp, Lock, Zap, ArrowRight, DollarSign, Database, Shield } from 'lucide-react';
import ParticleField from '../components/ParticleField';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const metrics = [
    { label: 'Total CVS Valued (TVV)', value: '$2.4M', icon: Lock, color: 'from-orange-500 to-amber-600' },
    { label: 'Data-Backed Loans (X-Chain)', value: '1,234', icon: DollarSign, color: 'from-amber-500 to-orange-600' },
    { label: 'GenAI Data Licenses Issued', value: '5,678', icon: Database, color: 'from-orange-600 to-red-600' },
  ];

  const features = [
    {
      title: 'Monetize Data Provenance',
      description: 'Secure and transparent licensing of IP usage streams to compliant AI training models. Powered by abv.dev for on-chain registration.',
      icon: Database,
      gradient: 'from-orange-500 to-amber-600',
    },
    {
      title: 'Dynamic Collateral Score',
      description: 'Real-time valuation of your IP asset based on usage, licensing, and enforcement data. Powered by Goldsky for live indexing.',
      icon: TrendingUp,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      title: 'Instant Cross-Chain Liquidity',
      description: 'Borrow instantly against your CVS score, with funds delivered to any chain via Owlto Bridge for seamless cross-chain transfers.',
      icon: Shield,
      gradient: 'from-orange-600 to-red-600',
    },
  ];

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <ParticleField />

      <div className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-block mb-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-600 blur-3xl opacity-50 animate-pulse" />
                <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/50">
                  <Zap className="w-16 h-16 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-6xl md:text-7xl font-bold text-white mb-6"
            >
              Tokenize IP Data. Unlock DeFi Liquidity.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
            >
              From Provenance Data Streams to Dynamic Collateral
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-gray-400 mb-12 max-w-2xl mx-auto"
            >
              The first IP Data Oracle (IDO) facilitating CVS-backed loans and compliant GenAI data licensing, secured by World ID and built on Story L1
            </motion.p>

            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
              onClick={() => onNavigate('vault')}
              className="group relative px-10 py-4 bg-gradient-to-b from-orange-950/40 to-transparent border-2 border-orange-500 text-white rounded-2xl font-bold text-lg shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="flex items-center gap-3">
                Create Data Vault
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20"
          >
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="relative group"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${metric.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity`} />
                  <div className="relative bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-8 hover:border-orange-500/50 transition-all">
                    <div className={`w-14 h-14 bg-gradient-to-br ${metric.color} rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className={`text-4xl font-bold bg-gradient-to-r ${metric.color} bg-clip-text text-transparent mb-2`}>
                      {metric.value}
                    </div>
                    <div className="text-gray-400 text-sm">{metric.label}</div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <div className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Three pillars powering the future of IP-backed finance
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.7 + index * 0.15 }}
                    whileHover={{ y: -20 }}
                    className="relative group"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 blur-2xl transition-all duration-500 rounded-3xl`} />
                    <div className="relative bg-gray-900/30 backdrop-blur-xl border border-gray-800/30 rounded-3xl p-8 group-hover:border-orange-500/50 transition-all">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20`}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                      <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-orange-500/10 to-amber-600/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [360, 180, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-amber-500/10 to-orange-600/10 rounded-full blur-3xl"
      />
    </div>
  );
}
