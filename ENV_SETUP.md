# كيفية الحصول على قيم .env

## 📋 contracts/.env

### PRIVATE_KEY
**من أين:**
- من محفظتك (MetaMask, WalletConnect, etc.)
- **⚠️ مهم جداً:** استخدم محفظة testnet فقط للنشر
- **كيفية الحصول:**
  1. افتح MetaMask
  2. اضغط على الثلاث نقاط → Account Details
  3. Export Private Key
  4. **انسخ بدون 0x في البداية**

**مثال:**
```
PRIVATE_KEY=abc123def456... (بدون 0x)
```

### STORY_PROTOCOL_RPC
**من أين:**
- من Story Protocol documentation
- أو من Story Protocol dashboard
- **رابط:** https://docs.story.foundation

**مثال:**
```
STORY_PROTOCOL_RPC=https://rpc.story.foundation
```

### RPC_URL (بديل)
**إذا لم تستخدم Story Protocol:**
- **Base Sepolia:** https://sepolia.base.org
- **Base Mainnet:** https://mainnet.base.org
- **Ethereum Sepolia:** https://rpc.sepolia.org

---

## 📋 apps/agent-service/.env

### ADLV_ADDRESS و IDO_ADDRESS
**من أين:**
- **بعد النشر مباشرة** من output السكريبت
- أو من Explorer بعد النشر

**مثال بعد النشر:**
```
IDO Contract: 0x1234567890abcdef...
ADLV Contract: 0xabcdef1234567890...
```

### RPC_URL
**نفس RPC المستخدم في النشر:**
- إذا نشرت على Story Protocol → استخدم STORY_PROTOCOL_RPC
- إذا نشرت على Base → استخدم Base RPC

### CHAIN_ID
**Chain IDs الشائعة:**
- **Story Protocol Testnet:** تحقق من docs
- **Base Sepolia:** 84532
- **Base Mainnet:** 8453
- **Ethereum Sepolia:** 11155111

### PRIVATE_KEY
**نفس PRIVATE_KEY المستخدم في النشر**

### OWLTO_API_KEY
**من أين:**
1. اذهب إلى https://owlto.finance
2. سجل حساب
3. اذهب إلى API Keys
4. أنشئ API key جديد
5. انسخ المفتاح

### ABV_API_KEY
**من أين:**
1. اذهب إلى https://abv.dev
2. سجل حساب
3. اذهب إلى Developer Settings
4. أنشئ API key
5. انسخ المفتاح

### STORY_PROTOCOL_API_KEY
**من أين:**
1. اذهب إلى Story Protocol dashboard
2. سجل حساب
3. اذهب إلى API Keys
4. أنشئ API key

### WORLD_ID_APP_ID
**من أين:**
1. اذهب إلى https://developer.worldcoin.org
2. سجل حساب
3. أنشئ تطبيق جديد
4. انسخ App ID

### ETHERSCAN_API_KEY (للتحقق)
**من أين:**
1. اذهب إلى https://basescan.org (لـ Base)
2. سجل حساب
3. اذهب إلى API Keys
4. أنشئ API key جديد

---

## 🚀 خطوات سريعة

### 1. للحصول على PRIVATE_KEY:
```bash
# من MetaMask:
# Settings → Security & Privacy → Show Private Key
# ⚠️ استخدم testnet wallet فقط!
```

### 2. للحصول على RPC URLs:
- **Story Protocol:** من docs.story.foundation
- **Base:** https://docs.base.org/docs/tools/network-faucets

### 3. للحصول على API Keys:
- كل خدمة لها dashboard خاص
- سجل حساب → API Keys → أنشئ مفتاح

---

## ⚠️ تحذيرات أمنية

1. **لا ترفع .env على GitHub أبداً**
2. **استخدم testnet wallet للنشر**
3. **لا تشارك private keys مع أحد**
4. **احفظ backup آمن للـ private key**

