import { motion } from "framer-motion";
import {
  TrendingUp,
  Lock,
  Zap,
  ArrowRight,
  DollarSign,
  Database,
  Shield,
} from "lucide-react";
import ParticleField from "../components/ParticleField";
// Read-only chain and data utilities
import { useEffect, useMemo, useState } from "react";
import { parseAbiItem, createPublicClient, http, formatUnits } from "viem";
import { storyTestnet } from "../wagmi";
// Import subgraph hooks from the workspace package export
import { useLicenseSales, useGlobalStats } from "@atlas-protocol/graphql-client";

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Env-driven chain setup for read-only event logs
  const RPC_URL = import.meta.env.VITE_RPC_URL as string | undefined;
  const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || storyTestnet.id);
  const ADLV_ADDRESS = (import.meta.env.VITE_ADLV_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;

  // Create a public client to query logs from your configured chain
  const publicClient = useMemo(() => {
    if (!RPC_URL) return null;
    return createPublicClient({
      chain: { ...storyTestnet, id: CHAIN_ID },
      transport: http(RPC_URL),
    });
  }, [RPC_URL, CHAIN_ID]);

  // Minimal event ABIs for parsing ADLV logs
  const evLicenseSold = useMemo(
    () =>
      parseAbiItem(
        "event LicenseSold(address indexed vaultAddress, bytes32 indexed ipId, address indexed licensee, uint256 price, string licenseType)"
      ),
    []
  );
  const evVaultCreated = useMemo(
    () =>
      parseAbiItem(
        "event VaultCreated(address indexed vaultAddress, bytes32 indexed ipId, address indexed creator, uint256 initialCVS)"
      ),
    []
  );
  const evLoanIssued = useMemo(
    () =>
      parseAbiItem(
        "event LoanIssued(address indexed vaultAddress, address indexed borrower, uint256 indexed loanId, uint256 amount, uint256 collateral, uint256 interestRate, uint256 duration)"
      ),
    []
  );

  // Chain-derived items to feed the ticker when available
  const [chainSales, setChainSales] = useState<
    { company: string; tier: string; amount: string; cvs?: string }[]
  >([]);

  const [platformActivity, setPlatformActivity] = useState<
    { type: 'VaultCreated' | 'LoanIssued'; actor: string; amount?: string }[]
  >([]);

  // Poll chain logs periodically and map LicenseSold events to ticker items
  useEffect(() => {
    let timer: any;
    const run = async () => {
      try {
        if (!publicClient || !ADLV_ADDRESS || ADLV_ADDRESS === "0x0000000000000000000000000000000000000000") return;
        const latest = await publicClient.getBlockNumber();
        const window = 10_000n;
        const fromBlock = latest > window ? latest - window : 0n;
        const soldLogs = await publicClient.getLogs({ address: ADLV_ADDRESS, event: evLicenseSold, fromBlock, toBlock: latest });
        const items = soldLogs.map((log) => {
          const licensee = (log.args.licensee as string) || "0x";
          const short = `${licensee.slice(0, 6)}...${licensee.slice(-4)}`;
          const price = log.args.price as bigint;
          const amount = `${formatUnits(price, 18)} STORY`;
          const tier = (log.args.licenseType as string) || "Standard";
          return { company: short, tier, amount, cvs: "" };
        });
        setChainSales(items.slice(-20));

        const createdLogs = await publicClient.getLogs({ address: ADLV_ADDRESS, event: evVaultCreated, fromBlock, toBlock: latest });
        const loanLogs = await publicClient.getLogs({ address: ADLV_ADDRESS, event: evLoanIssued, fromBlock, toBlock: latest });

        const createdItems = createdLogs.map((log) => {
          const creator = (log.args.creator as string) || "0x";
          const actor = `${creator.slice(0, 6)}...${creator.slice(-4)}`;
          return { type: 'VaultCreated' as const, actor };
        });

        const loanItems = loanLogs.map((log) => {
          const borrower = (log.args.borrower as string) || "0x";
          const actor = `${borrower.slice(0, 6)}...${borrower.slice(-4)}`;
          const amountWei = log.args.amount as bigint;
          const amount = `${formatUnits(amountWei, 18)} STORY`;
          return { type: 'LoanIssued' as const, actor, amount };
        });

        setPlatformActivity([...createdItems, ...loanItems].slice(-20));
      } catch {}
    };
    run();
    timer = setInterval(run, prefersReducedMotion ? 120_000 : 60_000);
    return () => clearInterval(timer);
  }, [publicClient, ADLV_ADDRESS, prefersReducedMotion, evLicenseSold]);

  const { data: salesData } = useLicenseSales({ first: 20 });
  const { data: globalStats } = useGlobalStats();
  const metrics = useMemo(() => {
    if (!globalStats) return [];
    try {
      return [
        {
          label: "Total CVS Valued (TVV)",
          value: Number(globalStats.totalCVS || 0).toLocaleString(),
          icon: Lock,
          color: "from-orange-500 to-amber-600",
        },
        {
          label: "Data-Backed Loans (X-Chain)",
          value: Number(globalStats.totalLoans || 0).toLocaleString(),
          icon: DollarSign,
          color: "from-amber-500 to-orange-600",
        },
        {
          label: "GenAI Data Licenses Issued",
          value: Number(globalStats.totalLicenses || 0).toLocaleString(),
          icon: Database,
          color: "from-orange-600 to-red-600",
        },
      ];
    } catch {
      return [];
    }
  }, [globalStats]);

  const features = [
    {
      title: "Monetize Data Provenance",
      description:
        "Secure and transparent licensing of IP usage streams to compliant AI training models. Powered by abv.dev for on-chain registration.",
      icon: Database,
      gradient: "from-orange-500 to-amber-600",
    },
    {
      title: "Dynamic Collateral Score",
      description:
        "Real-time valuation of your IP asset based on usage, licensing, and enforcement data. Powered by Goldsky for live indexing.",
      icon: TrendingUp,
      gradient: "from-amber-500 to-orange-600",
    },
    {
      title: "Instant Cross-Chain Liquidity",
      description:
        "Borrow instantly against your CVS score, with funds delivered to any chain via Owlto Bridge for seamless cross-chain transfers.",
      icon: Shield,
      gradient: "from-orange-600 to-red-600",
    },
  ];

  const tickerItems = useMemo(() => {
    if (chainSales.length > 0) return chainSales;
    if (salesData && Array.isArray(salesData) && salesData.length > 0) {
      return salesData.map((sale: any) => {
        const amountUsd = sale.salePrice
          ? `$${Number(sale.salePrice).toLocaleString()}`
          : sale.amount || "$";
        const company = sale.ipAsset?.name || sale.licensee || "License Buyer";
        const cvs = sale.cvsIncrement ? `+${sale.cvsIncrement}` : sale.cvsImpact || "+";
        return { company, tier: sale.licenseType || "Standard", amount: amountUsd, cvs };
      });
    }
    return [];
  }, [chainSales, salesData]);

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {!prefersReducedMotion && <ParticleField />}

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
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block mb-6"
            >
              <div className="relative">
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-600 ${
                    prefersReducedMotion ? "blur-xl" : "blur-3xl animate-pulse"
                  } opacity-50`}
                />
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
              The first IP Data Oracle (IDO) facilitating CVS-backed loans and
              compliant GenAI data licensing, secured by World ID and built on
              Story L1
            </motion.p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="px-4 py-2 rounded-full border border-gray-700/60 bg-gray-900/40 text-gray-200 text-sm flex items-center gap-2"
              >
                <Shield className="w-4 h-4 text-amber-400" />
                World ID Verified
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="px-4 py-2 rounded-full border border-gray-700/60 bg-gray-900/40 text-gray-200 text-sm flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-green-400" />
                Goldsky Indexed
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="px-4 py-2 rounded-full border border-gray-700/60 bg-gray-900/40 text-gray-200 text-sm flex items-center gap-2"
              >
                <Database className="w-4 h-4 text-orange-400" />
                abv.dev Registered
              </motion.div>
            </div>

            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
              onClick={() => onNavigate("vault")}
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

          <div className="mb-12">
            <div className="max-w-5xl mx-auto bg-gray-900/40 border border-gray-800/60 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Zap className="w-4 h-4 text-green-400" />
                  Recent License Sales
                </div>
                {/* <div className="text-xs text-gray-500">Mock data</div> */}
              </div>
              <div className="overflow-hidden">
                {tickerItems.length > 0 ? (
                  prefersReducedMotion ? (
                    <div className="flex items-center gap-4 flex-wrap justify-center">
                      {tickerItems.map((item, idx) => (
                        <div
                          key={item.company + idx}
                          className="px-4 py-2 rounded-full border border-gray-700/60 bg-gray-800/40 text-gray-200 text-sm flex items-center gap-3"
                        >
                          <span className="text-white font-semibold">{item.company}</span>
                          <span className="text-gray-400">{item.tier}</span>
                          <span className="text-orange-400 font-bold">{item.amount}</span>
                          {item.cvs && (
                            <span className="text-green-400 font-bold">{item.cvs} CVS</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ x: 0 }}
                      animate={{ x: ["0%", "-100%"] }}
                      transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
                      className="flex items-center gap-6 whitespace-nowrap"
                      style={{ willChange: "transform" }}
                    >
                      {[...tickerItems, ...tickerItems].map((item, idx) => (
                        <div
                          key={item.company + idx}
                          className="px-4 py-2 rounded-full border border-gray-700/60 bg-gray-800/40 text-gray-200 text-sm flex items-center gap-3"
                        >
                          <span className="text-white font-semibold">{item.company}</span>
                          <span className="text-gray-400">{item.tier}</span>
                          <span className="text-orange-400 font-bold">{item.amount}</span>
                          {item.cvs && (
                            <span className="text-green-400 font-bold">{item.cvs} CVS</span>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )
                ) : (
                  <div className="text-gray-500 text-sm">No recent license sales</div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-12">
            <div className="max-w-5xl mx-auto bg-gray-900/40 border border-gray-800/60 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Platform Activity
              </div>
              {platformActivity.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {platformActivity.map((ev, idx) => (
                    <div
                      key={ev.type + idx}
                      className="flex items-center justify-between px-4 py-2 rounded-xl border border-gray-700/60 bg-gray-800/40 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{ev.type}</span>
                        <span className="text-gray-400">{ev.actor}</span>
                      </div>
                      {ev.amount && (
                        <span className="text-orange-400 font-bold">{ev.amount}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">No recent platform activity</div>
              )}
            </div>
          </div>

          {metrics.length > 0 && (
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
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${metric.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity`}
                  />
                  <div className="relative bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-8 hover:border-orange-500/50 transition-all">
                    <div
                      className={`w-14 h-14 bg-gradient-to-br ${metric.color} rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div
                      className={`text-4xl font-bold bg-gradient-to-r ${metric.color} bg-clip-text text-transparent mb-2`}
                    >
                      {metric.value}
                    </div>
                    <div className="text-gray-400 text-sm">{metric.label}</div>
                  </div>
                </motion.div>
              );
            })}
            </motion.div>
          )}

          <div className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                How It Works
              </h2>
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
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 blur-2xl transition-all duration-500 rounded-3xl`}
                    />
                    <div className="relative bg-gray-900/30 backdrop-blur-xl border border-gray-800/30 rounded-3xl p-8 group-hover:border-orange-500/50 transition-all">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20`}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-white mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-gray-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {!prefersReducedMotion && (
        <>
          <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-orange-500/10 to-amber-600/10 rounded-full blur-xl"
          />
          <motion.div
            animate={{ scale: [1.1, 1, 1.1], rotate: [360, 180, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-amber-500/10 to-orange-600/10 rounded-full blur-xl"
          />
        </>
      )}
    </div>
  );
}
