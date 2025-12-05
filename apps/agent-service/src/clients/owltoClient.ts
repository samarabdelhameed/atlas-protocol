/**
 * Owlto Finance Client - Cross-Chain Bridge
 * 
 * Uses owlto-sdk for cross-chain bridging services
 * This client handles bridging funds between chains (e.g., Story Network ↔ Base)
 * 
 * SDK Docs: https://docs.owlto.finance/integration-guides/sdk
 */

import * as owlto from 'owlto-sdk';

// Initialize the Owlto Bridge SDK
// Using default options - chain names will be used directly
const bridge = new owlto.Bridge({});

// Chain name mapping for Owlto (uses chain names not IDs)
const CHAIN_NAMES: Record<number, string> = {
  1315: 'StoryTestnet',       // Story Aeneid Testnet
  84532: 'BaseSepoliaTestnet', // Base Sepolia
  8453: 'BaseMainnet',        // Base Mainnet
  1: 'EthereumMainnet',       // Ethereum
  11155111: 'SepoliaTestnet', // Sepolia
  137: 'Polygon',             // Polygon
  42161: 'ArbitrumOne',       // Arbitrum
  10: 'OptimismMainnet',      // Optimism
};

// Token name for native token
const NATIVE_TOKEN = 'ETH';

export interface OwltoBridgeParams {
  fromChainId: number;
  toChainId: number;
  amount: string; // value in token units (e.g., "0.1" for 0.1 ETH)
  tokenName?: string; // token name (default: ETH for native)
  recipient: string; // recipient address on destination chain
  sender: string; // sender address on source chain
}

export interface OwltoBridgeResult {
  success: boolean;
  txHash?: string;
  error?: string;
  networkType?: number;
  txs?: {
    approveBody?: any;
    transferBody?: any;
  };
}

/**
 * Get the bridge transaction data from Owlto
 * This returns the transaction that needs to be signed and sent
 */
export async function getBridgeTransaction(params: OwltoBridgeParams): Promise<any> {
  const fromChainName = CHAIN_NAMES[params.fromChainId];
  const toChainName = CHAIN_NAMES[params.toChainId];
  
  if (!fromChainName) {
    throw new Error(`Unsupported source chain: ${params.fromChainId}`);
  }
  if (!toChainName) {
    throw new Error(`Unsupported destination chain: ${params.toChainId}`);
  }

  const tokenName = params.tokenName || NATIVE_TOKEN;
  // Convert wei to ETH for the SDK (it expects value like "0.1" for 0.1 ETH)
  const valueInEth = (BigInt(params.amount) / BigInt(10 ** 18)).toString();
  
  console.log(`🌉 Getting Owlto bridge transaction...`);
  console.log(`   Token: ${tokenName}`);
  console.log(`   From: ${fromChainName} (${params.fromChainId})`);
  console.log(`   To: ${toChainName} (${params.toChainId})`);
  console.log(`   Amount: ${valueInEth} ${tokenName}`);
  console.log(`   Sender: ${params.sender}`);
  console.log(`   Recipient: ${params.recipient}`);

  try {
    // Use the SDK to get the bridge transaction
    // Signature: getBuildTx(tokenName, fromChainName, toChainName, value, fromAddress, toAddress)
    const result = await bridge.getBuildTx(
      tokenName,          // token name (e.g., "ETH", "USDC")
      fromChainName,      // from chain name
      toChainName,        // to chain name
      valueInEth,         // value in token units
      params.sender,      // from address
      params.recipient    // to address
    );

    console.log('✅ Got Owlto build transaction:', {
      networkType: result.networkType,
      hasApprove: !!result.txs?.approveBody,
      hasTransfer: !!result.txs?.transferBody,
    });

    return result;
  } catch (error: any) {
    console.error('❌ Error getting Owlto build tx:', error.message);
    throw error;
  }
}

/**
 * Wait for bridge receipt (confirmation on destination chain)
 */
export async function waitForBridgeReceipt(txHash: string): Promise<any> {
  console.log(`⏳ Waiting for bridge receipt...`);
  console.log(`   TxHash: ${txHash}`);

  try {
    const receipt = await bridge.waitReceipt(txHash);
    console.log('✅ Bridge receipt received:', receipt);
    return receipt;
  } catch (error: any) {
    console.error('❌ Error waiting for bridge receipt:', error.message);
    throw error;
  }
}

/**
 * Get bridge receipt status (non-blocking)
 */
export async function getBridgeReceipt(txHash: string): Promise<any> {
  try {
    const receipt = await bridge.getReceipt(txHash);
    return receipt;
  } catch (error: any) {
    console.warn('⚠️ Bridge receipt not ready:', error.message);
    return null;
  }
}

/**
 * Get pair info for a specific bridge route
 */
export async function getPairInfo(
  tokenName: string,
  fromChainId: number,
  toChainId: number
): Promise<any> {
  const fromChainName = CHAIN_NAMES[fromChainId];
  const toChainName = CHAIN_NAMES[toChainId];
  
  if (!fromChainName || !toChainName) {
    return null;
  }

  try {
    return await bridge.getPairInfo(tokenName, fromChainName, toChainName);
  } catch (error: any) {
    console.warn('⚠️ Pair info not available:', error.message);
    return null;
  }
}

/**
 * Get all supported chain pairs from Owlto
 */
export async function getSupportedPairs(): Promise<any> {
  try {
    const pairs = await bridge.getAllPairInfos();
    return pairs;
  } catch (error: any) {
    console.warn('⚠️ Could not fetch supported pairs:', error.message);
    return null;
  }
}

/**
 * Check if a chain pair is supported
 */
export async function isPairSupported(
  tokenName: string,
  fromChainId: number, 
  toChainId: number
): Promise<boolean> {
  const pairInfo = await getPairInfo(tokenName, fromChainId, toChainId);
  return pairInfo !== null;
}

/**
 * Get supported chains list
 */
export function getSupportedChains(): Array<{ chainId: number; name: string }> {
  return Object.entries(CHAIN_NAMES).map(([id, name]) => ({
    chainId: parseInt(id),
    name,
  }));
}
