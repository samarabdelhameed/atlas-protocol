import { motion } from 'framer-motion';
import { DollarSign, TrendingDown, Clock, CheckCircle2, AlertTriangle, Network, Shield, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { createPublicClient, http, isAddress, formatUnits, parseUnits } from 'viem';
import ADLV_JSON from '../../../agent-service/contracts/ADLV.json';
import IDO_JSON from '../../../agent-service/contracts/IDO.json';

interface LoansProps {
  onNavigate?: (page: string) => void;
}

export default function Loans({ onNavigate }: LoansProps = {}) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [loanAmount, setLoanAmount] = useState('');
  const [selectedChain, setSelectedChain] = useState('');
  const [duration, setDuration] = useState('30');
  const [loanExecuted, setLoanExecuted] = useState(false);
  const [vaultAddress, setVaultAddress] = useState('');
  const [issueTxHash, setIssueTxHash] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState<string>('');

  // Env-driven chain and contract addresses
  const RPC_URL = import.meta.env.VITE_RPC_URL as string | undefined;
  const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 1315);
  const ADLV_ADDRESS = (import.meta.env.VITE_ADLV_CONTRACT_ADDRESS || '') as `0x${string}`;
  const IDO_ADDRESS = (import.meta.env.VITE_IDO_CONTRACT_ADDRESS || '') as `0x${string}`;

  const publicClient = useMemo(() => {
    if (!RPC_URL) return null;
    return createPublicClient({
      chain: { id: CHAIN_ID, name: 'Story', nativeCurrency: { name: 'STORY', symbol: 'STORY', decimals: 18 }, rpcUrls: { default: { http: [RPC_URL] } } },
      transport: http(RPC_URL),
    });
  }, [RPC_URL, CHAIN_ID]);

  const [currentCVS, setCurrentCVS] = useState<number>(0);
  const [maxBorrowable, setMaxBorrowable] = useState<number>(0);
  const [collateralBps, setCollateralBps] = useState<number>(15000);
  const [aprBps, setAprBps] = useState<number>(350);

  // Fetch live metrics when vault changes
  useEffect(() => {
    const run = async () => {
      setError('');
      if (!publicClient || !ADLV_ADDRESS || !IDO_ADDRESS) return;
      if (!vaultAddress || !isAddress(vaultAddress)) return;
      try {
        // getVault to obtain ipId
        const vault: any = await publicClient.readContract({
          address: ADLV_ADDRESS,
          abi: ADLV_JSON.abi,
          functionName: 'getVault',
          args: [vaultAddress],
        });
        const ipId: `0x${string}` = vault?.ipId as `0x${string}`;
        // CVS
        const cvs = (await publicClient.readContract({
          address: IDO_ADDRESS,
          abi: IDO_JSON.abi,
          functionName: 'getCVS',
          args: [ipId],
        })) as bigint;
        setCurrentCVS(Number(formatUnits(cvs, 18)));
        // Max loan
        const maxLoan = (await publicClient.readContract({
          address: ADLV_ADDRESS,
          abi: ADLV_JSON.abi,
          functionName: 'calculateMaxLoanAmount',
          args: [vaultAddress],
        })) as bigint;
        setMaxBorrowable(Number(formatUnits(maxLoan, 18)));
        // Collateral ratio (bps)
        const cr = (await publicClient.readContract({
          address: ADLV_ADDRESS,
          abi: ADLV_JSON.abi,
          functionName: 'defaultCollateralRatio',
        })) as bigint;
        setCollateralBps(Number(cr));
        // APR from CVS (bps)
        const apr = (await publicClient.readContract({
          address: ADLV_ADDRESS,
          abi: ADLV_JSON.abi,
          functionName: 'calculateInterestRate',
          args: [cvs],
        })) as bigint;
        setAprBps(Number(apr));
      } catch (e: any) {
        setError(e?.message || 'Failed to load vault metrics');
      }
    };
    run();
  }, [publicClient, ADLV_ADDRESS, IDO_ADDRESS, vaultAddress]);

  const handleExecuteLoan = async () => {
    try {
      setError('');
      if (!walletClient || !isConnected) {
        setError('Wallet not connected');
        return;
      }
      if (!vaultAddress || !isAddress(vaultAddress)) {
        setError('Enter a valid vault address');
        return;
      }
      if (!loanAmount || Number(loanAmount) <= 0) {
        setError('Enter a valid loan amount');
        return;
      }
      if (maxBorrowable && Number(loanAmount) > maxBorrowable) {
        setError('Requested amount exceeds max borrowable');
        return;
      }
      const durationDays = parseInt(duration);
      const durationSeconds = BigInt(durationDays * 24 * 60 * 60);
      const loanAmountWei = parseUnits(loanAmount, 18);
      const collateralWei = (loanAmountWei * BigInt(collateralBps)) / BigInt(10000);
      setIssuing(true);
      const targetChainId = selectedChain ? BigInt(selectedChain) : BigInt(0);
      const txHash = await walletClient.writeContract({
        address: ADLV_ADDRESS,
        abi: ADLV_JSON.abi,
        functionName: 'issueLoan',
        args: [vaultAddress, loanAmountWei, durationSeconds, targetChainId],
        value: collateralWei,
        chain: { id: CHAIN_ID } as any,
      });
      setIssueTxHash(txHash);
      setLoanExecuted(true);
      setTimeout(() => setLoanExecuted(false), 3000);
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || 'Failed to issue loan');
    } finally {
      setIssuing(false);
    }
  };

  const chains = [
    { id: 'ethereum', name: 'Ethereum', color: 'from-blue-400 to-blue-600' },
    { id: 'polygon', name: 'Polygon', color: 'from-purple-400 to-purple-600' },
    { id: 'arbitrum', name: 'Arbitrum', color: 'from-cyan-400 to-cyan-600' },
    { id: 'optimism', name: 'Optimism', color: 'from-red-400 to-red-600' },
    { id: 'base', name: 'Base', color: 'from-blue-500 to-indigo-600' },
  ];

  const activeLoans: Array<{ id: string; amount: string; chain: string; apr: string; dueDate: string; status: 'healthy' | 'warning' | 'critical'; cvsHealth: number; collateralRatio: number; currentCVS: number; }> = [];

  const collateralRatio = collateralBps / 100;
  const estimatedAPR = loanAmount && aprBps ? (Number(aprBps) / 100).toFixed(2) : '—';

  const getHealthColor = (health: number) => {
    if (health >= 70) return 'from-green-500 to-emerald-600';
    if (health >= 40) return 'from-orange-500 to-amber-600';
    return 'from-red-500 to-rose-600';
  };

  const getHealthTextColor = (health: number) => {
    if (health >= 70) return 'text-green-400';
    if (health >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">CVS-Backed Liquidity Module (IPFi)</h1>
          <p className="text-gray-400">Instant Liquidity Collateralized by CVS, enabled by Owlto Bridge</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8"
          >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Execute Liquidity Drawdown</h2>
              <p className="text-gray-400 text-sm">Collateralized by your Dynamic CVS Score</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Vault Address</label>
              <input
                value={vaultAddress}
                onChange={(e) => setVaultAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Drawdown Amount (USDC)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-4 bg-gray-900/50 border border-gray-700 rounded-xl text-white text-2xl font-bold placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                />
                <button
                  onClick={() => setLoanAmount(maxBorrowable ? maxBorrowable.toString() : '')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-gradient-to-b from-orange-950/40 to-transparent border border-orange-500 text-white rounded-xl text-sm font-medium shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] transition-all duration-300"
                >
                  MAX
                </button>
              </div>
              <div className="mt-2 flex justify-between items-center text-sm">
                <span className="text-gray-400">Max Drawdown Limit (200% Collateral)</span>
                <span className="text-amber-400 font-bold">{maxBorrowable ? `$${maxBorrowable.toLocaleString()}` : '—'}</span>
              </div>
            </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-3">
                  Target Chain (Owlto Bridge)
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {chains.map((chain) => (
                    <motion.button
                      key={chain.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedChain(chain.id)}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        selectedChain === chain.id
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                      }`}
                    >
                      {selectedChain === chain.id && (
                        <motion.div
                          layoutId="selectedChain"
                          className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-xl"
                        />
                      )}
                      <div className={`relative w-8 h-8 mx-auto mb-2 bg-gradient-to-br ${chain.color} rounded-lg`} />
                      <p className="relative text-white text-xs font-medium text-center">
                        {chain.name}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Loan Duration
                </label>
                <div className="flex gap-3">
                  {['7', '30', '90', '180'].map((days) => (
                    <motion.button
                      key={days}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDuration(days)}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                        duration === days
                          ? 'bg-black border-2 border-orange-500 text-orange-500 hover:text-white'
                          : 'bg-gray-900/50 text-gray-400 hover:text-white border border-gray-700'
                      }`}
                    >
                      {days} days
                    </motion.button>
                  ))}
                </div>
              </div>

              {loanAmount && selectedChain && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-orange-500/30 rounded-xl space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Estimated APR</span>
                    <span className="text-green-400 font-bold text-lg">{estimatedAPR}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Required CVS Collateral</span>
                    <span className="text-amber-400 font-bold">
                      {currentCVS && loanAmount ? (parseFloat(loanAmount) * collateralRatio / 100).toFixed(0) : '—'} CVS
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Repayment</span>
                    <span className="text-white font-bold">
                      {estimatedAPR !== '—' ? (parseFloat(loanAmount) * (1 + parseFloat(estimatedAPR) / 100 * parseInt(duration) / 365)).toFixed(2) : '—'}
                    </span>
                  </div>
                </motion.div>
              )}

              {error && (
                <div className="text-red-400 text-sm mb-2">{error}</div>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!loanAmount || !selectedChain || !isAddress(vaultAddress) || issuing}
                onClick={handleExecuteLoan}
                className="w-full py-4 bg-gradient-to-b from-orange-950/40 to-transparent border-2 border-orange-500 text-white rounded-2xl font-bold text-lg shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {issuing ? 'Processing...' : loanExecuted ? '✓ Loan Executed Successfully!' : 'Execute Liquidity Drawdown'}
              </motion.button>
              {issueTxHash && (
                <div className="mt-2 text-xs text-amber-400">
                  Tx: <a href={`https://sepolia.basescan.org/tx/${issueTxHash}`} target="_blank" rel="noreferrer" className="underline">{issueTxHash.slice(0, 10)}...{issueTxHash.slice(-8)}</a>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Your Eligibility</h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm">Active Vault CVS Score</span>
                    <span className="text-white font-bold">{currentCVS.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '85%' }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-600 rounded-full"
                    />
                  </div>
                </div>

                <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-400 text-sm">Max Drawdown Limit</span>
                    <span className="text-amber-400 font-bold">${maxBorrowable}</span>
                  </div>
                  <p className="text-gray-500 text-xs">200% CVS Collateral Required</p>
                </div>

                <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-400 text-sm">Owlto Bridge Access</span>
                    <span className="text-white font-bold">5+ Networks</span>
                  </div>
                  <p className="text-gray-500 text-xs">Cross-Chain Disbursement</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Cross-Chain Disbursement</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Funds transferred instantly to your target network via <span className="text-amber-400 font-medium">Owlto API</span>.
                Low fees, fast settlement, and multi-chain support powered by our Sponsor Tool integration.
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Data-Collateralized Loan Positions</h2>
              <p className="text-gray-400 text-sm">Monitor Collateral Health & Liquidation Risk</p>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm">Total Outstanding Principal</div>
              <div className="text-2xl font-bold text-white">$7,500</div>
            </div>
          </div>

          <div className="space-y-4">
            {activeLoans.map((loan, index) => (
              <motion.div
                key={loan.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.01 }}
                className={`p-6 rounded-xl border-2 transition-all ${
                  loan.status === 'critical'
                    ? 'bg-red-500/5 border-red-500/30'
                    : loan.status === 'warning'
                    ? 'bg-orange-500/5 border-orange-500/30'
                    : 'bg-gray-900/50 border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${
                      loan.status === 'critical' ? 'from-red-500 to-rose-600' : 'from-orange-500 to-amber-600'
                    } rounded-xl flex items-center justify-center`}>
                      {loan.status === 'critical' ? (
                        <AlertTriangle className="w-6 h-6 text-white" />
                      ) : (
                        <DollarSign className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-bold text-lg">{loan.id}</h3>
                        {loan.status === 'critical' && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-md text-xs font-bold">
                            LIQUIDATION ALERT
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{loan.chain} • {loan.apr} APR</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white mb-1">{loan.amount}</div>
                    <div className="flex items-center gap-1 text-gray-400 text-sm">
                      <Clock className="w-4 h-4" />
                      Due in {loan.dueDate}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                    <div className="text-gray-400 text-xs mb-1">Current CVS</div>
                    <div className="text-white font-bold">{loan.currentCVS.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                    <div className="text-gray-400 text-xs mb-1">Collateral Ratio</div>
                    <div className={`font-bold ${getHealthTextColor(loan.cvsHealth)}`}>
                      {loan.collateralRatio}%
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">CVS Health Status</span>
                    <span className={`font-bold ${getHealthTextColor(loan.cvsHealth)}`}>
                      {loan.cvsHealth >= 70 ? 'Healthy' : loan.cvsHealth >= 40 ? 'At Risk' : 'Critical'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${loan.cvsHealth}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                      className={`h-full bg-gradient-to-r ${getHealthColor(loan.cvsHealth)}`}
                    />
                  </div>
                  {loan.status === 'critical' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-red-400 text-xs font-bold mb-1">Liquidation Warning</p>
                          <p className="text-gray-400 text-xs">
                            Your CVS has dropped below safe levels. Repay or add collateral immediately to avoid automatic liquidation by the LoanManager.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 bg-gradient-to-b from-green-950/40 to-transparent border-2 border-green-500 text-white rounded-xl font-medium shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_35px_rgba(34,197,94,0.5)] transition-all duration-300"
                  >
                    Repay Loan
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 bg-gradient-to-b from-gray-950/40 to-transparent border-2 border-gray-600 text-white rounded-xl font-medium shadow-[0_0_15px_rgba(156,163,175,0.2)] hover:shadow-[0_0_25px_rgba(156,163,175,0.4)] transition-all duration-300"
                  >
                    Add Collateral
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-400 text-sm font-medium mb-1">About CVS Health & Liquidation</p>
                <p className="text-gray-400 text-sm">
                  Your loan is secured by your CVS score. If your CVS drops significantly (due to reduced IP usage),
                  the collateral ratio may fall below 150%, triggering automatic liquidation by the LoanManager agent
                  to protect lenders. Keep your CVS healthy by maintaining active licensing.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
