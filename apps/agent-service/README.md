# Agent Service

Core backend service for Atlas Protocol, handling blockchain interactions and external integrations.

## Features

- **GenAI Licensing**: Integration with Story Protocol for IP management
- **Cross-Chain Bridging**: Owlto Finance integration for seamless asset transfers
- **IP Data Oracle**: Real-time data ingestion and processing
- **World ID**: Identity verification and authentication
- **ABV.dev**: Developer tools integration

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **Blockchain**: ethers.js + viem
- **Protocol**: Story Protocol

## Installation

```bash
bun install
```

## Development

```bash
# Run in development mode
bun run dev

# Build for production
bun run build

# Start production server
bun run start
```

## Environment Variables

Create a `.env` file with the following:

```env
RPC_URL=http://localhost:8545
STORY_PROTOCOL_API_KEY=
ABV_API_KEY=
OWLTO_API_KEY=
WORLD_ID_APP_ID=
PRIVATE_KEY=
```

## Project Structure

```
src/
├── services/     # Core business logic
├── config/       # Configuration files
└── utils/        # Utility functions
```
