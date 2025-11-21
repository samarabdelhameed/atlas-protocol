# How to Get GOLDSKY_API_KEY and GOLDSKY_PROJECT_ID

## Steps to Get Credentials from Goldsky

### Step 1: Create Goldsky Account

1. **Go to Goldsky website:**
   - Website: https://goldsky.com
   - Or directly: https://app.goldsky.com/signup

2. **Sign up for a new account:**
   - Use GitHub, Google, or Email to Sign Up
   - Goldsky provides a Free tier to start

### Step 2: Create New Project

1. **After logging in, go to Dashboard**
2. **Create a new Project:**
   - Click "New Project" or "Create Project"
   - Enter project name: `atlas-protocol` (or any name you prefer)
   - Select Network: Story Protocol Testnet (or appropriate Network)

### Step 3: Get PROJECT_ID

1. **After creating the project:**
   - You'll find `PROJECT_ID` in the project settings page
   - Or in the URL: `https://app.goldsky.com/projects/{PROJECT_ID}`
   - Or in Dashboard → Project Settings → Project Details
   
2. **Copy PROJECT_ID:**
   ```
   Example: proj_xxxxxxxxxxxxxxxxxxxx
   ```

### Step 4: Create API Key

1. **Go to Project Settings:**
   - In Dashboard → Select the project
   - Settings → API Keys (or Credentials)

2. **Create a new API Key:**
   - Click "Create API Key" or "Generate New Key"
   - Enter a name for the Key (e.g., `atlas-subgraph-deployment`)
   - Select Permissions: `Deploy Subgraph` or `Full Access`

3. **Copy API Key immediately:**
   - ⚠️ **Very important**: API Key is shown only once!
   - Copy it and save it in a safe place
   - Don't share it publicly or upload it to GitHub

### Step 5: Add Credentials to Project

1. **Create `.env` file in `subgraph/` folder:**

```bash
cd subgraph
touch .env
```

2. **Add the credentials:**

```env
GOLDSKY_API_KEY=gsky_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOLDSKY_PROJECT_ID=proj_xxxxxxxxxxxxxxxxxxxx
```

3. **Make sure `.env` is in `.gitignore`:**
   - `.env` should be in `.gitignore` to protect keys
   - Don't upload `.env` to GitHub!

### Step 6: Verify Credentials

1. **Install Goldsky CLI:**
   ```bash
   npm install -g @goldskycom/cli
   ```

2. **Login:**
   ```bash
   goldsky login
   ```
   
   Or use API Key directly:
   ```bash
   export GOLDSKY_TOKEN=your_api_key_here
   ```

3. **Test connection:**
   ```bash
   goldsky subgraph list
   ```

If the command succeeds, the credentials are correct! ✅

---

## 📝 Quick Summary

```bash
# 1. Create account on https://goldsky.com
# 2. Create a new Project
# 3. Copy PROJECT_ID from Project Settings
# 4. Create API Key from Project Settings → API Keys
# 5. Add credentials in subgraph/.env:

GOLDSKY_API_KEY=your_api_key_here
GOLDSKY_PROJECT_ID=your_project_id_here

# 6. Test:
goldsky login
goldsky subgraph list
```

---

## 🔒 Security

- ⚠️ **Don't upload `.env` to GitHub**
- ⚠️ **Don't share API Keys publicly**
- ⚠️ **Use Environment Variables in Production**
- ✅ **Save keys in a safe place**

---

## 📚 Useful Resources

- [Goldsky Documentation](https://docs.goldsky.com/)
- [Goldsky Dashboard](https://app.goldsky.com/)
- [Goldsky CLI Docs](https://docs.goldsky.com/reference/cli)

---

## ⚡ After Getting Credentials

After adding credentials in `subgraph/.env`:

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

3. **Get GraphQL Endpoint from Dashboard**

4. **Update Environment Variables in:**
   - `apps/agent-service/.env`
   - `apps/frontend/.env`

---

**Note:** If you encounter any issues creating an account or getting keys, check [Goldsky Support](https://docs.goldsky.com/support) or contact Goldsky directly.
