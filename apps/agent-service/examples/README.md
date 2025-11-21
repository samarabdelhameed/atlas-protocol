# Story Protocol SDK Examples

A collection of practical examples for using Story Protocol SDK.

## Files

### 1. `storyProtocolExample.ts`
Basic examples for all SDK functions:
- Register IP Asset
- Attach License Terms
- Mint License Tokens
- Get IP Details
- Register Derivatives

### 2. `integrateWithADLV.ts`
Advanced examples for integration with ADLVWithStory contract:
- Complete workflow from creating vault to registering IP
- Batch registration of IPs
- Add IP liquidity to vaults
- Create derivatives

## How to Use

### 1. Environment Setup

Add the following variables to `.env`:

```bash
WALLET_PRIVATE_KEY=0x...
STORY_RPC_URL=https://rpc.odyssey.storyrpc.io
```

### 2. Run Examples

```bash
# Basic example
bun run examples/storyProtocolExample.ts

# ADLV integration example
bun run examples/integrateWithADLV.ts
```

### 3. Customize Examples

Update contract addresses in the files:

```typescript
const ADLV_CONTRACT = '0xYourADLVAddress';
const MOCK_NFT = '0xYourNFTAddress';
```

## Recommended Workflow

### For New Vaults:

1. Create vault in ADLVWithStory
2. Register vault as IP Asset
3. Attach License Terms
4. Add IP liquidity

### For Existing IPs:

1. Register NFT as IP Asset
2. Attach License Terms
3. Add to existing vault

### For Derivatives:

1. Get license from original IP
2. Create new NFT
3. Register it as derivative
4. Add to vault

## License Terms IDs

| ID | Name | Description |
|----|------|-------------|
| 1 | PIL Non-Commercial Social Remixing | Free, non-commercial |
| 2 | PIL Commercial Use | Commercial use |
| 3 | PIL Commercial Remix | Commercial remix |

## Resources

- [Story Protocol Docs](https://docs.story.foundation/)
- [SDK Documentation](https://docs.story.foundation/docs/sdk-documentation)
- [Contract Addresses](../../contracts/FRONTEND_CONTRACTS_INFO.md)
