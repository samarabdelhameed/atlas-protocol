# Story Protocol SDK Integration Guide

## Overview

تم تثبيت وإعداد Story Protocol SDK في المشروع لتسهيل التفاعل مع Story Protocol على testnet.

## Installation

SDK تم تثبيته في:
- ✅ `apps/frontend` - للاستخدام في واجهة المستخدم
- ✅ `apps/agent-service` - للاستخدام في خدمة الـ Agent

```bash
# Already installed
@story-protocol/core-sdk@1.4.1
```

## Project Structure

```
apps/
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   │   └── storyProtocol.ts      # Story Protocol service functions
│   │   └── hooks/
│   │       └── useStoryProtocol.ts   # React hook for Story Protocol
│   └── package.json
│
└── agent-service/
    ├── services/
    │   └── storyProtocol.ts           # Story Protocol service functions
    ├── examples/
    │   └── storyProtocolExample.ts    # Usage examples
    └── package.json
```

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Story Protocol RPC
STORY_RPC_URL=https://rpc.odyssey.storyrpc.io

# Your wallet private key (for agent-service)
WALLET_PRIVATE_KEY=0x...
```

## Usage Examples

### Frontend (React)

```typescript
import { useStoryProtocol } from './hooks/useStoryProtocol';

function MyComponent() {
  const { registerIP, loading, error } = useStoryProtocol();

  const handleRegister = async () => {
    try {
      const result = await registerIP(
        '0xNFTContractAddress',
        1n // tokenId
      );
      console.log('IP registered:', result.ipId);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <button onClick={handleRegister} disabled={loading}>
      {loading ? 'Registering...' : 'Register IP'}
    </button>
  );
}
```

### Agent Service (Backend)

```typescript
import { registerIPAsset, attachLicenseTerms } from './services/storyProtocol';

async function processIP() {
  // Register IP Asset
  const ipId = await registerIPAsset(
    '0xNFTContractAddress',
    1n
  );

  // Attach license terms
  await attachLicenseTerms(
    ipId,
    1n // PIL Non-Commercial Social Remixing
  );

  console.log('IP processed:', ipId);
}
```

## Available Functions

### 1. Register IP Asset

```typescript
registerIPAsset(nftContract: Address, tokenId: bigint)
```

تسجيل NFT كـ IP Asset على Story Protocol.

### 2. Attach License Terms

```typescript
attachLicenseTerms(ipId: Address, licenseTermsId: bigint)
```

إضافة شروط الترخيص لـ IP Asset.

**License Terms IDs:**
- `1n` - PIL Non-Commercial Social Remixing
- `2n` - PIL Commercial Use
- `3n` - PIL Commercial Remix

### 3. Mint License Tokens

```typescript
mintLicenseTokens(
  licensorIpId: Address,
  licenseTermsId: bigint,
  amount: number,
  receiver: Address
)
```

إنشاء رموز ترخيص لـ IP Asset.

### 4. Get IP Asset Details

```typescript
getIPAsset(ipId: Address)
```

الحصول على تفاصيل IP Asset.

### 5. Register Derivative

```typescript
registerDerivative(
  nftContract: Address,
  tokenId: bigint,
  parentIpIds: Address[],
  licenseTermsIds: bigint[]
)
```

تسجيل عمل مشتق من IP Assets أخرى.

## Integration with ADLVWithStory Contract

يمكن دمج SDK مع العقد الذكي الموجود:

```typescript
// 1. Create vault in ADLVWithStory contract
const vaultId = await adlvContract.createVault(...);

// 2. Register the vault's NFT as IP Asset
const ipId = await registerIPAsset(
  adlvContractAddress,
  vaultId
);

// 3. Attach license terms
await attachLicenseTerms(ipId, 1n);

// 4. Add IP liquidity to vault
await adlvContract.addIPLiquidity(vaultId, ipId, amount);
```

## Testing

Run the examples:

```bash
# In agent-service
cd apps/agent-service
bun run examples/storyProtocolExample.ts
```

## Network Information

### Supported Networks

| Network | Chain ID | RPC URL | Explorer |
|---------|----------|---------|----------|
| Aeneid Testnet | 1315 | https://rpc.odyssey.storyrpc.io | https://odyssey.storyscan.xyz |
| Story Mainnet | 1514 | https://rpc.story.foundation | https://storyscan.xyz |

**Note:** Currently configured for mainnet (1514). Change `chainId` to `1315` for testnet.

## Common License Terms

| ID | Name | Description |
|----|------|-------------|
| 1 | PIL Non-Commercial Social Remixing | Free to use, remix, non-commercial |
| 2 | PIL Commercial Use | Commercial use allowed |
| 3 | PIL Commercial Remix | Commercial remix allowed |

## Resources

- [Story Protocol Docs](https://docs.story.foundation/)
- [SDK Documentation](https://docs.story.foundation/docs/sdk-documentation)
- [Testnet Faucet](https://faucet.story.foundation/)

## Next Steps

1. ✅ SDK installed and configured
2. ✅ Service functions created
3. ✅ React hooks created
4. 🔄 Integrate with existing vault creation flow
5. 🔄 Add UI components for IP registration
6. 🔄 Test on testnet

## Support

للمساعدة أو الأسئلة:
- Story Protocol Discord: https://discord.gg/storyprotocol
- Documentation: https://docs.story.foundation/
