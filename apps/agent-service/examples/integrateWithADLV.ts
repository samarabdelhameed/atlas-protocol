/**
 * Example: Integrating Story Protocol with ADLVWithStory contract
 * This shows how to create a vault and register it as an IP Asset
 */

import { createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { registerIPAsset, attachLicenseTerms } from '../services/storyProtocol';

// Contract addresses (update with your deployed addresses)
const ADLV_CONTRACT = '0x5e0B67e184b2C2e59Be5bDa1C6e2415c6e9d8c8A';
const MOCK_NFT = '0x041B4F29183317Fd352AE57e331154b73F8a1D7F';

/**
 * Complete workflow: Create vault → Register as IP → Attach license
 */
async function completeWorkflow() {
  console.log('🚀 Starting complete workflow...\n');

  // Step 1: Create a vault in ADLVWithStory contract
  console.log('1️⃣ Creating vault in ADLVWithStory...');
  const vaultId = await createVault();
  console.log(`   ✅ Vault created with ID: ${vaultId}\n`);

  // Step 2: Register the vault as an IP Asset
  console.log('2️⃣ Registering vault as IP Asset...');
  const ipId = await registerIPAsset(MOCK_NFT, BigInt(vaultId));
  console.log(`   ✅ IP Asset registered: ${ipId}\n`);

  // Step 3: Attach license terms
  console.log('3️⃣ Attaching license terms...');
  await attachLicenseTerms(ipId, 1n); // PIL Non-Commercial Social Remixing
  console.log(`   ✅ License terms attached\n`);

  // Step 4: Add IP liquidity to vault
  console.log('4️⃣ Adding IP liquidity to vault...');
  await addIPLiquidity(vaultId, ipId);
  console.log(`   ✅ IP liquidity added\n`);

  console.log('🎉 Complete workflow finished!');
  console.log(`\nVault ID: ${vaultId}`);
  console.log(`IP Asset ID: ${ipId}`);
}

/**
 * Create a vault in ADLVWithStory contract
 */
async function createVault(): Promise<number> {
  // This is a placeholder - implement actual contract interaction
  // using viem or ethers to call createVault on ADLVWithStory
  
  console.log('   Creating vault with:');
  console.log('   - Name: "AI Generated Art Collection"');
  console.log('   - Symbol: "AIGAC"');
  console.log('   - Initial deposit: 0.1 ETH');
  
  // Example contract call:
  // const tx = await adlvContract.write.createVault([
  //   "AI Generated Art Collection",
  //   "AIGAC",
  //   parseEther("0.1")
  // ]);
  
  // For now, return a mock vault ID
  return 1;
}

/**
 * Add IP liquidity to a vault
 */
async function addIPLiquidity(vaultId: number, ipId: string): Promise<void> {
  // This is a placeholder - implement actual contract interaction
  
  console.log(`   Adding IP ${ipId} to vault ${vaultId}`);
  console.log('   - Amount: 1000 tokens');
  
  // Example contract call:
  // const tx = await adlvContract.write.addIPLiquidity([
  //   vaultId,
  //   ipId,
  //   parseEther("1000")
  // ]);
}

/**
 * Example: Register multiple IPs and add to vault
 */
async function batchRegisterIPs() {
  console.log('📦 Batch registering IPs...\n');

  const tokenIds = [1n, 2n, 3n];
  const ipIds: string[] = [];

  for (const tokenId of tokenIds) {
    console.log(`Registering token ${tokenId}...`);
    const ipId = await registerIPAsset(MOCK_NFT, tokenId);
    ipIds.push(ipId);
    
    // Attach license
    await attachLicenseTerms(ipId, 1n);
    console.log(`✅ Token ${tokenId} → IP ${ipId}\n`);
  }

  console.log('🎉 Batch registration complete!');
  console.log(`Registered ${ipIds.length} IP Assets`);
  
  return ipIds;
}

/**
 * Example: Create derivative work
 */
async function createDerivativeWork(parentIpId: string) {
  console.log('🎨 Creating derivative work...\n');

  // This would involve:
  // 1. Minting a new NFT
  // 2. Registering it as a derivative of the parent IP
  // 3. Adding it to a vault

  console.log(`Parent IP: ${parentIpId}`);
  console.log('Creating derivative NFT...');
  
  // Implementation would go here
  
  console.log('✅ Derivative work created and registered');
}

// Export functions for use in other modules
export {
  completeWorkflow,
  createVault,
  addIPLiquidity,
  batchRegisterIPs,
  createDerivativeWork,
};

// Uncomment to run examples
// completeWorkflow().catch(console.error);
