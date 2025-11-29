/**
 * Owlto Finance Client - Cross-Chain Bridge
 * 
 * Owlto Finance provides cross-chain bridging services
 * This client handles bridging funds between chains (e.g., Story Network ↔ Base)
 */

import { config } from '../config/index.js';

export interface OwltoBridgeParams {
  fromChain: string | number;
  toChain: string | number;
  amount: string; // in wei
  token: string; // token address
  recipient: string; // recipient address
  slippage?: string; // slippage tolerance (default: 0.5%)
  referralCode?: string;
}

export interface OwltoBridgeResponse {
  bridgeId: string;
  transactionHash?: string;
  fromChain: string;
  toChain: string;
  amount: string;
  estimatedArrivalTime?: number; // in seconds
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
}

/**
 * Bridge funds using Owlto Finance API
 * 
 * @param params - Bridge parameters
 * @returns Bridge response
 */
export async function bridgeFunds(params: OwltoBridgeParams): Promise<OwltoBridgeResponse> {
  const apiKey = process.env.OWLTO_API_KEY || config.owlto.apiKey;
  const apiUrl = process.env.OWLTO_API_URL || config.owlto.bridgeUrl || 'https://api.owlto.finance/api/v2/bridge';
  
  if (!apiKey) {
    throw new Error('OWLTO_API_KEY not set in environment variables. Please set OWLTO_API_KEY in .env file');
  }

  try {
    console.log(`🌉 Initiating cross-chain bridge via Owlto Finance...`);
    console.log(`   From Chain: ${params.fromChain}`);
    console.log(`   To Chain: ${params.toChain}`);
    console.log(`   Amount: ${params.amount} wei`);
    console.log(`   Token: ${params.token}`);
    console.log(`   Recipient: ${params.recipient}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey, // Alternative header format
      },
      body: JSON.stringify({
        fromChainId: typeof params.fromChain === 'string' ? parseInt(params.fromChain) : params.fromChain,
        toChainId: typeof params.toChain === 'string' ? parseInt(params.toChain) : params.toChain,
        tokenAddress: params.token,
        amount: params.amount,
        recipient: params.recipient,
        slippage: params.slippage || config.owlto.slippage || '0.5',
        referralCode: params.referralCode || config.owlto.referralCode || '',
        // Metadata for tracking
        metadata: {
          source: 'atlas-protocol',
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Owlto API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log('✅ Owlto Bridge Response:', JSON.stringify(data, null, 2));
    
    return {
      bridgeId: data.bridgeId || data.id || data.bridge_id || '',
      transactionHash: data.transactionHash || data.txHash || data.transaction_hash,
      fromChain: params.fromChain.toString(),
      toChain: params.toChain.toString(),
      amount: params.amount,
      estimatedArrivalTime: data.estimatedArrivalTime || data.estimated_arrival_time || data.eta,
      status: data.status || 'pending',
      message: data.message || data.msg,
    };
  } catch (error: any) {
    console.error('❌ Error bridging funds with Owlto:', error.message);
    throw error;
  }
}

/**
 * Get bridge status
 */
export async function getBridgeStatus(bridgeId: string): Promise<OwltoBridgeResponse> {
  const apiKey = process.env.OWLTO_API_KEY || config.owlto.apiKey;
  const apiUrl = process.env.OWLTO_API_URL || config.owlto.bridgeUrl || 'https://api.owlto.finance/api/v2/bridge';
  
  if (!apiKey) {
    throw new Error('OWLTO_API_KEY not set');
  }

  try {
    const response = await fetch(`${apiUrl}/${bridgeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Owlto API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      bridgeId: data.bridgeId || data.id || bridgeId,
      transactionHash: data.transactionHash || data.txHash,
      fromChain: data.fromChain || data.from_chain || '',
      toChain: data.toChain || data.to_chain || '',
      amount: data.amount || '',
      estimatedArrivalTime: data.estimatedArrivalTime || data.eta,
      status: data.status || 'pending',
      message: data.message,
    };
  } catch (error: any) {
    console.error('❌ Error getting bridge status:', error.message);
    throw error;
  }
}

/**
 * Get supported chains
 */
export async function getSupportedChains(): Promise<Array<{ chainId: number; name: string }>> {
  const apiKey = process.env.OWLTO_API_KEY || config.owlto.apiKey;
  const apiUrl = process.env.OWLTO_API_URL || config.owlto.bridgeUrl || 'https://api.owlto.finance/api/v2';
  
  if (!apiKey) {
    throw new Error('OWLTO_API_KEY not set');
  }

  try {
    const response = await fetch(`${apiUrl}/chains`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      // If endpoint doesn't exist, return common chains
      return [
        { chainId: 1315, name: 'Story Aeneid Testnet' },
        { chainId: 8453, name: 'Base' },
        { chainId: 1, name: 'Ethereum' },
        { chainId: 137, name: 'Polygon' },
      ];
    }

    const data = await response.json();
    return data.chains || data;
  } catch (error: any) {
    console.warn('⚠️  Could not fetch supported chains, using defaults');
    return [
      { chainId: 1315, name: 'Story Aeneid Testnet' },
      { chainId: 8453, name: 'Base' },
      { chainId: 1, name: 'Ethereum' },
      { chainId: 137, name: 'Polygon' },
    ];
  }
}

