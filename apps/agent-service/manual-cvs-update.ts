/**
 * Manual CVS Update Script
 *
 * Use this to manually increase CVS for an IP asset after a license sale
 * Run: bun run manual-cvs-update.ts
 */

import { createWalletClient, createPublicClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { storyAeneid } from './src/lib/chain-config.js';
import IDO_ABI from './src/contracts/abis/IDO.json' assert { type: 'json' };

const IDO_ADDRESS = '0x4a875fD309C95DBFBcA6dFC3575517Ea7d5F6eC7'; // Your IDO contract
const RPC_URL = process.env.RPC_URL || 'https://rpc.ankr.com/story_testnet';

async function updateCVS() {
  // Get private key from environment
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('WALLET_PRIVATE_KEY not found in .env');
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);

  const walletClient = createWalletClient({
    account,
    chain: storyAeneid,
    transport: http(RPC_URL),
  });

  const publicClient = createPublicClient({
    chain: storyAeneid,
    transport: http(RPC_URL),
  });

  // REPLACE WITH YOUR IP ASSET ID
  const ipId = '0xYourIPAssetAddress' as `0x${string}`;

  // Calculate CVS increase based on license tier
  // For a 100 STORY license at 5% rate = 5 STORY CVS increase
  const cvsIncrease = parseEther('5'); // 5 STORY tokens in Wei

  console.log(`📊 Updating CVS for IP: ${ipId}`);
  console.log(`   Increase: ${cvsIncrease.toString()} Wei (5 STORY)`);

  try {
    // Call IDO.increaseCVS()
    const txHash = await walletClient.writeContract({
      address: IDO_ADDRESS,
      abi: IDO_ABI.abi,
      functionName: 'increaseCVS',
      args: [ipId, cvsIncrease],
    });

    console.log(`✅ Transaction sent: ${txHash}`);
    console.log(`   Waiting for confirmation...`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    if (receipt.status === 'success') {
      console.log(`✅ CVS increased successfully!`);

      // Read the new CVS value
      const newCVS = await publicClient.readContract({
        address: IDO_ADDRESS,
        abi: IDO_ABI.abi,
        functionName: 'getCVS',
        args: [ipId],
      }) as bigint;

      console.log(`📈 New CVS: ${newCVS.toString()} Wei (${Number(newCVS) / 1e18} STORY)`);
    } else {
      console.error(`❌ Transaction failed`);
    }
  } catch (error) {
    console.error(`❌ Error updating CVS:`, error);
  }
}

updateCVS().catch(console.error);
