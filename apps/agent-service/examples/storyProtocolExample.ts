/**
 * Example usage of Story Protocol SDK integration
 * This demonstrates how to use the Story Protocol service
 */

import {
  registerIPAsset,
  attachLicenseTerms,
  mintLicenseTokens,
  getIPAsset,
  registerDerivative,
} from '../services/storyProtocol';

// Example: Register an IP Asset
async function exampleRegisterIP() {
  const nftContract = '0xYourNFTContract';
  const tokenId = 1n;

  try {
    const ipId = await registerIPAsset(nftContract, tokenId);
    console.log('Registered IP Asset:', ipId);
    return ipId;
  } catch (error) {
    console.error('Failed to register IP:', error);
  }
}

// Example: Attach license terms to IP
async function exampleAttachLicense(ipId: string) {
  const licenseTermsId = 1n; // PIL Non-Commercial Social Remixing

  try {
    await attachLicenseTerms(ipId, licenseTermsId);
    console.log('License terms attached successfully');
  } catch (error) {
    console.error('Failed to attach license:', error);
  }
}

// Example: Mint license tokens
async function exampleMintLicenses(ipId: string) {
  const licenseTermsId = 1n;
  const amount = 10;

  try {
    const tokenIds = await mintLicenseTokens(ipId, licenseTermsId, amount);
    console.log('Minted license tokens:', tokenIds);
    return tokenIds;
  } catch (error) {
    console.error('Failed to mint licenses:', error);
  }
}

// Example: Get IP Asset details
async function exampleGetIPDetails(ipId: string) {
  try {
    const ipAsset = await getIPAsset(ipId);
    console.log('IP Asset details:', ipAsset);
    return ipAsset;
  } catch (error) {
    console.error('Failed to get IP details:', error);
  }
}

// Example: Register a derivative work
async function exampleRegisterDerivative() {
  const nftContract = '0xYourNFTContract';
  const tokenId = 2n;
  const parentIpIds = ['0xParentIPId1'];
  const licenseTermsIds = [1n];

  try {
    const derivativeIpId = await registerDerivative(
      nftContract,
      tokenId,
      parentIpIds,
      licenseTermsIds
    );
    console.log('Registered derivative IP:', derivativeIpId);
    return derivativeIpId;
  } catch (error) {
    console.error('Failed to register derivative:', error);
  }
}

// Run examples
async function runExamples() {
  console.log('=== Story Protocol SDK Examples ===\n');

  // 1. Register IP
  const ipId = await exampleRegisterIP();
  if (!ipId) return;

  // 2. Attach license
  await exampleAttachLicense(ipId);

  // 3. Mint licenses
  await exampleMintLicenses(ipId);

  // 4. Get IP details
  await exampleGetIPDetails(ipId);

  // 5. Register derivative
  await exampleRegisterDerivative();
}

// Uncomment to run examples
// runExamples();

export {
  exampleRegisterIP,
  exampleAttachLicense,
  exampleMintLicenses,
  exampleGetIPDetails,
  exampleRegisterDerivative,
};
