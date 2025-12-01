import { motion } from "framer-motion";
import {
  Shield,
  Scan,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { IDKitWidget, VerificationLevel } from "@worldcoin/idkit";
import { isAddress, createPublicClient, http, formatUnits, padHex } from "viem";
import { useStoryProtocol } from "../hooks/useStoryProtocol";
import { CONTRACTS, NETWORK, getExplorerUrl } from "../contracts/addresses";
import { storyTestnet } from "../wagmi";
import ADLV_ABI from "../contracts/abis/ADLV.json";
import IDO_ABI from "../contracts/abis/IDO.json";

interface VaultCreationProps {
  onNavigate?: (page: string) => void;
}

interface WorldIDResult {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: string;
}

export default function VaultCreation({ onNavigate }: VaultCreationProps = {}) {
  const [step, setStep] = useState(1);
  const [ipAssetId, setIpAssetId] = useState("");
  const [creatorAddress, setCreatorAddress] = useState("");
  const { address, isConnected } = useAccount();
  const { getIPAsset } = useStoryProtocol();
  const [isVerified, setIsVerified] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationSuccess, setValidationSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [assetName, setAssetName] = useState<string>("");
  const [assetType, setAssetType] = useState<string>("");
  const [assetOwner, setAssetOwner] = useState<string>("");
  // Read-only metrics for Review step
  const [cvsScore, setCvsScore] = useState<string>("");
  const [maxBorrowable, setMaxBorrowable] = useState<string>("");
  // Existing vault detection state
  const [existingVaultAddress, setExistingVaultAddress] = useState<string>("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [vaultAddress, setVaultAddress] = useState<string>("");
  const [transactionHash, setTransactionHash] = useState<string>("");
  const [vaultCreationError, setVaultCreationError] = useState<string>("");
  // Prefer backend base endpoint, fallback to legacy verification endpoint or default
  const WORLD_ID_APP_ID = import.meta.env.VITE_WORLD_ID_APP_ID || "";
  const WORLD_ID_ACTION =
    import.meta.env.VITE_WORLD_ID_ACTION || "atlasverification";
  const BACKEND_BASE = import.meta.env.VITE_BACKEND_ENDPOINT || "";
  const VERIFICATION_ENDPOINT = BACKEND_BASE
    ? `${BACKEND_BASE}/verify-vault`
    : import.meta.env.VITE_VERIFICATION_ENDPOINT ||
      "http://localhost:3001/verify-vault";
  const MOCK_VERIFICATION = false;

  // Chain/env for on-chain read-only queries
  const RPC_URL = import.meta.env.VITE_RPC_URL as string | undefined;
  const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || storyTestnet.id);

  // Contract addresses from centralized config
  const ADLV_ADDRESS = CONTRACTS.ADLV;
  const IDO_ADDRESS = CONTRACTS.IDO;

  // Create viem public client using Story Testnet chain config
  const publicClient = useMemo(() => {
    if (!RPC_URL) return null;
    return createPublicClient({
      chain: { ...storyTestnet, id: CHAIN_ID },
      transport: http(RPC_URL),
    });
  }, [RPC_URL, CHAIN_ID]);

  useEffect(() => {
    if (!creatorAddress && isConnected && address) {
      setCreatorAddress(address);
    }
  }, [address, isConnected, creatorAddress]);

  const stepLabels = [
    "Select IP Asset",
    "Verify Human Identity",
    "Review & Deploy",
  ];

  const handleValidateIP = () => {
    if (!isAddress(ipAssetId) || !isAddress(creatorAddress)) return;
    setIsValidating(true);
    setValidationError("");
    const run = async () => {
      try {
        const asset = await getIPAsset(ipAssetId as `0x${string}`);
        console.log('IP Asset validation:', {
          ipAssetId,
          assetOwner: asset?.owner,
          connectedAddress: creatorAddress,
          ownerMatch: asset?.owner?.toLowerCase() === creatorAddress.toLowerCase()
        });

        if (!asset || !asset.owner) {
          setValidationError("IP Asset not found on Story Protocol");
          setIsValidating(false);
          return;
        }
        if (asset.owner.toLowerCase() !== creatorAddress.toLowerCase()) {
          setValidationError(
            `IP Asset ownership mismatch:\n` +
            `IP Asset owned by: ${asset.owner}\n` +
            `Your address: ${creatorAddress}\n\n` +
            `Please connect the wallet that owns this IP Asset, or use a different IP Asset ID.`
          );
          setIsValidating(false);
          return;
        }
        setAssetName(asset.name || "IP Asset");
        setAssetType(asset.type?.toString() || "Asset");
        setAssetOwner(asset.owner);
        setIsValidating(false);
        setValidationSuccess(true);
        setTimeout(() => {
          setStep(2);
        }, 800);
      } catch (e) {
        setValidationError(e instanceof Error ? e.message : "Error validating IP Asset");
        setIsValidating(false);
      }
    };
    run();
  };

  const handleWorldIDSuccess = async (result: WorldIDResult) => {
    setIsVerified(true);
    setStep(3);
    // Fetch vault metrics for Review step
    fetchVaultMetrics();
    if (MOCK_VERIFICATION) {
      setIsVerified(true);
      setStep(3);
      return;
    }
    // try {
      // const res = await fetch(VERIFICATION_ENDPOINT, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     proof: result,
      //     // Use ipAssetId as signal per backend direction
      //     signal: ipAssetId,
      //     vaultData: { ipId: ipAssetId, creator: creatorAddress },
      //   }),
      // });

      // if (res.ok) {
      //   const data = await res.json();
      //   // Save real vault data from backend/smart contract
      //   if (data.vaultAddress) {
      //     setVaultAddress(data.vaultAddress);
      //   }
      //   if (data.transactionHash) {
      //     setTransactionHash(data.transactionHash);
      //   }
      //   // Handle existing vault case
      //   if (data.alreadyExists) {
      //     console.log("Vault already exists, using existing vault address");
      //     setExistingVaultAddress(data.vaultAddress);
      //   }
      //   setIsVerified(true);
      //   setStep(3);
      // } else {
      //   const errorData = await res.json().catch(() => ({}));

      //   // Handle different error cases
      //   if (res.status === 401) {
      //     // World ID verification failed - allow to proceed anyway for testing
      //     console.warn("World ID verification failed, but allowing to proceed for testing");
      //     // setIsVerified(true);
      //     // setStep(3);
      //     // return;
      //   }

      //   if (res.status === 409 || errorData.code === "VAULT_EXISTS") {
      //     // Vault already exists - use existing vault
      //     console.warn("Vault already exists:", errorData.vaultAddress);
      //     if (errorData.vaultAddress) {
      //       setExistingVaultAddress(errorData.vaultAddress);
      //       setVaultAddress(errorData.vaultAddress);
      //     }
      //     setIsVerified(true);
      //     setStep(3);
      //     return;
      //   }

      //   // Network or server errors
      //   const errorText = await res.text().catch(() => "");
      //   throw new Error(`Server error (${res.status}): ${errorData.error || errorData.details || errorText || "Verification failed"}`);
      // }
    // } catch (error) {
    //   console.error("Vault verification error:", error);

    //   // Check if it's a network error
    //   if (error instanceof TypeError && error.message.includes("fetch")) {
    //     setVaultCreationError("Network error. Please check your connection and try again.");
    //     // Don't proceed on network errors
    //     return;
    //   }

    //   // Other errors - show message but allow proceed for testing
    //   setVaultCreationError(error instanceof Error ? error.message : "Verification failed, but you can continue");
    //   setIsVerified(true);
    //   setStep(3);

    //   // Fetch vault metrics for Review step
    //   fetchVaultMetrics();
    // }
  };

  const fetchVaultMetrics = () => {
    // Populate CVS and Max Borrowable for the Review step when addresses are available
    try {
      if (publicClient && IDO_ADDRESS && isAddress(IDO_ADDRESS) && ipAssetId && isAddress(ipAssetId)) {
        // Contracts expect bytes32 IP IDs; pad the address to 32 bytes
        const ipBytes32 = padHex(ipAssetId as `0x${string}`, { size: 32 });
        publicClient
          .readContract({
            address: IDO_ADDRESS,
            abi: IDO_ABI.abi,
            functionName: "getCVS",
            args: [ipBytes32],
          })
          .then((cvs) => setCvsScore(formatUnits(cvs as bigint, 18)))
          .catch(() => setCvsScore(""));
      }
      // Existing vault detection via ipToVault; reflect in UI and compute max borrowable
      if (publicClient && ADLV_ADDRESS && isAddress(ADLV_ADDRESS) && ipAssetId && isAddress(ipAssetId)) {
        const ipBytes32 = padHex(ipAssetId as `0x${string}`, { size: 32 });
        publicClient
          .readContract({
            address: ADLV_ADDRESS,
            abi: ADLV_ABI.abi,
            functionName: "ipToVault",
            args: [ipBytes32],
          })
          .then((addr) => {
            const vaultAddr = addr as `0x${string}`;
            if (vaultAddr && vaultAddr !== "0x0000000000000000000000000000000000000000") {
              setExistingVaultAddress(vaultAddr);
              setVaultAddress(vaultAddr);
              publicClient
                .readContract({
                  address: ADLV_ADDRESS,
                  abi: ADLV_ABI.abi,
                  functionName: "calculateMaxLoanAmount",
                  args: [addr],
                })
                .then((amt) => setMaxBorrowable(formatUnits(amt as bigint, 18)))
                .catch(() => setMaxBorrowable(""));
            } else {
              setExistingVaultAddress("");
            }
          })
          .catch(() => setExistingVaultAddress(""));
      }
      if (publicClient && ADLV_ADDRESS && isAddress(ADLV_ADDRESS) && vaultAddress && isAddress(vaultAddress)) {
        publicClient
          .readContract({
            address: ADLV_ADDRESS,
            abi: ADLV_ABI.abi,
            functionName: "calculateMaxLoanAmount",
            args: [vaultAddress],
          })
          .then((amt) => setMaxBorrowable(formatUnits(amt as bigint, 18)))
          .catch(() => setMaxBorrowable(""));
      }
    } catch (error) {
      console.error("Error fetching vault metrics:", error);
    }
  };

  const handleDeployVault = async () => {
    // If vault was already created during World ID verification, just show it
    if (vaultAddress && transactionHash) {
      setIsDeploying(true);
      setTimeout(() => {
        setIsDeploying(false);
        setStep(4);
      }, 1000);
      return;
    }

    // Otherwise, create vault now (fallback if World ID didn't create it)
    setIsDeploying(true);
    setVaultCreationError("");

    try {
      const res = await fetch(VERIFICATION_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Backend supports creating or returning existing vault from the same endpoint
          // If ID proof was handled earlier, backend may ignore proof
          // proof: null,
          // signal: ipAssetId,
          vaultData: { ipId: ipAssetId, creator: creatorAddress },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.vaultAddress) {
          setVaultAddress(data.vaultAddress);
        }
        if (data.transactionHash) {
          setTransactionHash(data.transactionHash);
        }
        // Handle existing vault case
        if (data.alreadyExists) {
          console.log("Using existing vault:", data.vaultAddress);
          // For existing vault, we might not have transactionHash
          // Set a placeholder or fetch it if needed
          if (!data.transactionHash) {
            setTransactionHash("N/A - Existing Vault");
          }
        }
        // Move to step 5 immediately
        setIsDeploying(false);
        setStep(4);
      } else {
        const errorData = await res.json().catch(() => ({}));
        // Handle vault already exists
        if (res.status === 409 || errorData.code === "VAULT_EXISTS") {
          // Try to get vault address from error response or fetch it
          if (errorData.vaultAddress) {
            setVaultAddress(errorData.vaultAddress);
            setTransactionHash("N/A - Existing Vault");
            setIsDeploying(false);
            setStep(4);
          } else {
            setVaultCreationError(
              errorData.error ||
                "Vault already exists. Please use a different IP Asset ID."
            );
            setIsDeploying(false);
          }
        } else {
          setVaultCreationError(
            errorData.error || errorData.details || "Failed to deploy vault"
          );
          setIsDeploying(false);
        }
      }
    } catch (error) {
      console.error("Vault deployment error:", error);
      setVaultCreationError(error instanceof Error ? error.message : "Network error during deployment");
      setIsDeploying(false);
    }
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
          <div className="relative max-w-4xl mx-auto px-8">
            {/* Connector lines */}
            <div className="absolute top-7 left-0 right-0 flex items-center justify-between px-20">
              {[1, 2].map((num) => (
                <div key={num} className="flex-1 h-1 mx-4 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: step > num ? "100%" : "0%" }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-600"
                  />
                </div>
              ))}
            </div>

            {/* Step circles and labels */}
            <div className="flex items-start justify-between relative">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className="flex flex-col items-center"
                >
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
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: num * 0.1 + 0.2 }}
                    className={`text-xs mt-3 text-center w-32 ${
                      step >= num ? "text-amber-400 font-medium" : "text-gray-500"
                    }`}
                  >
                    {stepLabels[num - 1]}
                  </motion.p>
                </div>
              ))}
            </div>
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
                        {validationError && (
                          <p className="text-red-400 text-xs mt-2">
                            {validationError}
                          </p>
                        )}
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
                            {assetName || "IP Asset"}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {assetType || "Asset"}
                          </p>
                          <p className="text-gray-500 text-xs">
                            Owned by: {assetOwner ? `${assetOwner.slice(0, 6)}...${assetOwner.slice(-4)}` : 'Validating...'}
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
                    !isAddress(ipAssetId) ||
                    !isAddress(creatorAddress) ||
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
                        verification_level={VerificationLevel.Device}
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
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    3. Review & Deploy Your Vault
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
                      <p className="text-white font-medium">{assetType || "IP Asset"}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                      Verified on Story Protocol
                    </span>
                  </div>
                </div>

                {existingVaultAddress && (
                  <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-yellow-400 font-medium mb-2">Vault Already Exists</h4>
                        <p className="text-gray-300 text-sm mb-3">
                          A vault for this IP Asset already exists. You can use the existing vault instead of creating a new one.
                        </p>
                        <div className="bg-gray-900/50 rounded-lg p-3">
                          <div className="text-xs text-gray-400 mb-1">Existing Vault Address</div>
                          <div className="text-white font-mono text-sm break-all">{existingVaultAddress}</div>
                          <a
                            href={getExplorerUrl(existingVaultAddress)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 text-sm mt-2 inline-flex items-center gap-1 hover:text-blue-300"
                          >
                            View on Explorer →
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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

                <div className="p-5 bg-gray-900/50 rounded-xl border border-gray-700/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">
                        Initial CVS Score
                      </p>
                      <p className="text-amber-400 font-bold text-lg">{cvsScore || "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm mb-1">
                        Est. Max Borrowable
                      </p>
                      <p className="text-white font-bold">{maxBorrowable ? `${maxBorrowable}` : "—"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDeployVault}
                disabled={isDeploying || !validationSuccess || !isVerified || (!!existingVaultAddress && !vaultAddress)}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  existingVaultAddress
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:shadow-lg hover:shadow-yellow-500/50'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/50'
                }`}
              >
                {isDeploying ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </span>
                ) : existingVaultAddress ? (
                  "Use Existing Vault"
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

          {step === 4 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center py-12"
            >
              {vaultCreationError ? (
                <>
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 1,
                    }}
                    className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center"
                  >
                    <AlertCircle className="w-12 h-12 text-white" />
                  </motion.div>

                  <h2 className="text-3xl font-bold text-white mb-3">
                    Vault Deployment Error
                  </h2>
                  <p className="text-red-400 mb-8">{vaultCreationError}</p>
                  <p className="text-gray-400 text-sm mb-8">
                    Please check your connection and try again.
                  </p>
                </>
              ) : vaultAddress && transactionHash ? (
                <>
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
                    Your IP Data Vault is now active on-chain and ready to
                    generate liquidity
                  </p>

                  <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto mb-8">
                    <div className="p-5 bg-gray-900/50 rounded-xl border border-green-500/30">
                      <div className="text-gray-400 text-sm mb-2">
                        Vault ID (On-Chain)
                      </div>
                      <div className="text-white font-mono text-sm break-all mb-2">
                        {vaultAddress}
                      </div>
                      <p className="text-gray-500 text-xs mb-3">
                        Vault data is stored in ADLV contract mapping
                      </p>
                      <div className="flex gap-3">
                        <a
                          href={getExplorerUrl(vaultAddress)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-400 hover:text-orange-300 text-xs underline"
                        >
                          View Address →
                        </a>
                        <a
                          href={getExplorerUrl(CONTRACTS.ADLV)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-400 hover:text-orange-300 text-xs underline"
                        >
                          View ADLV Contract →
                        </a>
                      </div>
                    </div>

                    <div className="p-5 bg-gray-900/50 rounded-xl border border-green-500/30">
                      <div className="text-gray-400 text-sm mb-2">
                        Transaction Hash
                      </div>
                      <div className="text-white font-mono text-sm break-all mb-3">
                        {transactionHash}
                      </div>
                      <a
                        href={`${NETWORK.explorerUrl}/tx/${transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-400 hover:text-orange-300 text-xs underline"
                      >
                        View Transaction →
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-900/50 rounded-xl border border-orange-500/30">
                        <div className="text-gray-400 text-sm mb-1">
                          IP Asset ID
                        </div>
                        <div className="text-white font-mono text-xs break-all">
                          {ipAssetId.slice(0, 10)}...{ipAssetId.slice(-8)}
                        </div>
                      </div>
                      <div className="p-4 bg-gray-900/50 rounded-xl border border-orange-500/30">
                        <div className="text-gray-400 text-sm mb-1">
                          Creator
                        </div>
                        <div className="text-white font-mono text-xs break-all">
                          {creatorAddress.slice(0, 10)}...
                          {creatorAddress.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 1,
                    }}
                    className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center"
                  >
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                  </motion.div>

                  <h2 className="text-3xl font-bold text-white mb-3">
                    Vault Deployment In Progress
                  </h2>
                  <p className="text-gray-400 mb-8">
                    Creating vault on-chain... This may take a few moments.
                  </p>
                  {vaultCreationError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-4">
                      <p className="text-red-400 text-sm">
                        {vaultCreationError}
                      </p>
                    </div>
                  )}
                </>
              )}

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
