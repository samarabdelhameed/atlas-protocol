# Atlas Protocol

A decentralized protocol featuring ADLV (Adaptive Dynamic Liquidity Vault) and IDO mechanisms with integrated sponsor tools.

## Project Structure

```
atlas-protocol/
├── contracts/          # Solidity smart contracts (Foundry)
├── apps/
│   ├── backend/       # Backend agent service (Bun + TypeScript)
│   └── frontend/      # Frontend application (React + Vite + TypeScript)
├── packages/          # Shared TypeScript packages
└── subgraph/          # Goldsky/Subgraph indexing definitions
```

## Tech Stack

- **Smart Contracts**: Solidity + Foundry
- **Backend**: Bun + TypeScript
- **Frontend**: React + Vite + TypeScript
- **Indexing**: Goldsky/Subgraph
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
# Run frontend
bun run dev:frontend

# Run backend
bun run dev:backend

# Test contracts
bun run test:contracts
```

## Integrated Sponsor Tools

- **abv.dev** - Developer tools integration
- **Owlto Finance** - Cross-chain bridge
- **World ID** - Identity verification

## License

MIT

