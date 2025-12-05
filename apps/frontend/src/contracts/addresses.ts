/**
 * Atlas Protocol Contract Addresses
 * Network: Story Aeneid Testnet (Chain ID: 1315)
 * Explorer: https://aeneid.storyscan.io
 */

export const CONTRACTS = {
  ADLV: '0x084A44Ddc404B0D8F7A021d64Ec24f4520B7f1C6' as const, // v6.0 - Owlto Bridge Integrated
  IDO: '0xea7dFd2572ceC090C0517Ea345B82CA07E394034' as const, // v6.0 - Owlto Bridge Integrated
  LendingModule: '0x1f74B15A2AB01734151697Cc7E19F5681125A6f9' as const,
  LoanNFT: '0x9FC6018a786c79Be7d1fEdc8D1fd27f6C4d86385' as const,
  CVSOracle: '0xBc57dBFA4936A5F1D10bDE8A65ABf2f9864e5170' as const, // v6.0
  StoryProtocolCore: '0x825B9Ad5F77B64aa1d56B52ef01291E6D4aA60a5' as const,
  IPAssetRegistry: '0x77319B4031e6eF1250907aa00018B8B1c67a244b' as const,
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