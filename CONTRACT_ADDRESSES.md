# 📍 Contract Addresses - Story Protocol Testnet

**Network**: Story Protocol Testnet  
**Chain ID**: 1315  
**RPC URL**: https://rpc-storyevm-testnet.aldebaranode.xyz  
**Explorer**: https://www.storyscan.io  

**Status**: ✅ All contracts deployed and verified  
**Last Updated**: November 20, 2024

---

## 🎯 Atlas Protocol Contracts (Deployed & Working)

### Main Contracts

```javascript
// Copy-paste ready for your frontend
export const CONTRACTS = {
  // Atlas Protocol Contracts
  ADLV: "0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205",
  IDO:  "0x75B0EF811CB728aFdaF395a0b17341fb426c26dD",
  
  // Story Protocol Official Contracts
  STORY_SPG: "0x69415CE984A79a3Cfbe3F51024C63b6C107331e3",
  STORY_IP_REGISTRY: "0x292639452A975630802C17c9267169D93BD5a793",
  STORY_LICENSING_MODULE: "0x5a7D9Fa17DE09350F481A53B470D798c1c1b7c93",
};
```

---

## 📋 Contract Details

### 1. ADLV (Automated Data Licensing Vault)

**Address**: `0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205`

**Explorer**: https://www.storyscan.io/address/0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205

**What it does**:
- Creates IP-backed lending vaults
- Manages liquidity deposits/withdrawals
- Issues loans based on CVS (Collateral Value Score)
- Handles license sales
- Distributes revenue (70% creator, 25% vault, 5% protocol)

**Status**: ✅ Deployed and operational
- 2 vaults created
- 8.325 IP total liquidity
- 0.325 IP license revenue
- All functions tested and working

**ABI Location**: `contracts/out/ADLVWithStory.sol/ADLVWithStory.json`

---

### 2. IDO (IP Data Oracle)

**Address**: `0x75B0EF811CB728aFdaF395a0b17341fb426c26dD`

**Explorer**: https://www.storyscan.io/address/0x75B0EF811CB728aFdaF395a0b17341fb426c26dD

**What it does**:
- Tracks CVS (Collateral Value Score) for each IP
- Manages IP revenue tracking
- Owned by ADLV contract

**Status**: ✅ Deployed and operational
- Owner: ADLV contract (verified ✅)
- CVS tracking active
- Revenue tracking working

**ABI Location**: `contracts/out/IDO.sol/IDO.json`

---

### 3. Story Protocol SPG (Story Protocol Gateway)

**Address**: `0x69415CE984A79a3Cfbe3F51024C63b6C107331e3`

**What it does**:
- Official Story Protocol gateway
- Simplifies IP registration
- Handles licensing operations

**Status**: ✅ Official Story Protocol contract
- Referenced in ADLV contract (verified ✅)
- Ready for frontend integration

---

### 4. Story Protocol IP Asset Registry

**Address**: `0x292639452A975630802C17c9267169D93BD5a793`

**What it does**:
- Official Story Protocol IP registry
- Tracks all registered IP assets
- Manages IP metadata

**Status**: ✅ Official Story Protocol contract
- Referenced in ADLV contract (verified ✅)
- Ready for frontend integration

---

## 🧪 Test Data (Real Vaults)

### Vault 1 (For Testing)

```javascript
const VAULT_1 = {
  address: "0x5E23c8894D44c41294Ec991F01653286fBf971C9",
  storyIPId: "test-ip-001",
  name: "AI Generated Art Collection",
  
  // Real data (verified on-chain)
  totalLiquidity: "8325000000000000000", // 8.325 IP
  licenseRevenue: "325000000000000000",  // 0.325 IP
  activeLoans: 0,
  
  // Explorer
  explorer: "https://www.storyscan.io/address/0x5E23c8894D44c41294Ec991F01653286fBf971C9"
};
```

---

## ✅ Verification Commands

### Quick Verification (Copy-paste in terminal)

```bash
# 1. Check vault count
cast call 0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205 "vaultCounter()" \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
# Expected: 2

# 2. Verify Story SPG reference
cast call 0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205 "storySPG()" \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
# Expected: 0x69415CE984A79a3Cfbe3F51024C63b6C107331e3

# 3. Verify IP Registry reference
cast call 0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205 "storyIPAssetRegistry()" \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
# Expected: 0x292639452A975630802C17c9267169D93BD5a793

# 4. Check IDO owner (should be ADLV)
cast call 0x75B0EF811CB728aFdaF395a0b17341fb426c26dD "owner()" \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
# Expected: 0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205

# 5. Get vault details
cast call 0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205 \
  "getVault(address)" "0x5E23c8894D44c41294Ec991F01653286fBf971C9" \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
```

---

## 🔗 Network Configuration

### For Wagmi/Viem

```typescript
import { defineChain } from 'viem';

export const storyTestnet = defineChain({
  id: 1315,
  name: 'Story Protocol Testnet',
  network: 'story-testnet',
  nativeCurrency: {
    name: 'IP',
    symbol: 'IP',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-storyevm-testnet.aldebaranode.xyz'],
    },
    public: {
      http: ['https://rpc-storyevm-testnet.aldebaranode.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Story Scan',
      url: 'https://www.storyscan.io',
    },
  },
  testnet: true,
});
```

### Environment Variables

```bash
# Add to your .env file
VITE_CHAIN_ID=1315
VITE_RPC_URL=https://rpc-storyevm-testnet.aldebaranode.xyz

# Atlas Protocol Contracts
VITE_ADLV_ADDRESS=0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205
VITE_ADLV_CONTRACT_ADDRESS=0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205
VITE_IDO_ADDRESS=0x75B0EF811CB728aFdaF395a0b17341fb426c26dD
VITE_IDO_CONTRACT_ADDRESS=0x75B0EF811CB728aFdaF395a0b17341fb426c26dD

# Story Protocol Contracts
VITE_STORY_SPG_ADDRESS=0x69415CE984A79a3Cfbe3F51024C63b6C107331e3
VITE_STORY_IP_REGISTRY=0x292639452A975630802C17c9267169D93BD5a793
```

---

## 📚 Documentation Files

For complete integration guide, see:

1. **[FRONTEND_INTEGRATION_CONFIG.md](FRONTEND_INTEGRATION_CONFIG.md)** - Complete frontend setup
2. **[FRONTEND_CONTRACTS_INFO.md](contracts/FRONTEND_CONTRACTS_INFO.md)** - Detailed contract info
3. **[STORY_PROTOCOL_SDK_GUIDE.md](STORY_PROTOCOL_SDK_GUIDE.md)** - SDK usage guide

---

## 🎯 Quick Start for Frontend

```typescript
import { useReadContract, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';

const ADLV_ADDRESS = "0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205";

// Read vault count
const { data: vaultCount } = useReadContract({
  address: ADLV_ADDRESS,
  abi: ADLV_ABI,
  functionName: 'vaultCounter',
});

// Create vault
const { writeContract } = useWriteContract();
await writeContract({
  address: ADLV_ADDRESS,
  abi: ADLV_ABI,
  functionName: 'createVault',
  args: [ipId, storyIPId],
});

// Deposit liquidity
await writeContract({
  address: ADLV_ADDRESS,
  abi: ADLV_ABI,
  functionName: 'deposit',
  args: [vaultAddress],
  value: parseEther('1'), // 1 IP
});
```

---

## ✅ Status Summary

| Contract | Status | Verified | Live Data |
|----------|--------|----------|-----------|
| **ADLV** | ✅ Deployed | ✅ Yes | ✅ 2 vaults, 8.325 IP |
| **IDO** | ✅ Deployed | ✅ Yes | ✅ CVS tracking active |
| **Story SPG** | ✅ Referenced | ✅ Yes | ✅ Official contract |
| **IP Registry** | ✅ Referenced | ✅ Yes | ✅ Official contract |

---

## 🆘 Need Help?

- **Full Documentation**: See `FRONTEND_INTEGRATION_CONFIG.md`
- **Contract ABIs**: In `contracts/out/` folder
- **Verification**: Run `./verify-all.sh`
- **Story Protocol Docs**: https://docs.story.foundation/

---

**Everything is deployed, verified, and working! Ready to integrate! 🚀**

**Last Updated**: November 20, 2024
