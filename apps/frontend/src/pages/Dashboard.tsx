import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, FileText, Activity, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps = {}) {
  const [cvsScore, setCvsScore] = useState(8542);
  const [chartData, setChartData] = useState<number[]>([]);

  useEffect(() => {
    const data = Array.from({ length: 30 }, (_, i) =>
      5000 + Math.sin(i / 3) * 2000 + Math.random() * 1000
    );
    setChartData(data);

    const interval = setInterval(() => {
      setCvsScore(prev => prev + Math.floor(Math.random() * 100 - 20));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: 'CVS Score (Live)', value: cvsScore.toLocaleString(), change: '+12.5%', icon: TrendingUp, positive: true, subtitle: 'IDOVault Query' },
    { label: 'Data Licensing Yield', value: '$45,320', change: '+8.2%', icon: DollarSign, positive: true, subtitle: 'Total Revenue' },
    { label: 'Active Data-Backed Loans', value: '3', change: '-1', icon: FileText, positive: false, subtitle: 'X-Chain Loans' },
    { label: 'Dynamic Collateral Ratio', value: '200%', change: '+2%', icon: Activity, positive: true, subtitle: 'CVS-Based' },
  ];

  const recentLicenses = [
    { id: 'LIC-001', ipAsset: '0x742d...89Ac', buyer: '0x8a3f...12De', amount: '$1,200', date: '2 hours ago', status: 'completed', cvsImpact: '+85 pts' },
    { id: 'LIC-002', ipAsset: '0x742d...89Ac', buyer: '0x9b2c...34Ef', amount: '$850', date: '5 hours ago', status: 'completed', cvsImpact: '+62 pts' },
    { id: 'LIC-003', ipAsset: '0x742d...89Ac', buyer: '0x1c4d...56Gh', amount: '$2,400', date: '1 day ago', status: 'completed', cvsImpact: '+142 pts' },
    { id: 'LIC-004', ipAsset: '0x742d...89Ac', buyer: '0x2e5f...78Jk', amount: '$1,650', date: '2 days ago', status: 'completed', cvsImpact: '+98 pts' },
  ];

  const maxValue = Math.max(...chartData);
  const minValue = Math.min(...chartData);

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Atlas Data Vault Dashboard</h1>
          <p className="text-gray-400">Real-time IP Asset Valuation via IDO, Powered by Goldsky</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity rounded-2xl" />
                <div className="relative bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 group-hover:border-orange-500/50 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>
                      {stat.positive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                      {stat.change}
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{stat.subtitle}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">CVS Provenance & Growth Analysis</h2>
                <p className="text-gray-400 text-sm">Real-time calculation based on Goldsky Indexed Usage Events</p>
              </div>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-right"
              >
                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
                  {cvsScore.toLocaleString()}
                </div>
                <div className="text-sm text-green-400 flex items-center gap-1 justify-end">
                  <Sparkles className="w-4 h-4" />
                  Live
                </div>
              </motion.div>
            </div>

            <div className="relative h-64">
              <svg className="w-full h-full" viewBox="0 0 800 200">
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgb(6, 182, 212)" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="rgb(6, 182, 212)" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                  d={`M 0 ${200 - ((chartData[0] - minValue) / (maxValue - minValue)) * 180} ${chartData
                    .map((value, i) => {
                      const x = (i / (chartData.length - 1)) * 800;
                      const y = 200 - ((value - minValue) / (maxValue - minValue)) * 180;
                      return `L ${x} ${y}`;
                    })
                    .join(' ')}`}
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                <motion.path
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                  d={`M 0 ${200 - ((chartData[0] - minValue) / (maxValue - minValue)) * 180} ${chartData
                    .map((value, i) => {
                      const x = (i / (chartData.length - 1)) * 800;
                      const y = 200 - ((value - minValue) / (maxValue - minValue)) * 180;
                      return `L ${x} ${y}`;
                    })
                    .join(' ')} L 800 200 L 0 200 Z`}
                  fill="url(#chartGradient)"
                />

                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgb(6, 182, 212)" />
                    <stop offset="50%" stopColor="rgb(37, 99, 235)" />
                    <stop offset="100%" stopColor="rgb(139, 92, 246)" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute top-0 left-0 right-0 flex justify-between text-xs text-gray-500">
                <span>30d ago</span>
                <span>Today</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-1">Cross-Chain Loan Eligibility</h2>
            <p className="text-gray-400 text-xs mb-4">Powered by Owlto Bridge</p>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">Max Liquidity (CVS Limit)</span>
                <span className="text-white font-bold">$4,271</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '50%' }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-600"
                />
              </div>
              <p className="text-gray-500 text-xs mt-1">Based on current CVS: {cvsScore.toLocaleString()}</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-900/50 rounded-xl">
                <span className="text-gray-400 text-sm">Interest Rate</span>
                <span className="text-green-400 font-bold">3.5% APR</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-900/50 rounded-xl">
                <span className="text-gray-400 text-sm">Collateral Ratio</span>
                <span className="text-white font-bold">200%</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-900/50 rounded-xl">
                <div>
                  <span className="text-gray-400 text-sm block">Owlto Bridge Access</span>
                  <span className="text-gray-500 text-xs">Networks</span>
                </div>
                <span className="text-amber-400 font-bold">5+</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate?.('loans')}
              className="w-full mt-6 py-3 bg-gradient-to-b from-orange-950/40 to-transparent border-2 border-orange-500 text-white rounded-2xl font-medium shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300"
            >
              Request Loan (Cross-Chain)
            </motion.button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Recent License Sales</h2>
              <p className="text-gray-400 text-sm">Latest GenAI data licensing activity • Registered via abv.dev</p>
            </div>
            <button className="text-amber-400 hover:text-cyan-300 text-sm font-medium transition-colors">
              View All →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-4 text-gray-400 font-medium text-sm">License ID</th>
                  <th className="pb-4 text-gray-400 font-medium text-sm">IP Asset</th>
                  <th className="pb-4 text-gray-400 font-medium text-sm">Buyer</th>
                  <th className="pb-4 text-gray-400 font-medium text-sm">Amount</th>
                  <th className="pb-4 text-gray-400 font-medium text-sm">CVS Impact</th>
                  <th className="pb-4 text-gray-400 font-medium text-sm">Time</th>
                  <th className="pb-4 text-gray-400 font-medium text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLicenses.map((license, index) => (
                  <motion.tr
                    key={license.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="py-4 text-white font-medium">{license.id}</td>
                    <td className="py-4 text-gray-300 font-mono text-xs">{license.ipAsset}</td>
                    <td className="py-4 text-gray-300 font-mono text-xs">{license.buyer}</td>
                    <td className="py-4 text-amber-400 font-bold">{license.amount}</td>
                    <td className="py-4">
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-md text-xs font-bold">
                        {license.cvsImpact}
                      </span>
                    </td>
                    <td className="py-4 text-gray-400 text-sm">{license.date}</td>
                    <td className="py-4">
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium capitalize">
                        {license.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-400 text-sm font-medium mb-1">About CVS Impact</p>
                <p className="text-gray-400 text-sm">
                  Each license sale increases your Content Value Score (CVS) based on the transaction amount and usage metrics.
                  Higher CVS unlocks greater borrowing capacity and better loan terms.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
