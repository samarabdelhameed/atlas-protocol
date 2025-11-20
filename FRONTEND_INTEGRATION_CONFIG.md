# 🎯 Frontend Integration - Complete Configuration

**For Frontend Developer**  
**Last Updated**: November 20, 2024

---

## 📋 Quick Copy-Paste Configuration

### 1. Environment Variables (.env)

```bash
# Network Configuration
VITE_CHAIN_ID=1315
VITE_CHAIN_NAME="Story Protocol Testnet"
VITE_RPC_URL=https://rpc-storyevm-testnet.aldebaranode.xyz
VITE_EXPLORER_URL=https://www.storyscan.io

# Contract Addresses
VITE_ADLV_ADDRESS=0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205
VITE_IDO_ADDRESS=0x75B0EF811CB728aFdaF395a0b17341fb426c26dD

# Story Protocol Addresses
VITE_STORY_SPG_ADDRESS=0x69415CE984A79a3Cfbe3F51024C63b6C107331e3
VITE_STORY_IP_REGISTRY=0x292639452A975630802C17c9267169D93BD5a793

# Subgraph (After Deployment)
# VITE_SUBGRAPH_URL=https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1

# Optional: World ID
VITE_WORLD_ID_APP_ID=app_staging_72f7715e459d7b53ec15c8bf7398fd0f
VITE_WORLD_ID_ACTION=atlasverification

# Optional: WalletConnect
VITE_WALLETCONNECT_PROJECT_ID=321057023fa9e8ca9d5e1b71d0492af5
```

---

## 🔗 All Contract Addresses

### Main Contracts

```typescript
export const CONTRACTS = {
  // Atlas Protocol Contracts
  ADLV: "0xf2116eE783Be82ba51a6Eda9453dFD6A1723d205",
  IDO: "0x75B0EF811CB728aFdaF395a0b17341fb426c26dD",
  
  // Story Protocol Contracts
  STORY_SPG: "0x69415CE984A79a3Cfbe3F51024C63b6C107331e3",
  STORY_IP_REGISTRY: "0x292639452A975630802C17c9267169D93BD5a793",
  STORY_LICENSING_MODULE: "0x5a7D9Fa17DE09350F481A53B470D798c1c1b7c93",
} as const;
```

### Deployed Vaults (For Testing)

```typescript
export const VAULTS = {
  VAULT_1: {
    address: "0x5E23c8894D44c41294Ec991F01653286fBf971C9",
    storyIPId: "test-ip-001",
    name: "AI Generated Art Collection",
    liquidity: "8.325", // IP tokens
    revenue: "0.325", // IP tokens
  },
} as const;
```

---

## 🌐 Network Configuration

### Story Protocol Testnet

```typescript
export const STORY_TESTNET = {
  id: 1315,
  name: "Story Protocol Testnet",
  network: "story-testnet",
  nativeCurrency: {
    name: "IP",
    symbol: "IP",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-storyevm-testnet.aldebaranode.xyz"],
    },
    public: {
      http: ["https://rpc-storyevm-testnet.aldebaranode.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Story Scan",
      url: "https://www.storyscan.io",
    },
  },
  testnet: true,
} as const;
```

### Add to Wagmi Config

```typescript
import { createConfig, http } from 'wagmi';
import { connectkit } from 'connectkit';

export const config = createConfig({
  chains: [STORY_TESTNET],
  transports: {
    [STORY_TESTNET.id]: http('https://rpc-storyevm-testnet.aldebaranode.xyz'),
  },
  connectors: connectkit.getDefaultConnectors({
    app: {
      name: 'Atlas Protocol',
    },
    walletConnectProjectId: '321057023fa9e8ca9d5e1b71d0492af5',
  }),
});
```

---

## 📄 Contract ABIs

### Import ABIs

```typescript
// Option 1: From compiled contracts
import ADLV_ABI from '../contracts/out/ADLVWithStory.sol/ADLVWithStory.json';
import IDO_ABI from '../contracts/out/IDO.sol/IDO.json';

// Option 2: Extract ABI only
const ADLV_ABI = ADLV_ABI.abi;
const IDO_ABI = IDO_ABI.abi;
```

### ABI Locations

```
contracts/out/ADLVWithStory.sol/ADLVWithStory.json
contracts/out/IDO.sol/IDO.json
```

---

## 🎨 Contract Functions Reference

### ADLV Contract - Read Functions

```typescript
import { useReadContract } from 'wagmi';

// Get vault count
const { data: vaultCount } = useReadContract({
  address: CONTRACTS.ADLV,
  abi: ADLV_ABI,
  functionName: 'vaultCounter',
});

// Get vault details
const { data: vault } = useReadContract({
  address: CONTRACTS.ADLV,
  abi: ADLV_ABI,
  functionName: 'getVault',
  args: [vaultAddress],
});

// Get user shares
const { data: shares } = useReadContract({
  address: CONTRACTS.ADLV,
  abi: ADLV_ABI,
  functionName: 'getUserShares',
  args: [vaultAddress, userAddress],
});

// Get loan details
const { data: loan } = useReadContract({
  address: CONTRACTS.ADLV,
  abi: ADLV_ABI,
  functionName: 'getLoan',
  args: [loanId],
});

// Get protocol configuration
const { data: protocolFee } = useReadContract({
  address: CONTRACTS.ADLV,
  abi: ADLV_ABI,
  functionName: 'protocolFeeBps',
});

// Get Story Protocol references
const { data: storySPG } = useReadContract({
  address: CONTRACTS.ADLV,
  abi: ADLV_ABI,
  functionName: 'storySPG',
});

const { data: ipRegistry } = useReadContract({
  address: CONTRACTS.ADLV,
  abi: ADLV_ABI,
  functionName: 'storyIPAssetRegistry',
});
```

### ADLV Contract - Write Functions

```typescript
import { useWriteContract } from 'wagmi';

const { writeContract } = useWriteContract();

// Create vault
await writeContract({
  address: CONTRACTS.ADLV,
  abi: ADLV_ABI,
  functionName: 'createVault',
  args: [ipId, storyIPId], // bytes32, string
});

// Deposit liquidity
await writeContract({
  address: CONTRACTS.ADLV,
  abi: ADLV_ABI,
  functionName: 'deposit',
  args: [vaultAddress],
  value: parseEther('1'), // Amount in wei
});

// Withdraw liquidity
await writeContract({
  address: CONTRACTS.ADLV,
  abi: ADLV_ABI,
  functionName: 'withdraw',
  args: [vaultAddress, shares],
});

// Issue loan
await writeContract({
  address: CONTRACTS.ADLV,
  abi: ADLV_ABI,
  functionName: 'issueLoan',
  args: [vaultAddress, amount, duration],
  value: collateralAmount, // Collateral in wei
});

// Repay loan
await writeContract({
  address: CONTRACTS.ADLV,
  abi: ADLV_ABI,
  functionName: 'repayLoan',
  args: [loanId],
  value: repaymentAmount,
});

// Sell license
await writeContract({
  address: CONTRACTS.ADLV,
  abi: ADLV_ABI,
  functionName: 'sellLicense',
  args: [vaultAddress, licenseType, duration],
  value: licensePrice,
});
```

### IDO Contract - Read Functions

```typescript
// Get CVS score
const { data: cvs } = useReadContract({
  address: CONTRACTS.IDO,
  abi: IDO_ABI,
  functionName: 'getCVS',
  args: [ipId],
});

// Get revenue
const { data: revenue } = useReadContract({
  address: CONTRACTS.IDO,
  abi: IDO_ABI,
  functionName: 'getRevenue',
  args: [ipId],
});

// Get owner
const { data: owner } = useReadContract({
  address: CONTRACTS.IDO,
  abi: IDO_ABI,
  functionName: 'owner',
});
```

---

## 🎯 Story Protocol SDK Integration

### Installation

```bash
npm install @story-protocol/core-sdk viem
# or
bun add @story-protocol/core-sdk viem
```

### Configuration

```typescript
import { StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import { http } from 'viem';
import { useAccount } from 'wagmi';

export function useStoryClient() {
  const { address } = useAccount();
  
  if (!address) return null;
  
  const config: StoryConfig = {
    account: address,
    transport: http('https://rpc-storyevm-testnet.aldebaranode.xyz'),
    chainId: 1315,
  };
  
  return StoryClient.newClient(config);
}
```

### Usage

```typescript
import { useStoryProtocol } from './hooks/useStoryProtocol';

function MyComponent() {
  const { registerIP, attachLicense, mintLicenses, loading } = useStoryProtocol();
  
  const handleRegisterIP = async () => {
    const result = await registerIP(nftContract, tokenId);
    console.log('IP ID:', result.ipId);
  };
  
  const handleAttachLicense = async (ipId: string) => {
    await attachLicense(ipId, 1n); // PIL Non-Commercial
  };
  
  const handleMintLicenses = async (ipId: string) => {
    const result = await mintLicenses(ipId, 1n, 10, userAddress);
    console.log('License tokens:', result.licenseTokenIds);
  };
}
```

---

## 📊 Subgraph Queries (After Deployment)

### GraphQL Endpoint

```typescript
const SUBGRAPH_URL = "https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1";
```

### Example Queries

```typescript
import { useQuery } from '@tanstack/react-query';

// Get vault data
export function useVaultData(vaultAddress: string) {
  return useQuery({
    queryKey: ['vault', vaultAddress],
    queryFn: async () => {
      const response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetVault($id: ID!) {
              idoVault(id: $id) {
                vaultAddress
                currentCVS
                totalLiquidity
                availableLiquidity
                totalLicenseRevenue
                activeLoansCount
                maxLoanAmount
                interestRate
                ipAsset {
                  name
                  creator
                }
              }
            }
          `,
          variables: { id: vaultAddress.toLowerCase() }
        })
      });
      const { data } = await response.json();
      return data.idoVault;
    }
  });
}

// Get all vaults
export function useAllVaults() {
  return useQuery({
    queryKey: ['vaults'],
    queryFn: async () => {
      const response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetVaults {
              idoVaults(
                first: 10
                orderBy: currentCVS
                orderDirection: desc
              ) {
                vaultAddress
                currentCVS
                totalLiquidity
                totalLicenseRevenue
                activeLoansCount
              }
            }
          `
        })
      });
      const { data } = await response.json();
      return data.idoVaults;
    }
  });
}

// Get user loans
export function useUserLoans(userAddress: string) {
  return useQuery({
    queryKey: ['loans', userAddress],
    queryFn: async () => {
      const response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetUserLoans($borrower: Bytes!) {
              loans(
                where: { borrower: $borrower }
                orderBy: issuedAt
                orderDirection: desc
              ) {
                loanId
                loanAmount
                collateralAmount
                interestRate
                status
                outstandingAmount
                startTime
                endTime
              }
            }
          `,
          variables: { borrower: userAddress.toLowerCase() }
        })
      });
      const { data } = await response.json();
      return data.loans;
    }
  });
}
```

---

## 🔔 Event Listening

### Listen to Contract Events

```typescript
import { useWatchContractEvent } from 'wagmi';

// Watch vault creation
useWatchContractEvent({
  address: CONTRACTS.ADLV,
  abi: ADLV_ABI,
  eventName: 'VaultCreated',
  onLogs(logs) {
    logs.forEach((log) => {
      console.log('Vault created:', {
        vaultAddress: log.args.vaultAddress,
        ipId: log.args.ipId,
        storyIPId: log.args.storyIPId,
        creator: log.args.creator,
      });
    });
  },
});

// Watch deposits
useWatchContractEvent({
  address: CONTRACTS.ADLV,
  abi: ADLV_ABI,
  eventName: 'Deposited',
  onLogs(logs) {
    logs.forEach((log) => {
      console.log('Deposit:', {
        vault: log.args.vaultAddress,
        depositor: log.args.depositor,
        amount: log.args.amount,
        shares: log.args.shares,
      });
    });
  },
});

// Watch license sales
useWatchContractEvent({
  address: CONTRACTS.ADLV,
  abi: ADLV_ABI,
  eventName: 'LicenseSold',
  onLogs(logs) {
    logs.forEach((log) => {
      console.log('License sold:', {
        vault: log.args.vaultAddress,
        ipId: log.args.ipId,
        licensee: log.args.licensee,
        price: log.args.price,
        licenseType: log.args.licenseType,
      });
    });
  },
});
```

---

## 🛠️ Utility Functions

### Format Helpers

```typescript
import { formatEther, parseEther } from 'viem';

// Format IP tokens
export function formatIP(value: bigint): string {
  return formatEther(value);
}

// Parse IP tokens
export function parseIP(value: string): bigint {
  return parseEther(value);
}

// Format percentage (basis points to %)
export function formatBps(bps: bigint): string {
  return (Number(bps) / 100).toFixed(2) + '%';
}

// Format timestamp
export function formatTimestamp(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toLocaleString();
}
```

### Validation Helpers

```typescript
// Validate vault address
export function isValidVaultAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Calculate max loan amount (50% of CVS)
export function calculateMaxLoan(cvs: bigint): bigint {
  return cvs / 2n;
}

// Calculate interest rate (20% - CVS/10000)
export function calculateInterestRate(cvs: bigint): bigint {
  const baseRate = 2000n; // 20%
  const discount = cvs / 100n;
  const rate = baseRate - discount;
  return rate < 500n ? 500n : rate; // Min 5%
}
```

---

## 📱 API Endpoints

### Story Protocol API

```typescript
const STORY_API = {
  BASE_URL: "https://api.storyprotocol.net",
  API_KEY: "KOTbaGUSWQ6cUJWhiJYi0jPgB0kTRu1eCFFvQL0IWls", // Public key
};

// Example: Get IP Asset
async function getIPAsset(ipId: string) {
  const response = await fetch(
    `${STORY_API.BASE_URL}/api/v1/assets/${ipId}`,
    {
      headers: {
        'X-API-Key': STORY_API.API_KEY,
      },
    }
  );
  return response.json();
}
```

### RPC Endpoint

```typescript
const RPC_URL = "https://rpc-storyevm-testnet.aldebaranode.xyz";

// Direct RPC call example
async function getBlockNumber() {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
      id: 1,
    }),
  });
  return response.json();
}
```

---

## 🎨 UI Components Examples

### Vault Card Component

```typescript
interface VaultCardProps {
  vaultAddress: string;
}

export function VaultCard({ vaultAddress }: VaultCardProps) {
  const { data: vault } = useReadContract({
    address: CONTRACTS.ADLV,
    abi: ADLV_ABI,
    functionName: 'getVault',
    args: [vaultAddress],
  });
  
  if (!vault) return <div>Loading...</div>;
  
  return (
    <div className="vault-card">
      <h3>Vault {vault.storyIPId}</h3>
      <p>Liquidity: {formatIP(vault.totalLiquidity)} IP</p>
      <p>Revenue: {formatIP(vault.totalLicenseRevenue)} IP</p>
      <p>Active Loans: {vault.activeLoansCount.toString()}</p>
    </div>
  );
}
```

### Deposit Component

```typescript
export function DepositForm({ vaultAddress }: { vaultAddress: string }) {
  const [amount, setAmount] = useState('');
  const { writeContract, isPending } = useWriteContract();
  
  const handleDeposit = async () => {
    await writeContract({
      address: CONTRACTS.ADLV,
      abi: ADLV_ABI,
      functionName: 'deposit',
      args: [vaultAddress],
      value: parseIP(amount),
    });
  };
  
  return (
    <div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount in IP"
      />
      <button onClick={handleDeposit} disabled={isPending}>
        {isPending ? 'Depositing...' : 'Deposit'}
      </button>
    </div>
  );
}
```

---

## 📚 Complete Example

### Full Integration Example

```typescript
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useStoryProtocol } from './hooks/useStoryProtocol';

export function VaultDashboard() {
  const { address } = useAccount();
  const { registerIP, attachLicense } = useStoryProtocol();
  
  // Read vault data
  const { data: vaultCount } = useReadContract({
    address: CONTRACTS.ADLV,
    abi: ADLV_ABI,
    functionName: 'vaultCounter',
  });
  
  // Write functions
  const { writeContract } = useWriteContract();
  
  const createVault = async () => {
    const ipId = '0x' + '1'.repeat(64); // Generate unique ID
    const storyIPId = `vault-${Date.now()}`;
    
    await writeContract({
      address: CONTRACTS.ADLV,
      abi: ADLV_ABI,
      functionName: 'createVault',
      args: [ipId, storyIPId],
    });
  };
  
  return (
    <div>
      <h1>Atlas Protocol Dashboard</h1>
      <p>Total Vaults: {vaultCount?.toString()}</p>
      <button onClick={createVault}>Create Vault</button>
    </div>
  );
}
```

---

## ✅ Checklist for Frontend Developer

- [ ] Copy environment variables to `.env`
- [ ] Import contract ABIs
- [ ] Configure Wagmi with Story Testnet
- [ ] Install Story Protocol SDK
- [ ] Set up contract hooks
- [ ] Implement vault creation
- [ ] Implement deposit/withdraw
- [ ] Add event listeners
- [ ] Connect to Subgraph (after deployment)
- [ ] Test on Story Testnet

---

## 🔗 Important Links

- **Documentation**: `contracts/FRONTEND_CONTRACTS_INFO.md`
- **SDK Guide**: `STORY_PROTOCOL_SDK_GUIDE.md`
- **Live Data**: `contracts/LIVE_DATA_SUMMARY.md`
- **Story Protocol Docs**: https://docs.story.foundation/
- **Faucet**: https://faucet.story.foundation/

---

**Everything you need is here. Copy, paste, and start building!** 🚀

**Last Updated**: November 20, 2024
