# 🚀 Atlas Protocol - Deployment Info

## 🌐 Live URLs

### Production Deployment
- **Main URL**: https://frontend-ivory-three-31.vercel.app
- **Alternative URL**: https://frontend-samarabdelhameeds-projects-df99c328.vercel.app

### Latest Deployment
- **URL**: https://frontend-9ysqxs6t1-samarabdelhameeds-projects-df99c328.vercel.app
- **Status**: ✅ Ready
- **Deployed**: December 7, 2025

## 📊 Live Data Sources

### Goldsky Subgraph (GraphQL API)
- **Endpoint**: https://api.goldsky.com/api/public/project_cmi7k5szzd54101yy44xg05em/subgraphs/atlas-protocol/6.0.1/gn
- **Status**: ✅ Active
- **Real Data**:
  - 3 License Sales
  - 6 Loans Issued
  - Active monitoring

### Story Protocol Network
- **Chain ID**: 1315 (Story Aeneid Testnet)
- **RPC**: https://rpc-storyevm-testnet.aldebaranode.xyz
- **Explorer**: https://aeneid.storyscan.io

## 🔑 Smart Contracts (Deployed)

| Contract | Address |
|----------|---------|
| ADLV (Vault) | `0x793402b59d2ca4c501EDBa328347bbaF69a59f7b` |
| IDO (Oracle) | `0xeF83DB9b011261Ad3a76ccE8B7E54B2c055300D8` |
| Lending Module | `0xbefb2fF399Bd0faCDBd100A16A569c625e1E4bf3` |
| Loan NFT | `0x9386262027dc860337eC4F93A8503aD4ee852c41` |
| Story Protocol Core | `0x825B9Ad5F77B64aa1d56B52ef01291E6D4aA60a5` |
| Story SPG | `0x69415CE984A79a3Cfbe3F51024C63b6C107331e3` |
| IP Asset Registry | `0x77319B4031e6eF1250907aa00018B8B1c67a244b` |

## ✅ Verification

### Test Subgraph Query
```bash
curl -s "https://api.goldsky.com/api/public/project_cmi7k5szzd54101yy44xg05em/subgraphs/atlas-protocol/6.0.1/gn" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ dataLicenseSales(first: 5) { id salePrice licenseType timestamp } }"}' \
  | python3 -m json.tool
```

### Expected Response
```json
{
  "data": {
    "dataLicenseSales": [
      {
        "id": "0x56a1e7c25756120f489a1a8a47d4a0bb1fb0ea5b1b87eb2fbbd714c4fd797050-1",
        "salePrice": "1500000000000000000",
        "licenseType": "commercial",
        "timestamp": "1764937190"
      }
    ]
  }
}
```

## 🎯 Features Verified

- ✅ Frontend deployed and accessible
- ✅ Environment variables configured
- ✅ Subgraph returning real data
- ✅ Smart contracts deployed on Story Protocol
- ✅ World ID integration configured
- ✅ Cross-chain bridge ready (Owlto Finance)

## 📱 How to Use

1. Visit: https://frontend-ivory-three-31.vercel.app
2. Connect your wallet (Story Testnet - Chain ID 1315)
3. Browse IP assets and licenses
4. Create vaults backed by your IP
5. Issue loans against your IP collateral
6. Sell licenses to AI companies

## 🔧 Local Development

```bash
# Install dependencies
bun install

# Start development servers
bun run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

## 📝 Notes

- All data is real and fetched from Story Protocol blockchain
- Subgraph indexes events in real-time via Goldsky
- World ID verification is active for Sybil resistance
- Cross-chain loans supported via Owlto Finance bridge

---

**Last Updated**: December 7, 2025
**Deployment Status**: ✅ Production Ready
