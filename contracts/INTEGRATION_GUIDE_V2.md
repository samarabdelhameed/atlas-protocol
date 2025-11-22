# ADLV V2 Integration Guide

## 🎯 Quick Start

هذا الدليل يشرح كيفية استخدام الميزات الجديدة في ADLV V2.

---

## 1️⃣ EIP-2612 Permit Integration

### Frontend Integration

```typescript
// utils/permit.ts
import { ethers } from 'ethers';

export async function signPermit(
  signer: ethers.Signer,
  token: ethers.Contract,
  spender: string,
  value: ethers.BigNumber,
  deadline: number
): Promise<{ v: number; r: string; s: string }> {
  const [nonce, name, version, chainId] = await Promise.all([
    token.nonces(await signer.getAddress()),
    token.name(),
    '1',
    signer.getChainId()
  ]);

  const domain = {
    name,
    version,
    chainId,
    verifyingContract: token.address
  };

  const types = {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
  };

  const message = {
    owner: await signer.getAddress(),
    spender,
    value: value.toString(),
    nonce: nonce.toNumber(),
    deadline
  };

  const signature = await signer._signTypedData(domain, types, message);
  return ethers.utils.splitSignature(signature);
}

// Usage in component
export async function depositWithPermit(
  adlv: ethers.Contract,
  shareToken: ethers.Contract,
  vaultAddress: string,
  amount: ethers.BigNumber,
  signer: ethers.Signer
) {
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  
  const { v, r, s } = await signPermit(
    signer,
    shareToken,
    adlv.address,
    amount,
    deadline
  );

  const tx = await adlv.depositWithPermit(
    vaultAddress,
    amount,
    deadline,
    v, r, s,
    { value: amount }
  );

  return tx.wait();
}
```

### React Hook Example

```typescript
// hooks/usePermitDeposit.ts
import { useState } from 'react';
import { useWallet } from './useWallet';
import { depositWithPermit } from '../utils/permit';

export function usePermitDeposit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { signer, adlv, getShareToken } = useWallet();

  const deposit = async (vaultAddress: string, amount: string) => {
    try {
      setLoading(true);
      setError(null);

      const shareToken = await getShareToken(vaultAddress);
      const amountBN = ethers.utils.parseEther(amount);

      const receipt = await depositWithPermit(
        adlv,
        shareToken,
        vaultAddress,
        amountBN,
        signer
      );

      return receipt;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { deposit, loading, error };
}
```

---

## 2️⃣ Meta-Transaction Integration

### Gasless License Purchase

```typescript
// utils/metaTx.ts
import { ethers } from 'ethers';

export async function signLicensePurchase(
  signer: ethers.Signer,
  licenseMetaTx: ethers.Contract,
  vaultAddress: string,
  licenseType: string,
  duration: number,
  price: ethers.BigNumber,
  deadline: number
): Promise<string> {
  const nonce = await licenseMetaTx.getNonce(await signer.getAddress());
  const chainId = await signer.getChainId();

  const domain = {
    name: 'ADLVLicenseMetaTx',
    version: '1',
    chainId,
    verifyingContract: licenseMetaTx.address
  };

  const types = {
    LicensePurchase: [
      { name: 'vaultAddress', type: 'address' },
      { name: 'licenseType', type: 'string' },
      { name: 'duration', type: 'uint256' },
      { name: 'price', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
  };

  const message = {
    vaultAddress,
    licenseType,
    duration,
    price: price.toString(),
    nonce: nonce.toNumber(),
    deadline
  };

  return signer._signTypedData(domain, types, message);
}

// Relayer service
export async function relayLicensePurchase(
  adlv: ethers.Contract,
  vaultAddress: string,
  licenseType: string,
  duration: number,
  price: ethers.BigNumber,
  deadline: number,
  signature: string,
  relayerSigner: ethers.Signer
) {
  const tx = await adlv.connect(relayerSigner).purchaseLicenseWithMetaTx(
    vaultAddress,
    licenseType,
    duration,
    price,
    deadline,
    signature,
    { value: price }
  );

  return tx.wait();
}
```

### React Component Example

```typescript
// components/GaslessLicensePurchase.tsx
import React, { useState } from 'react';
import { ethers } from 'ethers';
import { signLicensePurchase } from '../utils/metaTx';

export function GaslessLicensePurchase({ vaultAddress }: { vaultAddress: string }) {
  const [loading, setLoading] = useState(false);
  const { signer, adlv, licenseMetaTx } = useWallet();

  const purchaseLicense = async () => {
    try {
      setLoading(true);

      const licenseType = 'commercial';
      const duration = 365 * 24 * 60 * 60; // 1 year
      const price = ethers.utils.parseEther('0.1');
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      // User signs (no gas needed)
      const signature = await signLicensePurchase(
        signer,
        licenseMetaTx,
        vaultAddress,
        licenseType,
        duration,
        price,
        deadline
      );

      // Send to relayer service
      const response = await fetch('/api/relay-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vaultAddress,
          licenseType,
          duration,
          price: price.toString(),
          deadline,
          signature
        })
      });

      const { txHash } = await response.json();
      
      alert(`License purchased! TX: ${txHash}`);
    } catch (err) {
      console.error(err);
      alert('Failed to purchase license');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={purchaseLicense} disabled={loading}>
      {loading ? 'Processing...' : 'Buy License (Gasless)'}
    </button>
  );
}
```

### Relayer Backend (Node.js)

```typescript
// api/relay-license.ts
import { ethers } from 'ethers';

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
const adlv = new ethers.Contract(process.env.ADLV_ADDRESS, ADLV_ABI, relayerWallet);

export async function POST(req: Request) {
  const { vaultAddress, licenseType, duration, price, deadline, signature } = await req.json();

  try {
    // Relayer executes transaction (pays gas)
    const tx = await adlv.purchaseLicenseWithMetaTx(
      vaultAddress,
      licenseType,
      duration,
      price,
      deadline,
      signature,
      { value: price }
    );

    const receipt = await tx.wait();

    return Response.json({
      success: true,
      txHash: receipt.transactionHash
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

---

## 3️⃣ Story Protocol Royalty Streams

### Initialize Royalty Stream

```typescript
// utils/royalty.ts
export async function initializeRoyaltyStream(
  adlv: ethers.Contract,
  vaultAddress: string,
  beneficiary: string,
  royaltyPercentage: number // basis points (e.g., 1000 = 10%)
) {
  const tx = await adlv.initializeRoyaltyStream(
    vaultAddress,
    beneficiary,
    royaltyPercentage
  );

  return tx.wait();
}
```

### Create Derivative License

```typescript
export async function createDerivativeLicense(
  adlv: ethers.Contract,
  parentVaultAddress: string,
  licensee: string,
  royaltyShare: number, // basis points (e.g., 2000 = 20%)
  licenseTerms: {
    type: string;
    duration: number;
  }
) {
  const encodedTerms = ethers.utils.defaultAbiCoder.encode(
    ['string', 'uint256'],
    [licenseTerms.type, licenseTerms.duration]
  );

  const tx = await adlv.createDerivativeLicense(
    parentVaultAddress,
    licensee,
    royaltyShare,
    encodedTerms
  );

  const receipt = await tx.wait();
  const event = receipt.events?.find(e => e.event === 'DerivativeLicenseCreated');
  
  return event?.args?.licenseId;
}
```

### Register Derivative IP

```typescript
export async function registerDerivativeIP(
  adlv: ethers.Contract,
  parentVaultAddress: string,
  licenseId: number,
  derivativeName: string,
  contentHash: string
) {
  const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(contentHash));

  const tx = await adlv.registerDerivativeIPWithRoyalty(
    parentVaultAddress,
    licenseId,
    derivativeName,
    hash
  );

  const receipt = await tx.wait();
  const event = receipt.events?.find(e => e.event === 'DerivativeVaultCreated');

  return {
    derivativeVaultAddress: event?.args?.derivativeVaultAddress,
    derivativeIpId: event?.args?.derivativeIpId
  };
}
```

### Stream Revenue

```typescript
export async function streamRevenue(
  adlv: ethers.Contract,
  vaultAddress: string,
  amount: ethers.BigNumber
) {
  const tx = await adlv.streamRevenueToIP(vaultAddress, { value: amount });
  return tx.wait();
}
```

### Claim Royalties

```typescript
export async function claimRoyalties(
  adlv: ethers.Contract,
  vaultAddress: string
) {
  const tx = await adlv.claimRoyaltiesFromStory(vaultAddress);
  const receipt = await tx.wait();
  
  const event = receipt.events?.find(e => e.event === 'RoyaltiesClaimed');
  return event?.args?.amount;
}
```

### Get Pending Royalties

```typescript
export async function getPendingRoyalties(
  adlv: ethers.Contract,
  vaultAddress: string
): Promise<ethers.BigNumber> {
  return adlv.getPendingRoyalties(vaultAddress);
}
```

### Full Derivative Workflow Component

```typescript
// components/DerivativeWorkflow.tsx
import React, { useState } from 'react';
import { ethers } from 'ethers';

export function DerivativeWorkflow({ parentVaultAddress }: { parentVaultAddress: string }) {
  const [step, setStep] = useState(1);
  const [licenseId, setLicenseId] = useState<number>();
  const [derivativeVault, setDerivativeVault] = useState<string>();
  const { adlv, signer } = useWallet();

  // Step 1: Parent creates license
  const createLicense = async () => {
    const licensee = await signer.getAddress();
    const id = await createDerivativeLicense(
      adlv,
      parentVaultAddress,
      licensee,
      2000, // 20% to parent
      { type: 'commercial', duration: 365 * 24 * 60 * 60 }
    );
    setLicenseId(id);
    setStep(2);
  };

  // Step 2: Licensee registers derivative
  const registerDerivative = async () => {
    const { derivativeVaultAddress } = await registerDerivativeIP(
      adlv,
      parentVaultAddress,
      licenseId!,
      'My Derivative Work',
      'content-hash-here'
    );
    setDerivativeVault(derivativeVaultAddress);
    setStep(3);
  };

  // Step 3: Stream revenue (automatic sharing)
  const streamRevenueToDerivative = async () => {
    await streamRevenue(
      adlv,
      derivativeVault!,
      ethers.utils.parseEther('1.0')
    );
    alert('Revenue streamed! 0.8 ETH to derivative, 0.2 ETH to parent');
    setStep(4);
  };

  // Step 4: Claim royalties
  const claimParentRoyalties = async () => {
    const amount = await claimRoyalties(adlv, parentVaultAddress);
    alert(`Claimed ${ethers.utils.formatEther(amount)} ETH`);
  };

  return (
    <div>
      <h2>Derivative IP Workflow</h2>
      
      {step === 1 && (
        <button onClick={createLicense}>
          Step 1: Create Derivative License
        </button>
      )}

      {step === 2 && (
        <button onClick={registerDerivative}>
          Step 2: Register Derivative IP
        </button>
      )}

      {step === 3 && (
        <button onClick={streamRevenueToDerivative}>
          Step 3: Stream Revenue (Test)
        </button>
      )}

      {step === 4 && (
        <button onClick={claimParentRoyalties}>
          Step 4: Claim Parent Royalties
        </button>
      )}
    </div>
  );
}
```

---

## 🔧 Environment Setup

```bash
# .env
PRIVATE_KEY=your_private_key
RPC_URL=https://story-testnet.rpc.url
STORY_SPG_ADDRESS=0x...
STORY_IP_ASSET_REGISTRY=0x...
STORY_LICENSE_REGISTRY=0x...

# For relayer
RELAYER_PRIVATE_KEY=relayer_private_key
ADLV_ADDRESS=0x...
```

---

## 📊 Monitoring & Analytics

### Track Royalty Streams

```typescript
export async function getRoyaltyAnalytics(
  adlv: ethers.Contract,
  vaultAddress: string
) {
  const [totalRevenue, derivativeRevenue] = await adlv.getTotalRevenueWithDerivatives(vaultAddress);
  const pendingRoyalties = await adlv.getPendingRoyalties(vaultAddress);
  const derivativeLicenses = await adlv.getDerivativeLicensesForVault(vaultAddress);

  return {
    totalRevenue: ethers.utils.formatEther(totalRevenue),
    derivativeRevenue: ethers.utils.formatEther(derivativeRevenue),
    pendingRoyalties: ethers.utils.formatEther(pendingRoyalties),
    derivativeCount: derivativeLicenses.length
  };
}
```

---

## ✅ Testing Checklist

- [ ] Deploy ADLV V2
- [ ] Create vault with share token
- [ ] Test deposit with permit
- [ ] Test withdraw with permit
- [ ] Test gasless license purchase
- [ ] Initialize royalty stream
- [ ] Create derivative license
- [ ] Register derivative IP
- [ ] Stream revenue (verify automatic sharing)
- [ ] Claim royalties

---

## 🚀 Production Deployment

```bash
# 1. Deploy contracts
forge script script/DeployADLVV2.s.sol:DeployADLVV2 \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify

# 2. Setup relayer service
npm run start:relayer

# 3. Update frontend config
# Update contract addresses in frontend/.env

# 4. Test end-to-end
npm run test:e2e
```

---

## 📞 Support

للمساعدة أو الأسئلة:
- GitHub Issues
- Discord: #adlv-support
- Email: support@adlv.io

---

## 🎉 You're Ready!

الآن لديك كل ما تحتاجه لاستخدام ADLV V2 مع:
- ✅ Gasless transactions
- ✅ Professional UX
- ✅ Full Story Protocol integration
- ✅ Derivative IP licensing
- ✅ Automatic royalty streams

Happy building! 🚀
