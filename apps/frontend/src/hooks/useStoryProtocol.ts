import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { Address } from 'viem';
import {
  createStoryClient,
  registerIPAsset,
  attachLicenseTerms,
  mintLicenseTokens,
  getIPAsset,
  registerDerivative,
} from '../services/storyProtocol';

export function useStoryProtocol() {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleRegisterIP = useCallback(
    async (nftContract: Address, tokenId: bigint) => {
      if (!address) throw new Error('Wallet not connected');

      setLoading(true);
      setError(null);

      try {
        const client = createStoryClient(address);
        const result = await registerIPAsset(client, nftContract, tokenId);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [address]
  );

  const handleAttachLicense = useCallback(
    async (ipId: Address, licenseTermsId: bigint) => {
      if (!address) throw new Error('Wallet not connected');

      setLoading(true);
      setError(null);

      try {
        const client = createStoryClient(address);
        const result = await attachLicenseTerms(client, ipId, licenseTermsId);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [address]
  );

  const handleMintLicenses = useCallback(
    async (
      licensorIpId: Address,
      licenseTermsId: bigint,
      amount: number,
      receiver: Address
    ) => {
      if (!address) throw new Error('Wallet not connected');

      setLoading(true);
      setError(null);

      try {
        const client = createStoryClient(address);
        const result = await mintLicenseTokens(
          client,
          licensorIpId,
          licenseTermsId,
          amount,
          receiver
        );
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [address]
  );

  const handleGetIPAsset = useCallback(
    async (ipId: Address) => {
      setLoading(true);
      setError(null);

      try {
        // getIPAsset no longer requires a client - it uses direct contract calls
        const result = await getIPAsset(ipId);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleRegisterDerivative = useCallback(
    async (
      nftContract: Address,
      tokenId: bigint,
      parentIpIds: Address[],
      licenseTermsIds: bigint[]
    ) => {
      if (!address) throw new Error('Wallet not connected');

      setLoading(true);
      setError(null);

      try {
        const client = createStoryClient(address);
        const result = await registerDerivative(
          client,
          nftContract,
          tokenId,
          parentIpIds,
          licenseTermsIds
        );
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [address]
  );

  return {
    loading,
    error,
    registerIP: handleRegisterIP,
    attachLicense: handleAttachLicense,
    mintLicenses: handleMintLicenses,
    getIPAsset: handleGetIPAsset,
    registerDerivative: handleRegisterDerivative,
  };
}
