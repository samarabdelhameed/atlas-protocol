# 🔗 Atlas Protocol - Important Links

## 🌐 Live Application

### Production Deployment
**Main URL:** https://frontend-samarabdelhameeds-projects-df99c328.vercel.app

**Alternative URLs:**
- https://frontend-ivory-three-31.vercel.app
- https://frontend-9ysqxs6t1-samarabdelhameeds-projects-df99c328.vercel.app

---

## 🎥 Video Content

### Demo Video
**Full Platform Walkthrough:** https://www.youtube.com/watch?v=4i-WnMpG6fE
- Complete feature demonstration
- User journey walkthrough
- Live interaction with smart contracts

### Presentation Video
**Technical Overview:** https://www.youtube.com/watch?v=DDL-Lgo2KKM
- Project architecture
- Technology stack
- Integration details

---

## 📊 Data & APIs

### Goldsky Subgraph (GraphQL)
**Endpoint:** https://api.goldsky.com/api/public/project_cmi7k5szzd54101yy44xg05em/subgraphs/atlas-protocol/6.0.1/gn

**Example Query:**
```graphql
{
  dataLicenseSales(first: 5) {
    id
    salePrice
    licenseType
    timestamp
  }
  loans(first: 5) {
    id
    loanId
    borrower
    loanAmount
    status
  }
}
```

### Story Protocol Network
**Chain ID:** 1315 (Story Aeneid Testnet)
**RPC URL:** https://rpc-storyevm-testnet.aldebaranode.xyz
**Explorer:** https://aeneid.storyscan.io

---

## 📱 Smart Contracts

### Core Contracts

| Contract | Address | Explorer |
|----------|---------|----------|
| **ADLV (Vault)** | `0x793402b59d2ca4c501EDBa328347bbaF69a59f7b` | [View](https://aeneid.storyscan.io/address/0x793402b59d2ca4c501EDBa328347bbaF69a59f7b) |
| **IDO (Oracle)** | `0xeF83DB9b011261Ad3a76ccE8B7E54B2c055300D8` | [View](https://aeneid.storyscan.io/address/0xeF83DB9b011261Ad3a76ccE8B7E54B2c055300D8) |
| **Lending Module** | `0xbefb2fF399Bd0faCDBd100A16A569c625e1E4bf3` | [View](https://aeneid.storyscan.io/address/0xbefb2fF399Bd0faCDBd100A16A569c625e1E4bf3) |
| **Loan NFT** | `0x9386262027dc860337eC4F93A8503aD4ee852c41` | [View](https://aeneid.storyscan.io/address/0x9386262027dc860337eC4F93A8503aD4ee852c41) |

### Story Protocol Contracts

| Contract | Address | Explorer |
|----------|---------|----------|
| **Story Protocol Core** | `0x825B9Ad5F77B64aa1d56B52ef01291E6D4aA60a5` | [View](https://aeneid.storyscan.io/address/0x825B9Ad5F77B64aa1d56B52ef01291E6D4aA60a5) |
| **Story SPG** | `0x69415CE984A79a3Cfbe3F51024C63b6C107331e3` | [View](https://aeneid.storyscan.io/address/0x69415CE984A79a3Cfbe3F51024C63b6C107331e3) |
| **IP Asset Registry** | `0x77319B4031e6eF1250907aa00018B8B1c67a244b` | [View](https://aeneid.storyscan.io/address/0x77319B4031e6eF1250907aa00018B8B1c67a244b) |

---

## 🛠️ Developer Resources

### Documentation
- **Main README:** [README.md](./README.md)
- **Deployment Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Smart Contracts:** [contracts/README.md](./contracts/README.md)
- **SDK Implementation:** [SDK_IMPLEMENTATION.md](./SDK_IMPLEMENTATION.md)

### Local Development
```bash
# Clone repository
git clone https://github.com/samarabdelhameed/atlas-protocol.git

# Install dependencies
bun install

# Start development servers
bun run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

---

## 🎯 Quick Access

### For Users
1. **Try the App:** https://frontend-samarabdelhameeds-projects-df99c328.vercel.app
2. **Watch Demo:** https://www.youtube.com/watch?v=4i-WnMpG6fE
3. **View Presentation:** https://www.youtube.com/watch?v=DDL-Lgo2KKM

### For Developers
1. **Explore Contracts:** https://aeneid.storyscan.io
2. **Query Subgraph:** https://api.goldsky.com/api/public/project_cmi7k5szzd54101yy44xg05em/subgraphs/atlas-protocol/6.0.1/gn
3. **Read Docs:** [README.md](./README.md)

### For Judges
1. **Live Demo:** https://frontend-samarabdelhameeds-projects-df99c328.vercel.app
2. **Video Walkthrough:** https://www.youtube.com/watch?v=4i-WnMpG6fE
3. **Technical Presentation:** https://www.youtube.com/watch?v=DDL-Lgo2KKM
4. **Smart Contracts:** https://aeneid.storyscan.io
5. **Real-time Data:** https://api.goldsky.com/api/public/project_cmi7k5szzd54101yy44xg05em/subgraphs/atlas-protocol/6.0.1/gn

---

## 📊 Live Statistics

**Current Data (Real-time from Subgraph):**
- ✅ 3 License Sales
- ✅ 6 Loans Issued (5 Repaid, 1 Active)
- ✅ Total Volume: ~4.5 STORY
- ✅ Last Updated: December 7, 2025

---

## 🌟 Key Features

- ✅ IP-backed lending (IPFi)
- ✅ Dynamic CVS (Collateral Value Score)
- ✅ GenAI licensing marketplace
- ✅ World ID verification
- ✅ Cross-chain loans (Owlto Finance)
- ✅ Real-time data indexing (Goldsky)
- ✅ Story Protocol integration

---

**Last Updated:** December 7, 2025
**Status:** ✅ Production Ready
