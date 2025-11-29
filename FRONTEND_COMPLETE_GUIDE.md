# 🎯 ATLAS PROTOCOL - COMPLETE FRONTEND IMPLEMENTATION GUIDE
**Everything You Need in One File**

**Date**: November 29, 2024  
**Network**: Story Aeneid Testnet (Chain ID: 1315)  
**Estimated Time**: 2-3 days

---

## 📋 TABLE OF CONTENTS

1. [Quick Start (5 Minutes)](#quick-start)
2. [Contract Addresses & Setup](#contract-addresses)
3. [Step 1: Add Wallet Connection](#step-1-wallet-connection)
4. [Step 2: Dashboard - User Vaults](#step-2-dashboard)
5. [Step 3: Vault Creation](#step-3-vault-creation)
6. [Step 4: Loans Page](#step-4-loans)
7. [Step 5: Licensing Page](#step-5-licensing)
8. [Contract Functions Reference](#contract-functions)
9. [Testing Checklist](#testing)

---

## 🚀 QUICK START

### Copy ABIs (Required First!)

```bash
cd apps/frontend
mkdir -p src/contracts/abis

# Copy all ABIs
cp ../agent-service/contracts/ADLV.json src/contracts/abis/
cp ../agent-service/contracts/IDO.json src/contracts/abis/
cp ../agent-service/contracts/LendingModule.json src/contracts/abis/
cp ../agent-service/contracts/LoanNFT.json src/contracts/abis/
```

### Create Addresses File

```bash
cat > src/contracts/addresses.ts << 'EOF'
export const CONTRACTS = {
  ADLV: '0x793402b59d2ca4c501EDBa328347bbaF69a59f7b' as const,
  IDO: '0xeF83DB9b011261Ad3a76ccE8B7E54B2c055300D8' as const,
  LendingModule: '0xbefb2fF399Bd0faCDBd100A16A569c625e1E4bf3' as const,
  LoanNFT: '0x9386262027dc860337eC4F93A8503aD4ee852c41' as const,
  StoryProtocolCore: '0x825B9Ad5F77B64aa1d56B52ef01291E6D4aA60a5' as const,
  IPAssetRegistry: '0x292639452A975630802C17c9267169D93BD5a793' as const,
};
EOF
```

### Update .env

```bash
cat > .env << 'EOF'
VITE_CHAIN_ID=1315
VITE_RPC_URL=https://rpc-storyevm-testnet.aldebaranode.xyz
VITE_ADLV_ADDRESS=0x793402b59d2ca4c501EDBa328347bbaF69a59f7b
VITE_IDO_ADDRESS=0xeF83DB9b011261Ad3a76ccE8B7E54B2c055300D8
VITE_LENDING_MODULE_ADDRESS=0xbefb2fF399Bd0faCDBd100A16A569c625e1E4bf3
VITE_LOAN_NFT_ADDRESS=0x9386262027dc860337eC4F93A8503aD4ee852c41
VITE_BACKEND_URL=http://localhost:3001
VITE_WORLD_ID_APP_ID=app_staging_72f7715e459d7b53ec15c8bf7398fd0f
EOF
```

---

## 📍 CONTRACT ADDRESSES

**All contracts on Story Aeneid Testnet (Chain ID: 1315)**

| Contract | Address | Explorer |
|----------|---------|----------|
| ADLV | `0x793402b59d2ca4c501EDBa328347bbaF69a59f7b` | [View](https://aeneid.storyscan.io/address/0x793402b59d2ca4c501EDBa328347bbaF69a59f7b) |
| IDO | `0xeF83DB9b011261Ad3a76ccE8B7E54B2c055300D8` | [View](https://aeneid.storyscan.io/address/0xeF83DB9b011261Ad3a76ccE8B7E54B2c055300D8) |
| LendingModule | `0xbefb2fF399Bd0faCDBd100A16A569c625e1E4bf3` | [View](https://aeneid.storyscan.io/address/0xbefb2fF399Bd0faCDBd100A16A569c625e1E4bf3) |
| LoanNFT | `0x9386262027dc860337eC4F93A8503aD4ee852c41` | [View](https://aeneid.storyscan.io/address/0x9386262027dc860337eC4F93A8503aD4ee852c41) |
| StoryProtocolCore | `0x825B9Ad5F77B64aa1d56B52ef01291E6D4aA60a5` | [View](https://aeneid.storyscan.io/address/0x825B9Ad5F77B64aa1d56B52ef01291E6D4aA60a5) |

**Network**: https://rpc-storyevm-testnet.aldebaranode.xyz  
**Explorer**: https://aeneid.storyscan.io

---

## 🔌 STEP 1: WALLET CONNECTION

### File: `apps/frontend/src/components/Navigation.tsx`

**Add this to Navigation component:**

```typescript
import { ConnectKitButton } from 'connectkit';
import { useAccount, useNetwork, useSwitchNetwork } from 'wagmi';

export default function Navigation({ currentPage, onNavigate }) {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Nav Items */}
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-white">Atlas Protocol</h1>
            <div className="hidden md:flex items-center gap-6">
              {['landing', 'dashboard', 'vault', 'loans', 'licensing'].map((page) => (
                <button
                  key={page}
                  onClick={() => onNavigate(page)}
                  className={`text-sm font-medium ${
                    currentPage === page ? 'text-orange-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {page.charAt(0).toUpperCase() + page.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center gap-4">
            {/* Wrong Network Warning */}
            {isConnected && chain?.id !== 1315 && (
              <button
                onClick={() => switchNetwork?.(1315)}
                className="px-4 py-2 bg-red-500/20 border border-red-500 text-red-400 rounded-xl text-sm font-medium"
              >
                ⚠️ Switch to Story Testnet
              </button>
            )}
            
            {/* Connect Button */}
            <ConnectKitButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
```

---

## 📊 STEP 2: DASHBOARD

### File: `apps/frontend/src/pages/Dashboard.tsx`

**Replace entire Dashboard component with this:**

```typescript
import { useAccount, useContractRead } from 'wagmi';
import { useQueries } from '@tanstack/react-query';
import { createPublicClient, http, formatUnits } from 'viem';
import { motion } from 'framer-motion';
import { CONTRACTS } from '../contracts/addresses';
import ADLV_ABI from '../contracts/abis/ADLV.json';
import IDO_ABI from '../contracts/abis/IDO.json';

export default function Dashboard({ onNavigate }) {
  const { address } = useAccount();

  // Fetch user's vaults
  const { data: userVaults, isLoading } = useContractRead({
    address: CONTRACTS.ADLV,
    abi: ADLV_ABI.abi,
    functionName: 'getUserVaults',
    args: [address],
    enabled: !!address,
    watch: true,
  });

  // Fetch details for each vault
  const vaultQueries = useQueries({
    queries: (userVaults || []).map((vaultAddr) => ({
      queryKey: ['vault', vaultAddr],
      queryFn: async () => {
        const client = createPublicClient({
          chain: { id: 1315, rpcUrls: { default: { http: ['https://rpc-storyevm-testnet.aldebaranode.xyz'] } } },
          transport: http(),
        });

        const vault = await client.readContract({
          address: CONTRACTS.ADLV,
          abi: ADLV_ABI.abi,
          functionName: 'getVault',
          args: [vaultAddr],
        });

        const cvs = await client.readContract({
          address: CONTRACTS.IDO,
          abi: IDO_ABI.abi,
          functionName: 'getCVS',
          args: [vault.ipId],
        });

        const maxLoan = await client.readContract({
          address: CONTRACTS.ADLV,
          abi: ADLV_ABI.abi,
          functionName: 'calculateMaxLoanAmount',
          args: [vaultAddr],
        });

        return { address: vaultAddr, ...vault, cvs, maxLoan };
      },
    })),
  });

  const totalCVS = vaultQueries.reduce((sum, q) => 
    sum + Number(formatUnits(q.data?.cvs || 0n, 18)), 0
  );

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">My Dashboard</h1>
          <button
            onClick={() => onNavigate('vault')}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600"
          >
            + Create Vault
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <div className="text-3xl mb-2">🏦</div>
            <div className="text-3xl font-bold text-white">{userVaults?.length || 0}</div>
            <div className="text-sm text-gray-400">My Vaults</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-3xl font-bold text-white">{totalCVS.toFixed(0)}</div>
            <div className="text-sm text-gray-400">Total CVS</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-3xl font-bold text-white">
              ${vaultQueries.reduce((sum, q) => sum + Number(formatUnits(q.data?.maxLoan || 0n, 18)), 0).toFixed(0)}
            </div>
            <div className="text-sm text-gray-400">Max Borrowable</div>
          </div>
        </div>

        {/* Vaults */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">My Vaults</h2>
          {isLoading ? (
            <div className="text-gray-400">Loading...</div>
          ) : userVaults && userVaults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vaultQueries.map((query, i) => {
                if (!query.data) return null;
                const v = query.data;
                return (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-bold">
                        {v.address.slice(0, 6)}...{v.address.slice(-4)}
                      </h3>
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                        Active
                      </span>
                    </div>
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">CVS</span>
                        <span className="text-white font-bold">{Number(formatUnits(v.cvs, 18)).toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Max Loan</span>
                        <span className="text-amber-400 font-bold">${Number(formatUnits(v.maxLoan, 18)).toFixed(2)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('loans')}
                      className="w-full py-2 bg-orange-500 text-white rounded-xl text-sm font-medium"
                    >
                      Request Loan
                    </button>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-800/30 border border-gray-700 rounded-2xl">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-bold text-white mb-2">No Vaults Yet</h3>
              <p className="text-gray-400 mb-6">Create your first vault to start earning</p>
              <button
                onClick={() => onNavigate('vault')}
                className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium"
              >
                Create Vault
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
```

---

## 🏗️ STEP 3: VAULT CREATION

### File: `apps/frontend/src/pages/VaultCreation.tsx`

**Fix Step 4 (Deploy Vault) - Replace handleDeployVault function:**

```typescript
import { useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseUnits } from 'viem';
import ADLV_ABI from '../contracts/abis/ADLV.json';
import { CONTRACTS } from '../contracts/addresses';

// In VaultCreation component, replace handleDeployVault:
const { write: createVault, data: txData } = useContractWrite({
  address: CONTRACTS.ADLV,
  abi: ADLV_ABI.abi,
  functionName: 'createVault',
  args: [
    ipAssetId,
    creatorAddress,
    parseUnits('1000', 18), // Initial CVS
  ],
});

const { isLoading: isWaiting } = useWaitForTransaction({
  hash: txData?.hash,
  onSuccess: (receipt) => {
    // Extract vault address from logs
    const vaultLog = receipt.logs.find(log => 
      log.topics[0] === '0x...' // VaultCreated event signature
    );
    if (vaultLog) {
      const vaultAddr = `0x${vaultLog.topics[1].slice(26)}`;
      setVaultAddress(vaultAddr);
    }
    setTransactionHash(receipt.transactionHash);
    setIsDeploying(false);
    setStep(5);
  },
  onError: (error) => {
    setVaultCreationError(error.message);
    setIsDeploying(false);
  },
});

const handleDeployVault = () => {
  setIsDeploying(true);
  createVault?.();
};

// In JSX (Step 4):
<button
  onClick={handleDeployVault}
  disabled={isDeploying || isWaiting}
  className="w-full py-4 bg-green-500 text-white rounded-xl font-bold"
>
  {isDeploying || isWaiting ? 'Deploying...' : 'Deploy Vault'}
</button>
```

---

## 💰 STEP 4: LOANS

### File: `apps/frontend/src/pages/Loans.tsx`

**Add vault selector and loan issuance:**

```typescript
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACTS } from '../contracts/addresses';
import ADLV_ABI from '../contracts/abis/ADLV.json';
import LendingModule_ABI from '../contracts/abis/LendingModule.json';

export default function Loans({ onNavigate }) {
  const { address } = useAccount();
  const [vaultAddress, setVaultAddress] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [duration, setDuration] = useState('30');

  // Get user's vaults
  const { data: userVaults } = useContractRead({
    address: CONTRACTS.ADLV,
    abi: ADLV_ABI.abi,
    functionName: 'getUserVaults',
    args: [address],
    enabled: !!address,
  });

  // Get max loan for selected vault
  const { data: maxLoan } = useContractRead({
    address: CONTRACTS.ADLV,
    abi: ADLV_ABI.abi,
    functionName: 'calculateMaxLoanAmount',
    args: [vaultAddress],
    enabled: !!vaultAddress,
  });

  // Calculate collateral (150%)
  const collateral = loanAmount ? parseUnits((Number(loanAmount) * 1.5).toString(), 18) : 0n;

  // Issue loan
  const { write: issueLoan, data: txData } = useContractWrite({
    address: CONTRACTS.LendingModule,
    abi: LendingModule_ABI.abi,
    functionName: 'issueLoan',
    args: [
      vaultAddress,
      parseUnits(loanAmount || '0', 18),
      BigInt(parseInt(duration) * 24 * 60 * 60),
    ],
    value: collateral,
  });

  const { isLoading: isWaiting } = useWaitForTransaction({
    hash: txData?.hash,
    onSuccess: () => {
      alert('Loan issued successfully!');
      setLoanAmount('');
    },
  });

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Request Loan</h1>

        {/* Vault Selector */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-medium mb-2">Select Vault</label>
          <select
            value={vaultAddress}
            onChange={(e) => setVaultAddress(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white"
          >
            <option value="">Choose a vault...</option>
            {userVaults?.map((vault) => (
              <option key={vault} value={vault}>
                {vault.slice(0, 6)}...{vault.slice(-4)}
              </option>
            ))}
          </select>
        </div>

        {/* Loan Amount */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-medium mb-2">Loan Amount</label>
          <input
            type="number"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            max={maxLoan ? formatUnits(maxLoan, 18) : undefined}
            placeholder="0.00"
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white"
          />
          {maxLoan && (
            <p className="text-gray-400 text-sm mt-2">
              Max: ${formatUnits(maxLoan, 18)}
            </p>
          )}
        </div>

        {/* Duration */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-medium mb-2">Duration</label>
          <div className="grid grid-cols-4 gap-3">
            {['7', '30', '60', '90'].map((days) => (
              <button
                key={days}
                onClick={() => setDuration(days)}
                className={`py-3 rounded-xl font-medium ${
                  duration === days ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                {days} days
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={() => issueLoan?.()}
          disabled={!vaultAddress || !loanAmount || isWaiting}
          className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold disabled:opacity-50"
        >
          {isWaiting ? 'Processing...' : 'Request Loan'}
        </button>
      </div>
    </div>
  );
}
```

---

## 📜 STEP 5: LICENSING

### File: `apps/frontend/src/pages/Licensing.tsx`

**Add contract interaction to purchase:**

```typescript
import { useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACTS } from '../contracts/addresses';
import ADLV_ABI from '../contracts/abis/ADLV.json';

// In Licensing component, update handlePurchase:
const handlePurchase = async (tier) => {
  try {
    // Show buyer modal
    setPendingTier(tier);
    setShowBuyerModal(true);
  } catch (error) {
    console.error(error);
  }
};

// Add contract write
const { write: purchaseLicense, data: txData } = useContractWrite({
  address: CONTRACTS.ADLV,
  abi: ADLV_ABI.abi,
  functionName: 'sellLicense',
  args: [
    vaultAddress, // You need to add vault selector
    pendingTier?.licenseType || 'basic',
    BigInt(30 * 24 * 60 * 60), // 30 days
  ],
  value: parseUnits(pendingTier?.price.replace('$', '') || '0', 18),
});

const { isLoading: isWaiting } = useWaitForTransaction({
  hash: txData?.hash,
  onSuccess: () => {
    setPurchaseDetails({
      tier: pendingTier.name,
      price: pendingTier.price,
      txHash: txData.hash,
    });
    setShowBuyerModal(false);
  },
});

// In buyer modal submit:
const submitMetadata = async () => {
  setIsSubmitting(true);
  
  // Call contract
  purchaseLicense?.();
  
  // Send metadata to backend
  await fetch('http://localhost:3001/licenses/metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...buyerInfo,
      tierId: pendingTier.id,
      amount: pendingTier.price,
    }),
  }).catch(() => {});
  
  setIsSubmitting(false);
};
```

---

## 📚 CONTRACT FUNCTIONS

### ADLV Contract (`0x793402b59d2ca4c501EDBa328347bbaF69a59f7b`)

**Read Functions:**
```typescript
// Get user's vaults
getUserVaults(address) → address[]

// Get vault details
getVault(address) → { ipId, creator, totalLiquidity, ... }

// Check if vault exists for IP
ipToVault(bytes32 ipId) → address

// Calculate max loan
calculateMaxLoanAmount(address vault) → uint256

// Get vault count
vaultCounter() → uint256
```

**Write Functions:**
```typescript
// Create vault
createVault(bytes32 ipId, address creator, uint256 initialCVS)

// Sell license
sellLicense(address vault, string licenseType, uint256 duration) payable

// Deposit
deposit(address vault) payable
```

### IDO Contract (`0xeF83DB9b011261Ad3a76ccE8B7E54B2c055300D8`)

```typescript
// Get CVS score
getCVS(bytes32 ipId) → uint256

// Update CVS
updateCVS(bytes32 ipId, uint256 newCVS)
```

### LendingModule (`0xbefb2fF399Bd0faCDBd100A16A569c625e1E4bf3`)

```typescript
// Get user's loans
getUserLoans(address) → uint256[]

// Get loan details
getLoan(uint256 loanId) → { borrower, amount, ... }

// Issue loan
issueLoan(address vault, uint256 amount, uint256 duration) payable

// Repay loan
repayLoan(uint256 loanId) payable
```

---

## ✅ TESTING CHECKLIST

### Phase 1: Critical
- [ ] Wallet connects
- [ ] Network switches to 1315
- [ ] ABIs copied to frontend
- [ ] Addresses file created

### Phase 2: Dashboard
- [ ] User vaults display
- [ ] CVS scores show
- [ ] Create vault button works
- [ ] Empty state shows

### Phase 3: Vault Creation
- [ ] IP validation works
- [ ] Vault deploys
- [ ] Transaction confirms
- [ ] Success screen shows

### Phase 4: Loans
- [ ] Vault selector works
- [ ] Loan issues
- [ ] Transaction confirms

### Phase 5: Licensing
- [ ] Purchase flow works
- [ ] Transaction confirms

---

## 🐛 TROUBLESHOOTING

**Issue: ABIs not found**
```bash
cp apps/agent-service/contracts/*.json apps/frontend/src/contracts/abis/
```

**Issue: Wrong network**
- Add network switcher (see Step 1)

**Issue: Transaction fails**
- Check wallet has ETH
- Check on correct network (1315)
- Check contract address is correct

---

## 🎯 PRIORITY ORDER

1. 🔴 **Day 1**: Wallet connection + Copy ABIs
2. 🟡 **Day 2**: Dashboard + Vault Creation
3. 🟢 **Day 3**: Loans + Licensing

---

---

## 🔧 BACKEND ENDPOINTS

### Backend is Running on Port 3001

**Base URL**: `http://localhost:3001`

### Available Endpoints:

#### 1. Health Check
```bash
GET /health
Response: { "status": "ok", "service": "world-id-verification" }
```

#### 2. Verify Vault (World ID + Create Vault)
```bash
POST /verify-vault

Body:
{
  "proof": { ... },           // World ID proof (optional for testing)
  "signal": "ipAssetId",      // IP Asset ID
  "vaultData": {
    "ipId": "0x...",          // IP Asset ID
    "creator": "0x..."        // Creator address
  }
}

Response:
{
  "success": true,
  "vaultAddress": "0x...",
  "transactionHash": "0x..."
}
```

#### 3. License Metadata
```bash
POST /licenses/metadata

Body:
{
  "personalName": "John Doe",
  "organization": "OpenAI Labs",
  "email": "john@openai.com",
  "tierId": "commercial",
  "tierName": "Commercial",
  "amount": "$1,500"
}

Response:
{
  "success": true,
  "message": "License metadata recorded successfully"
}
```

### Backend Status:
- ✅ Agent Service is running
- ✅ World ID verification endpoint active
- ✅ License metadata endpoint active
- ✅ Contract monitoring active
- ✅ CVS engine running

### To Start Backend (if not running):
```bash
cd apps/agent-service
bun run dev
```

---

## 📝 IMPORTANT NOTES

### For Frontend Developer:

1. **Backend Must Be Running**
   - Agent service runs on port 3001
   - Check with: `curl http://localhost:3001/health`
   - If not running: `cd apps/agent-service && bun run dev`

2. **Contract ABIs Location**
   - Source: `apps/agent-service/contracts/*.json`
   - Destination: `apps/frontend/src/contracts/abis/`
   - Must copy before starting

3. **Network Configuration**
   - Chain ID: 1315 (Story Aeneid Testnet)
   - RPC: https://rpc-storyevm-testnet.aldebaranode.xyz
   - Explorer: https://aeneid.storyscan.io

4. **Testing Flow**
   - Connect wallet → Should switch to network 1315
   - Create vault → Calls backend `/verify-vault`
   - Request loan → Calls LendingModule contract
   - Purchase license → Calls ADLV contract + backend `/licenses/metadata`

5. **Common Issues**
   - Backend not running → Start agent service
   - Wrong network → Add network switcher
   - ABIs not found → Copy from agent-service
   - Transaction fails → Check wallet has ETH

---

## ✅ FINAL CHECKLIST

Before you start coding:
- [ ] Backend is running (port 3001)
- [ ] ABIs copied to frontend
- [ ] addresses.ts file created
- [ ] .env file updated
- [ ] Wallet extension installed

While coding:
- [ ] Wallet connection works
- [ ] Network switcher works
- [ ] User vaults display
- [ ] Vault creation works
- [ ] Loan issuance works
- [ ] License purchase works

Before submitting:
- [ ] All pages load without errors
- [ ] All transactions confirm on-chain
- [ ] Error messages are user-friendly
- [ ] Loading states show properly
- [ ] Real-time data updates

---

**END OF GUIDE**

Everything you need is in this one file. Backend is ready. Good luck! 🚀
