# Story Protocol SDK Examples

مجموعة من الأمثلة العملية لاستخدام Story Protocol SDK.

## الملفات

### 1. `storyProtocolExample.ts`
أمثلة أساسية لجميع وظائف SDK:
- تسجيل IP Asset
- إضافة شروط الترخيص
- إنشاء رموز الترخيص
- الحصول على تفاصيل IP
- تسجيل الأعمال المشتقة

### 2. `integrateWithADLV.ts`
أمثلة متقدمة للدمج مع عقد ADLVWithStory:
- سير عمل كامل من إنشاء vault إلى تسجيل IP
- تسجيل دفعات من IPs
- إضافة IP liquidity إلى vaults
- إنشاء أعمال مشتقة

## كيفية الاستخدام

### 1. إعداد البيئة

أضف المتغيرات التالية إلى `.env`:

```bash
WALLET_PRIVATE_KEY=0x...
STORY_RPC_URL=https://rpc.odyssey.storyrpc.io
```

### 2. تشغيل الأمثلة

```bash
# مثال أساسي
bun run examples/storyProtocolExample.ts

# مثال التكامل مع ADLV
bun run examples/integrateWithADLV.ts
```

### 3. تخصيص الأمثلة

قم بتحديث عناوين العقود في الملفات:

```typescript
const ADLV_CONTRACT = '0xYourADLVAddress';
const MOCK_NFT = '0xYourNFTAddress';
```

## سير العمل الموصى به

### للـ Vaults الجديدة:

1. إنشاء vault في ADLVWithStory
2. تسجيل الـ vault كـ IP Asset
3. إضافة شروط الترخيص
4. إضافة IP liquidity

### للـ IPs الموجودة:

1. تسجيل NFT كـ IP Asset
2. إضافة شروط الترخيص
3. إضافة إلى vault موجود

### للأعمال المشتقة:

1. الحصول على ترخيص من IP الأصلي
2. إنشاء NFT جديد
3. تسجيله كعمل مشتق
4. إضافته إلى vault

## License Terms IDs

| ID | الاسم | الوصف |
|----|-------|-------|
| 1 | PIL Non-Commercial Social Remixing | مجاني، غير تجاري |
| 2 | PIL Commercial Use | استخدام تجاري |
| 3 | PIL Commercial Remix | ريمكس تجاري |

## الموارد

- [Story Protocol Docs](https://docs.story.foundation/)
- [SDK Documentation](https://docs.story.foundation/docs/sdk-documentation)
- [Contract Addresses](../../contracts/FRONTEND_CONTRACTS_INFO.md)
