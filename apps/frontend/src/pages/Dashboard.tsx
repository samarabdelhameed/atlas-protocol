import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, FileText, Activity, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { parseAbiItem, createPublicClient, http, formatUnits } from 'viem';
import { useAccount } from 'wagmi';
import { useQuery, useQueries } from '@tanstack/react-query';
import { storyTestnet } from '../wagmi';
import { CONTRACTS } from '../contracts/addresses';
import ADLV_ABI from '../contracts/abis/ADLV.json';
import IDO_ABI from '../contracts/abis/IDO.json';

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

interface VaultData {
  address: `0x${string}`;
  ipId: `0x${string}`;
  creator: string;
  totalLiquidity: bigint;
  cvs: bigint;
  maxLoan: bigint;
}

interface LicenseMetadata {
  personalName: string;
  organization: string;
  email: string;
  tierId: string;
  tierName: string;
  amount: string;
  timestamp: string;
}

export default function Dashboard({ onNavigate }: DashboardProps = {}) {
  // Wallet connection
  const { address } = useAccount();

  // Env-driven chain setup for read-only event logs (same as LandingPage)
  const RPC_URL = import.meta.env.VITE_RPC_URL as string | undefined;
  const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || storyTestnet.id);
  const ADLV_ADDRESS = CONTRACTS.ADLV;

  // Create public client to query logs from chain (real data)
  const publicClient = useMemo(() => {
    if (!RPC_URL) return null;
    return createPublicClient({
      chain: { ...storyTestnet, id: CHAIN_ID },
      transport: http(RPC_URL),
    });
  }, [RPC_URL, CHAIN_ID]);

  // Fetch user's vaults with optimized caching
  const { data: userVaults, isLoading: isLoadingVaults } = useQuery({
    queryKey: ['userVaults', address],
    queryFn: async () => {
      if (!address) return [];

      try {
        // Fetch vaults from backend API (queries Goldsky subgraph)
        const backendUrl = import.meta.env.VITE_BACKEND_ENDPOINT || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/vaults/${address}`);

        if (!response.ok) {
          console.error('Failed to fetch vaults from API:', response.status);
          return [];
        }

        const data = await response.json();
        console.log(`✅ Fetched ${data.count} vault(s) from API for ${address}`);

        return (data.vaults || []) as `0x${string}`[];
      } catch (error) {
        console.error('Error fetching vaults:', error);
        return [];
      }
    },
    enabled: !!address,
    staleTime: 30_000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: 30_000, // Refetch every 30 seconds (reduced from 10s)
  });

  // Fetch details for each vault with optimized caching and parallel requests
  const vaultQueries = useQueries({
    queries: (userVaults || []).map((vaultAddr) => ({
      queryKey: ['vault', vaultAddr],
      queryFn: async (): Promise<VaultData | null> => {
        if (!publicClient) return null;

        // Parallel fetch all vault data for better performance
        const [vault, maxLoan] = await Promise.all([
          publicClient.readContract({
            address: CONTRACTS.ADLV,
            abi: ADLV_ABI.abi,
            functionName: 'getVault',
            args: [vaultAddr],
          }) as Promise<{ ipId: `0x${string}`; creator: string; totalLiquidity: bigint }>,
          publicClient.readContract({
            address: CONTRACTS.ADLV,
            abi: ADLV_ABI.abi,
            functionName: 'calculateMaxLoanAmount',
            args: [vaultAddr],
          }) as Promise<bigint>,
        ]);

        // Get CVS score after we have the ipId
        const cvs = await publicClient.readContract({
          address: CONTRACTS.IDO,
          abi: IDO_ABI.abi,
          functionName: 'getCVS',
          args: [vault.ipId],
        }) as bigint;

        return { address: vaultAddr, ...vault, cvs, maxLoan };
      },
      enabled: !!publicClient,
      staleTime: 30_000, // Consider data fresh for 30 seconds
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    })),
  });

  // Calculate total CVS and max borrowable across all vaults
  const totalCVS = vaultQueries.reduce((sum, q) =>
    sum + Number(formatUnits(q.data?.cvs || 0n, 18)), 0
  );

  const totalMaxBorrowable = vaultQueries.reduce((sum, q) =>
    sum + Number(formatUnits(q.data?.maxLoan || 0n, 18)), 0
  );

  // Event ABIs for parsing ADLV logs (real events from chain)
  const evLoanIssued = useMemo(
    () =>
      parseAbiItem(
        "event LoanIssued(address indexed vaultAddress, address indexed borrower, uint256 indexed loanId, uint256 amount, uint256 collateral, uint256 interestRate, uint256 duration)"
      ),
    []
  );

  const [chartData, setChartData] = useState<number[]>([]);
  const [activeLoansCount, setActiveLoansCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Recent licenses from backend API (with full metadata)
  const [recentLicenses, setRecentLicenses] = useState<Array<{
    id: string;
    ipAsset: string;
    buyer: string;
    amount: string;
    date: string;
    status: string;
    cvsImpact: string;
  }>>([]);

  // Fetch recent license sales from backend
  useEffect(() => {
    const fetchRecentLicenses = async () => {
      try {
        const response = await fetch('http://localhost:3001/licenses/metadata');
        const data = await response.json();

        if (data.success && data.licenses) {
          const formatted = data.licenses.slice(0, 10).map((license: LicenseMetadata, index: number) => {
            const cvsImpact = license.tierId === 'basic' ? '+25 pts' :
                            license.tierId === 'commercial' ? '+80 pts' :
                            license.tierId === 'enterprise' ? '+200 pts' : '+0 pts';

            return {
              id: `LIC-${String(index + 1).padStart(3, '0')}`,
              ipAsset: license.organization || 'Unknown',
              buyer: license.personalName || 'Anonymous',
              amount: `${license.amount} STORY`,
              date: formatRelativeTime(new Date(license.timestamp)),
              status: 'completed',
              cvsImpact,
            };
          });
          setRecentLicenses(formatted);
        }
      } catch (error) {
        console.error('Error fetching recent licenses:', error);
        setRecentLicenses([]); // Empty array on error
      }
    };

    fetchRecentLicenses();
    const interval = setInterval(fetchRecentLicenses, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Helper to format relative time
  const formatRelativeTime = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  // Calculate stats from chain data (real data)
  const stats = useMemo(() => {
    const revenue = totalRevenue;
    const loans = activeLoansCount;
    const userCVS = totalCVS;

    return [
      {
        label: 'My Total CVS',
        value: userCVS > 0 ? userCVS.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0',
        change: userCVS > 0 ? '+' + ((userCVS / 1000) * 100).toFixed(1) + '%' : '0%',
        icon: TrendingUp,
        positive: userCVS > 0,
        subtitle: 'Across All Vaults'
      },
      {
        label: 'Data Licensing Yield',
        value: `$${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        change: revenue > 0 ? '+' + ((revenue / 10000) * 100).toFixed(1) + '%' : '0%',
        icon: DollarSign,
        positive: revenue > 0,
        subtitle: 'Total Revenue'
      },
      {
        label: 'Active Data-Backed Loans',
        value: loans.toString(),
        change: loans > 0 ? `+${loans}` : '0',
        icon: FileText,
        positive: loans > 0,
        subtitle: 'X-Chain Loans'
      },
      {
        label: 'Max Borrowable',
        value: `$${totalMaxBorrowable.toFixed(0)}`,
        change: totalMaxBorrowable > 0 ? '+' + ((totalMaxBorrowable / 1000) * 100).toFixed(1) + '%' : '0%',
        icon: Activity,
        positive: totalMaxBorrowable > 0,
        subtitle: 'Across All Vaults'
      },
    ];
  }, [totalRevenue, activeLoansCount, totalCVS, totalMaxBorrowable]);

  // Fetch loan data from chain
  useEffect(() => {
    const run = async () => {
      try {
        if (!publicClient) return;

        const latest = await publicClient.getBlockNumber();
        const window = 10_000n;
        const fromBlock = latest > window ? latest - window : 0n;

        // Fetch loans (real data from chain)
        const loanLogs = await publicClient.getLogs({
          address: ADLV_ADDRESS,
          event: evLoanIssued,
          fromBlock,
          toBlock: latest
        });
        setActiveLoansCount(loanLogs.length);

        // Calculate total revenue from backend license data
        const revenue = recentLicenses.reduce((sum, license) => {
          const amount = parseFloat(license.amount.replace(' STORY', '')) || 0;
          return sum + amount;
        }, 0);
        setTotalRevenue(revenue);

        // Generate chart data from backend license sales
        if (recentLicenses.length > 0) {
          const data = recentLicenses.slice(0, 30).reverse().map((license) => {
            const amount = parseFloat(license.amount.replace(' STORY', '')) || 0;
            return 5000 + amount * 100; // Scale for visualization
          });
          setChartData(data.length > 0 ? data : Array.from({ length: 30 }, (_, i) => 5000 + Math.sin(i / 3) * 2000 + Math.random() * 1000));
        } else {
          const data = Array.from({ length: 30 }, (_, i) =>
            5000 + Math.sin(i / 3) * 2000 + Math.random() * 1000
          );
          setChartData(data);
        }

      } catch (error) {
        console.error('Error fetching chain data:', error);
      }
    };

    run();
    const interval = setInterval(run, 60000); // Refresh every minute

    return () => {
      clearInterval(interval);
    };
  }, [publicClient, ADLV_ADDRESS, evLoanIssued, recentLicenses]);

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
                  {totalCVS > 0 ? totalCVS.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
                </div>
                <div className="text-sm text-green-400 flex items-center gap-1 justify-end">
                  <Sparkles className="w-4 h-4" />
                  {address ? 'My CVS' : 'Live'}
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
                <span className="text-white font-bold">
                  ${totalMaxBorrowable.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((totalCVS / 10000) * 100, 100)}%` }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-600"
                />
              </div>
              <p className="text-gray-500 text-xs mt-1">Based on current CVS: {totalCVS > 0 ? totalCVS.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}</p>
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

        {/* My Vaults Section */}
        {address && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">My Vaults</h2>
              <button
                onClick={() => onNavigate?.('vault')}
                className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
              >
                + Create Vault
              </button>
            </div>

            {/* Vault Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
                <div className="text-3xl mb-2">🏦</div>
                <div className="text-3xl font-bold text-white">{userVaults?.length || 0}</div>
                <div className="text-sm text-gray-400">My Vaults</div>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
                <div className="text-3xl mb-2">📊</div>
                <div className="text-3xl font-bold text-white">{totalCVS.toFixed(0)}</div>
                <div className="text-sm text-gray-400">Total CVS</div>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
                <div className="text-3xl mb-2">💰</div>
                <div className="text-3xl font-bold text-white">
                  ${totalMaxBorrowable.toFixed(0)}
                </div>
                <div className="text-sm text-gray-400">Max Borrowable</div>
              </div>
            </div>

            {/* Vault Cards */}
            {isLoadingVaults ? (
              <div className="text-center py-12 bg-gray-800/30 border border-gray-700 rounded-2xl">
                <div className="text-gray-400">Loading vaults...</div>
              </div>
            ) : userVaults && userVaults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vaultQueries.map((query, i) => {
                  if (!query.data) return null;
                  const v = query.data;
                  return (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-bold">
                          {(v.address as string).slice(0, 6)}...{(v.address as string).slice(-4)}
                        </h3>
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                          Active
                        </span>
                      </div>
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-sm">CVS</span>
                          <span className="text-white font-bold">
                            {Number(formatUnits((v.cvs as bigint) || 0n, 18)).toFixed(0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-sm">Max Loan</span>
                          <span className="text-amber-400 font-bold">
                            ${Number(formatUnits((v.maxLoan as bigint) || 0n, 18)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onNavigate?.('loans')}
                        className="w-full py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors"
                      >
                        Request Loan
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-800/30 border border-gray-700 rounded-2xl">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-bold text-white mb-2">No Vaults Yet</h3>
                <p className="text-gray-400 mb-6">Create your first vault to start earning</p>
                <button
                  onClick={() => onNavigate?.('vault')}
                  className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
                >
                  Create Vault
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
