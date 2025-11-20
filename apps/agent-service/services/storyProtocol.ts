import { StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import { http } from 'viem';
import { odyssey } from '@story-protocol/core-sdk';

// Story Protocol configuration for testnet
const config: StoryConfig = {
  account: process.env.WALLET_PRIVATE_KEY as `0x${string}`,
  transport: http(process.env.STORY_RPC_URL || 'https://rpc.odyssey.storyrpc.io'),
  chainId: 1514, // Story mainnet (use 1315 for aeneid testnet)
};

// Initialize Story Client
export const storyClient = StoryClient.newClient(config);

/**
 * Register an IP Asset on Story Protocol
 * @param nftContract - The NFT contract address
 * @param tokenId - The token ID
 * @returns IP Asset ID
 */
export async function registerIPAsset(
  nftContract: string,
  tokenId: bigint
): Promise<string> {
  try {
    const response = await storyClient.ipAsset.register({
      nftContract: nftContract as `0x${string}`,
      tokenId: tokenId,
      metadata: {
        metadataURI: '',
        metadataHash: '',
        nftMetadataHash: '',
      },
    });

    console.log(`IP Asset registered: ${response.ipId}`);
    return response.ipId as string;
  } catch (error) {
    console.error('Error registering IP Asset:', error);
    throw error;
  }
}

/**
 * Attach license terms to an IP Asset
 * @param ipId - The IP Asset ID
 * @param licenseTermsId - The license terms ID
 */
export async function attachLicenseTerms(
  ipId: string,
  licenseTermsId: bigint
): Promise<void> {
  try {
    await storyClient.license.attachLicenseTerms({
      ipId: ipId as `0x${string}`,
      licenseTermsId: licenseTermsId,
    });

    console.log(`License terms ${licenseTermsId} attached to IP ${ipId}`);
  } catch (error) {
    console.error('Error attaching license terms:', error);
    throw error;
  }
}

/**
 * Mint license tokens for an IP Asset
 * @param licensorIpId - The licensor IP ID
 * @param licenseTermsId - The license terms ID
 * @param amount - Number of licenses to mint
 * @returns License token IDs
 */
export async function mintLicenseTokens(
  licensorIpId: string,
  licenseTermsId: bigint,
  amount: number
): Promise<bigint[]> {
  try {
    const response = await storyClient.license.mintLicenseTokens({
      licensorIpId: licensorIpId as `0x${string}`,
      licenseTermsId: licenseTermsId,
      amount: amount,
      receiver: config.account,
    });

    console.log(`Minted ${amount} license tokens`);
    return response.licenseTokenIds || [];
  } catch (error) {
    console.error('Error minting license tokens:', error);
    throw error;
  }
}

/**
 * Get IP Asset details
 * @param ipId - The IP Asset ID
 */
export async function getIPAsset(ipId: string) {
  try {
    const ipAsset = await storyClient.ipAsset.get(ipId as `0x${string}`);
    return ipAsset;
  } catch (error) {
    console.error('Error fetching IP Asset:', error);
    throw error;
  }
}

/**
 * Register a derivative IP Asset
 * @param nftContract - The NFT contract address
 * @param tokenId - The token ID
 * @param parentIpIds - Array of parent IP IDs
 * @param licenseTermsIds - Array of license terms IDs
 */
export async function registerDerivative(
  nftContract: string,
  tokenId: bigint,
  parentIpIds: string[],
  licenseTermsIds: bigint[]
): Promise<string> {
  try {
    const response = await storyClient.ipAsset.registerDerivative({
      nftContract: nftContract as `0x${string}`,
      tokenId: tokenId,
      derivData: {
        parentIpIds: parentIpIds as `0x${string}`[],
        licenseTermsIds: licenseTermsIds,
      },
    });

    console.log(`Derivative IP registered: ${response.ipId}`);
    return response.ipId as string;
  } catch (error) {
    console.error('Error registering derivative:', error);
    throw error;
  }
}
