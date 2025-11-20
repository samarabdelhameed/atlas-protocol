import { createConfig, http, injected } from "wagmi";
import { defineChain } from "viem";

export const storyTestnet = defineChain({
  id: 1315,
  name: "Story Testnet",
  nativeCurrency: { name: "STORY", symbol: "STORY", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        import.meta.env.VITE_RPC_URL ||
          "https://rpc-storyevm-testnet.aldebaranode.xyz",
      ],
    },
    public: {
      http: [
        import.meta.env.VITE_STORY_RPC ||
          "https://rpc-storyevm-testnet.aldebaranode.xyz",
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
        "https://rpc-storyevm-testnet.aldebaranode.xyz"
    ),
  },
  //   autoConnect: true,
});
