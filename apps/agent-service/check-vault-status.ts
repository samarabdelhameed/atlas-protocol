import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import { storyAeneid } from 'viem/chains';
import { config } from './src/config/index.js';
import ADLV_ABI from '../frontend/src/contracts/abis/ADLV.json' assert { type: 'json' };
import IDO_ABI from '../frontend/src/contracts/abis/IDO.json' assert { type: 'json' };

const client = createPublicClient({
  chain: storyAeneid,
  transport: http(config.rpcUrl),
});

const ADLV_ADDRESS = config.contracts.adlv;
const IDO_ADDRESS = config.contracts.ido;

async function checkVaultStatus(vaultAddress: string) {
  console.log('🔍 Checking Vault Status...');
  console.log(`   Vault: ${vaultAddress}`);
  console.log(`   ADLV:  ${ADLV_ADDRESS}`);
  console.log(`   IDO:   ${IDO_ADDRESS}`);
  console.log('');

  try {
    // 1. Get vault info
    const vault = await client.readContract({
      address: ADLV_ADDRESS,
      abi: ADLV_ABI.abi,
      functionName: 'getVault',
      args: [vaultAddress as `0x${string}`],
    }) as {
      vaultAddress: `0x${string}`;
      ipId: `0x${string}`;
      creator: `0x${string}`;
      totalLiquidity: bigint;
      availableLiquidity: bigint;
      totalLoansIssued: bigint;
      activeLoansCount: bigint;
      totalLicenseRevenue: bigint;
      totalLoanRepayments: bigint;
      createdAt: bigint;
      exists: boolean;
    };

    console.log('📦 Vault Info:');
    console.log(`   Exists: ${vault.exists}`);
    
    if (!vault.exists) {
      console.log('   ❌ Vault does not exist!');
      return;
    }

    console.log(`   IP ID: ${vault.ipId}`);
    console.log(`   Creator: ${vault.creator}`);
    console.log(`   Total Liquidity: ${formatUnits(vault.totalLiquidity, 18)} IP`);
    console.log(`   Available Liquidity: ${formatUnits(vault.availableLiquidity, 18)} IP`);
    console.log(`   Active Loans: ${vault.activeLoansCount.toString()}`);
    console.log('');

    // 2. Get CVS for this IP
    const cvs = await client.readContract({
      address: IDO_ADDRESS,
      abi: IDO_ABI.abi,
      functionName: 'getCVS',
      args: [vault.ipId],
    }) as bigint;

    console.log('💎 CVS Analysis:');
    console.log(`   Current CVS: ${formatUnits(cvs, 18)} IP`);
    
    // 3. Calculate max loan (CVS / 2)
    const maxLoan = cvs / 2n;
    console.log(`   Max Loan Amount: ${formatUnits(maxLoan, 18)} IP (50% of CVS)`);
    console.log('');

    // 4. Show requirements for sample loan amounts
    console.log('📊 Loan Requirements:');
    console.log('');
    
    const sampleLoans = [0.1, 0.5, 1.0, 5.0];
    
    for (const loanAmount of sampleLoans) {
      const loanWei = BigInt(Math.floor(loanAmount * 1e18));
      const requiredCVS = loanWei * 2n;
      const requiredCollateral = (loanWei * 15000n) / 10000n; // 150%
      
      const hasEnoughCVS = cvs >= requiredCVS;
      const hasEnoughLiquidity = vault.availableLiquidity >= loanWei;
      const canBorrow = hasEnoughCVS && hasEnoughLiquidity;
      
      console.log(`   Loan: ${loanAmount} IP`);
      console.log(`      Required CVS: ${formatUnits(requiredCVS, 18)} IP ${hasEnoughCVS ? '✅' : '❌'}`);
      console.log(`      Required Collateral: ${formatUnits(requiredCollateral, 18)} IP (you must send this)`);
      console.log(`      Vault Liquidity: ${formatUnits(vault.availableLiquidity, 18)} IP ${hasEnoughLiquidity ? '✅' : '❌'}`);
      console.log(`      Status: ${canBorrow ? '✅ CAN BORROW' : '❌ CANNOT BORROW'}`);
      console.log('');
    }

    // 5. Summary
    console.log('═══════════════════════════════════════════');
    console.log('📋 Summary:');
    console.log('');
    
    if (cvs === 0n) {
      console.log('   ❌ CVS is ZERO - You need to:');
      console.log('      1. Register license sales for this IP');
      console.log('      2. Wait for agent-service to update CVS');
    } else if (vault.availableLiquidity === 0n) {
      console.log('   ❌ Vault has NO LIQUIDITY - You need to:');
      console.log('      1. Deposit funds into the vault');
      console.log('      2. Use the deposit() function on ADLV contract');
    } else {
      const minAmount = maxLoan < vault.availableLiquidity ? maxLoan : vault.availableLiquidity;
      console.log(`   ✅ Vault is ready for loans up to ${formatUnits(minAmount, 18)} IP`);
      console.log('');
      console.log('   💡 To take a loan, you need to send:');
      console.log('      - Collateral = Loan Amount × 1.5 (as msg.value)');
    }
    console.log('═══════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Get vault address from command line or use a default
const vaultAddress = process.argv[2];

if (!vaultAddress) {
  console.log('Usage: bun run check-vault-status.ts <vault-address>');
  console.log('');
  console.log('Example:');
  console.log('  bun run check-vault-status.ts 0x1234567890abcdef...');
  process.exit(1);
}

checkVaultStatus(vaultAddress);
