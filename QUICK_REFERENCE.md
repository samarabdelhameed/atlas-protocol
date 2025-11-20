# ⚡ Quick Reference - Copy & Paste

**For Frontend Developer - Everything you need in one place**

---

## 📍 Contract Addresses (Story Testnet)

```javascript
// Copy this entire block
export const CONTRACTS = {
  ADLV: "0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205",
  IDO:  "0x75B0EF811CB728aFdaF395a0b17341fb426c26dD",
  STORY_SPG: "0x69415CE984A79a3Cfbe3F51024C63b6C107331e3",
  STORY_IP_REGISTRY: "0x292639452A975630802C17c9267169D93BD5a793",
};
```

---

## 🌐 Network Config

```javascript
// Story Protocol Testnet
export const STORY_TESTNET = {
  id: 1315,
  name: "Story Protocol Testnet",
  rpcUrl: "https://rpc-storyevm-testnet.aldebaranode.xyz",
  explorer: "https://www.storyscan.io",
  currency: { name: "IP", symbol: "IP", decimals: 18 },
};
```

---

## 🔧 Environment Variables

```bash
# Add to .env
VITE_CHAIN_ID=1315
VITE_RPC_URL=https://rpc-storyevm-testnet.aldebaranode.xyz
VITE_ADLV_ADDRESS=0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205
VITE_IDO_ADDRESS=0x75B0EF811CB728aFdaF395a0b17341fb426c26dD
```

---

## 📊 Test Vault (Real Data)

```javascript
// Use this vault for testing
const TEST_VAULT = {
  address: "0x5E23c8894D44c41294Ec991F01653286fBf971C9",
  storyIPId: "test-ip-001",
  liquidity: "8.325 IP", // Real data
  revenue: "0.325 IP",   // Real data
};
```

---

## ✅ Quick Verification

```bash
# Verify everything works
cast call 0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205 "vaultCounter()" \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
# Should return: 2
```

---

## 📚 Full Documentation

- **Complete Guide**: `FRONTEND_INTEGRATION_CONFIG.md`
- **Contract Details**: `CONTRACT_ADDRESSES.md`
- **All Info**: `contracts/FRONTEND_CONTRACTS_INFO.md`

---

**Status**: ✅ All deployed and working!
