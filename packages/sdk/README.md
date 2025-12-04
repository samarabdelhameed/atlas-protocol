# Atlas Protocol SDK

Simple JavaScript/TypeScript SDK for accessing **global IP usage intelligence data** from the Atlas Protocol.

License holders can use this SDK to programmatically access usage analytics, including:
- 🌍 Global usage tracking (where IP is being used)
- 🚨 Infringement detection (via Yakoa)
- ✅ Authorized usages
- 🔗 On-chain derivative works (Story Protocol)
- 📊 Provenance verification scores
- 💰 Licensing summaries

---

## Installation

```bash
npm install @atlas-protocol/sdk ethers
# or
yarn add @atlas-protocol/sdk ethers
# or
pnpm add @atlas-protocol/sdk ethers
```

---

## Quick Start

```typescript
import { AtlasClient } from '@atlas-protocol/sdk';
import { ethers } from 'ethers';

// 1. Connect wallet
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// 2. Create client
const client = new AtlasClient({
  apiUrl: 'http://localhost:3001', // or your backend URL
  signer,
});

// 3. Authenticate (free - no gas required)
await client.authenticate();

// 4. Get global usage data for a licensed IP asset
const usageData = await client.getGlobalUsageData('0xYourIPAssetID');

console.log('Total detections:', usageData.globalUsage.totalDetections);
console.log('Infringements:', usageData.globalUsage.unauthorizedUses);
console.log('Authorized uses:', usageData.globalUsage.authorizedUses);
console.log('Yakoa score:', usageData.provenance.yakoaScore);
```

---

## API Reference

### `new AtlasClient(config)`

Create a new Atlas client instance.

```typescript
const client = new AtlasClient({
  apiUrl: 'http://localhost:3001',  // Optional: Backend URL
  signer: ethersSignerInstance,     // Optional: Ethers.js signer
});
```

### `client.authenticate(): Promise<boolean>`

Authenticate using wallet signature. This is **free** (no gas required) as it only signs a message.

```typescript
const success = await client.authenticate();
if (success) {
  console.log('Authenticated!');
}
```

### `client.getGlobalUsageData(ipAssetId): Promise<GlobalUsageData>`

Get comprehensive global usage intelligence for an IP asset. Requires active license.

```typescript
const data = await client.getGlobalUsageData('0xIPAssetID');

// Access global usage metrics
console.log(data.globalUsage.totalDetections);    // Total times IP detected
console.log(data.globalUsage.unauthorizedUses);   // Infringements
console.log(data.globalUsage.authorizedUses);     // Legitimate uses
console.log(data.globalUsage.platforms);          // Where it's being used
console.log(data.globalUsage.derivatives);        // On-chain remixes

// Access infringement details
data.infringements.forEach(inf => {
  console.log('Infringement:', inf.brand_id, inf.detected_at);
});

// Access authorized usages
data.authorizations.forEach(auth => {
  console.log('Authorized:', auth.brand_id, auth.authorized_at);
});

// Access derivatives
data.derivatives.forEach(der => {
  console.log('Derivative:', der.childIpId, der.creator);
});

// Provenance verification
console.log('Yakoa score:', data.provenance.yakoaScore);
console.log('Verified:', data.provenance.verified);
```

### `client.getMyLicenses(): Promise<{ licenses: License[], count: number }>`

Get all licenses owned by the authenticated user.

```typescript
const { licenses, count } = await client.getMyLicenses();

licenses.forEach(license => {
  console.log('IP Asset:', license.ipAssetName);
  console.log('Expires:', license.expiresAt);
  console.log('Active:', license.isActive);
});
```

### `client.hasActiveLicense(ipAssetId): Promise<boolean>`

Check if user has an active license for a specific IP asset.

```typescript
const hasLicense = await client.hasActiveLicense('0xIPAssetID');
if (hasLicense) {
  // User can access this IP's usage data
}
```

### `client.isAuthenticated(): boolean`

Check if currently authenticated with valid token.

```typescript
if (client.isAuthenticated()) {
  console.log('Still authenticated');
} else {
  await client.authenticate();
}
```

### `client.signOut(): void`

Sign out and clear authentication.

```typescript
client.signOut();
```

---

## Usage Examples

### Browser Example (React)

```typescript
import { useState, useEffect } from 'react';
import { AtlasClient } from '@atlas-protocol/sdk';
import { BrowserProvider } from 'ethers';

function App() {
  const [client, setClient] = useState<AtlasClient | null>(null);
  const [usageData, setUsageData] = useState(null);

  const connectAndAuth = async () => {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const atlasClient = new AtlasClient({ signer });
    await atlasClient.authenticate();

    setClient(atlasClient);
  };

  const fetchUsageData = async (ipAssetId: string) => {
    if (!client) return;

    const data = await client.getGlobalUsageData(ipAssetId);
    setUsageData(data);
  };

  return (
    <div>
      <button onClick={connectAndAuth}>Connect & Authenticate</button>
      <button onClick={() => fetchUsageData('0xYourIPAssetID')}>
        Get Usage Data
      </button>

      {usageData && (
        <div>
          <h2>Global Usage Intelligence</h2>
          <p>Total Detections: {usageData.globalUsage.totalDetections}</p>
          <p>Infringements: {usageData.globalUsage.unauthorizedUses}</p>
          <p>Yakoa Score: {usageData.provenance.yakoaScore}/100</p>
        </div>
      )}
    </div>
  );
}
```

### Node.js Example

```typescript
import { AtlasClient } from '@atlas-protocol/sdk';
import { Wallet, JsonRpcProvider } from 'ethers';

async function main() {
  // Create signer from private key
  const provider = new JsonRpcProvider('https://rpc.ankr.com/story_aeneid_testnet/...');
  const wallet = new Wallet('YOUR_PRIVATE_KEY', provider);

  // Create client
  const client = new AtlasClient({
    apiUrl: 'https://your-backend.com',
    signer: wallet,
  });

  // Authenticate
  await client.authenticate();

  // Get all my licenses
  const { licenses } = await client.getMyLicenses();
  console.log(`You have ${licenses.length} licenses`);

  // Get usage data for each licensed IP
  for (const license of licenses) {
    if (!license.isActive) continue;

    const usage = await client.getGlobalUsageData(license.ipAssetId);

    console.log(`\n${license.ipAssetName}:`);
    console.log(`  Detections: ${usage.globalUsage.totalDetections}`);
    console.log(`  Infringements: ${usage.globalUsage.unauthorizedUses}`);
    console.log(`  Yakoa Score: ${usage.provenance.yakoaScore}/100`);
    console.log(`  Platforms: ${usage.globalUsage.platforms.join(', ')}`);
  }
}

main();
```

### Monitoring Script Example

```typescript
import { AtlasClient } from '@atlas-protocol/sdk';
import { Wallet, JsonRpcProvider } from 'ethers';

// Monitor IP usage and alert on infringements
async function monitorIPUsage(ipAssetId: string) {
  const provider = new JsonRpcProvider(process.env.RPC_URL);
  const wallet = new Wallet(process.env.PRIVATE_KEY!, provider);

  const client = new AtlasClient({
    apiUrl: process.env.ATLAS_API_URL,
    signer: wallet,
  });

  await client.authenticate();

  // Poll every 5 minutes
  setInterval(async () => {
    const usage = await client.getGlobalUsageData(ipAssetId);

    // Alert on new infringements
    if (usage.globalUsage.unauthorizedUses > 0) {
      console.warn(`⚠️  ${usage.globalUsage.unauthorizedUses} infringements detected!`);

      usage.infringements.forEach(inf => {
        console.log(`  - ${inf.brand_id} detected at ${inf.detected_at}`);
        // Send email/webhook notification
      });
    }

    // Report on authorized usages
    console.log(`✅ ${usage.globalUsage.authorizedUses} authorized uses`);
    console.log(`📊 Yakoa Score: ${usage.provenance.yakoaScore}/100`);
  }, 5 * 60 * 1000);
}

monitorIPUsage('0xYourIPAssetID');
```

---

## Response Types

### `GlobalUsageData`

```typescript
interface GlobalUsageData {
  ipId: string;
  ipAssetName: string;

  globalUsage: {
    totalDetections: number;
    authorizedUses: number;
    unauthorizedUses: number;
    platforms: string[];
    derivatives: number;
    lastDetectedAt: string | null;
  };

  infringements: Array<{
    brand_id: string;
    detected_at: string;
    status: string;
    context?: string;
  }>;

  authorizations: Array<{
    brand_id: string;
    authorized_at: string;
    context?: string;
  }>;

  derivatives: Array<{
    childIpId: string;
    childName?: string;
    creator: string;
    createdAt: string;
    royaltiesPaid?: string;
  }>;

  provenance: {
    yakoaScore: number;
    verified: boolean;
    confidence: number;
    status: 'verified' | 'unverified' | 'pending' | 'unavailable';
    infringementCount: number;
    authorizationCount: number;
  };

  cvs: {
    currentScore: string;
    rank: number;
    history: Array<{ timestamp: string; score: string }>;
  };

  licensingSummary: {
    totalLicensesSold: number;
    activeLicenses: number;
    totalRevenue: string;
    licenseTypeBreakdown: {
      standard: number;
      commercial: number;
      exclusive: number;
    };
  };
}
```

---

## Error Handling

```typescript
try {
  const data = await client.getGlobalUsageData(ipAssetId);
} catch (error) {
  if (error.message.includes('Access denied')) {
    console.error('You need an active license for this IP asset');
  } else if (error.message.includes('Not authenticated')) {
    await client.authenticate();
  } else {
    console.error('Error:', error.message);
  }
}
```

---

## License

MIT

---

## Support

For issues and questions:
- GitHub: [atlas-protocol/atlas](https://github.com/atlas-protocol/atlas)
- Documentation: [docs.atlas-protocol.com](https://docs.atlas-protocol.com)
