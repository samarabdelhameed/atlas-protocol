# Atlas Protocol

A decentralized protocol featuring ADLV (Adaptive Dynamic Liquidity Vault) and IDO mechanisms with integrated sponsor tools.

## Project Structure

```
atlas-protocol/
├── contracts/          # Solidity smart contracts (Foundry)
│   ├── src/           # Contract source files
│   ├── test/          # Contract tests
│   └── script/        # Deployment scripts
├── apps/
│   ├── web/           # Next.js frontend (Main UI)
│   ├── frontend/      # Vite React frontend (Alternative)
│   ├── backend/       # Basic backend service
│   └── agent-service/ # Blockchain agent service
├── packages/
│   └── types/         # Shared TypeScript types
└── subgraph/          # Goldsky/The Graph indexer
    ├── schema.graphql # GraphQL schema
    ├── subgraph.yaml  # Subgraph configuration
    └── src/           # Event handlers
```

## Tech Stack

- **Smart Contracts**: Solidity + Foundry
- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Backend**: Bun + TypeScript + ethers.js + viem
- **Web3**: wagmi + @tanstack/react-query
- **Styling**: Tailwind CSS
- **Indexing**: Goldsky/The Graph
- **Monorepo**: Turborepo
- **Package Manager**: Bun

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.2.0
- [Foundry](https://book.getfoundry.sh/getting-started/installation)

### Installation

```bash
# Install all dependencies
bun install

# Install app-specific dependencies
cd apps/backend && bun install
cd apps/frontend && bun install
```

### Development

```bash
# Run Next.js web app
bun run dev:web

# Run Vite frontend (alternative)
bun run dev:frontend

# Run backend service
bun run dev:backend

# Run agent service
bun run dev:agent

# Run all apps in parallel
bun run dev

# Test smart contracts
bun run test:contracts

# Build all apps
bun run build
```

### Subgraph Development

```bash
cd subgraph

# Install dependencies
npm install

# Generate types from schema
npm run codegen

# Build subgraph
npm run build

# Deploy to Goldsky
npm run deploy
```

## Integrated Sponsor Tools

- **abv.dev** - Developer tools integration
- **Owlto Finance** - Cross-chain bridge
- **World ID** - Identity verification

## License

MIT

