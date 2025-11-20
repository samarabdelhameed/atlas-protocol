import { StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import { http, Address } from 'viem';

/**
 * Initialize Story Protocol client with user's wallet
 */
export function createStoryClient(account: Address): StoryClient {
  const config: StoryConfig = {
    account: account,
    transport: http('https://rpc.odyssey.storyrpc.io'),
    chainId: 1514, // Story mainnet (use 1315 for aeneid testnet)
  };

  return StoryClient.newClient(config);
}

/**
 * Register an IP Asset on Story Protocol
 */
export async function registerIPAsset(
  client: StoryClient,
  nftContract: Address,
  tokenId: bigint
) {
  try {
    const response = await client.ipAsset.register({
      nftContract,
      tokenId,
      metadata: {
        metadataURI: '',
        metadataHash: '',
        nftMetadataHash: '',
      },
    });

    return {
      ipId: response.ipId,
      txHash: response.txHash,
    };
  } catch (error) {
    console.error('Error registering IP Asset:', error);
    throw error;
  }
}

/**
 * Attach license terms to an IP Asset
 */
export async function attachLicenseTerms(
  client: StoryClient,
  ipId: Address,
  licenseTermsId: bigint
) {
  try {
    const response = await client.license.attachLicenseTerms({
      ipId,
      licenseTermsId,
    });

    return {
      success: response.success,
      txHash: response.txHash,
    };
  } catch (error) {
    console.error('Error attaching license terms:', error);
    throw error;
  }
}

/**
 * Mint license tokens
 */
export async function mintLicenseTokens(
  client: StoryClient,
  licensorIpId: Address,
  licenseTermsId: bigint,
  amount: number,
  receiver: Address
) {
  try {
    const response = await client.license.mintLicenseTokens({
      licensorIpId,
      licenseTermsId,
      amount,
      receiver,
    });

    return {
      licenseTokenIds: response.licenseTokenIds,
      txHash: response.txHash,
    };
  } catch (error) {
    console.error('Error minting license tokens:', error);
    throw error;
  }
}

/**
 * Get IP Asset details
 */
export async function getIPAsset(client: StoryClient, ipId: Address) {
  try {
    return await client.ipAsset.get(ipId);
  } catch (error) {
    console.error('Error fetching IP Asset:', error);
    throw error;
  }
}

/**
 * Register a derivative IP Asset
 */
export async function registerDerivative(
  client: StoryClient,
  nftContract: Address,
  tokenId: bigint,
  parentIpIds: Address[],
  licenseTermsIds: bigint[]
) {
  try {
    const response = await client.ipAsset.registerDerivative({
      nftContract,
      tokenId,
      derivData: {
        parentIpIds,
        licenseTermsIds,
      },
    });

    return {
      ipId: response.ipId,
      txHash: response.txHash,
    };
  } catch (error) {
    console.error('Error registering derivative:', error);
    throw error;
  }
}

/**
 * Get royalty information for an IP Asset
 */
export async function getRoyaltyInfo(client: StoryClient, ipId: Address) {
  try {
    // This would use the royalty module from Story Protocol
    // Implementation depends on the specific royalty contract
    return await client.ipAsset.get(ipId);
  } catch (error) {
    console.error('Error fetching royalty info:', error);
    throw error;
  }
}
