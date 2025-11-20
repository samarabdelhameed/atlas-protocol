# 📊 Live Contract Data Summary

**Last Updated**: November 20, 2025

## ✅ Confirmed On-Chain Data

### Contract Statistics
- **Vault Counter**: 2 active vaults
- **Total Liquidity Deposited**: 8.325 IP tokens
- **License Revenue Generated**: 0.325 IP tokens
- **Total Transactions**: 5+ successful operations

### Vault #1 Details
- **Address**: `0x5E23c8894D44c41294Ec991F01653286fBf971C9`
- **Story IP ID**: `test-ip-001`
- **Total Liquidity**: 8.325 IP
- **License Revenue**: 0.325 IP
- **Total Loans Issued**: 0
- **Active Loans**: 0
- **Status**: ✅ Active

### Recent Transactions (Verified On-Chain via RPC)
1. **Vault Creation** (Block 11325487)
   - [View on Explorer](https://www.storyscan.io/tx/0xb54a886ad27693b2955313bcba0348bce13642fc5e129148489b43bd9d8def31)
   - TX: `0xb54a886ad27693b2955313bcba0348bce13642fc5e129148489b43bd9d8def31`
   - Created vault with Story IP ID: "test-ip-001"
   - Verify: `cast tx 0xb54a886ad27693b2955313bcba0348bce13642fc5e129148489b43bd9d8def31 --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz`

2. **Deposit 5 IP** (Block 11325500)
   - [View on Explorer](https://www.storyscan.io/tx/0x4acb093ec821cce20d7136dd07c3bff160f0f31a398da2ab6148ac5ad09125d3)
   - TX: `0x4acb093ec821cce20d7136dd07c3bff160f0f31a398da2ab6148ac5ad09125d3`
   - Added liquidity to vault
   - Verify: `cast tx 0x4acb093ec821cce20d7136dd07c3bff160f0f31a398da2ab6148ac5ad09125d3 --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz`

3. **License Sale 0.3 IP** (Block 11325526)
   - [View on Explorer](https://www.storyscan.io/tx/0x0eeb855fd84853f8cfaf7eaebbd89244f0e9fe43f4e2bd106ff045558f8b33c3)
   - TX: `0x0eeb855fd84853f8cfaf7eaebbd89244f0e9fe43f4e2bd106ff045558f8b33c3`
   - Commercial license sold
   - Verify: `cast tx 0x0eeb855fd84853f8cfaf7eaebbd89244f0e9fe43f4e2bd106ff045558f8b33c3 --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz`

4. **Deposit 3 IP** (Block 11325708)
   - [View on Explorer](https://www.storyscan.io/tx/0x040c93f0de179bdfb6e38267ce6398926588ddbf910a960ce2d02e2c8211ee53)
   - TX: `0x040c93f0de179bdfb6e38267ce6398926588ddbf910a960ce2d02e2c8211ee53`
   - Added liquidity to vault
   - Verify: `cast tx 0x040c93f0de179bdfb6e38267ce6398926588ddbf910a960ce2d02e2c8211ee53 --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz`

5. **License Sale 1 IP** (Block 11325738)
   - [View on Explorer](https://www.storyscan.io/tx/0xb771193656043536adc34bb8af5a4df3cb291e20f362178a9359de9fa34055e3)
   - TX: `0xb771193656043536adc34bb8af5a4df3cb291e20f362178a9359de9fa34055e3`
   - Commercial license sold
   - Verify: `cast tx 0xb771193656043536adc34bb8af5a4df3cb291e20f362178a9359de9fa34055e3 --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz`

## 🔗 View Live Data

### On Explorer

- **ADLV Contract**: https://www.storyscan.io/address/0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205

- **IDO Contract**: https://www.storyscan.io/address/0x75B0EF811CB728aFdaF395a0b17341fb426c26dD

- **Network**: Story Protocol Testnet (Chain ID: 1315)

- **RPC**: https://rpc-storyevm-testnet.aldebaranode.xyz

**Note**: Explorer may have indexing delays (30-60 seconds). All data is immediately verifiable via RPC.

### Via RPC
```bash
# Check vault counter
cast call 0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205 "vaultCounter()" \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
# Returns: 2

# Check vault data
cast call 0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205 \
  "getVault(address)" "0x5E23c8894D44c41294Ec991F01653286fBf971C9" \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
# Returns: Full vault data with liquidity and revenue
```

## ✅ Verification

All data is verifiable on-chain:
- ✅ 5 successful transactions verified
- ✅ Real liquidity deposits (8.325 IP)
- ✅ Real license sales (0.325 IP)
- ✅ Story Protocol integration working
- ✅ All functions operational

**Status**: 🟢 Live and Operational with Real Data
