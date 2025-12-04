import { createConfig, http, injected } from "wagmi";
import { defineChain } from "viem";

export const storyTestnet = defineChain({
  id: 1315,
  name: "Story Testnet",
  nativeCurrency: { name: "IP", symbol: "IP", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        import.meta.env.VITE_RPC_URL ||
          "https://rpc.ankr.com/story_aeneid_testnet/bc16a42ff54082470945f1420d9917706e7de9dbea9c11f20d93584bd6d26886",
        "https://rpc-storyevm-testnet.aldebaranode.xyz",
        "https://testnet.storyrpc.io",
      ],
    },
    public: {
      http: [
        import.meta.env.VITE_STORY_RPC ||
          "https://rpc.ankr.com/story_aeneid_testnet/bc16a42ff54082470945f1420d9917706e7de9dbea9c11f20d93584bd6d26886",
        "https://rpc-storyevm-testnet.aldebaranode.xyz",
        "https://testnet.storyrpc.io",
      ],
    },
  },
});

export const config = createConfig({
  chains: [storyTestnet],
  connectors: [injected()],
  transports: {
    [storyTestnet.id]: http(
      import.meta.env.VITE_RPC_URL ||
        "https://rpc.ankr.com/story_aeneid_testnet/bc16a42ff54082470945f1420d9917706e7de9dbea9c11f20d93584bd6d26886",
      {
        timeout: 10_000,
        retryCount: 3,
        retryDelay: 1000,
      }
    ),
  },
  //   autoConnect: true,
});
