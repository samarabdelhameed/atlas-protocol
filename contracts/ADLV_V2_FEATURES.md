# ADLV V2 - Professional Features

## 🚀 New Features Overview

ADLV V2 يضيف ميزات احترافية لتحسين تجربة المستخدم وتكامل Story Protocol:

### 1. ✅ EIP-2612 Permit Support
**Gasless Approvals للـ Vault Shares**

#### المشكلة:
- المستخدم يحتاج معاملتين: `approve()` ثم `deposit()`
- تكلفة gas مضاعفة
- UX سيئة

#### الحل:
```solidity
// Deposit with permit (one transaction, gasless approval)
adlv.depositWithPermit(
    vaultAddress,
    amount,
    deadline,
    v, r, s  // EIP-712 signature
);

// Withdraw with permit
adlv.withdrawWithPermit(
    vaultAddress,
    shares,
    deadline,
    v, r, s
);
```

#### الفوائد:
- ✅ معاملة واحدة بدلاً من اثنتين
- ✅ توفير 50% من gas
- ✅ UX أفضل (no approval step)
- ✅ Meta-transaction ready

---

### 2. ✅ Meta-Transactions for Licenses
**Gasless License Purchases**

#### المشكلة:
- المستخدم يحتاج ETH للـ gas
- Onboarding صعب للمستخدمين الجدد

#### الحل:
```solidity
// User signs message off-chain
bytes memory signature = signLicensePurchase(
    vaultAddress,
    licenseType,
    duration,
    price,
    deadline
);

// Relayer executes (pays gas)
adlv.purchaseLicenseWithMetaTx(
    vaultAddress,
    licenseType,
    duration,
    price,
    deadline,
    signature
);
```

#### الفوائد:
- ✅ المستخدم لا يحتاج ETH للـ gas
- ✅ Relayer يدفع gas
- ✅ Onboarding سهل
- ✅ Web3 UX محسّن

---

### 3. ✅ Story Protocol Royalty Streams
**Full Licensing Ecosystem**

#### الميزات:

##### A. Royalty Policy Setup
```solidity
// Set royalty policy for IP
adlv.initializeRoyaltyStream(
    vaultAddress,
    beneficiary,      // Who receives royalties
    royaltyPercentage // e.g., 1000 = 10%
);
```

##### B. Create Derivative Licenses
```solidity
// IP owner creates derivative license
uint256 licenseId = adlv.createDerivativeLicense(
    vaultAddress,
    licensee,
    royaltyShare,  // e.g., 2000 = 20% to parent
    licenseTerms
);
```

##### C. Register Derivative IP
```solidity
// Licensee registers derivative
(address derivativeVault, address derivativeIpId) = 
    adlv.registerDerivativeIPWithRoyalty(
        parentVaultAddress,
        licenseId,
        "Derivative IP Name",
        contentHash
    );
```

##### D. Automatic Revenue Sharing
```solidity
// When derivative earns revenue
adlv.streamRevenueToIP{value: amount}(derivativeVaultAddress);

// Revenue automatically splits:
// - 80% to derivative owner
// - 20% to parent IP owner (based on royaltyShare)
```

##### E. Claim Royalties
```solidity
// Parent IP owner claims accumulated royalties
uint256 claimed = adlv.claimRoyaltiesFromStory(vaultAddress);
```

#### الفوائد:
- ✅ **Licensing → Derivatives → Royalties** (full ecosystem)
- ✅ Automatic revenue sharing
- ✅ On-chain royalty tracking
- ✅ Story Protocol integration
- ✅ Derivative IP support

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      ADLVWithStoryV2                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ VaultSharesERC20 │  │  LicenseMetaTx   │               │
│  │                  │  │                  │               │
│  │ • EIP-2612       │  │ • EIP-712        │               │
│  │ • Permit         │  │ • Meta-tx        │               │
│  │ • Gasless        │  │ • Gasless        │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         StoryRoyaltyModule                          │   │
│  │                                                     │   │
│  │ • Royalty Policies                                  │   │
│  │ • Derivative Licenses                               │   │
│  │ • Revenue Streams                                   │   │
│  │ • Automatic Sharing                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Story Protocol SPG   │
                │                       │
                │ • IP Registration     │
                │ • License Registry    │
                │ • Royalty Hub         │
                └───────────────────────┘
```

---

## 🔧 Usage Examples

### Example 1: Deposit with Permit

```javascript
// Frontend code
import { ethers } from 'ethers';

// 1. Get permit signature
const domain = {
  name: 'ADLV Vault Share',
  version: '1',
  chainId: await provider.getNetwork().chainId,
  verifyingContract: shareTokenAddress
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

const value = {
  owner: userAddress,
  spender: adlvAddress,
  value: depositAmount,
  nonce: await shareToken.nonces(userAddress),
  deadline: Math.floor(Date.now() / 1000) + 3600
};

const signature = await signer._signTypedData(domain, types, value);
const { v, r, s } = ethers.utils.splitSignature(signature);

// 2. Deposit with permit (one transaction)
await adlv.depositWithPermit(
  vaultAddress,
  depositAmount,
  value.deadline,
  v, r, s,
  { value: depositAmount }
);
```

### Example 2: Gasless License Purchase

```javascript
// 1. User signs license purchase
const domain = {
  name: 'ADLVLicenseMetaTx',
  version: '1',
  chainId: await provider.getNetwork().chainId,
  verifyingContract: licenseMetaTxAddress
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

const value = {
  vaultAddress,
  licenseType: 'commercial',
  duration: 365 * 24 * 60 * 60, // 1 year
  price: ethers.utils.parseEther('0.1'),
  nonce: await licenseMetaTx.getNonce(userAddress),
  deadline: Math.floor(Date.now() / 1000) + 3600
};

const signature = await signer._signTypedData(domain, types, value);

// 2. Relayer executes (pays gas)
await adlv.purchaseLicenseWithMetaTx(
  vaultAddress,
  'commercial',
  value.duration,
  value.price,
  value.deadline,
  signature,
  { value: value.price }
);
```

### Example 3: Full Derivative Workflow

```javascript
// 1. Parent IP owner sets royalty policy
await adlv.initializeRoyaltyStream(
  parentVaultAddress,
  parentOwnerAddress,
  1000 // 10% royalty
);

// 2. Create derivative license
const licenseId = await adlv.createDerivativeLicense(
  parentVaultAddress,
  licenseeAddress,
  2000, // 20% to parent
  ethers.utils.defaultAbiCoder.encode(
    ['string', 'uint256'],
    ['commercial', 365 * 24 * 60 * 60]
  )
);

// 3. Licensee registers derivative
const tx = await adlv.registerDerivativeIPWithRoyalty(
  parentVaultAddress,
  licenseId,
  'My Derivative Work',
  ethers.utils.keccak256(ethers.utils.toUtf8Bytes('content'))
);

const receipt = await tx.wait();
const event = receipt.events.find(e => e.event === 'DerivativeVaultCreated');
const derivativeVaultAddress = event.args.derivativeVaultAddress;

// 4. Derivative earns revenue (automatic sharing)
await adlv.streamRevenueToIP(derivativeVaultAddress, {
  value: ethers.utils.parseEther('1.0')
});
// 0.8 ETH to derivative owner
// 0.2 ETH to parent owner

// 5. Parent claims royalties
const claimed = await adlv.claimRoyaltiesFromStory(parentVaultAddress);
console.log('Claimed:', ethers.utils.formatEther(claimed), 'ETH');
```

---

## 🎯 Why This Matters for Story Protocol

### Story Protocol يقيّم المشاريع على:

1. ✅ **IP Registration** - Done
2. ✅ **Licensing** - Done
3. ✅ **Derivatives** - Done ✨ NEW
4. ✅ **Royalty Streams** - Done ✨ NEW
5. ✅ **Revenue Sharing** - Done ✨ NEW

### ADLV V2 الآن يوفر:
- **Full licensing ecosystem**
- **Derivative IP support**
- **Automatic royalty distribution**
- **On-chain revenue tracking**
- **Professional UX** (gasless transactions)

---

## 📝 Deployment

```bash
# 1. Set environment variables
export PRIVATE_KEY="your_private_key"
export STORY_SPG_ADDRESS="0x..."
export STORY_IP_ASSET_REGISTRY="0x..."
export STORY_LICENSE_REGISTRY="0x..."

# 2. Deploy
forge script script/DeployADLVV2.s.sol:DeployADLVV2 \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify

# 3. Check deployment
cat deployment-v2.txt
```

---

## 🔍 Contract Addresses

After deployment, you'll get:
- `IDO` - IP Data Oracle
- `LOAN_NFT` - Loan NFT contract
- `ADLV_V2` - Main ADLV V2 contract
- `LICENSE_METATX` - Meta-transaction handler
- `ROYALTY_MODULE` - Story royalty module

---

## 🧪 Testing

```bash
# Test permit functionality
forge test --match-test testDepositWithPermit -vvv

# Test meta-transactions
forge test --match-test testLicenseMetaTx -vvv

# Test royalty streams
forge test --match-test testRoyaltyStream -vvv

# Test derivative licensing
forge test --match-test testDerivativeLicense -vvv
```

---

## 📚 Additional Resources

- [EIP-2612: Permit Extension](https://eips.ethereum.org/EIPS/eip-2612)
- [EIP-712: Typed Structured Data](https://eips.ethereum.org/EIPS/eip-712)
- [Story Protocol Docs](https://docs.story.foundation/)
- [Meta-Transactions Guide](https://docs.openzeppelin.com/contracts/4.x/api/metatx)

---

## ✨ Summary

ADLV V2 transforms the platform into a **professional-grade IP licensing ecosystem**:

1. **Better UX** - Gasless transactions, one-click operations
2. **Full Story Integration** - Licensing → Derivatives → Royalties
3. **Automatic Revenue Sharing** - On-chain, transparent, trustless
4. **Production Ready** - EIP standards, security best practices

**Result**: A complete IP-backed DeFi platform that Story Protocol will love! 🚀
