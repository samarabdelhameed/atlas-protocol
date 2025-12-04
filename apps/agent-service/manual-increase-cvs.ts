/**
 * Manually increase CVS for an IP asset
 *
 * Usage:
 *   bun run manual-increase-cvs.ts <ipId> <amount>
 *
 * Example:
 *   bun run manual-increase-cvs.ts 0xcced9e1c5331ac8c9b98b8dedbdbf9cfd03ad60c 2000000000000000
 */

import { createWalletClient, http, parseUnits, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import ADLV_ABI from '../../contracts/out/ADLV.sol/ADLV.json';
import IDO_ABI from '../../contracts/out/IDO.sol/IDO.json';

const RPC_URL = process.env.RPC_URL || 'https://rpc.ankr.com/story_aeneid_testnet/bc16a42ff54082470945f1420d9917706e7de9dbea9c11f20d93584bd6d26886';
const ADLV_ADDRESS = (process.env.ADLV_ADDRESS || '0x9c7cCfB831Ed4D521599a3B97df0174C91bB2AAC') as `0x${string}`;
const IDO_ADDRESS = (process.env.IDO_ADDRESS || '0xFb1EC26171848c330356ff1C9e2a1228066Da324') as `0x${string}`;
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY as `0x${string}`;

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('❌ Usage: bun run manual-increase-cvs.ts <ipId> <amount>');
    console.error('   Example: bun run manual-increase-cvs.ts 0xcced9e1c5331ac8c9b98b8dedbdbf9cfd03ad60c 0.002');
    process.exit(1);
  }

  if (!PRIVATE_KEY) {
    console.error('❌ WALLET_PRIVATE_KEY not set in environment');
    process.exit(1);
  }

  const ipIdInput = args[0];
  const amountInput = args[1];

  // Convert IP ID to bytes32
  let ipId: `0x${string}`;
  if (ipIdInput.startsWith('0x')) {
    // If already has 0x, pad to 32 bytes if needed
    ipId = ipIdInput.padEnd(66, '0') as `0x${string}`;
  } else {
    // Add 0x prefix and pad
    ipId = ('0x' + ipIdInput.padEnd(64, '0')) as `0x${string}`;
  }

  // Parse amount (support both wei and ether format)
  let amount: bigint;
  if (amountInput.includes('.')) {
    // Ether format (e.g., "0.002")
    amount = parseUnits(amountInput, 18);
  } else {
    // Wei format
    amount = BigInt(amountInput);
  }

  console.log('🔧 Manual CVS Increase');
  console.log('═══════════════════════════════════════');
  console.log(`   IP ID: ${ipId}`);
  console.log(`   Amount: ${amount} wei (${Number(amount) / 1e18} STORY)`);
  console.log(`   ADLV Contract: ${ADLV_ADDRESS}`);
  console.log(`   IDO Contract: ${IDO_ADDRESS}`);
  console.log('');

  // Create wallet client
  const account = privateKeyToAccount(PRIVATE_KEY);
  const client = createWalletClient({
    account,
    chain: {
      id: 1315,
      name: 'Story Aeneid Testnet',
      nativeCurrency: { name: 'Story', symbol: 'STORY', decimals: 18 },
      rpcUrls: {
        default: { http: [RPC_URL] },
        public: { http: [RPC_URL] },
      },
    },
    transport: http(RPC_URL),
  }).extend(publicActions);

  console.log(`   Wallet: ${account.address}`);
  console.log('');

  // Check current CVS
  const currentCVS = await client.readContract({
    address: IDO_ADDRESS,
    abi: IDO_ABI.abi,
    functionName: 'getCVS',
    args: [ipId],
  }) as bigint;

  console.log(`📊 Current CVS: ${currentCVS} wei (${Number(currentCVS) / 1e18} STORY)`);

  // Calculate new CVS (current + increase)
  const newCVS = currentCVS + amount;

  console.log(`📤 Sending updateIPCVS transaction via ADLV...`);
  console.log(`   New CVS will be: ${Number(newCVS) / 1e18} STORY`);
  console.log('');

  const hash = await client.writeContract({
    address: ADLV_ADDRESS,
    abi: ADLV_ABI.abi,
    functionName: 'updateIPCVS',
    args: [ipId, newCVS],
  });

  console.log(`✅ Transaction sent: ${hash}`);
  console.log(`   Explorer: https://aeneid.storyscan.io/tx/${hash}`);
  console.log('');
  console.log('⏳ Waiting for confirmation...');

  const receipt = await client.waitForTransactionReceipt({ hash });

  if (receipt.status === 'success') {
    console.log('✅ Transaction confirmed!');

    // Check new CVS
    const newCVS = await client.readContract({
      address: IDO_ADDRESS,
      abi: IDO_ABI.abi,
      functionName: 'getCVS',
      args: [ipId],
    }) as bigint;

    console.log('');
    console.log(`📈 CVS Updated:`);
    console.log(`   Before: ${Number(currentCVS) / 1e18} STORY`);
    console.log(`   After:  ${Number(newCVS) / 1e18} STORY`);
    console.log(`   Change: +${Number(amount) / 1e18} STORY`);
  } else {
    console.error('❌ Transaction failed!');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
