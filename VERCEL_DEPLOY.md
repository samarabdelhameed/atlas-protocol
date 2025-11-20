# Vercel Deployment Guide

## ✅ Configuration Complete

The project is ready for Vercel deployment. Configuration files have been added:
- `apps/frontend/vercel.json` - Vercel configuration for frontend

## 🚀 Deploy Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository: `samarabdelhameed/atlas-protocol`
4. Configure the project:
   - **Root Directory**: `apps/frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. Add Environment Variables (in Vercel Dashboard):
   - `VITE_VERIFICATION_ENDPOINT` - Your backend URL (e.g., `https://your-backend.vercel.app/verify-vault`)
   - `VITE_WORLD_ID_APP_ID` - Your World ID App ID
   - `VITE_WORLD_ID_ACTION` - World ID Action (e.g., `atlasverification`)
   - `VITE_WALLETCONNECT_PROJECT_ID` - WalletConnect Project ID

6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
cd apps/frontend
npx vercel --prod
```

## ⚠️ Important Notes

- **Environment Variables**: Make sure to add all required env vars in Vercel Dashboard
- **Backend URL**: Update `VITE_VERIFICATION_ENDPOINT` to point to your deployed backend
- **.env files**: Never commit .env files - they are protected in .gitignore

## 🔗 After Deployment

Once deployed, Vercel will provide you with:
- Production URL: `https://your-project.vercel.app`
- Preview URLs for each commit

## ✅ Verification

After deployment, verify:
1. Frontend loads correctly
2. Wallet connection works
3. Vault creation flow works
4. Backend integration works (if backend is also deployed)

