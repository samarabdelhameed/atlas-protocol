import { StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import { http, Address, createPublicClient } from 'viem';
import { storyTestnet } from '../wagmi';
import { CONTRACTS } from '../contracts/addresses';
import IPAssetRegistry_ABI from '../contracts/abis/IPAssetRegistry.json';

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
 * Note: The actual Story Protocol IPAssetRegistry only has isRegistered function.
 * IP Assets are ERC-6551 token-bound accounts, so we check the account's owner via ERC-6551 interface.
 */
export async function getIPAsset(ipId: Address) {
  try {
    // Create a public client for reading from the blockchain
    const publicClient = createPublicClient({
      chain: storyTestnet,
      transport: http(),
    });

    // First, check if the IP Asset is registered
    const isRegistered = await publicClient.readContract({
      address: CONTRACTS.IPAssetRegistry,
      abi: IPAssetRegistry_ABI.abi,
      functionName: 'isRegistered',
      args: [ipId],
    }) as boolean;

    if (!isRegistered) {
      throw new Error('IP Asset not registered in Story Protocol');
    }

    // IP Assets are ERC-6551 token-bound accounts
    // Try to get owner from the ERC-6551 account interface
    const ERC6551_ABI = [
      {
        "inputs": [],
        "name": "owner",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "token",
        "outputs": [
          {"internalType": "uint256", "name": "chainId", "type": "uint256"},
          {"internalType": "address", "name": "tokenContract", "type": "address"},
          {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ];

    try {
      // Get token info (NFT contract + token ID) from the IP Account
      const [chainId, tokenContract, tokenId] = await publicClient.readContract({
        address: ipId,
        abi: ERC6551_ABI,
        functionName: 'token',
      }) as [bigint, Address, bigint];

      // Now get the actual owner from the NFT contract
      const ERC721_ABI = [
        {
          "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
          "name": "ownerOf",
          "outputs": [{"internalType": "address", "name": "", "type": "address"}],
          "stateMutability": "view",
          "type": "function"
        }
      ];

      const owner = await publicClient.readContract({
        address: tokenContract,
        abi: ERC721_ABI,
        functionName: 'ownerOf',
        args: [tokenId],
      }) as Address;

      console.log('IP Asset details:', {
        ipId,
        tokenContract,
        tokenId: tokenId.toString(),
        owner,
      });

      return {
        owner,
        name: `IP Asset #${tokenId.toString()}`,
        type: 1, // Default type
        tokenContract,
        tokenId: Number(tokenId),
        chainId: Number(chainId),
      };
    } catch (accountError) {
      console.warn('Could not read ERC-6551 account details:', accountError);
      // If we can't get owner info, just return that it's registered
      return {
        owner: '0x0000000000000000000000000000000000000000' as Address,
        name: 'IP Asset',
        type: 1,
        tokenContract: '0x0000000000000000000000000000000000000000' as Address,
        tokenId: 0,
        chainId: 1315,
      };
    }
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
 * TODO: Implement when royalty module is needed
 */
export async function getRoyaltyInfo(client: StoryClient, ipId: Address) {
  // This would use the royalty module from Story Protocol
  // Implementation depends on the specific royalty contract
  throw new Error('getRoyaltyInfo not yet implemented - requires royalty module contract integration');
}
