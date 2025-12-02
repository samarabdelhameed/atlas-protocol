import { motion } from "framer-motion";
import {
  Brain,
  Sparkles,
  Database,
  CheckCircle2,
  Star,
  TrendingUp,
  Shield,
  Users,
  Activity,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACTS } from '../contracts/addresses';
import ADLV_ABI from '../contracts/abis/ADLV.json';

// Story Aeneid Testnet Chain ID
const STORY_CHAIN_ID = 1315;



interface LicenseTier {
  id: string;
  name: string;
  price: string;
  period: string;
  color: string;
  cvsImpact: string;
  features: string[];
  popular: boolean;
}

interface PurchaseDetails {
  tier: string;
  price: string;
  txHash: string;
  organization: string;
  email: string;
  cvsImpact: string;
  vaultAddress: string;
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

export default function Licensing() {
  // Backend URL configuration
  const BACKEND_URL = import.meta.env.VITE_AGENT_API_URL || 'http://localhost:3001';

  // Wallet and account
  const { address } = useAccount();
  const chainId = useChainId();

  // State management
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | null>(null);
  const [pendingTier, setPendingTier] = useState<LicenseTier | null>(null);
  const [showBuyerModal, setShowBuyerModal] = useState(false);
  const [buyerInfo, setBuyerInfo] = useState({ name: '', organization: '', email: '' });
  const [formErrors, setFormErrors] = useState<{ name?: string; organization?: string; email?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVault, setSelectedVault] = useState('');
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Fetch user's vaults for dropdown
  const { data: userVaults } = useReadContract({
    address: CONTRACTS.ADLV,
    abi: ADLV_ABI.abi,
    functionName: 'getUserVaults',
    args: [address],
    query: {
      enabled: !!address,
    },
  });

  // Helper to parse price string to Wei
  const parseLicensePrice = (priceString: string): bigint => {
    if (priceString === 'Custom') return 0n;
    // "1.5" → 1.5 * 10^18 Wei (STORY tokens)
    return parseUnits(priceString, 18);
  };

  // Map frontend tier IDs to backend license types (for CVS calculation)
  const tierToLicenseType = {
    'basic': 'standard',        // 2% CVS increment
    'commercial': 'commercial',  // 5% CVS increment
    'enterprise': 'exclusive',   // 10% CVS increment
  } as const;

  // Contract write for sellLicense
  const { writeContract: purchaseLicense, data: txHash } = useWriteContract();

  // Transaction monitoring with error handling
  const { isLoading: isWaitingForTx, isError: isTxError, error: txError } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Network validation - check if user is on Story Aeneid Testnet
  useEffect(() => {
    if (address && chainId !== STORY_CHAIN_ID) {
      setNetworkError(`Please switch to Story Aeneid Testnet (Chain ID: ${STORY_CHAIN_ID})`);
    } else {
      setNetworkError(null);
    }
  }, [address, chainId]);

  // Helper function to submit metadata with retry logic
  const submitMetadataWithRetry = async (metadata: any, maxRetries = 3): Promise<boolean> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(`${BACKEND_URL}/licenses/metadata`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metadata),
        });

        if (response.ok) {
          console.log('✅ License metadata submitted successfully');
          return true;
        }

        // If 4xx error (client error), don't retry
        if (response.status >= 400 && response.status < 500) {
          console.warn('⚠️ Metadata submission failed with client error:', response.status);
          return false;
        }

        // 5xx errors - will retry
        console.warn(`⚠️ Metadata submission failed (attempt ${i + 1}/${maxRetries}):`, response.status);
      } catch (error) {
        if (i === maxRetries - 1) {
          console.error('❌ Failed to submit metadata after retries:', error);
          return false;
        }
        // Wait before retry (exponential backoff: 1s, 2s, 4s)
        const delay = Math.pow(2, i) * 1000;
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    return false;
  };

  // Handle transaction success
  useEffect(() => {
    if (txHash && !isWaitingForTx) {
      // Update purchase details with real data
      setPurchaseDetails({
        tier: pendingTier?.name || "",
        price: pendingTier?.price || "",
        txHash: txHash,
        organization: buyerInfo.organization,
        email: buyerInfo.email,
        cvsImpact: pendingTier?.cvsImpact || "",
        vaultAddress: selectedVault,
      });

      // Close buyer modal, show confirmation
      setShowBuyerModal(false);
      setSelectedTier(pendingTier?.id as string);

      // Update recent purchases
      if (pendingTier) {
        setRecentPurchases((prev) => [
          {
            company: buyerInfo.organization || "Unknown Org",
            tier: pendingTier.name,
            date: "Just now",
            amount: pendingTier.price,
            cvsImpact: pendingTier.cvsImpact,
            creator: "N/A",
          },
          ...prev,
        ]);
      }

      // Send metadata to backend with retry logic (non-blocking)
      (async () => {
        const success = await submitMetadataWithRetry({
          personalName: buyerInfo.name,
          organization: buyerInfo.organization,
          email: buyerInfo.email,
          tierId: pendingTier?.id,
          tierName: pendingTier?.name,
          amount: pendingTier?.price,
          vaultAddress: selectedVault,
          transactionHash: txHash,
        });

        if (!success) {
          // Metadata logging failed after retries - not critical but log it
          console.warn('⚠️ License metadata could not be logged to backend');
        }

        setIsSubmitting(false);
      })();
    }
  }, [txHash, isWaitingForTx, pendingTier, buyerInfo, selectedVault]);

  // Handle transaction errors
  useEffect(() => {
    if (isTxError && txError) {
      console.error('❌ Transaction failed:', txError);

      // Show error to user
      const errorMessage = txError.message || 'Transaction failed. Please try again.';
      setFormErrors({ email: errorMessage });

      // Close modal and reset state
      setShowBuyerModal(false);
      setIsSubmitting(false);
      setPendingTier(null);

      // Alert user about the error
      alert(`Transaction failed: ${errorMessage}`);
    }
  }, [isTxError, txError]);

  const tiers = [
    {
      id: "basic",
      name: "Basic Access",
      price: "0.1", // 0.1 STORY tokens
      period: "/month",
      color: "from-orange-500 to-amber-600",
      cvsImpact: "+25",
      features: [
        "Access to 10 IP datasets",
        "Basic usage analytics",
        "Standard API access",
        "Email support",
        "Monthly updates",
        "Human-verified provenance",
      ],
      popular: false,
    },
    {
      id: "commercial",
      name: "Commercial",
      price: "1.5", // 1.5 STORY tokens
      period: "/month",
      color: "from-amber-500 to-orange-600",
      cvsImpact: "+80",
      features: [
        "Access to 50+ IP datasets",
        "Advanced analytics dashboard",
        "Priority API access",
        "Dedicated support",
        "Real-time updates",
        "Commercial usage rights",
        "Custom integrations",
        "World ID verified sources",
      ],
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Custom",
      period: "",
      color: "from-orange-600 to-red-600",
      cvsImpact: "+200",
      features: [
        "Unlimited IP dataset access",
        "Full analytics suite",
        "Dedicated infrastructure",
        "24/7 premium support",
        "Real-time streaming",
        "White-label options",
        "Custom contracts",
        "On-premise deployment",
        "Direct creator partnerships",
      ],
      popular: false,
    },
  ];

  const dataMetrics = [
    {
      label: "Total IP Assets",
      value: "12,453",
      icon: Database,
      color: "from-orange-500 to-amber-600",
    },
    {
      label: "Human-Verified Creators",
      value: "3,842",
      icon: Users,
      color: "from-orange-600 to-red-600",
    },
    {
      label: "Goldsky Indexed Events",
      value: "847K",
      icon: Activity,
      color: "from-green-500 to-emerald-600",
    },
  ];

  // Recent purchases fetched from backend
  const [recentPurchases, setRecentPurchases] = useState<Array<{
    company: string;
    tier: string;
    date: string;
    amount: string;
    cvsImpact: string;
    creator: string;
  }>>([]);

  // Fetch recent license purchases from backend
  useEffect(() => {
    const fetchRecentLicenses = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/licenses/metadata`);
        const data = await response.json();

        if (data.success && data.licenses) {
          // Transform backend data to match display format
          const formatted = data.licenses.map((license: LicenseMetadata) => {
            const tier = tiers.find(t => t.id === license.tierId);
            return {
              company: license.organization,
              tier: license.tierName,
              date: formatRelativeTime(new Date(license.timestamp)),
              amount: `${license.amount} STORY`,
              cvsImpact: tier?.cvsImpact || '+0',
              creator: license.personalName || 'Anonymous',
            };
          });
          setRecentPurchases(formatted);
        }
      } catch (error) {
        console.error('Error fetching recent licenses:', error);
      }
    };

    fetchRecentLicenses();
    // Refresh every 30 seconds
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


  const handlePurchase = (tier: LicenseTier) => {
    // Validate wallet connection
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    // Validate vault selected
    if (!selectedVault) {
      alert('Please select a vault first');
      return;
    }

    setPendingTier(tier);
    setShowBuyerModal(true);
  };

  const submitMetadata = async () => {
    setIsSubmitting(true);
    setFormErrors({});

    try {
      if (!pendingTier || !selectedVault) {
        throw new Error('Missing required data');
      }

      // Prepare contract arguments
      const licenseType = tierToLicenseType[pendingTier.id as keyof typeof tierToLicenseType] || 'BASIC';
      const duration = BigInt(30 * 24 * 60 * 60); // 30 days in seconds
      const price = parseLicensePrice(pendingTier.price);

      // Call smart contract
      purchaseLicense?.({
        address: CONTRACTS.ADLV,
        abi: ADLV_ABI.abi,
        functionName: 'sellLicense',
        args: [
          selectedVault as `0x${string}`,
          licenseType,
          duration,
        ],
        value: price,
      });

      // Note: Transaction monitoring will handle success/failure via useWaitForTransaction
      // Don't set isSubmitting to false here - let onSuccess/onError handle it
    } catch (error) {
      console.error('Error initiating transaction:', error);
      setFormErrors({ email: 'Failed to initiate transaction. Please try again.' });
      setIsSubmitting(false);
    }
  };

  const validateBuyerInfo = () => {
    const errors: { name?: string; organization?: string; email?: string } = {};
    if (!buyerInfo.name.trim()) errors.name = "Required";
    if (!buyerInfo.organization.trim()) errors.organization = "Required";

    // RFC 5322 compliant email regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    const emailOk = emailRegex.test(buyerInfo.email);
    if (!buyerInfo.email.trim() || !emailOk) errors.email = "Invalid email";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
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

          <h1 className="text-5xl font-bold text-white mb-4">
            GenAI Data Licensing Portal
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            <span className="text-orange-400 font-semibold">
              Human-verified IP data
            </span>{" "}
            for compliant AI training • Powered by{" "}
            <span className="text-amber-400 font-semibold">World ID</span> &{" "}
            <span className="text-green-400 font-semibold">abv.dev</span>
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
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${metric.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity rounded-2xl`}
                />
                <div className="relative bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 group-hover:border-orange-500/50 transition-all">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${metric.color} rounded-xl flex items-center justify-center mb-3`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {metric.value}
                  </div>
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
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Choose Your Plan
          </h2>

          {address && networkError && (
            <div className="mb-8 max-w-md mx-auto">
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm font-medium">
                  ⚠️ {networkError}
                </p>
              </div>
            </div>
          )}

          {address && !networkError && (
            <div className="mb-8 max-w-md mx-auto">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Select Vault to Sell License From
              </label>
              <select
                value={selectedVault}
                onChange={(e) => setSelectedVault(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:border-orange-500 focus:outline-none transition-colors"
              >
                <option value="">Choose a vault...</option>
                {Array.isArray(userVaults) && userVaults.map((vault) => {
                  const vaultAddress = vault as string;
                  return (
                    <option key={vaultAddress} value={vaultAddress}>
                      {vaultAddress.slice(0, 6)}...{vaultAddress.slice(-4)}
                    </option>
                  );
                })}
              </select>
              {!selectedVault && (
                <p className="text-amber-400 text-xs mt-2">
                  ⚠️ Select a vault before purchasing a license
                </p>
              )}
            </div>
          )}

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
                      ? "border-orange-500/50"
                      : "border-gray-700/50 group-hover:border-gray-600/50"
                  }`}
                >
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${tier.color} rounded-2xl flex items-center justify-center mb-4`}
                  >
                    <Brain className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2">
                    {tier.name}
                  </h3>

                  <div className="flex items-baseline gap-1 mb-2">
                    <span
                      className={`text-5xl font-bold bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}
                    >
                      {tier.price === 'Custom' ? 'Custom' : `${tier.price} STORY`}
                    </span>
                    <span className="text-gray-400 text-lg">{tier.period}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-6 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm font-bold">
                      Creator CVS Impact: {tier.cvsImpact} pts
                    </span>
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
                        <CheckCircle2
                          className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                            tier.popular ? "text-orange-400" : "text-amber-400"
                          }`}
                        />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePurchase(tier)}
                    disabled={!address || !!networkError || !selectedVault || isSubmitting || isWaitingForTx}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                      tier.popular
                        ? "bg-gradient-to-b from-orange-950/40 to-transparent border-2 border-orange-500 text-white shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)]"
                        : "bg-gradient-to-b from-gray-950/40 to-transparent border-2 border-gray-600 text-white shadow-[0_0_15px_rgba(156,163,175,0.2)] hover:shadow-[0_0_25px_rgba(156,163,175,0.4)]"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {!address
                      ? 'Connect Wallet'
                      : networkError
                      ? 'Wrong Network'
                      : !selectedVault
                      ? 'Select Vault First'
                      : isWaitingForTx
                      ? 'Processing Transaction...'
                      : tier.price === 'Custom'
                      ? 'Contact Sales'
                      : 'Purchase License'}
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
              <h2 className="text-2xl font-bold text-white mb-1">
                Recent License Purchases
              </h2>
              <p className="text-gray-400 text-sm">
                Real-time marketplace activity indexed by Goldsky
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-4 text-gray-400 font-medium text-sm">Organization</th>
                  <th className="pb-4 text-gray-400 font-medium text-sm">Tier</th>
                  <th className="pb-4 text-gray-400 font-medium text-sm">Creator</th>
                  <th className="pb-4 text-gray-400 font-medium text-sm">Amount</th>
                  <th className="pb-4 text-gray-400 font-medium text-sm">CVS Impact</th>
                  <th className="pb-4 text-gray-400 font-medium text-sm">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentPurchases.map((purchase, index) => (
                  <motion.tr
                    key={purchase.company + index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.05 }}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="py-4 text-white font-medium">{purchase.company}</td>
                    <td className="py-4 text-gray-300">{purchase.tier}</td>
                    <td className="py-4 text-gray-300">{purchase.creator}</td>
                    <td className="py-4 text-orange-400 font-bold">{purchase.amount}</td>
                    <td className="py-4 text-green-400 font-bold">{purchase.cvsImpact}</td>
                    <td className="py-4 text-gray-400 text-sm">{purchase.date}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
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
              <h3 className="text-xl font-bold text-white mb-2">
                How Atlas Protocol Works
              </h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                When you purchase a license, the{" "}
                <span className="text-orange-400 font-semibold">
                  LicensingAgent
                </span>{" "}
                automatically splits revenue via{" "}
                <span className="text-amber-400 font-semibold">
                  ADLV.depositLicenseRevenue()
                </span>
                , increasing the creator's CVS (Content Value Score). All
                transactions are indexed by{" "}
                <span className="text-green-400 font-semibold">Goldsky</span>{" "}
                and the license is registered as a derivative IP asset on Story
                Protocol via{" "}
                <span className="text-green-400 font-semibold">abv.dev</span>,
                ensuring full provenance and compliance.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                  <div className="text-orange-400 font-bold mb-1">Step 1</div>
                  <div className="text-gray-300 text-sm">
                    Select tier & purchase
                  </div>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                  <div className="text-amber-400 font-bold mb-1">Step 2</div>
                  <div className="text-gray-300 text-sm">
                    LicensingAgent splits revenue
                  </div>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                  <div className="text-green-400 font-bold mb-1">Step 3</div>
                  <div className="text-gray-300 text-sm">
                    CVS updated via Goldsky
                  </div>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                  <div className="text-green-400 font-bold mb-1">Step 4</div>
                  <div className="text-gray-300 text-sm">
                    License registered on-chain
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {showBuyerModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          onClick={() => {
            if (!isSubmitting) setShowBuyerModal(false);
          }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-white mb-4">Buyer Information</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Personal Name</label>
                <input
                  value={buyerInfo.name}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg bg-gray-900/50 border ${formErrors.name ? 'border-red-500' : 'border-gray-700'} text-white`}
                  placeholder="e.g., Jane Doe"
                />
                {formErrors.name && <div className="text-red-500 text-xs mt-1">{formErrors.name}</div>}
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Organization Name</label>
                <input
                  value={buyerInfo.organization}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo, organization: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg bg-gray-900/50 border ${formErrors.organization ? 'border-red-500' : 'border-gray-700'} text-white`}
                  placeholder="e.g., OpenAI Labs"
                />
                {formErrors.organization && <div className="text-red-500 text-xs mt-1">{formErrors.organization}</div>}
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Contact Email</label>
                <input
                  type="email"
                  value={buyerInfo.email}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo, email: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg bg-gray-900/50 border ${formErrors.email ? 'border-red-500' : 'border-gray-700'} text-white`}
                  placeholder="name@company.com"
                />
                {formErrors.email && <div className="text-red-500 text-xs mt-1">{formErrors.email}</div>}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBuyerModal(false)}
                disabled={isSubmitting || isWaitingForTx}
                className="flex-1 py-3 bg-gray-700 text-white rounded-2xl font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => { if (validateBuyerInfo()) submitMetadata(); }}
                disabled={isSubmitting || isWaitingForTx}
                className="flex-1 py-3 bg-gradient-to-b from-orange-950/40 to-transparent border-2 border-orange-500 text-white rounded-2xl font-bold shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300 disabled:opacity-50"
              >
                {isWaitingForTx
                  ? 'Waiting for Transaction...'
                  : isSubmitting
                  ? 'Processing...'
                  : 'Complete Purchase'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

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
              <h3 className="text-2xl font-bold text-white mb-2">
                Purchase Confirmed!
              </h3>
              <p className="text-gray-400">
                Your license is being processed on-chain
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <span className="text-gray-400">License Tier</span>
                <span className="text-white font-bold">
                  {purchaseDetails.tier}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <span className="text-gray-400">Amount</span>
                <span className="text-orange-400 font-bold">
                  {purchaseDetails.price}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <span className="text-gray-400">Organization</span>
                <span className="text-white font-bold">
                  {purchaseDetails.organization || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <span className="text-gray-400">Contact Email</span>
                <span className="text-white font-bold">
                  {purchaseDetails.email || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                <span className="text-gray-400">Creator CVS Impact</span>
                <span className="text-green-400 font-bold">
                  {purchaseDetails.cvsImpact} pts
                </span>
              </div>
              <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-400 text-sm">
                    Transaction Hash
                  </span>
                  <a
                    href={`https://aeneid.storyscan.io/tx/${purchaseDetails.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-400 hover:text-orange-300 text-xs font-mono underline"
                  >
                    {purchaseDetails.txHash.slice(0, 10)}...
                    {purchaseDetails.txHash.slice(-8)}
                  </a>
                </div>
              </div>
              <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-400 text-sm">Vault Address</span>
                  <a
                    href={`https://aeneid.storyscan.io/address/${purchaseDetails.vaultAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-orange-400 text-xs font-mono underline"
                  >
                    {purchaseDetails.vaultAddress?.slice(0, 6)}...
                    {purchaseDetails.vaultAddress?.slice(-4)}
                  </a>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-violet-500/10 to-pink-500/10 rounded-lg border border-orange-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-orange-400" />
                  <span className="text-orange-400 text-sm font-bold">
                    On-Chain Registration
                  </span>
                </div>
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>Contract:</span>
                    <span className="text-amber-400 font-mono">
                      ADLV.sellLicense()
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Registry:</span>
                    <span className="text-green-400">
                      abv.dev (Story Protocol)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Indexing:</span>
                    <span className="text-green-400">
                      Goldsky (Real-time)
                    </span>
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
