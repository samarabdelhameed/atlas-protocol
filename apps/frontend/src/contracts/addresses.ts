/**
 * Atlas Protocol Contract Addresses
 * Network: Story Aeneid Testnet (Chain ID: 1315)
 * Explorer: https://aeneid.storyscan.io
 */

export const CONTRACTS = {
  ADLV: '0x572C39bE4E794Fac01f0CdfAe2d2471C52E49713' as const,
  IDO: '0xeF83DB9b011261Ad3a76ccE8B7E54B2c055300D8' as const,
  LendingModule: '0xbefb2fF399Bd0faCDBd100A16A569c625e1E4bf3' as const,
  LoanNFT: '0x9386262027dc860337eC4F93A8503aD4ee852c41' as const,
  StoryProtocolCore: '0x825B9Ad5F77B64aa1d56B52ef01291E6D4aA60a5' as const,
  IPAssetRegistry: '0x292639452A975630802C17c9267169D93BD5a793' as const,
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
  StoryProtocolCore: getExplorerUrl(CONTRACTS.StoryProtocolCore),
  IPAssetRegistry: getExplorerUrl(CONTRACTS.IPAssetRegistry),
  SPG: getExplorerUrl(CONTRACTS.SPG),
} as const;