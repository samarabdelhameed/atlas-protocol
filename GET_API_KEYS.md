# كيفية الحصول على API Keys

## 🔑 OWLTO_API_KEY (السطر 14)

### الخطوات:
1. اذهب إلى: **https://owlto.finance**
2. اضغط على **"Developer"** أو **"API"** في القائمة
3. سجل حساب جديد (أو سجل دخول)
4. اذهب إلى **"API Keys"** أو **"Developer Dashboard"**
5. اضغط **"Create New API Key"**
6. انسخ المفتاح

**أو:**
- ابحث في Owlto Finance documentation
- اتصل بدعم Owlto Finance للحصول على API key

**مثال:**
```
OWLTO_API_KEY=owlto_abc123def456...
```

---

## 🌉 OWLTO_BRIDGE_URL (السطر 15)

**هذا ثابت - لا يحتاج تغيير:**
```
OWLTO_BRIDGE_URL=https://api.owlto.finance/api/v2/bridge
```

**أو تحقق من Owlto Finance docs للـ URL الصحيح**

---

## 📝 ملاحظات مهمة:

### إذا لم تجد API Key:
- **OWLTO_API_KEY:** يمكنك تركه فارغاً مؤقتاً، لكن cross-chain transfers لن تعمل
- **OWLTO_BRIDGE_URL:** يمكنك تركه كما هو (القيمة الافتراضية صحيحة)

### للاختبار بدون API Keys:
- يمكنك تشغيل Agent Service بدون Owlto API key
- سيعمل كل شيء عدا cross-chain transfers
- ستحصل على warning في logs

---

## 🔗 روابط مفيدة:

- **Owlto Finance:** https://owlto.finance
- **Owlto Docs:** ابحث عن "Owlto Finance API documentation"
- **Support:** اتصل بدعم Owlto Finance

