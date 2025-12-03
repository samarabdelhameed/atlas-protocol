/**
 * Atlas Protocol Contract Addresses
 * Network: Story Aeneid Testnet (Chain ID: 1315)
 * Explorer: https://aeneid.storyscan.io
 */

export const CONTRACTS = {
  ADLV: '0x9c7cCfB831Ed4D521599a3B97df0174C91bB2AAC' as const, // v5.0 - CVS Oracle Integrated
  IDO: '0xFb1EC26171848c330356ff1C9e2a1228066Da324' as const, // v5.0 - CVS Oracle Integrated
  LendingModule: '0x3154484F0CdBa14F2A2A3Ba8D2125a5c088a5E4f' as const,
  LoanNFT: '0x69D6C3E0D2BAE75Cbad6de75e8a367C607Ae8bC1' as const,
  CVSOracle: '0x4a875fD309C95DBFBcA6dFC3575517Ea7d5F6eC7' as const, // v5.0 - NEW!
  StoryProtocolCore: '0x825B9Ad5F77B64aa1d56B52ef01291E6D4aA60a5' as const,
  IPAssetRegistry: '0x77319B4031e6eF1250907aa00018B8B1c67a244b' as const, // Updated to official Aeneid deployment
  SPG: '0x69415CE984A79a3Cfbe3F51024C63b6C107331e3' as const,
} as const;

/**
 * Network Configuration
 */
export const NETWORK = {
  chainId: 1315,
  name: 'Story Aeneid Testnet',
  rpcUrl: 'https://rpc-storyevm-testnet.aldebaranode.xyz',
  explorerUrl: 'https://aeneid.storyscan.io',
} as const;

/**
 * Explorer URLs for contracts
 */
export const getExplorerUrl = (address: string) => {
  return `${NETWORK.explorerUrl}/address/${address}`;
};

/**
 * Contract explorer links
 */
export const CONTRACT_EXPLORERS = {
  ADLV: getExplorerUrl(CONTRACTS.ADLV),
  IDO: getExplorerUrl(CONTRACTS.IDO),
  LendingModule: getExplorerUrl(CONTRACTS.LendingModule),
  LoanNFT: getExplorerUrl(CONTRACTS.LoanNFT),
  CVSOracle: getExplorerUrl(CONTRACTS.CVSOracle),
  StoryProtocolCore: getExplorerUrl(CONTRACTS.StoryProtocolCore),
  IPAssetRegistry: getExplorerUrl(CONTRACTS.IPAssetRegistry),
  SPG: getExplorerUrl(CONTRACTS.SPG),
} as const;