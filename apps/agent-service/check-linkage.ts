import { createPublicClient, http, parseAbiItem } from 'viem';
import { storyAeneid } from 'viem/chains';
import { config } from './src/config/index.js';

const client = createPublicClient({
  chain: storyAeneid,
  transport: http(config.rpcUrl),
});

const ADLV_ADDRESS = config.contracts.adlv;
const IDO_ADDRESS = config.contracts.ido;

async function checkState() {
  console.log('🔍 Checking Contract State...');
  console.log(`   ADLV: ${ADLV_ADDRESS}`);
  console.log(`   IDO:  ${IDO_ADDRESS}`);
  console.log('');

  try {
    // 1. Check what IDO address ADLV has
    const storedIDO = await client.readContract({
      address: ADLV_ADDRESS,
      abi: [parseAbiItem('function idoContract() view returns (address)')],
      functionName: 'idoContract',
    });
    console.log(`1. ADLV.idoContract() = ${storedIDO}`);
    
    if (storedIDO.toLowerCase() === IDO_ADDRESS.toLowerCase()) {
      console.log('   ✅ Matches config IDO address');
    } else {
      console.log('   ❌ MISMATCH! ADLV is pointing to a different IDO contract');
    }

    // 2. Check who owns the IDO contract
    const idoOwner = await client.readContract({
      address: IDO_ADDRESS,
      abi: [parseAbiItem('function owner() view returns (address)')],
      functionName: 'owner',
    });
    console.log(`2. IDO.owner() = ${idoOwner}`);

    if (idoOwner.toLowerCase() === ADLV_ADDRESS.toLowerCase()) {
      console.log('   ✅ ADLV is the owner of IDO');
    } else {
      console.log('   ❌ ADLV is NOT the owner of IDO');
      
      // Check if agent wallet is owner
      const { privateKeyToAccount } = await import('viem/accounts');
      const account = privateKeyToAccount(config.privateKey as `0x${string}`);
      
      if (idoOwner.toLowerCase() === account.address.toLowerCase()) {
        console.log('      (Agent wallet is the owner)');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkState();
