import { motion } from 'framer-motion';
import { DollarSign, Clock, CheckCircle2, AlertTriangle, Shield, Zap, Loader2, X, AlertCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { createPublicClient, http, isAddress, formatUnits, parseUnits } from 'viem';
import { useQueries } from '@tanstack/react-query';
import { CONTRACTS } from '../contracts/addresses';
import ADLV_JSON from '../contracts/abis/ADLV.json';
import IDO_JSON from '../contracts/abis/IDO.json';
import LendingModule_ABI from '../contracts/abis/LendingModule.json';


interface LoanData {
  id: bigint;
  vault: `0x${string}`;
  loanAmount: bigint;
  collateralAmount: bigint;
  startTime: bigint;
  endTime: bigint;
  interestRate: bigint;
  status: number;
  cvsAtIssuance: bigint;
  borrower: `0x${string}`;
}

interface VaultData {
  ipId: `0x${string}`;
  creator: `0x${string}`;
  cvs: bigint;
}

interface EnrichedLoanData extends LoanData {
  currentCVS: bigint;
  accruedInterest: bigint;
  vaultIpId: `0x${string}`;
  isLiquidatable: boolean;
}

export default function Loans() {
  const { address } = useAccount();
  const [loanAmount, setLoanAmount] = useState('');
  const [selectedChain, setSelectedChain] = useState('Story');
  const [selectedChainId, setSelectedChainId] = useState<number>(0); // 0 = Story (ETH)
  const [duration, setDuration] = useState('30');
  const [loanExecuted, setLoanExecuted] = useState(false);
  const [selectedVault, setSelectedVault] = useState('');
  const [error, setError] = useState<string>('');
  const [repayingLoanId, setRepayingLoanId] = useState<string | null>(null);
  const [repayError, setRepayError] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTxHash, setSuccessTxHash] = useState<string>('');

  // Chain ID mapping for Owlto Bridge
  const CHAIN_ID_MAP = {
    story: 0,      // Story Protocol (ETH)
    base: 8453,    // Base (USDC)
    arbitrum: 42161, // Arbitrum (USDC)
    optimism: 10,  // Optimism (USDC)
    polygon: 137,  // Polygon (USDC)
  } as const;

  // Update chain selector handler
  const handleChainSelect = (chain: string) => {
    setSelectedChain(chain);
    setSelectedChainId(CHAIN_ID_MAP[chain.toLowerCase() as keyof typeof CHAIN_ID_MAP] || 0);
  };

  // Env-driven chain setup
  const RPC_URL = import.meta.env.VITE_RPC_URL as string | undefined;
  const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 1315);

  // Contract addresses from centralized config
  const ADLV_ADDRESS = CONTRACTS.ADLV;
  const IDO_ADDRESS = CONTRACTS.IDO;

  const publicClient = useMemo(() => {
    if (!RPC_URL) return null;
    return createPublicClient({
      chain: { id: CHAIN_ID, name: 'Story', nativeCurrency: { name: 'STORY', symbol: 'STORY', decimals: 18 }, rpcUrls: { default: { http: [RPC_URL] } } },
      transport: http(RPC_URL),
    });
  }, [RPC_URL, CHAIN_ID]);

  // Fetch user's vaults for dropdown
  const { data: userVaults } = useReadContract({
    address: CONTRACTS.ADLV,
    abi: ADLV_JSON.abi,
    functionName: 'getUserVaults',
    args: [address],
    query: {
      enabled: !!address,
    },
  });

  // Calculate collateral (150%)
  const collateral = loanAmount ? parseUnits((Number(loanAmount) * 1.5).toString(), 18) : 0n;

  // Issue loan with wagmi hooks - Using LendingModule with cross-chain support
  const { writeContract: issueLoan, data: txHash } = useWriteContract();

  const { isLoading: isWaiting } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Handle transaction success/error
  useEffect(() => {
    if (txHash && !isWaiting) {
      setLoanExecuted(true);
      setLoanAmount('');
      setTimeout(() => setLoanExecuted(false), 3000);
    }
  }, [txHash, isWaiting]);

  // Fetch user's loan IDs
  const { data: loanIds, isLoading: loadingIds } = useReadContract({
    address: CONTRACTS.LendingModule,
    abi: LendingModule_ABI.abi,
    functionName: 'getBorrowerLoans',
    args: [address],
    query: {
      enabled: !!address,
      refetchInterval: 5000, // Poll every 5 seconds (replaces watch)
    },
  });

  // Fetch individual loan details in parallel
  const loanQueries = useQueries({
    queries: ((loanIds as bigint[]) || []).map((loanId: bigint) => ({
      queryKey: ['loan', loanId],
      queryFn: async () => {
        if (!publicClient) return null;

        // Fetch loan details
        const loan = await publicClient.readContract({
          address: CONTRACTS.LendingModule,
          abi: LendingModule_ABI.abi,
          functionName: 'getLoan',
          args: [loanId],
        }) as LoanData;

        // Fetch vault to get ipId
        const vault = await publicClient.readContract({
          address: CONTRACTS.ADLV,
          abi: ADLV_JSON.abi,
          functionName: 'getVault',
          args: [loan.vault],
        }) as VaultData;

        // Fetch current CVS
        const currentCVS = await publicClient.readContract({
          address: CONTRACTS.IDO,
          abi: IDO_JSON.abi,
          functionName: 'getCVS',
          args: [vault.ipId],
        }) as bigint;

        // Fetch accrued interest
        const interest = await publicClient.readContract({
          address: CONTRACTS.LendingModule,
          abi: LendingModule_ABI.abi,
          functionName: 'calculateAccruedInterest',
          args: [loanId],
        }) as bigint;

        // Fetch liquidation risk
        const isLiquidatable = await publicClient.readContract({
          address: CONTRACTS.LendingModule,
          abi: LendingModule_ABI.abi,
          functionName: 'isLoanLiquidatable',
          args: [loanId],
        }) as boolean;

        return {
          ...loan,
          currentCVS,
          accruedInterest: interest,
          vaultIpId: vault.ipId,
          isLiquidatable,
        } as EnrichedLoanData;
      },
      enabled: !!loanId && !!publicClient,
      refetchInterval: 10000, // Refresh every 10s
    })),
  });

  // Transform loan data for UI
  const activeLoans = useMemo(() => {
    return loanQueries
      .filter(q => q.data && (q.data as EnrichedLoanData).status === 0) // 0 = ACTIVE status
      .map(q => {
        const loan = q.data as EnrichedLoanData;
        const now = Math.floor(Date.now() / 1000);
        const timeRemaining = Number(loan.endTime) - now;
        const isOverdue = timeRemaining < 0;

        // Calculate CVS health percentage
        const cvsHealth = loan.cvsAtIssuance > 0n
          ? (Number(loan.currentCVS) / Number(loan.cvsAtIssuance)) * 100
          : 100;

        // Calculate total repayment
        const totalRepayment = loan.loanAmount + loan.accruedInterest;

        return {
          id: loan.id.toString(),
          amount: formatUnits(loan.loanAmount, 18),
          vaultAddress: loan.vault,
          chain: 'Story Testnet',
          dueDate: new Date(Number(loan.endTime) * 1000).toLocaleDateString(),
          timeRemaining,
          isOverdue,
          cvsHealth,
          healthStatus: (cvsHealth > 80 ? 'healthy' : cvsHealth > 50 ? 'warning' : 'critical') as 'healthy' | 'warning' | 'critical',
          collateral: formatUnits(loan.collateralAmount, 18),
          interest: formatUnits(loan.accruedInterest, 18),
          totalRepayment: formatUnits(totalRepayment, 18),
          totalRepaymentWei: totalRepayment,
          currentCVS: Number(formatUnits(loan.currentCVS, 18)),
          collateralRatio: cvsHealth,
          apr: '3.5%',
          status: (cvsHealth > 80 ? 'healthy' : cvsHealth > 50 ? 'warning' : 'critical') as 'healthy' | 'warning' | 'critical',
          isLiquidatable: loan.isLiquidatable,
        };
      })
      .sort((a, b) => {
        // Sort: overdue first, then by health, then by due date
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        if (a.cvsHealth !== b.cvsHealth) return a.cvsHealth - b.cvsHealth;
        return a.timeRemaining - b.timeRemaining;
      });
  }, [loanQueries]);

  // Calculate real-time total outstanding
  const totalOutstanding = useMemo(() => {
    return activeLoans.reduce((sum, loan) => {
      return sum + parseFloat(loan.totalRepayment);
    }, 0);
  }, [activeLoans]);

  // Find the loan being repaid to get repayment amount
  // Repay loan contract write
  const { writeContract: repayLoan, data: repayTxHash } = useWriteContract();

  const { isLoading: isRepaying } = useWaitForTransactionReceipt({
    hash: repayTxHash,
  });

  // Handle repayment transaction success
  useEffect(() => {
    if (repayTxHash && !isRepaying) {
      // Refetch loan data
      loanQueries.forEach(q => q.refetch());
      setRepayingLoanId(null);
      setRepayError('');
      setShowSuccess(true);
      setSuccessTxHash(repayTxHash);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [repayTxHash, isRepaying, loanQueries]);

  // Handler for repaying loan
  const handleRepayLoan = (loanId: string) => {
    const loan = activeLoans.find(l => l.id === loanId);
    if (!loan) {
      setRepayError('Loan not found');
      return;
    }

    setRepayingLoanId(loanId);
    setRepayError('');

    // Call contract write
    repayLoan?.({
      address: CONTRACTS.LendingModule,
      abi: LendingModule_ABI.abi,
      functionName: 'repayLoan',
      args: [BigInt(loanId)],
      value: loan.totalRepaymentWei || 0n,
    });
  };

  const [currentCVS, setCurrentCVS] = useState<number>(0);
  const [maxBorrowable, setMaxBorrowable] = useState<number>(0);
  const [collateralBps, setCollateralBps] = useState<number>(15000);
  const [aprBps, setAprBps] = useState<number>(350);

  // Fetch live metrics when vault changes
  useEffect(() => {
    const run = async () => {
      setError('');
      if (!publicClient || !ADLV_ADDRESS || !IDO_ADDRESS) return;
      if (!selectedVault || !isAddress(selectedVault)) return;
      try {
        // getVault to obtain ipId
        const vault = await publicClient.readContract({
          address: ADLV_ADDRESS,
          abi: ADLV_JSON.abi,
          functionName: 'getVault',
          args: [selectedVault],
        }) as VaultData;
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
          args: [selectedVault],
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
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load vault metrics');
      }
    };
    void run();
  }, [publicClient, ADLV_ADDRESS, IDO_ADDRESS, selectedVault]);

  const chains = [
    { id: 'story', name: 'Story', currency: 'ETH', color: 'from-orange-400 to-amber-600' },
    { id: 'base', name: 'Base', currency: 'USDC', color: 'from-blue-500 to-indigo-600' },
    { id: 'arbitrum', name: 'Arbitrum', currency: 'USDC', color: 'from-cyan-400 to-cyan-600' },
    { id: 'optimism', name: 'Optimism', currency: 'USDC', color: 'from-red-500 to-pink-600' },
    { id: 'polygon', name: 'Polygon', currency: 'USDC', color: 'from-purple-500 to-violet-600' },
  ];

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
              <label className="block text-gray-300 text-sm font-medium mb-2">Select Vault</label>
              <select
                value={selectedVault}
                onChange={(e) => setSelectedVault(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:border-orange-500 focus:outline-none transition-colors"
              >
                <option value="">Choose a vault...</option>
                {(userVaults as readonly `0x${string}`[] | undefined)?.map((vault: `0x${string}`) => (
                  <option key={vault} value={vault}>
                    {vault.slice(0, 6)}...{vault.slice(-4)}
                  </option>
                ))}
              </select>
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
                  Where do you want to receive your loan?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {chains.map((chain) => (
                    <motion.button
                      key={chain.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleChainSelect(chain.name)}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        selectedChain === chain.name
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                      }`}
                    >
                      {selectedChain === chain.name && (
                        <motion.div
                          layoutId="selectedChain"
                          className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-xl"
                        />
                      )}
                      <div className={`relative w-8 h-8 mx-auto mb-2 bg-gradient-to-br ${chain.color} rounded-lg`} />
                      <div className="relative text-center">
                        <p className="text-white text-sm font-semibold">{chain.name}</p>
                        <p className="text-gray-400 text-xs mt-1">{chain.currency}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <p className="text-xs text-blue-300">
                    {selectedChainId === 0
                      ? '💰 You will receive ETH on Story Protocol (same chain as your collateral)'
                      : `🌉 You will receive USDC on ${selectedChain} via Owlto Bridge • Collateral stays on Story`}
                  </p>
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
                disabled={!loanAmount || !selectedVault || !selectedChain || isWaiting}
                onClick={() => issueLoan?.({
                  address: CONTRACTS.LendingModule,
                  abi: LendingModule_ABI.abi,
                  functionName: 'issueLoan',
                  args: [
                    selectedVault as `0x${string}`,
                    parseUnits(loanAmount || '0', 18),
                    BigInt(parseInt(duration) * 24 * 60 * 60),
                    BigInt(selectedChainId),
                  ],
                  value: collateral,
                })}
                className="w-full py-4 bg-gradient-to-b from-orange-950/40 to-transparent border-2 border-orange-500 text-white rounded-2xl font-bold text-lg shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isWaiting ? 'Processing...' : loanExecuted ? '✓ Loan Executed Successfully!' : 'Execute Liquidity Drawdown'}
              </motion.button>
              {txHash && (
                <div className="mt-2 text-xs text-amber-400">
                  Tx: <a href={`https://aeneid.storyscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className="underline">{txHash.slice(0, 10)}...{txHash.slice(-8)}</a>
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
                      animate={{ width: currentCVS > 0 ? `${Math.min((currentCVS / 10000) * 100, 100)}%` : '0%' }}
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
              <div className="text-2xl font-bold text-white">
                {totalOutstanding > 0
                  ? `${totalOutstanding.toFixed(4)} ETH`
                  : '$0'}
              </div>
            </div>
          </div>

          {repayError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400 text-sm font-medium">Repayment Error</p>
                  <p className="text-gray-300 text-sm mt-1">{repayError}</p>
                </div>
                <button
                  onClick={() => setRepayError('')}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          <div className="space-y-4">
            {loadingIds || loanQueries.some(q => q.isLoading) ? (
              <div className="text-center py-12 bg-gray-800/30 border border-gray-700 rounded-2xl">
                <Loader2 className="w-12 h-12 text-orange-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading your loans...</p>
              </div>
            ) : activeLoans.length === 0 ? (
              <div className="text-center py-12 bg-gray-800/30 border border-gray-700 rounded-2xl">
                <div className="text-6xl mb-4">💰</div>
                <h3 className="text-xl font-bold text-white mb-2">No Active Loans</h3>
                <p className="text-gray-400 mb-6">You haven't taken out any loans yet</p>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600"
                >
                  Request Your First Loan
                </button>
              </div>
            ) : (
              <>
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
                </div>

                {loan.isLiquidatable && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-400 text-sm font-medium">Liquidation Risk!</p>
                        <p className="text-gray-300 text-xs mt-1">
                          Your CVS has dropped significantly. Repay now to avoid liquidation.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {loan.isOverdue && !loan.isLiquidatable && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-yellow-400 text-sm font-medium">Loan Overdue</p>
                        <p className="text-gray-300 text-xs mt-1">
                          This loan is past its due date. Interest continues to accrue.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRepayLoan(loan.id)}
                    disabled={isRepaying && repayingLoanId === loan.id}
                    className="w-full py-3 bg-gradient-to-b from-green-950/40 to-transparent border-2 border-green-500 text-white rounded-xl font-medium shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_35px_rgba(34,197,94,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRepaying && repayingLoanId === loan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Repaying...
                      </span>
                    ) : (
                      `Repay ${loan.totalRepayment} ETH`
                    )}
                  </motion.button>
                  <div className="text-xs text-gray-400 text-center">
                    Collateral locked: {loan.collateral} ETH
                  </div>
                </div>
              </motion.div>
                ))}
              </>
            )}
          </div>

          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-6 right-6 bg-green-500/90 backdrop-blur-xl border border-green-400 rounded-xl p-4 shadow-2xl max-w-md z-50"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-white flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-white font-bold mb-1">Loan Repaid Successfully!</p>
                  <p className="text-green-100 text-sm mb-2">
                    Your loan has been fully repaid and your collateral will be returned.
                  </p>
                  <a
                    href={`https://aeneid.storyscan.io/tx/${successTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white text-sm underline hover:text-green-200"
                  >
                    View Transaction →
                  </a>
                </div>
              </div>
            </motion.div>
          )}

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
