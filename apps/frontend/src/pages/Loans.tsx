import { motion } from 'framer-motion';
import { DollarSign, Clock, CheckCircle2, AlertTriangle, Shield, Zap, Loader2, X, AlertCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { createPublicClient, http, formatUnits, parseUnits } from 'viem';
import { useQuery, useQueries } from '@tanstack/react-query';
import { CONTRACTS } from '../contracts/addresses';
import ADLV_JSON from '../contracts/abis/ADLV.json';
import IDO_JSON from '../contracts/abis/IDO.json';
// LendingModule_ABI not used - repayLoan uses ADLV contract

// Debug: Check ABI issueLoan parameters
const issueLoanABI = ADLV_JSON.abi.find((item: any) => item.name === 'issueLoan');
console.log('🔍 issueLoan ABI inputs:', issueLoanABI?.inputs?.length, issueLoanABI?.inputs?.map((i: any) => i.name));

interface LoanData {
  loanId: bigint;           // uint256 loanId
  vaultAddress: `0x${string}`; // address vaultAddress (renamed from vault)
  borrower: `0x${string}`;  // address borrower
  loanAmount: bigint;       // uint256 loanAmount
  collateralAmount: bigint; // uint256 collateralAmount
  interestRate: bigint;     // uint256 interestRate
  duration: bigint;         // uint256 duration (was missing!)
  cvsAtIssuance: bigint;    // uint256 cvsAtIssuance
  startTime: bigint;        // uint256 startTime
  endTime: bigint;          // uint256 endTime
  repaidAmount: bigint;     // uint256 repaidAmount (was missing!)
  outstandingAmount: bigint; // uint256 outstandingAmount (was missing!)
  status: number | bigint;           // LoanStatus status
}

interface VaultData {
  address: `0x${string}`;
  ipId: `0x${string}`;
  creator: `0x${string}`;
  cvs: bigint;
  maxLoan: bigint;
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
  const [selectedChain, setSelectedChain] = useState('Story Testnet');
  const [selectedChainId, setSelectedChainId] = useState<number>(1315); // Story Aeneid Testnet
  const [duration, setDuration] = useState('30');
  const [loanExecuted, setLoanExecuted] = useState(false);
  const [selectedVault, setSelectedVault] = useState('');
  const [error, setError] = useState<string>('');
  const [repayingLoanId, setRepayingLoanId] = useState<string | null>(null);
  const [repayError, setRepayError] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTxHash, setSuccessTxHash] = useState<string>('');
  const [isLoadingMetrics, ] = useState(false);

  // Helper function to parse revert reasons from contract errors
  const parseContractError = (error: any): string => {
    const message = error?.message || error?.toString() || 'Unknown error';
    
    // Check for common ADLV revert reasons
    if (message.includes('Insufficient CVS')) {
      return 'Insufficient CVS: Your IP asset needs more value to support this loan amount. Try a smaller amount or increase CVS through license sales.';
    }
    if (message.includes('Insufficient collateral')) {
      return 'Insufficient collateral: You need to provide at least 150% of the loan amount as collateral.';
    }
    if (message.includes('Insufficient liquidity')) {
      return 'Insufficient vault liquidity: The vault doesn\'t have enough funds to issue this loan.';
    }
    if (message.includes('Vault does not exist')) {
      return 'Vault not found: The selected vault doesn\'t exist on-chain.';
    }
    if (message.includes('User rejected') || message.includes('user rejected')) {
      return 'Transaction cancelled: You rejected the transaction in your wallet.';
    }
    if (message.includes('insufficient funds')) {
      return 'Insufficient wallet balance: You don\'t have enough IP tokens for the collateral.';
    }
    
    // Extract revert reason if present
    const revertMatch = message.match(/revert(?:ed)?[:\s]+(.+?)(?:\n|$)/i);
    if (revertMatch) {
      return `Transaction reverted: ${revertMatch[1]}`;
    }
    
    // Truncate long messages
    if (message.length > 200) {
      return message.substring(0, 200) + '...';
    }
    
    return message;
  };

  // Chain ID mapping for Owlto Bridge (TESTNET)
  const CHAIN_ID_MAP = {
    story: 1315,     // Story Aeneid Testnet
    'base-sepolia': 84532,    // Base Sepolia Testnet
    'arbitrum-sepolia': 421614, // Arbitrum Sepolia Testnet
    'optimism-sepolia': 11155420,  // Optimism Sepolia Testnet
    'polygon-amoy': 80002,  // Polygon Amoy Testnet
  } as const;

  // Update chain selector handler
  const handleChainSelect = (chainId: string, chainName: string) => {
    setSelectedChain(chainName);
    setSelectedChainId(CHAIN_ID_MAP[chainId.toLowerCase() as keyof typeof CHAIN_ID_MAP] || 0);
    console.log('🔗 Chain selected:', { chainId, chainName, numericId: CHAIN_ID_MAP[chainId.toLowerCase() as keyof typeof CHAIN_ID_MAP] });
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
      chain: { id: CHAIN_ID, name: 'Story', nativeCurrency: { name: 'IP', symbol: 'IP', decimals: 18 }, rpcUrls: { default: { http: [RPC_URL] } } },
      transport: http(RPC_URL),
    });
  }, [RPC_URL, CHAIN_ID]);

  // Fetch user's vaults from API
  const { data: userVaults } = useQuery({
    queryKey: ['userVaults', address],
    queryFn: async () => {
      if (!address) return [];
      const backendUrl = import.meta.env.VITE_BACKEND_ENDPOINT || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/vaults/${address}`);
      if (!response.ok) return [];
      const data = await response.json();
      
      return (data.vaults || [])
        .filter((v: any) => v && v.address)
        .map((v: any) => ({
          address: v.address as `0x${string}`,
          ipId: (v.ipId || v.ipAsset) as `0x${string}`,
          creator: v.creator,
          cvs: BigInt(v.cvs || v.currentCVS || '0'),
          // Apply 99% safety buffer to avoid edge case failures due to rounding
          maxLoan: (BigInt(v.cvs || v.currentCVS || '0') * 99n) / 200n, // 49.5% of CVS (with buffer)
        }));
    },
    enabled: !!address,
  });

  // Calculate collateral (150%)
  const collateral = loanAmount ? parseUnits((Number(loanAmount) * 1.5).toString(), 18) : 0n;

  // Issue loan with wagmi hooks - Using LendingModule with cross-chain support
  const { writeContract: issueLoan, data: txHash, error: writeError, isPending } = useWriteContract();

  const { isLoading: isWaiting, data: txReceipt, isSuccess: txSuccess, isError: txError } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Fetch user's loan IDs from ADLV (not LendingModule)
  // ADLV tracks borrowerLoans mapping when loans are issued
  const { data: loanIds, isLoading: loadingIds, refetch: refetchLoanIds } = useReadContract({
    address: CONTRACTS.ADLV,
    abi: ADLV_JSON.abi,
    functionName: 'getBorrowerLoans',
    args: [address],
    query: {
      enabled: !!address,
      refetchInterval: 5000, // Poll every 5 seconds (replaces watch)
    },
  });

  // Debug: Log loan IDs
  useEffect(() => {
    console.log('🔍 Loan IDs for user:', address, loanIds);
    if (loanIds && Array.isArray(loanIds)) {
      console.log('   Total loans:', loanIds.length);
    }
  }, [loanIds, address]);

  // Fetch individual loan details in parallel
  const loanQueries = useQueries({
    queries: ((loanIds as bigint[]) || []).map((loanId: bigint) => ({
      // Convert BigInt to string for query key to avoid JSON.stringify error
      queryKey: ['loan', loanId.toString()],
      queryFn: async () => {
        if (!publicClient) return null;

        // Fetch loan details from ADLV (where loans are stored)
        const loan = await publicClient.readContract({
          address: CONTRACTS.ADLV,
          abi: ADLV_JSON.abi,
          functionName: 'getLoan',
          args: [loanId],
        }) as LoanData;

        // Fetch vault to get ipId
        const vault = await publicClient.readContract({
          address: CONTRACTS.ADLV,
          abi: ADLV_JSON.abi,
          functionName: 'getVault',
          args: [loan.vaultAddress],
        }) as VaultData;

        // Fetch current CVS
        const currentCVS = await publicClient.readContract({
          address: CONTRACTS.IDO,
          abi: IDO_JSON.abi,
          functionName: 'getCVS',
          args: [vault.ipId],
        }) as bigint;

        // Calculate accrued interest using ADLV's formula
        const now = BigInt(Math.floor(Date.now() / 1000));
        const elapsedTime = now - loan.startTime;
        const loanDuration = loan.endTime - loan.startTime;
        const interest = await publicClient.readContract({
          address: CONTRACTS.ADLV,
          abi: ADLV_JSON.abi,
          functionName: 'calculateInterest',
          args: [loan.loanAmount, loan.interestRate, elapsedTime, loanDuration],
        }) as bigint;

        // Check liquidation risk (loan is liquidatable if CVS drops below 2x loan amount)
        const isLiquidatable = currentCVS < (loan.loanAmount * 2n);

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
    console.log('🔍 Processing loan queries:', loanQueries.length);
    loanQueries.forEach((q, i) => {
      if (q.data) {
        console.log(`   Loan ${q.data.loanId}: rawStatus=${q.data.status} type=${typeof q.data.status} cast=${Number(q.data.status)}`);
      }
    });

    const filtered = loanQueries
      .filter(q => q.data && Number((q.data as EnrichedLoanData).status) === 1); // 1 = Active status

    console.log('   Active loans after filter:', filtered.length);

    return filtered.map(q => {
        const loan = q.data as EnrichedLoanData;
        const now = Math.floor(Date.now() / 1000);
        const timeRemaining = Number(loan.endTime) - now;
        const isOverdue = timeRemaining < 0;

        // Calculate CVS health percentage
        const cvsHealth = loan.cvsAtIssuance > 0n
          ? (Number(loan.currentCVS) / Number(loan.cvsAtIssuance)) * 100
          : 100;

        // Calculate total repayment (Principal + Interest - Repaid)
        // Check for 0 to avoid negative numbers due to async timing updates
        const totalDue = loan.loanAmount + loan.accruedInterest;
        const totalRepayment = totalDue > loan.repaidAmount ? totalDue - loan.repaidAmount : 0n;
        
        // Calculate interest per second for buffer to prevent partial repayment
        // Interest = (principal * rate * time) / (10000 * duration)
        // Rate is bps. Duration is seconds.
        const interestPerSecond = (loan.loanAmount * loan.interestRate) / (10000n * loan.duration);
        // Add 5 minutes buffer (300 seconds) to ensure transaction covers block time drift
        const buffer = interestPerSecond * 300n;
        
        // Ensure strictly greater than totalDue by adding 1000 wei extra just in case of rounding
        const repaymentTxValue = totalRepayment + buffer + 1000n;

        return {
          id: loan.loanId.toString(),
          amount: formatUnits(loan.loanAmount, 18),
          vaultAddress: loan.vaultAddress,
          chain: 'Story Testnet',
          dueDate: new Date(Number(loan.endTime) * 1000).toLocaleDateString(),
          timeRemaining,
          isOverdue,
          cvsHealth,
          healthStatus: (cvsHealth > 80 ? 'healthy' : cvsHealth > 50 ? 'warning' : 'critical') as 'healthy' | 'warning' | 'critical',
          collateral: formatUnits(loan.collateralAmount, 18),
          interest: formatUnits(loan.accruedInterest, 18),
          totalRepayment: formatUnits(totalRepayment, 18),
          totalRepaymentWei: repaymentTxValue, // Use buffered amount for TX
          currentCVS: Number(formatUnits(loan.currentCVS, 18)),
          collateralRatio: cvsHealth,
          apr: '3.5%',
          status: (cvsHealth > 80 ? 'healthy' : cvsHealth > 50 ? 'warning' : 'critical'),
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
  const [lastProcessedRepayTx, setLastProcessedRepayTx] = useState<string | null>(null);
  
  useEffect(() => {
    // Only process if we have a new tx hash that we haven't processed yet
    if (repayTxHash && !isRepaying && repayTxHash !== lastProcessedRepayTx) {
      setLastProcessedRepayTx(repayTxHash);
      // Refetch loan data
      refetchLoanIds();
      setRepayingLoanId(null);
      setRepayError('');
      setShowSuccess(true);
      setSuccessTxHash(repayTxHash);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [repayTxHash, isRepaying, lastProcessedRepayTx, refetchLoanIds]);

  // Handle loan issuance transaction success/failure
  useEffect(() => {
    if (txHash && !isWaiting && txReceipt) {
      console.log('📋 Transaction receipt:', txReceipt);

      // Check if transaction succeeded or reverted
      if (txReceipt.status === 'success') {
        console.log('✅ Loan transaction SUCCEEDED');
        setLoanExecuted(true);
        setLoanAmount('');
        setError('');

        // Refetch loan data to show the new loan
        refetchLoanIds();

        setTimeout(() => setLoanExecuted(false), 3000);
      } else {
        console.error('❌ Loan transaction REVERTED');
        setError('Transaction failed: The transaction was reverted. Please check your collateral, CVS requirements, and vault liquidity.');
        setLoanExecuted(false);
      }
    }
  }, [txHash, isWaiting, txReceipt, refetchLoanIds]);

  // Handle loan issuance write errors
  useEffect(() => {
    if (writeError) {
      console.error('❌ Write contract error:', writeError);
      setError(parseContractError(writeError));
    }
  }, [writeError]);

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
      address: CONTRACTS.ADLV,
      abi: ADLV_JSON.abi,
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
  const selectedVaultData = useMemo(() => {
    return userVaults?.find((v: any) => v.address.toLowerCase() === selectedVault.toLowerCase());
  }, [userVaults, selectedVault]);

  // Read Collateral Ratio from Contract
  const { data: collateralRatioData } = useReadContract({
    address: ADLV_ADDRESS,
    abi: ADLV_JSON.abi,
    functionName: 'defaultCollateralRatio',
    query: {
      enabled: !!ADLV_ADDRESS,
      staleTime: 60000, // Cache for 1 minute
    }
  });

  // Read Interest Rate from Contract (dependent on CVS)
  const { data: interestRateData } = useReadContract({
    address: ADLV_ADDRESS,
    abi: ADLV_JSON.abi,
    functionName: 'calculateInterestRate',
    args: selectedVaultData ? [selectedVaultData.cvs] : undefined,
    query: {
      enabled: !!ADLV_ADDRESS && !!selectedVaultData,
      staleTime: 60000,
    }
  });

  // Update state based on hooks and synchronous calculations
  useEffect(() => {
    if (!selectedVaultData) {
      setCurrentCVS(0);
      setMaxBorrowable(0);
      return;
    }

    // Update CVS from API data
    const cvsVal = Number(formatUnits(selectedVaultData.cvs, 18));
    setCurrentCVS(cvsVal);

    // Update Collateral Ratio if available
    if (collateralRatioData) {
      setCollateralBps(Number(collateralRatioData));
    }

    // Update APR if available
    if (interestRateData) {
      setAprBps(Number(interestRateData));
    }

    // Calculate Max Borrowable Synchronously
    const maxLoanFromCVS = Number(formatUnits(selectedVaultData.maxLoan, 18));

    // Calculate total outstanding loans for this vault
    const activeLoansForVault = loanQueries
      .map(q => q.data)
      .filter((loan): loan is EnrichedLoanData => 
        loan !== null && 
        loan !== undefined && 
        loan.vaultAddress.toLowerCase() === selectedVault.toLowerCase() && 
        loan.status === 1 // 1 = Active
      );

    const totalOutstanding = activeLoansForVault.reduce(
      (sum, loan) => sum + Number(formatUnits(loan.loanAmount, 18)),
      0
    );

    // Remaining borrowing capacity with 1% safety buffer
    const remainingCapacity = Math.max(0, (maxLoanFromCVS - totalOutstanding) * 0.99);

    console.log('📊 Borrowing capacity:', {
      cvs: cvsVal,
      maxFromCVS: maxLoanFromCVS,
      totalOutstanding,
      remainingCapacity,
      activeLoans: activeLoansForVault.length,
    });

    setMaxBorrowable(remainingCapacity);
    
    // No longer setting isLoadingMetrics here to avoid infinite loops
    // The button will just be disabled if maxBorrowable is 0 or data is missing
  }, [selectedVaultData, collateralRatioData, interestRateData, loanQueries, selectedVault]);

  // All loans are issued in IP tokens on Story Protocol
  // Owlto Bridge converts IP → native token on destination chain (if cross-chain selected)
  const chains = [
    { id: 'story', name: 'Story Testnet', currency: 'IP', color: 'from-orange-400 to-amber-600' },
    { id: 'base-sepolia', name: 'Base Sepolia', currency: 'USDC', color: 'from-blue-500 to-indigo-600' },
    { id: 'arbitrum-sepolia', name: 'Arbitrum Sepolia', currency: 'USDC', color: 'from-cyan-400 to-cyan-600' },
    { id: 'optimism-sepolia', name: 'Optimism Sepolia', currency: 'USDC', color: 'from-red-500 to-pink-600' },
    { id: 'polygon-amoy', name: 'Polygon Amoy', currency: 'USDC', color: 'from-purple-500 to-violet-600' },
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
                {userVaults?.map((vault: VaultData) => (
                  <option key={vault.address} value={vault.address}>
                    {vault.address.slice(0, 6)}...{vault.address.slice(-4)} (CVS: {(Number(vault.cvs) / 1e18).toFixed(2)} IP)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Loan Amount (IP)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (val > maxBorrowable) {
                      setLoanAmount(maxBorrowable.toString());
                      setError(`Maximum loan amount is ${maxBorrowable.toFixed(4)} IP (50% of your CVS)`);
                    } else {
                      setLoanAmount(e.target.value);
                      setError('');
                    }
                  }}
                  max={maxBorrowable}
                  placeholder="0.00"
                  className="w-full px-4 py-4 bg-gray-900/50 border border-gray-700 rounded-xl text-white text-2xl font-bold placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                />
                <button
                  onClick={() => setLoanAmount(maxBorrowable ? (Math.floor(maxBorrowable * 10000) / 10000).toString() : '')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-gradient-to-b from-orange-950/40 to-transparent border border-orange-500 text-white rounded-xl text-sm font-medium shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] transition-all duration-300"
                >
                  MAX
                </button>
              </div>
              <div className="mt-2 flex justify-between items-center text-sm">
                <span className="text-gray-400">Max Borrowable (50% of CVS)</span>
                <span className="text-amber-400 font-bold">
                  {maxBorrowable > 0 ? `${maxBorrowable < 0.01 ? maxBorrowable.toFixed(4) : maxBorrowable.toLocaleString(undefined, { maximumFractionDigits: 2 })} IP` : '—'}
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Required collateral: {loanAmount ? `${(parseFloat(loanAmount) * 1.5).toFixed(4)} IP (150%)` : '—'}
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
                      onClick={() => handleChainSelect(chain.id, chain.name)}
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
                    {selectedChainId === 1315
                      ? '💰 You will receive IP on Story Testnet (same chain as your collateral)'
                      : `🌉 You will receive ${chains.find(c => c.id === selectedChain.toLowerCase())?.currency || 'tokens'} on ${selectedChain} via Owlto Bridge • Collateral stays on Story Testnet`}
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
                      {(() => {
                        if (!currentCVS || !loanAmount) return '—';
                        const val = parseFloat(loanAmount) * collateralRatio / 100;
                        return `${val < 0.01 ? val.toFixed(4) : val.toFixed(2)} CVS`;
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Repayment</span>
                    <span className="text-white font-bold">
                      {(() => {
                        if (estimatedAPR === '—') return '—';
                        const val = parseFloat(loanAmount) * (1 + parseFloat(estimatedAPR) / 100 * parseInt(duration) / 365);
                        return val < 0.01 ? val.toFixed(4) : val.toFixed(2);
                      })()}
                    </span>
                  </div>
                </motion.div>
              )}

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-3">
                  <div className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">⚠️</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!loanAmount || !selectedVault || !selectedChain || isWaiting || isPending || !address || isLoadingMetrics || maxBorrowable === 0}
                onClick={() => {
                  try {
                    // Clear previous errors
                    setError('');

                    // Validate inputs
                    if (!address) {
                      setError('Please connect your wallet first');
                      return;
                    }
                    if (!selectedVault) {
                      setError('Please select a vault');
                      return;
                    }
                    if (!loanAmount || parseFloat(loanAmount) <= 0) {
                      setError('Please enter a valid loan amount');
                      return;
                    }
                    if (parseFloat(loanAmount) > maxBorrowable) {
                      setError(`Loan amount exceeds maximum of ${maxBorrowable.toFixed(4)} IP. Your CVS only supports loans up to ${(currentCVS / 2).toFixed(4)} IP.`);
                      return;
                    }
                    
                    // Additional CVS validation
                    const requiredCVS = parseFloat(loanAmount) * 2;
                    if (currentCVS < requiredCVS) {
                      setError(`Insufficient CVS: You need ${requiredCVS.toFixed(4)} IP CVS to borrow ${loanAmount} IP, but you only have ${currentCVS.toFixed(4)} IP CVS.`);
                      return;
                    }

                    console.log('🚀 Issuing loan:', {
                      wallet: address,
                      vault: selectedVault,
                      amount: loanAmount,
                      collateral: collateral.toString(),
                      duration: parseInt(duration) * 24 * 60 * 60,
                      chainId: selectedChainId,
                      issueLoanAvailable: !!issueLoan,
                    });

                    if (!issueLoan) {
                      console.error('❌ issueLoan function not available');
                      setError('Contract write function not initialized');
                      return;
                    }

                    issueLoan({
                      address: CONTRACTS.ADLV,
                      abi: ADLV_JSON.abi,
                      functionName: 'issueLoan',
                      args: [
                        selectedVault as `0x${string}`,
                        parseUnits(loanAmount || '0', 18),
                        BigInt(parseInt(duration) * 24 * 60 * 60),
                        BigInt(selectedChainId),
                      ],
                      value: collateral,
                    });
                  } catch (err: any) {
                    console.error('❌ Error in onClick:', err);
                    setError(`Error: ${err.message || 'Unknown error'}`);
                  }
                }}
                className="w-full py-4 bg-gradient-to-b from-orange-950/40 to-transparent border-2 border-orange-500 text-white rounded-2xl font-bold text-lg shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoadingMetrics ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span> Loading vault data...
                  </span>
                ) : isPending ? (
                  'Waiting for wallet approval...'
                ) : isWaiting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span> Processing transaction...
                  </span>
                ) : loanExecuted ? (
                  '✅ Loan Executed Successfully!'
                ) : maxBorrowable === 0 && selectedVault ? (
                  'No borrowing capacity available'
                ) : (
                  'Execute Liquidity Drawdown'
                )}
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
                    <span className="text-white font-bold">
                      {currentCVS > 0 ? (currentCVS < 0.01 ? currentCVS.toFixed(4) : currentCVS.toLocaleString(undefined, { maximumFractionDigits: 2 })) : '0'}
                    </span>
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
                    <span className="text-gray-400 text-sm">Max Borrowable</span>
                    <span className="text-amber-400 font-bold">{maxBorrowable.toFixed(4)} IP</span>
                  </div>
                  <p className="text-gray-500 text-xs">50% of CVS • Requires 150% Collateral</p>
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
                  ? `${totalOutstanding.toFixed(4)} IP`
                  : '0 IP'}
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
                    <div className="text-white font-bold">
                      {loan.currentCVS < 0.01 ? loan.currentCVS.toFixed(4) : loan.currentCVS.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
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
                      `Repay ${loan.totalRepayment} IP`
                    )}
                  </motion.button>
                  <div className="text-xs text-gray-400 text-center">
                    Collateral locked: {loan.collateral} IP
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
