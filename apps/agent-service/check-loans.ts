import { createPublicClient, http, formatUnits } from 'viem';
import { storyAeneid } from 'viem/chains';
import { config } from './src/config/index.js';
import ADLV_ABI from '../frontend/src/contracts/abis/ADLV.json' assert { type: 'json' };

const client = createPublicClient({
  chain: storyAeneid,
  transport: http(config.rpcUrl),
});

const ADLV_ADDRESS = config.contracts.adlv;
const userAddress = process.argv[2];

async function checkLoans() {
  console.log('🔍 Checking loans for:', userAddress);
  
  const loanIds = await client.readContract({
    address: ADLV_ADDRESS,
    abi: ADLV_ABI.abi,
    functionName: 'getBorrowerLoans',
    args: [userAddress as `0x${string}`],
  }) as bigint[];
  
  console.log(`Found ${loanIds.length} loans:`, loanIds.map(id => id.toString()));
  
  for (const loanId of loanIds) {
    const loan = await client.readContract({
      address: ADLV_ADDRESS,
      abi: ADLV_ABI.abi,
      functionName: 'getLoan',
      args: [loanId],
    }) as any;
    
    console.log(`\n📋 Loan #${loanId}:`);
    console.log(`   Vault: ${loan.vaultAddress || loan[1]}`);
    console.log(`   Borrower: ${loan.borrower || loan[2]}`);
    console.log(`   Loan Amount: ${formatUnits(loan.loanAmount || loan[3], 18)} IP`);
    console.log(`   Collateral: ${formatUnits(loan.collateralAmount || loan[4], 18)} IP`);
    console.log(`   Status: ${Number(loan.status || loan[12])} (0=Pending,1=Active,2=Repaid,3=Defaulted,4=Liquidated)`);
  }
}

checkLoans().catch(console.error);
