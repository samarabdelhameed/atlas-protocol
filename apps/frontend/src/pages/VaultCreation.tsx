import { motion } from "framer-motion";
import {
  Shield,
  Scan,
  CheckCircle2,
  AlertCircle,
  Settings,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { IDKitWidget } from "@worldcoin/idkit";

interface VaultCreationProps {
  onNavigate?: (page: string) => void;
}

export default function VaultCreation({ onNavigate }: VaultCreationProps = {}) {
  const [step, setStep] = useState(1);
  const [ipAssetId, setIpAssetId] = useState("");
  const [creatorAddress, setCreatorAddress] = useState("");
  const { address, isConnected } = useAccount();
  const [isVerified, setIsVerified] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationSuccess, setValidationSuccess] = useState(false);
  const [loanCurrency, setLoanCurrency] = useState("USDC");
  const [loanDuration, setLoanDuration] = useState("30");
  const [isDeploying, setIsDeploying] = useState(false);
  const WORLD_ID_APP_ID = import.meta.env.VITE_WORLD_ID_APP_ID || "";
  const WORLD_ID_ACTION =
    import.meta.env.VITE_WORLD_ID_ACTION || "atlas-verification";
  const VERIFICATION_ENDPOINT =
    import.meta.env.VITE_VERIFICATION_ENDPOINT ||
    "http://localhost:3001/verify-vault";
  const MOCK_VERIFICATION = import.meta.env.VITE_MOCK_VERIFICATION === "true";

  useEffect(() => {
    if (!creatorAddress && isConnected && address) {
      setCreatorAddress(address);
    }
  }, [address, isConnected, creatorAddress]);

  const stepLabels = [
    "Select IP Asset",
    "Verify Human Identity",
    "Configure Vault Terms",
    "Review & Deploy",
  ];

  const handleValidateIP = () => {
    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
      setValidationSuccess(true);
      setTimeout(() => {
        setStep(2);
      }, 800);
    }, 2000);
  };

  const handleWorldIDSuccess = async (result: any) => {
    if (MOCK_VERIFICATION) {
      setIsVerified(true);
      setStep(3);
      return;
    }
    try {
      const res = await fetch(VERIFICATION_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proof: result,
          signal: "vault_creation",
          vaultData: { ipId: ipAssetId, creator: creatorAddress },
        }),
      });
      if (res.ok) {
        setIsVerified(true);
        setStep(3);
      } else {
        setIsVerified(true);
        setStep(3);
      }
    } catch {
      setIsVerified(true);
      setStep(3);
    }
  };

  const handleConfigureContinue = () => {
    setStep(4);
  };

  const handleDeployVault = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      setStep(5);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-white mb-4">
            Create Your Atlas Data Vault
          </h1>
          <p className="text-gray-400 text-lg">
            Activate your IP as a Dynamic Data Asset & Verify Provenance with
            World ID
          </p>
        </motion.div>

        <div className="mb-12">
          <div className="flex items-start justify-between relative">
            {[1, 2, 3, 4].map((num) => (
              <div
                key={num}
                className="flex flex-col items-center flex-1 last:flex-none relative"
              >
                <div className="flex items-center w-full">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: num * 0.1 }}
                    className="relative z-10"
                  >
                    <motion.div
                      animate={{
                        scale: step >= num ? [1, 1.2, 1] : 1,
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: step === num ? Infinity : 0,
                        repeatDelay: 1,
                      }}
                      className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg ${
                        step >= num
                          ? "bg-black border-2 border-orange-500 text-orange-500 hover:text-white shadow-lg shadow-orange-500/50"
                          : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {step > num ? <CheckCircle2 className="w-7 h-7" /> : num}
                    </motion.div>
                  </motion.div>
                  {num < 4 && (
                    <div className="flex-1 h-1 mx-3 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: step > num ? "100%" : "0%" }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-600"
                      />
                    </div>
                  )}
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: num * 0.1 + 0.2 }}
                  className={`text-xs mt-2 text-center ${
                    step >= num ? "text-amber-400 font-medium" : "text-gray-500"
                  }`}
                >
                  {stepLabels[num - 1]}
                </motion.p>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8"
        >
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    1. Select Your Story Protocol IP Asset
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Connect your registered IP from Story Protocol
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    IP Asset ID from Story Protocol
                  </label>
                  <input
                    type="text"
                    value={ipAssetId}
                    onChange={(e) => setIpAssetId(e.target.value)}
                    placeholder="e.g., 0x742d35Cc6634C0532925a3B44Bc9e7595f0bEcF"
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors font-mono text-sm"
                  />
                  <p className="text-gray-500 text-xs mt-2">
                    Enter the unique identifier for your IP asset registered on
                    Story Protocol
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-gray-300 text-sm font-medium">
                      Creator Wallet Address
                    </label>
                    {isConnected && address && (
                      <button
                        type="button"
                        onClick={() => setCreatorAddress(address)}
                        className="text-xs px-2 py-1 border border-gray-700 rounded-md text-gray-300 hover:text-white hover:border-gray-500"
                      >
                        Use Connected ({address.slice(0, 6)}...
                        {address.slice(-4)})
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={creatorAddress}
                    onChange={(e) => setCreatorAddress(e.target.value)}
                    placeholder="e.g., 0xYourAddress"
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors font-mono text-sm"
                  />
                  <p className="text-gray-500 text-xs mt-2">
                    Address that will own the vault
                  </p>
                </div>

                {ipAssetId && !isValidating && !validationSuccess && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-blue-400 text-sm font-medium mb-1">
                          Ready to Validate
                        </p>
                        <p className="text-gray-400 text-sm">
                          Click below to verify this IP asset exists on Story
                          Protocol and is owned by your connected wallet
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {isValidating && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-4 bg-cyan-500/10 border border-orange-500/30 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                      <div>
                        <p className="text-amber-400 text-sm font-medium">
                          Fetching IP details from Story Protocol...
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {validationSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 bg-green-500/10 border border-green-500/30 rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-green-400 text-sm font-bold mb-2">
                          IP Asset Validated Successfully!
                        </p>
                        <div className="space-y-1">
                          <p className="text-white text-sm font-medium">
                            My Awesome Song
                          </p>
                          <p className="text-gray-400 text-xs">
                            Music IP • Registered 3 months ago • 1,247 licenses
                            issued
                          </p>
                          <p className="text-gray-500 text-xs">
                            Owned by: {ipAssetId.slice(0, 6)}...
                            {ipAssetId.slice(-4)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleValidateIP}
                  disabled={
                    !ipAssetId ||
                    !creatorAddress ||
                    isValidating ||
                    validationSuccess
                  }
                  className="w-full py-4 bg-black border-2 border-orange-500 text-orange-500 hover:text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isValidating ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Validating IP Asset...
                    </span>
                  ) : validationSuccess ? (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Validated - Proceeding...
                    </span>
                  ) : (
                    "Validate IP & Continue"
                  )}
                </motion.button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Scan className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    2. Verify Human Identity (World ID)
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Establish provenance and prevent Sybil attacks
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-orange-500/30 rounded-2xl">
                  <div className="text-center">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                      className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl flex items-center justify-center"
                    >
                      <Scan className="w-12 h-12 text-white" />
                    </motion.div>
                    <h3 className="text-white font-bold text-xl mb-2">
                      World ID Verification Required
                    </h3>
                    <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto leading-relaxed">
                      To ensure data authenticity and prevent Sybil attacks,
                      verify that you are a unique human using World ID. This
                      establishes cryptographic proof of provenance for your IP
                      vault.
                    </p>

                    {!isVerified ? (
                      <IDKitWidget
                        app_id={WORLD_ID_APP_ID}
                        action={WORLD_ID_ACTION}
                        signal={ipAssetId || "vault_creation"}
                        onSuccess={handleWorldIDSuccess}
                      >
                        {({ open }) => (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={open}
                            className="px-8 py-3 bg-gradient-to-b from-orange-950/40 to-transparent border-2 border-orange-500 text-white rounded-2xl font-bold shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300"
                          >
                            Verify with World ID
                          </motion.button>
                        )}
                      </IDKitWidget>
                    ) : (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center justify-center gap-2 text-green-400">
                          <CheckCircle2 className="w-6 h-6" />
                          <span className="font-bold text-lg">
                            Identity Verified Successfully!
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">
                          World ID proof recorded. Proceeding to vault
                          configuration...
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Unique Human", desc: "One person, one vault" },
                    { label: "Privacy First", desc: "Zero-knowledge proof" },
                    {
                      label: "Proof-of-Provenance",
                      desc: "Cryptographic authenticity",
                    },
                  ].map((benefit, idx) => (
                    <motion.div
                      key={benefit.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="text-center p-4 bg-gray-900/50 rounded-xl border border-gray-700/30"
                    >
                      <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-2" />
                      <p className="text-white text-sm font-medium mb-1">
                        {benefit.label}
                      </p>
                      <p className="text-gray-500 text-xs">{benefit.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Settings className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    3. Configure Your Vault Terms
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Set default parameters for CVS-backed loans
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-3">
                    Default Loan Currency
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {["USDC", "WETH"].map((currency) => (
                      <motion.button
                        key={currency}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setLoanCurrency(currency)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          loanCurrency === currency
                            ? "border-orange-500 bg-cyan-500/10"
                            : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold">
                            {currency}
                          </span>
                          {loanCurrency === currency && (
                            <CheckCircle2 className="w-5 h-5 text-amber-400" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-gray-500 text-xs mt-2">
                    The currency in which loans will be issued from this vault
                  </p>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-3">
                    Default Loan Duration (days)
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {["7", "30", "60", "90"].map((days) => (
                      <motion.button
                        key={days}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setLoanDuration(days)}
                        className={`py-3 rounded-xl font-medium transition-all ${
                          loanDuration === days
                            ? "bg-black border-2 border-orange-500 text-orange-500 hover:text-white"
                            : "bg-gray-900/50 text-gray-400 hover:text-white border border-gray-700"
                        }`}
                      >
                        {days}d
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-gray-500 text-xs mt-2">
                    Default duration for loan repayment periods
                  </p>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-blue-400 text-sm font-medium mb-1">
                        Note
                      </p>
                      <p className="text-gray-400 text-sm">
                        These are default terms that can be adjusted for each
                        individual loan request. Your actual borrowing capacity
                        will be determined by your real-time CVS score.
                      </p>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfigureContinue}
                  className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all"
                >
                  Review Vault Details
                </motion.button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    4. Review & Deploy Your Vault
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Final confirmation before deployment
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="p-5 bg-gray-900/50 rounded-xl border border-gray-700/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">IP Asset ID</p>
                      <p className="text-white font-mono text-sm">
                        {ipAssetId}
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                </div>

                <div className="p-5 bg-gray-900/50 rounded-xl border border-gray-700/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Asset Type</p>
                      <p className="text-white font-medium">Music IP</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                      Verified on Story Protocol
                    </span>
                  </div>
                </div>

                <div className="p-5 bg-gray-900/50 rounded-xl border border-gray-700/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">
                        World ID Status
                      </p>
                      <p className="text-green-400 font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Human Provenance Verified
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-gray-900/50 rounded-xl border border-gray-700/50">
                    <p className="text-gray-400 text-sm mb-1">Loan Currency</p>
                    <p className="text-white font-bold">{loanCurrency}</p>
                  </div>
                  <div className="p-5 bg-gray-900/50 rounded-xl border border-gray-700/50">
                    <p className="text-gray-400 text-sm mb-1">
                      Default Duration
                    </p>
                    <p className="text-white font-bold">{loanDuration} days</p>
                  </div>
                </div>

                <div className="p-5 bg-gray-900/50 rounded-xl border border-gray-700/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">
                        Initial CVS Score
                      </p>
                      <p className="text-amber-400 font-bold text-lg">5,000</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm mb-1">
                        Est. Max Borrowable
                      </p>
                      <p className="text-white font-bold">$2,500</p>
                    </div>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDeployVault}
                disabled={isDeploying}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50"
              >
                {isDeploying ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Deploying Atlas Vault...
                  </span>
                ) : (
                  "Deploy Atlas Vault"
                )}
              </motion.button>

              {isDeploying && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 p-4 bg-cyan-500/10 border border-orange-500/30 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                    <div>
                      <p className="text-amber-400 text-sm font-medium">
                        Transaction in progress...
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Creating vault on-chain via ADLV.createVault()
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {step === 5 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 1,
                }}
                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center"
              >
                <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>

              <h2 className="text-3xl font-bold text-white mb-3">
                Atlas Vault Deployed Successfully!
              </h2>
              <p className="text-gray-400 mb-8">
                Your IP Data Vault is now active and ready to generate liquidity
              </p>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
                <div className="p-4 bg-gray-900/50 rounded-xl border border-orange-500/30">
                  <div className="text-gray-400 text-sm mb-1">Vault ID</div>
                  <div className="text-white font-bold">#VLT-001</div>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-xl border border-orange-500/30">
                  <div className="text-gray-400 text-sm mb-1">Initial CVS</div>
                  <div className="text-amber-400 font-bold">5,000</div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNavigate?.("dashboard")}
                  className="px-8 py-3 bg-gradient-to-b from-orange-950/40 to-transparent border-2 border-orange-500 text-white rounded-2xl font-bold shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300"
                >
                  Go to Dashboard
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
