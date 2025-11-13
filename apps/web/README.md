# Atlas Protocol - Web Frontend

Next.js application for Atlas Protocol featuring ADLV and IDO mechanisms.

## Features

- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **ESLint** for code quality
- Integration with:
  - Story Protocol (GenAI Licensing)
  - Owlto Finance (Cross-Chain Bridge)
  - World ID (Identity Verification)
  - ABV.dev (Developer Tools)

## Getting Started

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Start production server
bun run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── layout.tsx   # Root layout
│   ├── page.tsx     # Home page
│   └── globals.css  # Global styles
```

## Tech Stack

- **Framework**: Next.js 16
- **Runtime**: Bun
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Linting**: ESLint
