# 🚀 Atlas Protocol - Quick Start Guide

## ⚡ الخطوات السريعة للنشر والاختبار

---

## 📋 الخطوة 1: النشر على Story Protocol Testnet

### أ. إعداد البيئة

```bash
cd contracts

# إنشاء ملف .env
cp .env.example .env

# تحرير .env وإضافة:
# PRIVATE_KEY=your_private_key_without_0x
# STORY_PROTOCOL_RPC=https://your-story-protocol-rpc-url
```

### ب. النشر

```bash
# استخدام السكريبت التلقائي
chmod +x scripts/deploy-story.sh
./scripts/deploy-story.sh
```

**أو يدوياً:**

```bash
source .env

forge script script/DeployToStory.s.sol:DeployToStoryScript \
  --rpc-url "$STORY_PROTOCOL_RPC" \
  --broadcast \
  --private-key "$PRIVATE_KEY" \
  -vvvv
```

### ج. حفظ العناوين

بعد النشر، ستحصل على:

```
IDO Contract: 0x[IDO_ADDRESS]
ADLV Contract: 0x[ADLV_ADDRESS]
```

**📝 احفظ هذه العناوين!**

---

## 🔗 الخطوة 2: روابط Explorer (بعد النشر)

بعد النشر على Story Protocol، ستكون الروابط كالتالي:

### Story Protocol Testnet Explorer

```
IDO Contract:
https://story-testnet.blockscout.com/address/0x[IDO_ADDRESS]

ADLV Contract:
https://story-testnet.blockscout.com/address/0x[ADLV_ADDRESS]

Transaction Hash:
https://story-testnet.blockscout.com/tx/0x[TX_HASH]
```

### Base Sepolia (إذا نشرت على Base)

```
IDO Contract:
https://sepolia.basescan.org/address/0x[IDO_ADDRESS]

ADLV Contract:
https://sepolia.basescan.org/address/0x[ADLV_ADDRESS]
```

---

## ✅ الخطوة 3: التحقق من العقود (Verification)

### على Story Protocol (Blockscout)

```bash
cd contracts

# الحصول على API Key من Blockscout
export BLOCKSCOUT_API_KEY=your_api_key

# التحقق من IDO
forge verify-contract \
  0x[IDO_ADDRESS] \
  src/IDO.sol:IDO \
  --chain <story_chain_id> \
  --rpc-url "$STORY_PROTOCOL_RPC" \
  --etherscan-api-key "$BLOCKSCOUT_API_KEY" \
  --constructor-args $(cast abi-encode "constructor(address)" <DEPLOYER_ADDRESS>)

# التحقق من ADLV
forge verify-contract \
  0x[ADLV_ADDRESS] \
  src/ADLV.sol:ADLV \
  --chain <story_chain_id> \
  --rpc-url "$STORY_PROTOCOL_RPC" \
  --etherscan-api-key "$BLOCKSCOUT_API_KEY" \
  --constructor-args $(cast abi-encode "constructor(address)" 0x[IDO_ADDRESS])
```

### على Base (Etherscan)

```bash
# الحصول على API Key من Basescan
export BASE_ETHERSCAN_API_KEY=your_api_key

# التحقق من IDO
forge verify-contract \
  0x[IDO_ADDRESS] \
  src/IDO.sol:IDO \
  --chain-id 84532 \
  --rpc-url https://sepolia.base.org \
  --etherscan-api-key "$BASE_ETHERSCAN_API_KEY" \
  --constructor-args $(cast abi-encode "constructor(address)" <DEPLOYER_ADDRESS>)

# التحقق من ADLV
forge verify-contract \
  0x[ADLV_ADDRESS] \
  src/ADLV.sol:ADLV \
  --chain-id 84532 \
  --rpc-url https://sepolia.base.org \
  --etherscan-api-key "$BASE_ETHERSCAN_API_KEY" \
  --constructor-args $(cast abi-encode "constructor(address)" 0x[IDO_ADDRESS])
```

**🔗 رابط التحقق بعد النجاح:**
```
https://explorer-url/address/0x[CONTRACT_ADDRESS]#code
```

---

## 🔧 الخطوة 4: تحديث Agent Service

```bash
cd apps/agent-service

# إنشاء .env
cp .env.example .env

# تحديث تلقائي
chmod +x scripts/update-env.sh
./scripts/update-env.sh

# أو تحديث يدوي في .env:
# ADLV_ADDRESS=0x[ADLV_ADDRESS]
# IDO_ADDRESS=0x[IDO_ADDRESS]
# RPC_URL=https://your-rpc-url
# CHAIN_ID=<chain_id>
```

---

## ✅ الخطوة 5: اختبار التكامل

```bash
cd apps/agent-service

# اختبار التكامل
chmod +x scripts/test-integration.sh
./scripts/test-integration.sh
```

**النتيجة المتوقعة:**
```
✅ RPC connection successful
✅ ADLV address format valid
✅ IDO address format valid
✅ All checks passed!
```

---

## 🎯 الخطوة 6: تشغيل Agent Service

```bash
cd apps/agent-service

# تثبيت التبعيات
bun install

# تشغيل الخدمة
bun run dev
```

**النتيجة المتوقعة:**
```
🚀 Initializing Atlas Agent Service...
✅ Agent Service started successfully
📡 Services active:
   ✓ CVS Engine
   ✓ Loan Manager - IPFi integration ready
   ✓ Licensing Agent - GenAI licensing ready
   ✓ Contract Monitor - Event monitoring ready
🔍 Starting loan event monitoring...
✅ Loan event monitoring active
🔍 Starting license event monitoring...
✅ License event monitoring active
🔄 Agent Service running...
```

---

## 🧪 الخطوة 7: اختبار التكامل الكامل

### اختبار 1: إنشاء Vault

من Frontend أو مباشرة:

```typescript
// Example transaction
const tx = await adlvContract.createVault(ipId);
```

**في Agent Service logs:**
```
📦 New vault created:
   vaultAddress: 0x...
   ipId: 0x...
   creator: 0x...
```

### اختبار 2: بيع ترخيص

```typescript
const tx = await adlvContract.sellLicense(
  vaultAddress,
  "commercial",
  0,
  { value: ethers.parseEther("1.0") }
);
```

**في Agent Service logs:**
```
🎫 LicenseSold Event Detected!
✅ CVS updated successfully
✅ License registered with abv.dev
```

### اختبار 3: إصدار قرض

```typescript
const tx = await adlvContract.issueLoan(
  vaultAddress,
  ethers.parseEther("100"),
  30 * 24 * 60 * 60,
  { value: collateralAmount }
);
```

**في Agent Service logs:**
```
🚨 LoanIssued Event Detected!
🌉 Initiating cross-chain transfer via Owlto Finance...
✅ Cross-chain transfer successfully initiated
```

---

## 🔗 روابط مفيدة بعد النشر

### Story Protocol

```
Main Explorer:
https://story-testnet.blockscout.com

Your Contracts:
- IDO: https://story-testnet.blockscout.com/address/0x[IDO_ADDRESS]
- ADLV: https://story-testnet.blockscout.com/address/0x[ADLV_ADDRESS]

API Documentation:
https://docs.story.foundation
```

### Base Network

```
Main Explorer:
https://basescan.org (mainnet)
https://sepolia.basescan.org (testnet)

Your Contracts:
- IDO: https://sepolia.basescan.org/address/0x[IDO_ADDRESS]
- ADLV: https://sepolia.basescan.org/address/0x[ADLV_ADDRESS]

Base Docs:
https://docs.base.org
```

### Verification

```
Blockscout API:
https://blockscout.com/api-docs

Etherscan API:
https://docs.etherscan.io/api-endpoints/contracts
```

---

## 📊 Checklist بعد النشر

- [ ] العقود منشورة بنجاح
- [ ] العناوين محفوظة
- [ ] العقود محققة (verified) على Explorer
- [ ] Agent Service .env محدث
- [ ] اختبار التكامل نجح
- [ ] Agent Service يعمل
- [ ] الأحداث يتم اكتشافها
- [ ] CVS يتم تحديثه تلقائياً
- [ ] القروض تعمل عبر Owlto
- [ ] التراخيص تسجل مع abv.dev

---

## 🎉 النتيجة النهائية

بعد إكمال جميع الخطوات، سيكون لديك:

✅ **عقود منشورة ومحققة** على Story Protocol
✅ **Agent Service يعمل** ويراقب الأحداث
✅ **روابط Explorer** للعقود تعمل
✅ **تكامل كامل** بين جميع المكونات

**جميع الروابط ستكون حقيقية وتعمل بعد النشر الفعلي!**

