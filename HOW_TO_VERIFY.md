# 🔍 كيفية التحقق من العقود

## التحقق السريع

استخدم هذه الأوامر للتحقق من العقود:

```bash
# 1. عدد الـ Vaults (يجب أن يكون 2)
cast call 0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205 "vaultCounter()" \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz

# 2. Story SPG Integration
cast call 0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205 "storySPG()" \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz

# 3. Protocol Fee (يجب أن يكون 500 = 5%)
cast call 0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205 "protocolFeeBps()" \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz

# 4. تحقق من معاملة
cast tx 0xb54a886ad27693b2955313bcba0348bce13642fc5e129148489b43bd9d8def31 \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
```

كل الأوامر يجب أن تعطي نتائج صحيحة، مما يثبت أن العقود deployed وشغالة!
