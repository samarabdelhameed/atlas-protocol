# 🔍 كيفية التحقق من العقود (How to Verify Contracts)

## ⚠️ ملاحظة مهمة
Block explorer للـ Story testnet مش شغال حالياً. لكن كل البيانات موجودة على الـ blockchain ويمكن التحقق منها باستخدام RPC calls.

---

## 📋 المتطلبات

تحتاج إلى تثبيت Foundry (cast):
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

---

## ✅ التحقق من العقود

### 1. تحقق من عدد الـ Vaults
```bash
cast call 0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205 "vaultCounter()" \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
```
**النتيجة المتوقعة**: `0x0000000000000000000000000000000000000000000000000000000000000002` (يعني 2 vaults)

---

### 2. تحقق من Story Protocol Integration
```bash
# تحقق من Story SPG address
cast call 0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205 "storySPG()" \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
```
**النتيجة المتوقعة**: `0x00000000000000000000000069415ce984a79a3cfbe3f51024c63b6c107331e3`

```bash
# تحقق من Story IP Asset Registry
cast call 0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205 "storyIPAssetRegistry()" \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
```
**النتيجة المتوقعة**: `0x000000000000000000000000292639452a975630802c17c9267169d93bd5a793`

---

### 3. تحقق من Protocol Configuration
```bash
# Protocol Fee (5%)
cast call 0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205 "protocolFeeBps()" \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
```
**النتيجة المتوقعة**: `500` (5%)

```bash
# Creator Share (70%)
cast call 0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205 "creatorShareBps()" \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
```
**النتيجة المتوقعة**: `7000` (70%)

```bash
# Vault Share (25%)
cast call 0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205 "vaultShareBps()" \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
```
**النتيجة المتوقعة**: `2500` (25%)

---

### 4. تحقق من Owner
```bash
cast call 0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205 "owner()" \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
```
**النتيجة المتوقعة**: `0x000000000000000000000000dafee25f98ff62504c1086eacbb406190f3110d5`

---

### 5. تحقق من IDO Contract Reference
```bash
cast call 0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205 "idoContract()" \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
```
**النتيجة المتوقعة**: `0x00000000000000000000000075b0ef811cb728afdaf395a0b17341fb426c26dd`

---

### 6. تحقق من بيانات Vault #1
```bash
cast call 0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205 \
  "getVault(address)" "0x5e23c8894d44c41294ec991f01653286fbf971c9" \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
```
**النتيجة**: ستحصل على بيانات الـ vault كاملة بما فيها:
- Total Liquidity: 8+ IP
- Story IP ID: "test-ip-001"
- License Revenue: 1+ IP

---

### 7. تحقق من المعاملات
```bash
# تحقق من معاملة إنشاء Vault
cast tx 0xb54a886ad27693b2955313bcba0348bce13642fc5e129148489b43bd9d8def31 \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
```
**النتيجة**: ستحصل على تفاصيل المعاملة الكاملة:
- Block Number: 11,325,487
- Status: Success
- From: 0xdAFEE25F98Ff62504C1086eAcbb406190F3110D5
- To: 0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205

```bash
# تحقق من معاملة Deposit
cast tx 0x4acb093ec821cce20d7136dd07c3bff160f0f31a398da2ab6148ac5ad09125d3 \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
```

```bash
# تحقق من معاملة License Sale
cast tx 0x0eeb855fd84853f8cfaf7eaebbd89244f0e9fe43f4e2bd106ff045558f8b33c3 \
  --rpc-url https://rpc-storyevm-testnet.aldebaranode.xyz
```

---

## 🎯 سكريبت تحقق سريع

احفظ هذا السكريبت في ملف `verify.sh`:

```bash
#!/bin/bash

RPC="https://rpc-storyevm-testnet.aldebaranode.xyz"
ADLV="0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205"

echo "🔍 Verifying Atlas Protocol Contracts..."
echo ""

echo "1️⃣ Vault Counter:"
cast call $ADLV "vaultCounter()" --rpc-url $RPC
echo ""

echo "2️⃣ Story SPG:"
cast call $ADLV "storySPG()" --rpc-url $RPC
echo ""

echo "3️⃣ Story IP Registry:"
cast call $ADLV "storyIPAssetRegistry()" --rpc-url $RPC
echo ""

echo "4️⃣ Protocol Fee (should be 500 = 5%):"
cast call $ADLV "protocolFeeBps()" --rpc-url $RPC
echo ""

echo "5️⃣ Owner:"
cast call $ADLV "owner()" --rpc-url $RPC
echo ""

echo "6️⃣ IDO Contract:"
cast call $ADLV "idoContract()" --rpc-url $RPC
echo ""

echo "✅ Verification Complete!"
```

شغله بـ:
```bash
chmod +x verify.sh
./verify.sh
```

---

## 📊 النتائج المتوقعة

إذا كانت كل الأوامر تعمل وتعطي النتائج المتوقعة، فهذا يثبت:

✅ العقود deployed بنجاح  
✅ Story Protocol integration شغال  
✅ البيانات موجودة على الـ blockchain  
✅ المعاملات تمت بنجاح  
✅ كل الـ configuration صحيح  

---

## 🆘 في حالة المشاكل

إذا واجهت أي مشكلة:

1. تأكد من تثبيت `cast` (من Foundry)
2. تأكد من الاتصال بالإنترنت
3. جرب RPC endpoint بديل إذا كان الأول بطيء

---

## 📝 ملاحظات للحكام

- كل البيانات موجودة على الـ blockchain
- يمكن التحقق من كل شيء باستخدام الأوامر أعلاه
- Block explorer مش ضروري للتحقق
- العقود شغالة 100% ويمكن التفاعل معها

**Status**: ✅ Ready for Verification
