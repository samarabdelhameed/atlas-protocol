# How to Fix CVS Score Not Increasing

## Problem
CVS score stays at 0 after license purchases because the CVS Sync Service doesn't actually send blockchain transactions.

## Required Changes

### 1. Add Wallet Client Initialization

**File**: `apps/agent-service/src/services/cvs-sync-service.ts`

**In the imports** (add after line 8):
```typescript
import { createWalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
```

**In the constructor** (add after line 52):
```typescript
// Initialize wallet client for signing transactions
if (process.env.WALLET_PRIVATE_KEY) {
  const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`);
  this.walletClient = createWalletClient({
    account,
    chain: storyAeneid,
    transport: http(config.rpcUrl || process.env.RPC_URL),
  });
  console.log(`   Wallet: ${account.address}`);
} else {
  console.warn('⚠️  WALLET_PRIVATE_KEY not found - CVS sync will be read-only');
}
```

### 2. Replace Fake Sync Code with Real Transaction

**Replace lines 242-252** with:
```typescript
// Sync to oracle (send actual blockchain transaction)
console.log(`📤 Syncing CVS ${storyCVS.cvs} to oracle for ${ipId}`);

if (!this.walletClient) {
  console.error('❌ Cannot sync CVS: wallet client not initialized');
  return {
    ipId,
    success: false,
    error: 'Wallet client not initialized',
    timestamp: Date.now(),
  };
}

try {
  // Send transaction to CVS Oracle to sync from Story Protocol
  const txHash = await this.walletClient.writeContract({
    address: this.cvsOracleAddress,
    abi: CVS_ORACLE_ABI,
    functionName: 'syncCVSFromSPG',
    args: [ipId as Address],
  });

  console.log(`   Transaction sent: ${txHash}`);

  // Wait for confirmation
  const receipt = await this.publicClient.waitForTransactionReceipt({
    hash: txHash,
    timeout: 60_000 // 60 second timeout
  });

  if (receipt.status === 'success') {
    console.log(`✅ CVS synced successfully for ${ipId}`);
    return {
      ipId,
      success: true,
      cvs: storyCVS.cvs,
      timestamp: Date.now(),
    };
  } else {
    console.error(`❌ Transaction failed for ${ipId}`);
    return {
      ipId,
      success: false,
      error: 'Transaction reverted',
      timestamp: Date.now(),
    };
  }
} catch (error: any) {
  console.error(`❌ Error sending CVS sync transaction:`, error);
  return {
    ipId,
    success: false,
    error: error.message || 'Transaction failed',
    timestamp: Date.now(),
  };
}
```

### 3. Add Required Environment Variable

**File**: `apps/agent-service/.env`

Add:
```bash
# Wallet private key for signing CVS update transactions
WALLET_PRIVATE_KEY=0x...your_private_key_here

# CVS Oracle address (your deployed contract)
CVS_ORACLE_ADDRESS=0x4a875fD309C95DBFBcA6dFC3575517Ea7d5F6eC7
```

⚠️ **Security Note**: This wallet will pay gas fees for CVS updates. Use a dedicated wallet with limited funds.

## Alternative: Listen for License Sales and Update CVS

Instead of relying on periodic sync, you can update CVS immediately when licenses are sold:

**File**: `apps/agent-service/src/services/license-event-monitor.ts` (create new file)

```typescript
import { createPublicClient, createWalletClient, http, parseAbiItem } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { storyAeneid } from 'viem/chains';
import { CONTRACTS } from '../config/contracts.js';
import ADLV_ABI from '../contracts/abis/ADLV.json' assert { type: 'json' };
import IDO_ABI from '../contracts/abis/IDO.json' assert { type: 'json' };

/**
 * Monitor license sales and automatically update CVS
 */
export class LicenseEventMonitor {
  private publicClient: ReturnType<typeof createPublicClient>;
  private walletClient: ReturnType<typeof createWalletClient>;
  private isMonitoring = false;

  constructor() {
    const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`);

    this.publicClient = createPublicClient({
      chain: storyAeneid,
      transport: http(process.env.RPC_URL),
    });

    this.walletClient = createWalletClient({
      account,
      chain: storyAeneid,
      transport: http(process.env.RPC_URL),
    });

    console.log('✅ License Event Monitor initialized');
  }

  /**
   * Start monitoring for LicenseSold events
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('⚠️  Already monitoring');
      return;
    }

    this.isMonitoring = true;
    console.log('👂 Listening for LicenseSold events...');

    // Watch for new LicenseSold events
    const unwatch = this.publicClient.watchEvent({
      address: CONTRACTS.ADLV as `0x${string}`,
      event: parseAbiItem('event LicenseSold(address indexed vaultAddress, address indexed licensee, uint256 indexed licenseId, uint256 amount, string tierName)'),
      onLogs: async (logs) => {
        for (const log of logs) {
          await this.handleLicenseSold(log);
        }
      },
    });

    return unwatch;
  }

  /**
   * Handle a LicenseSold event by updating CVS
   */
  private async handleLicenseSold(log: any) {
    try {
      const { vaultAddress, licensee, amount, tierName } = log.args;

      console.log(`\n🎫 License sold!`);
      console.log(`   Vault: ${vaultAddress}`);
      console.log(`   Buyer: ${licensee}`);
      console.log(`   Amount: ${amount}`);
      console.log(`   Tier: ${tierName}`);

      // Get IP ID from vault
      const vault = await this.publicClient.readContract({
        address: CONTRACTS.ADLV as `0x${string}`,
        abi: ADLV_ABI.abi,
        functionName: 'getVault',
        args: [vaultAddress],
      }) as any;

      const ipId = vault.ipId;
      console.log(`   IP ID: ${ipId}`);

      // Calculate CVS increase based on tier
      let cvsIncrease: bigint;
      switch (tierName?.toLowerCase()) {
        case 'basic':
          cvsIncrease = amount / BigInt(50); // 2%
          break;
        case 'commercial':
          cvsIncrease = amount / BigInt(20); // 5%
          break;
        case 'enterprise':
        case 'exclusive':
          cvsIncrease = amount / BigInt(10); // 10%
          break;
        default:
          cvsIncrease = amount / BigInt(100); // 1% fallback
      }

      console.log(`   CVS Increase: ${cvsIncrease} (${Number(cvsIncrease) / 1e18} STORY)`);

      // Update CVS on-chain
      const txHash = await this.walletClient.writeContract({
        address: CONTRACTS.IDO as `0x${string}`,
        abi: IDO_ABI.abi,
        functionName: 'increaseCVS',
        args: [ipId, cvsIncrease],
      });

      console.log(`   ✅ CVS update tx: ${txHash}`);

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status === 'success') {
        console.log(`   ✅ CVS increased successfully!`);

        // Read new CVS value
        const newCVS = await this.publicClient.readContract({
          address: CONTRACTS.IDO as `0x${string}`,
          abi: IDO_ABI.abi,
          functionName: 'getCVS',
          args: [ipId],
        }) as bigint;

        console.log(`   📈 New CVS: ${Number(newCVS) / 1e18} STORY\n`);
      } else {
        console.error(`   ❌ CVS update failed\n`);
      }
    } catch (error) {
      console.error(`❌ Error handling license sale:`, error);
    }
  }

  stopMonitoring() {
    this.isMonitoring = false;
    console.log('🛑 Stopped monitoring');
  }
}
```

**Then initialize it in your main server file**:

```typescript
import { LicenseEventMonitor } from './services/license-event-monitor.js';

// Start monitoring for license sales
const licenseMonitor = new LicenseEventMonitor();
await licenseMonitor.startMonitoring();
```

## Testing the Fix

After implementing either fix:

1. **Buy a test license** from the marketplace
2. **Check the backend logs** - you should see:
   ```
   🎫 License sold!
   ✅ CVS update tx: 0x...
   ✅ CVS increased successfully!
   📈 New CVS: X.XX STORY
   ```
3. **Refresh the Dashboard** - CVS should now show the increased value

## Expected CVS Increases

Based on your tier pricing:
- **Basic tier**: +2% of sale price
- **Commercial tier**: +5% of sale price
- **Enterprise tier**: +10% of sale price

For example, a 100 STORY license sale at the Commercial tier would increase CVS by 5 STORY.

---

**Priority**: CRITICAL - This is core business logic that's currently broken
