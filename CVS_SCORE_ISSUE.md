# CVS Score Not Increasing - Root Cause Analysis

## Problem
User purchased a license from an IP asset, but the CVS score remains at 0 and doesn't increase.

## Root Cause Found

### The CVS Sync Service Is NOT Actually Updating CVS On-Chain! ❌

**Location**: `apps/agent-service/src/services/cvs-sync-service.ts:244-246`

```typescript
// Sync to oracle (requires wallet client for signing)
// Note: In production, this would use a wallet client
console.log(`📤 Syncing CVS ${storyCVS.cvs} to oracle for ${ipId}`);

// For now, log the sync (actual transaction would require wallet)
return {
  ipId,
  success: true,  // ❌ LIES! It's not actually updating anything
  cvs: storyCVS.cvs,
  timestamp: Date.now(),
};
```

**The service is:**
- ✅ Calculating CVS values
- ✅ Fetching from Story Protocol
- ❌ **NOT calling the contract to update CVS!**

It just logs and returns. No transaction is being sent!

---

## What Should Happen

When a license is purchased:

1. Frontend calls `ADLV.sellLicense()` ✅ (Working)
2. Smart contract should call `depositLicenseRevenue()` (Unknown if this happens)
3. Revenue deposit should trigger `IDO.increaseCVS()` (Not happening)
4. CVS Sync Service should sync updated CVS to CVS Oracle (Not working - line 244)

---

## The Flow is Broken at Multiple Points

### Issue 1: CVS Sync Service Not Sending Transactions

**File**: `apps/agent-service/src/services/cvs-sync-service.ts`

**Problem**: Line 244-252 doesn't actually call the contract:

```typescript
// THIS CODE DOES NOTHING!
console.log(`📤 Syncing CVS ${storyCVS.cvs} to oracle for ${ipId}`);
return { ...success: true... }; // Fake success
```

**What it should do**:
```typescript
// Send transaction to CVS Oracle
if (!this.walletClient) {
  throw new Error('Wallet client not initialized');
}

const txHash = await this.walletClient.writeContract({
  address: this.cvsOracleAddress,
  abi: CVS_ORACLE_ABI,
  functionName: 'syncCVSFromSPG',
  args: [ipId],
});

await this.publicClient.waitForTransactionReceipt({ hash: txHash });
```

### Issue 2: Missing Wallet Client

**File**: `apps/agent-service/src/services/cvs-sync-service.ts:36`

```typescript
private walletClient: any; // For signing transactions
```

This is declared but **NEVER initialized**! The constructor doesn't set it up.

**What's needed**:
```typescript
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// In constructor:
if (process.env.WALLET_PRIVATE_KEY) {
  const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`);
  this.walletClient = createWalletClient({
    account,
    chain: storyAeneid,
    transport: http(config.rpcUrl),
  });
}
```

### Issue 3: Service May Not Be Monitoring License Sales

The CVS Sync Service is initialized but may not be actively monitoring new license sales to trigger CVS updates immediately.

---

## Environment Variables Missing

Check your `.env` file needs:

```bash
# Required for CVS updates
WALLET_PRIVATE_KEY=0x...  # Private key for signing CVS update transactions
CVS_ORACLE_ADDRESS=0x4a875fD309C95DBFBcA6dFC3575517Ea7d5F6eC7  # Your CVS Oracle address

# Optional for auto-sync
CVS_AUTO_SYNC_IPS=0xIPAsset1,0xIPAsset2  # Comma-separated list
CVS_SYNC_INTERVAL_MS=300000  # 5 minutes
```

---

## Immediate Fix Required

### Option 1: Quick Fix - Monitor License Events & Update CVS

**File**: `apps/agent-service/src/services/contract-monitor.ts`

Add an event listener for `LicenseSold` events that triggers CVS update:

```typescript
// Listen for LicenseSold events
adlvContract.on('LicenseSold', async (vaultAddress, licensee, licenseId, event) => {
  console.log(`🎫 License sold: ${licenseId}`);

  // Get vault info to find IP ID
  const vault = await adlvContract.getVault(vaultAddress);
  const ipId = vault.ipId;

  // Trigger CVS update
  await updateCVSForLicense(ipId, vault, event);
});

async function updateCVSForLicense(ipId, vault, event) {
  // Get license price from event
  const licensePrice = event.args.price || BigInt(0);

  // Calculate CVS increase based on license type
  let cvsIncrease = BigInt(0);
  if (licenseType === 'exclusive') {
    cvsIncrease = licensePrice / BigInt(10); // 10%
  } else if (licenseType === 'commercial') {
    cvsIncrease = licensePrice / BigInt(20); // 5%
  } else {
    cvsIncrease = licensePrice / BigInt(50); // 2%
  }

  // Call IDO.increaseCVS()
  const tx = await idoContract.increaseCVS(ipId, cvsIncrease);
  await tx.wait();

  console.log(`✅ CVS increased by ${cvsIncrease} for IP ${ipId}`);
}
```

### Option 2: Fix the CVS Sync Service

**Steps**:
1. Initialize wallet client in constructor
2. Replace line 244-252 with actual contract call
3. Add error handling for transaction failures
4. Monitor for `LicenseSold` events to trigger immediate sync

---

## Testing the Fix

After implementing the fix:

1. **Buy a test license** from the marketplace
2. **Wait 30 seconds** for transaction confirmation
3. **Refresh the marketplace page**
4. **CVS score should have increased** by the amount shown in the tier's "CVS Impact"

Expected increases:
- Basic tier: +25 CVS
- Commercial tier: +80 CVS
- Enterprise tier: +250 CVS

---

## Why This Wasn't Caught Earlier

1. The service returns `success: true` even though it does nothing
2. No error logging when CVS doesn't actually update
3. The initialization logs make it look like it's working:
   ```
   ✅ CVS Sync Service initialized
      CVS Oracle: 0x4a875fD309C95DBFBcA6dFC3575517Ea7d5F6eC7
      Sync Interval: 300000ms
   ```
4. The code structure looks complete but critical transaction code is commented out

---

## Recommended Solution

**Implement a dedicated License Event Handler:**

```typescript
// apps/agent-service/src/services/license-cvs-updater.ts

export class LicenseCVSUpdater {
  private adlvContract: Contract;
  private idoContract: Contract;
  private walletClient: WalletClient;

  async handleLicenseSold(event: LicenseSoldEvent) {
    const { vaultAddress, licensee, licenseType, price } = event.args;

    // Get IP ID from vault
    const vault = await this.adlvContract.getVault(vaultAddress);
    const ipId = vault.ipId;

    // Calculate CVS increase
    const cvsIncrease = this.calculateCVSIncrease(licenseType, price);

    // Update CVS on-chain
    try {
      const tx = await this.idoContract.increaseCVS(ipId, cvsIncrease);
      await tx.wait();
      console.log(`✅ CVS updated: +${cvsIncrease} for IP ${ipId}`);
    } catch (error) {
      console.error(`❌ Failed to update CVS:`, error);
      // Retry logic here
    }
  }

  private calculateCVSIncrease(licenseType: string, price: bigint): bigint {
    const typeMultipliers = {
      'standard': 50,    // 2%
      'commercial': 20,  // 5%
      'exclusive': 10,   // 10%
    };

    const divisor = BigInt(typeMultipliers[licenseType] || 50);
    return price / divisor;
  }
}
```

---

## Status

- ❌ **CVS is NOT being updated** after license purchases
- ❌ CVS Sync Service has dummy code that doesn't execute transactions
- ❌ No wallet client initialized to sign CVS update transactions
- ⚠️  Need to implement proper event monitoring + CVS updates

**Priority**: **CRITICAL** - Core business logic is broken

---

**Next Steps**:
1. Initialize wallet client with private key
2. Implement actual CVS Oracle contract calls
3. Add license event monitoring
4. Test with a real license purchase
5. Verify CVS increases correctly

---

**Date**: December 4, 2025
**Status**: Issue Identified, Fix Required
