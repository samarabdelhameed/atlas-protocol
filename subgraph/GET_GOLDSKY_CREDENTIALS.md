# كيفية الحصول على GOLDSKY_API_KEY و GOLDSKY_PROJECT_ID

## خطوات الحصول على Credentials من Goldsky

### الخطوة 1: إنشاء حساب Goldsky

1. **اذهب إلى موقع Goldsky:**
   - الموقع: https://goldsky.com
   - أو مباشرة: https://app.goldsky.com/signup

2. **سجل حساب جديد:**
   - استخدم GitHub, Google, أو Email للـ Sign Up
   - Goldsky يوفر Free tier للبداية

### الخطوة 2: إنشاء Project جديد

1. **بعد تسجيل الدخول، اذهب إلى Dashboard**
2. **أنشئ Project جديد:**
   - اضغط على "New Project" أو "Create Project"
   - أدخل اسم المشروع: `atlas-protocol` (أو أي اسم تفضله)
   - اختر Network: Story Protocol Testnet (أو Network المناسب)

### الخطوة 3: الحصول على PROJECT_ID

1. **بعد إنشاء المشروع:**
   - ستجد `PROJECT_ID` في صفحة إعدادات المشروع
   - أو في URL: `https://app.goldsky.com/projects/{PROJECT_ID}`
   - أو في Dashboard → Project Settings → Project Details
   
2. **انسخ PROJECT_ID:**
   ```
   مثال: proj_xxxxxxxxxxxxxxxxxxxx
   ```

### الخطوة 4: إنشاء API Key

1. **اذهب إلى Project Settings:**
   - في Dashboard → اختر المشروع
   - Settings → API Keys (أو Credentials)

2. **أنشئ API Key جديد:**
   - اضغط "Create API Key" أو "Generate New Key"
   - أدخل اسم للـ Key (مثل: `atlas-subgraph-deployment`)
   - اختر Permissions: `Deploy Subgraph` أو `Full Access`

3. **انسخ API Key فوراً:**
   - ⚠️ **مهم جداً**: API Key يظهر مرة واحدة فقط!
   - انسخه واحفظه في مكان آمن
   - لا تشاركه علناً أو ترفعه على GitHub

### الخطوة 5: إضافة Credentials للمشروع

1. **أنشئ ملف `.env` في مجلد `subgraph/`:**

```bash
cd subgraph
touch .env
```

2. **أضف الـ credentials:**

```env
GOLDSKY_API_KEY=gsky_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOLDSKY_PROJECT_ID=proj_xxxxxxxxxxxxxxxxxxxx
```

3. **تأكد أن `.env` في `.gitignore`:**
   - `.env` يجب أن يكون في `.gitignore` لحماية المفاتيح
   - لا ترفع `.env` على GitHub!

### الخطوة 6: التحقق من الـ Credentials

1. **ثبت Goldsky CLI:**
   ```bash
   npm install -g @goldskycom/cli
   ```

2. **سجل الدخول:**
   ```bash
   goldsky login
   ```
   
   أو استخدم الـ API Key مباشرة:
   ```bash
   export GOLDSKY_TOKEN=your_api_key_here
   ```

3. **اختبر الاتصال:**
   ```bash
   goldsky subgraph list
   ```

إذا عمل الأمر بنجاح، يعني الـ credentials صحيحة! ✅

---

## 📝 ملخص سريع

```bash
# 1. أنشئ حساب على https://goldsky.com
# 2. أنشئ Project جديد
# 3. انسخ PROJECT_ID من Project Settings
# 4. أنشئ API Key من Project Settings → API Keys
# 5. أضف الـ credentials في subgraph/.env:

GOLDSKY_API_KEY=your_api_key_here
GOLDSKY_PROJECT_ID=your_project_id_here

# 6. اختبر:
goldsky login
goldsky subgraph list
```

---

## 🔒 أمان

- ⚠️ **لا ترفع `.env` على GitHub**
- ⚠️ **لا تشارك API Keys علناً**
- ⚠️ **استخدم Environment Variables في Production**
- ✅ **احفظ المفاتيح في مكان آمن**

---

## 📚 مصادر مفيدة

- [Goldsky Documentation](https://docs.goldsky.com/)
- [Goldsky Dashboard](https://app.goldsky.com/)
- [Goldsky CLI Docs](https://docs.goldsky.com/reference/cli)

---

## ⚡ بعد الحصول على Credentials

بعد إضافة الـ credentials في `subgraph/.env`:

1. **Build Subgraph:**
   ```bash
   cd subgraph
   npm run codegen
   npm run build
   ```

2. **Deploy:**
   ```bash
   ./deploy-goldsky.sh
   ```

3. **احصل على GraphQL Endpoint من Dashboard**

4. **حدث Environment Variables في:**
   - `apps/agent-service/.env`
   - `apps/frontend/.env`

---

**ملاحظة:** إذا واجهت أي مشاكل في إنشاء الحساب أو الحصول على المفاتيح، راجع [Goldsky Support](https://docs.goldsky.com/support) أو تواصل مع Goldsky مباشرة.

