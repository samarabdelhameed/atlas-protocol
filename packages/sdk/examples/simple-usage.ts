/**
 * Simple usage example for Atlas Protocol SDK
 *
 * This example shows how to:
 * 1. Authenticate with your wallet
 * 2. Get global usage data for a licensed IP asset
 * 3. Monitor infringements and authorized uses
 */

import { AtlasClient } from '../src/index.js';
import { Wallet, JsonRpcProvider } from 'ethers';

async function main() {
  // Setup wallet (in production, use secure key management)
  const provider = new JsonRpcProvider(
    process.env.RPC_URL || 'https://rpc.ankr.com/story_aeneid_testnet/...'
  );
  const wallet = new Wallet(process.env.PRIVATE_KEY || '', provider);

  // Create Atlas client
  const client = new AtlasClient({
    apiUrl: process.env.ATLAS_API_URL || 'http://localhost:3001',
    signer: wallet,
  });

  console.log('🔐 Authenticating...');
  const authenticated = await client.authenticate();

  if (!authenticated) {
    console.error('❌ Authentication failed');
    return;
  }

  console.log('✅ Authenticated successfully!');

  // Get my licenses
  console.log('\n📋 Fetching my licenses...');
  const { licenses, count } = await client.getMyLicenses();

  console.log(`Found ${count} licenses:`);
  licenses.forEach((license, i) => {
    console.log(`  ${i + 1}. ${license.ipAssetName || license.ipAssetId}`);
    console.log(`     Type: ${license.licenseType}`);
    console.log(`     Active: ${license.isActive ? '✅' : '❌'}`);
    console.log(`     Expires: ${new Date(license.expiresAt).toLocaleDateString()}`);
  });

  // Get global usage data for the first active license
  const activeLicense = licenses.find(l => l.isActive && new Date(l.expiresAt) > new Date());

  if (!activeLicense) {
    console.log('\n⚠️  No active licenses found');
    return;
  }

  console.log(`\n📊 Fetching global usage data for: ${activeLicense.ipAssetName || activeLicense.ipAssetId}`);

  const usageData = await client.getGlobalUsageData(activeLicense.ipAssetId);

  // Display global usage metrics
  console.log('\n🌍 Global Usage Intelligence:');
  console.log(`  Total Detections: ${usageData.globalUsage.totalDetections}`);
  console.log(`  Authorized Uses: ${usageData.globalUsage.authorizedUses}`);
  console.log(`  Unauthorized Uses: ${usageData.globalUsage.unauthorizedUses}`);
  console.log(`  Platforms: ${usageData.globalUsage.platforms.join(', ') || 'None'}`);
  console.log(`  Derivatives: ${usageData.globalUsage.derivatives}`);
  console.log(`  Last Detected: ${usageData.globalUsage.lastDetectedAt || 'Never'}`);

  // Display provenance data
  console.log('\n🔍 Provenance Verification (Yakoa):');
  console.log(`  Score: ${usageData.provenance.yakoaScore}/100`);
  console.log(`  Status: ${usageData.provenance.status}`);
  console.log(`  Verified: ${usageData.provenance.verified ? '✅' : '❌'}`);
  console.log(`  Confidence: ${usageData.provenance.confidence}%`);

  // Display infringements
  if (usageData.infringements.length > 0) {
    console.log('\n🚨 Detected Infringements:');
    usageData.infringements.forEach((inf, i) => {
      console.log(`  ${i + 1}. Brand: ${inf.brand_id}`);
      console.log(`     Detected: ${inf.detected_at}`);
      console.log(`     Status: ${inf.status}`);
    });
  } else {
    console.log('\n✅ No infringements detected');
  }

  // Display authorized usages
  if (usageData.authorizations.length > 0) {
    console.log('\n✅ Authorized Usages:');
    usageData.authorizations.forEach((auth, i) => {
      console.log(`  ${i + 1}. Brand: ${auth.brand_id}`);
      console.log(`     Authorized: ${auth.authorized_at}`);
    });
  }

  // Display derivatives
  if (usageData.derivatives.length > 0) {
    console.log('\n🔗 On-Chain Derivatives:');
    usageData.derivatives.forEach((der, i) => {
      console.log(`  ${i + 1}. ${der.childName || der.childIpId}`);
      console.log(`     Creator: ${der.creator}`);
      console.log(`     Created: ${der.createdAt}`);
      if (der.royaltiesPaid) {
        console.log(`     Royalties: ${der.royaltiesPaid} wei`);
      }
    });
  }

  // Display licensing summary
  console.log('\n💰 Licensing Summary:');
  console.log(`  Total Licenses Sold: ${usageData.licensingSummary.totalLicensesSold}`);
  console.log(`  Active Licenses: ${usageData.licensingSummary.activeLicenses}`);
  console.log(`  Total Revenue: ${(Number(usageData.licensingSummary.totalRevenue) / 1e18).toFixed(4)} STORY`);
  console.log(`  License Types:`);
  console.log(`    - Standard: ${usageData.licensingSummary.licenseTypeBreakdown.standard}`);
  console.log(`    - Commercial: ${usageData.licensingSummary.licenseTypeBreakdown.commercial}`);
  console.log(`    - Exclusive: ${usageData.licensingSummary.licenseTypeBreakdown.exclusive}`);

  // Display CVS score
  console.log('\n📈 CVS Score (Collateral Value):');
  console.log(`  Current: ${usageData.cvs.currentScore}`);
  console.log(`  Rank: ${usageData.cvs.rank > 0 ? `#${usageData.cvs.rank}` : 'N/A'}`);

  console.log('\n✨ Done!');
}

main().catch(console.error);
