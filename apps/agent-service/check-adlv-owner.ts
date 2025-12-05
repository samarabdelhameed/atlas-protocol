import { createPublicClient, http, parseAbiItem } from 'viem';
import { storyAeneid } from 'viem/chains';
import { config } from './src/config/index.js';

const client = createPublicClient({
  chain: storyAeneid,
  transport: http(config.rpcUrl),
});

const ADLV_ADDRESS = config.contracts.adlv;
const ABI = [parseAbiItem('function owner() view returns (address)')];

async function checkOwner() {
  console.log(`Checking owner of ADLV at ${ADLV_ADDRESS}...`);
  try {
    const owner = await client.readContract({
      address: ADLV_ADDRESS,
      abi: ABI,
      functionName: 'owner',
    });
    console.log(`Owner: ${owner}`);
    console.log(`Agent: ${config.wallet.address}`);
    
    if (owner.toLowerCase() === config.wallet.address.toLowerCase()) {
      console.log('✅ Agent IS the owner of ADLV');
    } else {
      console.log('❌ Agent is NOT the owner of ADLV');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkOwner();
