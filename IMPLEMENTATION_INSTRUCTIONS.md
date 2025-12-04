# Implementation Instructions: Fetch IP Metadata from Story Protocol

## Overview
Transform the Licensing page from a "select your vault" dropdown into an **IP Asset Marketplace** that displays ALL IP assets with their metadata fetched from Story Protocol.

---

## Part 1: Story Protocol Integration Research (30 min)

### Step 1.1: Identify Story Protocol Contracts
You need to determine which Story Protocol contract stores IP asset metadata.

**Contracts to investigate:**
```
STORY_IP_ASSET_REGISTRY=0x77319B4031e6eF1250907aa00018B8B1c67a244b
STORY_SPG_ADDRESS=0x69415CE984A79a3Cfbe3F51024C63b6C107331e3
STORY_PROTOCOL_CORE_ADDRESS=0x825B9Ad5F77B64aa1d56B52ef01291E6D4aA60a5
```

**What you're looking for:**
- Contract function that returns IP metadata given an IP ID
- Metadata structure (name, description, content URI, category, etc.)
- Whether metadata is stored on-chain or via IPFS/external URI

**Resources:**
- Story Protocol docs: https://docs.storyprotocol.xyz/
- Story Protocol explorer: https://testnet.storyscan.xyz/
- Check ABIs in `/Users/a0000/projects/atlas/apps/agent-service/abis/`

**Expected findings:**
- Function signature like: `getIPMetadata(address ipId) returns (IPMetadata)`
- Or: `tokenURI(uint256 tokenId) returns (string)` if ERC721-based
- Or: `metadataURI(address ipId) returns (string)` for external metadata

### Step 1.2: Test Contract Queries
Use the Bash tool to query Story Protocol contracts directly:

```bash
# Example using cast (Foundry tool)
cd /Users/a0000/projects/atlas/contracts

# Query IP Asset Registry
cast call 0x77319B4031e6eF1250907aa00018B8B1c67a244b \
  "getIPMetadata(address)" \
  "0x<some_ip_id>" \
  --rpc-url https://rpc.ankr.com/story_aeneid_testnet/bc16a42ff54082470945f1420d9917706e7de9dbea9c11f20d93584bd6d26886

# If it returns external URI, fetch it
curl "<returned_uri>"
```

**Document your findings:**
- Which contract has the metadata?
- What function to call?
- What's the response structure?
- Is metadata on-chain or external (IPFS/HTTP)?

---

## Part 2: Backend API Endpoint (1-2 hours)

### Step 2.1: Create IP Metadata Service

**File to create:** `/Users/a0000/projects/atlas/apps/agent-service/src/services/ip-metadata-service.ts`

```typescript
import { createPublicClient, http, Address } from 'viem';
import { storyTestnet } from '../config/chains';

// TODO: Replace with actual Story Protocol contract address and ABI
const IP_REGISTRY_ADDRESS = '0x77319B4031e6eF1250907aa00018B8B1c67a244b';
const IP_REGISTRY_ABI = [
  // TODO: Add actual ABI functions found in Step 1.1
  {
    name: 'getIPMetadata', // Replace with actual function name
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'ipId', type: 'address' }],
    outputs: [
      {
        name: 'metadata',
        type: 'tuple',
        components: [
          { name: 'name', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'contentURI', type: 'string' },
          // TODO: Add other fields from Step 1.1
        ],
      },
    ],
  },
];

const client = createPublicClient({
  chain: storyTestnet,
  transport: http(process.env.STORY_RPC_URL),
});

interface IPMetadata {
  name: string;
  description: string;
  contentURI?: string;
  category?: string;
  creator: Address;
  createdAt?: number;
  thumbnailURI?: string;
}

// In-memory cache (use Redis in production)
const metadataCache = new Map<string, { data: IPMetadata; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour

export async function fetchIPMetadata(ipId: Address): Promise<IPMetadata | null> {
  try {
    // Check cache first
    const cached = metadataCache.get(ipId.toLowerCase());
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`✅ Cache hit for IP ${ipId}`);
      return cached.data;
    }

    console.log(`🔍 Fetching metadata for IP ${ipId} from Story Protocol...`);

    // TODO: Replace with actual contract call based on Step 1.1 findings
    const metadata = await client.readContract({
      address: IP_REGISTRY_ADDRESS,
      abi: IP_REGISTRY_ABI,
      functionName: 'getIPMetadata', // Replace with actual function
      args: [ipId],
    });

    // TODO: Parse metadata based on actual response structure
    const parsedMetadata: IPMetadata = {
      name: metadata.name || `IP Asset ${ipId.slice(0, 10)}...`,
      description: metadata.description || 'No description available',
      contentURI: metadata.contentURI,
      creator: metadata.creator || '0x0000000000000000000000000000000000000000',
      // Add other fields
    };

    // If metadata includes external URI (IPFS/HTTP), fetch it
    if (metadata.contentURI && metadata.contentURI.startsWith('http')) {
      try {
        const response = await fetch(metadata.contentURI, { timeout: 5000 });
        if (response.ok) {
          const externalData = await response.json();
          // Merge external data
          parsedMetadata.name = externalData.name || parsedMetadata.name;
          parsedMetadata.description = externalData.description || parsedMetadata.description;
          parsedMetadata.thumbnailURI = externalData.image || externalData.thumbnail;
          parsedMetadata.category = externalData.category;
        }
      } catch (fetchError) {
        console.warn(`⚠️ Failed to fetch external metadata: ${fetchError}`);
      }
    }

    // Cache result
    metadataCache.set(ipId.toLowerCase(), {
      data: parsedMetadata,
      timestamp: Date.now(),
    });

    return parsedMetadata;
  } catch (error) {
    console.error(`❌ Error fetching IP metadata for ${ipId}:`, error);
    return null;
  }
}

export async function fetchBulkIPMetadata(ipIds: Address[]): Promise<Map<Address, IPMetadata>> {
  const results = new Map<Address, IPMetadata>();

  // Fetch in parallel with concurrency limit
  const BATCH_SIZE = 5;
  for (let i = 0; i < ipIds.length; i += BATCH_SIZE) {
    const batch = ipIds.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (ipId) => {
      const metadata = await fetchIPMetadata(ipId);
      if (metadata) {
        results.set(ipId, metadata);
      }
    });
    await Promise.all(promises);
  }

  return results;
}
```

### Step 2.2: Create API Route

**File to modify:** `/Users/a0000/projects/atlas/apps/agent-service/src/index.ts`

Add this route handler (around line 200, after existing routes):

```typescript
import { fetchIPMetadata, fetchBulkIPMetadata } from './services/ip-metadata-service';

// Single IP metadata endpoint
app.get('/api/ip-metadata/:ipId', async (req, res) => {
  try {
    const { ipId } = req.params;

    if (!ipId || !ipId.startsWith('0x')) {
      return res.status(400).json({ error: 'Invalid IP ID' });
    }

    const metadata = await fetchIPMetadata(ipId as `0x${string}`);

    if (!metadata) {
      return res.status(404).json({ error: 'IP metadata not found' });
    }

    res.json({ ipId, metadata });
  } catch (error) {
    console.error('Error fetching IP metadata:', error);
    res.status(500).json({ error: 'Failed to fetch IP metadata' });
  }
});

// Bulk metadata endpoint (for marketplace page)
app.post('/api/ip-metadata/bulk', async (req, res) => {
  try {
    const { ipIds } = req.body;

    if (!Array.isArray(ipIds) || ipIds.length === 0) {
      return res.status(400).json({ error: 'Invalid ipIds array' });
    }

    if (ipIds.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 IPs per request' });
    }

    const metadataMap = await fetchBulkIPMetadata(ipIds);

    // Convert Map to object for JSON serialization
    const response: Record<string, any> = {};
    metadataMap.forEach((metadata, ipId) => {
      response[ipId] = metadata;
    });

    res.json({ metadata: response, count: metadataMap.size });
  } catch (error) {
    console.error('Error fetching bulk IP metadata:', error);
    res.status(500).json({ error: 'Failed to fetch IP metadata' });
  }
});
```

### Step 2.3: Test Backend Endpoint

```bash
# Start backend
cd /Users/a0000/projects/atlas/apps/agent-service
bun run index.ts

# In another terminal, test endpoint
curl http://localhost:3001/api/ip-metadata/0x<some_ip_id>

# Expected response:
# {
#   "ipId": "0x...",
#   "metadata": {
#     "name": "Cool AI Model",
#     "description": "Advanced neural network...",
#     "creator": "0x...",
#     "contentURI": "ipfs://...",
#     "category": "AI/ML"
#   }
# }
```

---

## Part 3: Enhanced Subgraph Query (30 min)

### Step 3.1: Update Subgraph Query

**File to modify:** `/Users/a0000/projects/atlas/apps/agent-service/src/utils/subgraph-queries.ts`

Add new query to fetch ALL vaults with their IP IDs:

```typescript
export const GET_ALL_VAULTS_WITH_IP = `
  query GetAllVaultsWithIP {
    idovaults(
      orderBy: timestamp
      orderDirection: desc
      first: 100
    ) {
      id
      vaultAddress
      ipAsset
      ipId
      creator
      initialCVS
      vaultType
      timestamp
      totalLicensesSold
      totalRevenue
    }
  }
`;

export async function fetchAllVaultsWithIP(): Promise<any[]> {
  try {
    const response = await fetch(process.env.SUBGRAPH_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: GET_ALL_VAULTS_WITH_IP }),
    });

    if (!response.ok) {
      throw new Error(`Subgraph request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error('Subgraph errors:', data.errors);
      return [];
    }

    return data.data?.idovaults || [];
  } catch (error) {
    console.error('Error fetching vaults from subgraph:', error);
    return [];
  }
}
```

### Step 3.2: Create Marketplace API Endpoint

**File to modify:** `/Users/a0000/projects/atlas/apps/agent-service/src/index.ts`

Add marketplace endpoint:

```typescript
import { fetchAllVaultsWithIP } from './utils/subgraph-queries';
import { fetchBulkIPMetadata } from './services/ip-metadata-service';

// Marketplace endpoint - returns ALL IP assets with metadata
app.get('/api/marketplace', async (req, res) => {
  try {
    console.log('🏪 Fetching marketplace data...');

    // Step 1: Fetch all vaults from subgraph
    const vaults = await fetchAllVaultsWithIP();

    if (vaults.length === 0) {
      return res.json({ assets: [], count: 0 });
    }

    // Step 2: Extract unique IP IDs
    const ipIds = [...new Set(vaults.map(v => v.ipId).filter(Boolean))];

    console.log(`📦 Found ${vaults.length} vaults with ${ipIds.length} unique IP assets`);

    // Step 3: Fetch metadata for all IPs in parallel
    const metadataMap = await fetchBulkIPMetadata(ipIds as `0x${string}`[]);

    // Step 4: Merge vault data with IP metadata
    const assets = vaults.map(vault => ({
      // Vault data from subgraph
      vaultAddress: vault.vaultAddress,
      ipId: vault.ipId,
      creator: vault.creator,
      cvsScore: vault.initialCVS,
      totalLicensesSold: vault.totalLicensesSold || 0,
      totalRevenue: vault.totalRevenue || '0',
      createdAt: vault.timestamp,

      // IP metadata from Story Protocol
      metadata: metadataMap.get(vault.ipId) || {
        name: `IP Asset ${vault.ipId.slice(0, 10)}...`,
        description: 'No description available',
        creator: vault.creator,
      },
    }));

    // Step 5: Sort by CVS score (highest first)
    assets.sort((a, b) => Number(b.cvsScore || 0) - Number(a.cvsScore || 0));

    res.json({
      assets,
      count: assets.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('❌ Error fetching marketplace data:', error);
    res.status(500).json({ error: 'Failed to fetch marketplace data' });
  }
});
```

---

## Part 4: Frontend Marketplace Redesign (2-3 hours)

### Step 4.1: Create Marketplace Components

**File to create:** `/Users/a0000/projects/atlas/apps/frontend/src/components/IPAssetCard.tsx`

```typescript
import { motion } from 'framer-motion';

interface IPAssetCardProps {
  vaultAddress: string;
  ipId: string;
  metadata: {
    name: string;
    description: string;
    thumbnailURI?: string;
    category?: string;
  };
  cvsScore: string;
  totalLicensesSold: number;
  totalRevenue: string;
  onBuyLicense: (vaultAddress: string) => void;
}

export default function IPAssetCard({
  vaultAddress,
  ipId,
  metadata,
  cvsScore,
  totalLicensesSold,
  totalRevenue,
  onBuyLicense,
}: IPAssetCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-cyan-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:shadow-[0_0_50px_rgba(6,182,212,0.3)] transition-all duration-300"
    >
      {/* Thumbnail */}
      {metadata.thumbnailURI ? (
        <img
          src={metadata.thumbnailURI}
          alt={metadata.name}
          className="w-full h-48 object-cover rounded-xl mb-4"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-xl mb-4 flex items-center justify-center">
          <div className="text-cyan-500/50 text-6xl">🎨</div>
        </div>
      )}

      {/* Category Badge */}
      {metadata.category && (
        <div className="inline-block px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full mb-3">
          {metadata.category}
        </div>
      )}

      {/* Title */}
      <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-2">
        {metadata.name}
      </h3>

      {/* Description */}
      <p className="text-gray-400 text-sm mb-4 line-clamp-3">
        {metadata.description}
      </p>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-cyan-500/10 rounded-lg p-3">
          <div className="text-cyan-400 text-xs mb-1">CVS Score</div>
          <div className="text-white font-bold">
            {Number(cvsScore).toLocaleString()}
          </div>
        </div>
        <div className="bg-orange-500/10 rounded-lg p-3">
          <div className="text-orange-400 text-xs mb-1">Licenses Sold</div>
          <div className="text-white font-bold">{totalLicensesSold}</div>
        </div>
      </div>

      {/* IP ID (truncated) */}
      <div className="text-gray-500 text-xs mb-4 font-mono">
        IP: {ipId.slice(0, 10)}...{ipId.slice(-8)}
      </div>

      {/* Buy Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onBuyLicense(vaultAddress)}
        className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] transition-all duration-300"
      >
        Buy Usage Analytics License
      </motion.button>
    </motion.div>
  );
}
```

### Step 4.2: Redesign Licensing Page

**File to modify:** `/Users/a0000/projects/atlas/apps/frontend/src/pages/Licensing.tsx`

**Major changes needed:**

1. **Remove vault dropdown** (lines 75-83, 272-293)
2. **Add marketplace fetch** using `/api/marketplace` endpoint
3. **Display grid of IPAssetCard components**
4. **Handle "Buy License" from card click**

**New structure:**

```typescript
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import IPAssetCard from '../components/IPAssetCard';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface MarketplaceAsset {
  vaultAddress: string;
  ipId: string;
  cvsScore: string;
  totalLicensesSold: number;
  totalRevenue: string;
  metadata: {
    name: string;
    description: string;
    thumbnailURI?: string;
    category?: string;
  };
}

export default function Licensing({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [selectedVault, setSelectedVault] = useState('');
  const [purchaseStep, setPurchaseStep] = useState<'browse' | 'confirm' | 'success'>('browse');

  // Fetch marketplace data
  const { data: marketplaceData, isLoading: isLoadingMarketplace } = useQuery({
    queryKey: ['marketplace'],
    queryFn: async () => {
      const response = await fetch(`${BACKEND_URL}/api/marketplace`);
      if (!response.ok) throw new Error('Failed to fetch marketplace');
      return response.json();
    },
    staleTime: 30_000, // Cache for 30 seconds
  });

  const handleBuyLicense = (vaultAddress: string) => {
    setSelectedVault(vaultAddress);
    setPurchaseStep('confirm');
    // Scroll to purchase form
    document.getElementById('purchase-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  // ... keep existing purchase logic (lines 100-400) ...

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
              IP Asset Marketplace
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Purchase usage analytics licenses for IP assets
          </p>
        </motion.div>

        {/* Marketplace Grid */}
        {purchaseStep === 'browse' && (
          <div>
            {isLoadingMarketplace ? (
              <div className="text-center text-cyan-400 py-20">
                Loading marketplace...
              </div>
            ) : marketplaceData?.assets?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketplaceData.assets.map((asset: MarketplaceAsset) => (
                  <IPAssetCard
                    key={asset.vaultAddress}
                    vaultAddress={asset.vaultAddress}
                    ipId={asset.ipId}
                    metadata={asset.metadata}
                    cvsScore={asset.cvsScore}
                    totalLicensesSold={asset.totalLicensesSold}
                    totalRevenue={asset.totalRevenue}
                    onBuyLicense={handleBuyLicense}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-20">
                No IP assets available yet
              </div>
            )}
          </div>
        )}

        {/* Purchase Confirmation (keep existing form, lines 294-500) */}
        {purchaseStep === 'confirm' && selectedVault && (
          <div id="purchase-form">
            {/* Keep existing purchase form UI */}
            {/* ... */}
          </div>
        )}

        {/* Success State (keep existing, lines 501-600) */}
        {purchaseStep === 'success' && (
          <div>
            {/* Keep existing success UI */}
            {/* Add "Browse More" button to go back to marketplace */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPurchaseStep('browse')}
              className="mt-6 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl font-bold"
            >
              Browse More IP Assets
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Step 4.3: Update Navigation

**File to modify:** `/Users/a0000/projects/atlas/apps/frontend/src/components/Navigation.tsx`

Change "Licensing" label to "Marketplace" (around line 60):

```typescript
{
  page: 'licensing',
  label: 'IP Marketplace', // Changed from "Licensing"
  icon: '🏪' // Changed from whatever icon was there
}
```

---

## Part 5: Testing & Validation (1 hour)

### Step 5.1: Backend Tests

```bash
# Test IP metadata endpoint
curl http://localhost:3001/api/ip-metadata/0x<existing_ip_id>

# Test marketplace endpoint
curl http://localhost:3001/api/marketplace

# Expected response structure:
# {
#   "assets": [
#     {
#       "vaultAddress": "0x...",
#       "ipId": "0x...",
#       "cvsScore": "1250",
#       "metadata": {
#         "name": "Cool IP Asset",
#         "description": "Amazing content",
#         "category": "AI/ML"
#       }
#     }
#   ],
#   "count": 5
# }
```

### Step 5.2: Frontend Tests

1. **Navigate to Marketplace**: Should see grid of IP asset cards
2. **Click "Buy License"**: Should scroll to purchase form with vault pre-selected
3. **Complete Purchase**: Should work exactly as before (existing logic untouched)
4. **Return to Marketplace**: "Browse More" button should work
5. **Check Responsiveness**: Test on mobile (cards should stack vertically)

### Step 5.3: Edge Cases

Test these scenarios:
- ✅ No metadata from Story Protocol (should show placeholder)
- ✅ External metadata fetch fails (should use on-chain data only)
- ✅ No vaults in subgraph (should show "No IP assets available")
- ✅ Metadata cache expiration (should refetch after 1 hour)
- ✅ Bulk fetch with 50+ IPs (should respect rate limits)

---

## Part 6: Deployment Checklist

### Before Deploying:

- [ ] Verify Story Protocol contract address and ABI are correct
- [ ] Test metadata fetching with at least 3 real IP IDs
- [ ] Confirm subgraph query returns all vaults
- [ ] Test marketplace endpoint returns merged data
- [ ] Test frontend displays cards correctly
- [ ] Test purchase flow still works
- [ ] Check mobile responsiveness
- [ ] Verify error handling (no metadata, network failures)

### Deploy:

```bash
# Backend
cd /Users/a0000/projects/atlas/apps/agent-service
# Stop current server (Ctrl+C)
bun run index.ts

# Frontend
cd /Users/a0000/projects/atlas/apps/frontend
npm run build
npm run preview
```

---

## Summary of Changes

### Files Created:
1. `/Users/a0000/projects/atlas/apps/agent-service/src/services/ip-metadata-service.ts` (~250 lines)
2. `/Users/a0000/projects/atlas/apps/frontend/src/components/IPAssetCard.tsx` (~150 lines)

### Files Modified:
1. `/Users/a0000/projects/atlas/apps/agent-service/src/index.ts` - Add 3 new routes (~100 lines added)
2. `/Users/a0000/projects/atlas/apps/agent-service/src/utils/subgraph-queries.ts` - Add query (~30 lines added)
3. `/Users/a0000/projects/atlas/apps/frontend/src/pages/Licensing.tsx` - Complete redesign (~400 lines changed)
4. `/Users/a0000/projects/atlas/apps/frontend/src/components/Navigation.tsx` - Label change (~1 line)

### Key Functionalities:
- ✅ Fetch IP metadata from Story Protocol
- ✅ Cache metadata (1 hour TTL)
- ✅ Bulk fetch for marketplace
- ✅ Display ALL IP assets as browseable cards
- ✅ One-click license purchase from cards
- ✅ Existing purchase flow preserved
- ✅ Mobile responsive design

---

## Expected Timeline

- **Part 1 (Research)**: 30 min
- **Part 2 (Backend API)**: 1-2 hours
- **Part 3 (Subgraph)**: 30 min
- **Part 4 (Frontend)**: 2-3 hours
- **Part 5 (Testing)**: 1 hour
- **Part 6 (Deployment)**: 30 min

**Total: 6-8 hours of focused work**

---

## Critical Success Factors

1. **Story Protocol Integration**: Must correctly identify the metadata contract/function in Part 1
2. **Caching Strategy**: Prevents rate limiting and improves performance
3. **Error Handling**: Graceful fallbacks when metadata unavailable
4. **UX Flow**: Seamless transition from browsing to purchasing
5. **Mobile Design**: Cards must be responsive and touch-friendly

---

## Support Resources

- Story Protocol Docs: https://docs.storyprotocol.xyz/
- Story Testnet Explorer: https://testnet.storyscan.xyz/
- Viem Docs: https://viem.sh/
- TanStack Query Docs: https://tanstack.com/query/latest

---

## Questions to Resolve During Implementation

1. What's the exact function name for fetching IP metadata from Story Protocol?
2. Is metadata stored on-chain or via external URI (IPFS/HTTP)?
3. What fields are available in Story Protocol's IP metadata?
4. Should we filter marketplace by certain criteria (active only, minimum CVS, etc.)?
5. Should marketplace have search/filter functionality?

---

## Next Steps After Completion

Once the marketplace is working:

1. **Add Filters**: Category, CVS range, price range
2. **Add Search**: Search by IP name, creator address
3. **Add Sorting**: By CVS, revenue, recent
4. **Add Pagination**: If >50 assets
5. **Add IP Detail Page**: Full analytics view before purchase (the IPIntelligencePage that already exists)
6. **Add Creator Profiles**: View all IPs by a creator

---

**End of Implementation Instructions**

Estimated total time: 6-8 hours for a single developer.
