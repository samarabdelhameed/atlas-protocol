# 🚀 Vercel Deployment Instructions

## ✅ المشروع جاهز للـ Deploy!

### الخطوات:

1. **اذهب إلى Vercel Dashboard:**
   - افتح: https://vercel.com/dashboard
   - سجل الدخول بحساب GitHub

2. **إنشاء مشروع جديد:**
   - اضغط "Add New Project"
   - اختر Repository: `samarabdelhameed/atlas-protocol`

3. **إعداد المشروع:**
   - **Root Directory**: `apps/frontend`
   - **Framework Preset**: Vite (سيتم اكتشافه تلقائياً)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **إضافة Environment Variables:**
   اضغط "Environment Variables" وأضف:
   ```
   VITE_VERIFICATION_ENDPOINT=https://your-backend-url/verify-vault
   VITE_WORLD_ID_APP_ID=app_staging_72f7715e459d7b53ec15c8bf7398fd0f
   VITE_WORLD_ID_ACTION=atlasverification
   VITE_WALLETCONNECT_PROJECT_ID=321057023fa9e8ca9d5e1b71d0492af5
   ```

5. **Deploy:**
   - اضغط "Deploy"
   - انتظر حتى يكتمل البناء
   - ستحصل على رابط Vercel

## 🔗 بعد الـ Deploy:

ستحصل على رابط مثل:
- `https://atlas-protocol.vercel.app`
- أو `https://atlas-protocol-[hash].vercel.app`

## ✅ التحقق:

بعد الـ Deploy، تأكد من:
1. ✅ الموقع يفتح بشكل صحيح
2. ✅ Wallet connection يعمل
3. ✅ Vault creation flow يعمل
4. ✅ Backend integration يعمل

## 📝 ملاحظات:

- ملفات `.env` محمية في `.gitignore` ✅
- لا ترفع أي ملفات `.env` ✅
- Environment Variables يجب إضافتها في Vercel Dashboard ✅

