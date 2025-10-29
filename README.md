# NFT Marketplace (Solana)

Trustless NFT marketplace on Solana using Anchor on-chain program and a Next.js (App Router) frontend. It supports marketplace initialization with a fee, listing NFTs into an escrow PDA, buying, and canceling listings. The frontend includes wallet connection, paginated marketplace grid, “My Listings”, rich modals, and notifications.

## Features

- Marketplace PDA with configurable fee percentage
- List NFT: transfer to escrow PDA controlled by marketplace
- Buy NFT: escrow-to-buyer transfer and SOL paid to seller minus fee
- Cancel Listing: escrow-to-seller transfer and state cleanup
- Paginated marketplace grid (9 per page) and NFT detail modal
- “My Listings” page (Available to list vs Currently listed)
- Global notification modal system
- Image handling and external hosts support

## Tech Stack

- On-chain: Anchor 0.31.x, `anchor-spl`
- Frontend: Next.js 14 App Router, React, TypeScript
- Wallets: `@solana/wallet-adapter` (Phantom, Solflare, etc.)
- Metadata: Metaplex JS SDK
- Styling: Custom CSS, component styles

## Repository Structure

- `anchor/` — Anchor workspace
  - `programs/nftmarketplace/` — Rust program: instructions, state, errors
  - `tests/` — Mocha/Chai tests via `ts-mocha`
  - `target/idl`, `target/types` — Generated IDL and TS types
- `src/` — Next.js app
  - `app/` — pages, layouts, routes (`/marketplace`, `/my-listings`)
  - `components/` — UI components, modals, cards
  - `contexts/MarketplaceContext.tsx` — all marketplace client logic
  - `hooks/useUserNFTs.ts` — wallet NFTs loader via Metaplex

## Program Overview

- Program ID: `EKReNxVoonN5sRAVgvNQiMWFfvkyRYSqWnNoYgAUaQRW`
- PDAs:
  - Marketplace PDA: seeds `["marketplace"]` stores authority, bump, fee_percent
  - Listing PDA: seeds `["listing", mint]` stores seller, mint, price, is_active, bump
- Key Instructions:
  - `initialize_marketplace(fee_percent)` — creates marketplace PDA
  - `create_listing(mint, price)` — creates/updates listing PDA and transfers NFT to escrow (ATA owned by marketplace PDA), guarded by `init_if_needed` and `ListingAlreadyActive`
  - `buy_nft(listing)` — transfers SOL to seller minus fee, sends NFT from escrow to buyer, closes or deactivates listing
  - `cancel_listing(listing)` — returns NFT to seller and deactivates listing

Escrow Authority: Marketplace PDA signs CPI token transfers using seeds `["marketplace", bump]`. This prevents sellers from bypassing escrow after listing.

## Frontend Overview

- `MarketplaceContext` centralizes program connection and actions: `checkMarketplaceStatus`, `refreshListings`, `createListing`, `buyNft`, `cancelListing`
- Uses `skipPreflight: true` to mitigate rare “simulation failed” race conditions
- `Marketplace` page provides init flow, grid, pagination, NFT detail modal
- `My Listings` shows tabs for available and currently listed NFTs
- Notification system: `NotificationProvider` + `NotificationModal`

## Prerequisites

- Node.js 18+
- Rust and Anchor CLI 0.31.1
- Solana CLI 1.18+
- Phantom/Solflare wallet for frontend

Verify tool versions:

```bash
anchor --version
solana --version
node -v
```

## Installation

```bash
npm install
```

If you work with Anchor tests locally:

```bash
cd anchor
npm install
```

## Environment Configuration

- Wallet and cluster come from your local Solana config for program actions (`anchor test`, etc.)
- Frontend connects using Wallet Adapter providers; no `.env` required for basics

Optional: set your cluster in Solana CLI

```bash
solana config set --url localhost   # or devnet
```

## Anchor Commands

From project root, these scripts proxy to Anchor using `npm`:

```bash
# Build the program
npm run anchor-build

# Local validator with program deployed
npm run anchor-localnet

# Run tests (ts-mocha)
npm run anchor-test

# Direct CLI if needed
cd anchor && anchor build
```

Notes:

- Anchor.toml pins `anchor_version = "0.31.1"`
- Tests use `./anchor/tsconfig.test.json` with CommonJS
- IDL artifacts emit to `anchor/target/idl` and types to `anchor/target/types`

## Frontend Commands

```bash
# Dev server
npm run dev

# Type-check and production build
npm run build

# Start production server (optional for local preview)
npm run start
```

## Using the Dapp

1. Open the app, connect your wallet.
2. If no marketplace exists, initialize it on `/marketplace` by entering a fee percentage.
3. Go to `/my-listings`:
   - “Available to List” tab shows wallet NFTs; list one with a price in SOL.
   - “Currently Listed” tab shows your active listings; open modal to cancel.
4. In `/marketplace`, browse listings, open details, and buy.

## Development Details

- Images: `next.config.ts` allows remote hosts and SVGs
- Webpack alias disables `pino-pretty` to avoid build issues
- ESLint is ignored during builds to not block CI
- `useUserNFTs` safely handles Metaplex `Metadata | Nft | Sft` shapes
- All lamport/SOL conversions are handled in the UI (1 SOL = 1e9 lamports)

## Testing

Tests live in `anchor/tests/nft-marketplace-test.ts` and cover:

- Marketplace initialization (and already-initialized failure)
- Create listing (and failure cases)
- Buy NFT (and inactive/failure cases)
- Cancel listing (and unauthorized/inactive failure cases)

Run:

```bash
npm run anchor-test
```

## Troubleshooting Guide

- Anchor version mismatch: ensure Anchor CLI matches `anchor/Anchor.toml` (`0.31.1`).
- AccountNotInitialized/ConstraintSeeds: confirm marketplace PDA seeds are `["marketplace"]` and correct program ID is used everywhere.
- CPI unauthorized signer/writable: mark accounts as `#[account(mut)]` where SOL or authorities change, and use PDA seeds for signer CPIs.
- “Already in use” on listing: `init_if_needed` is used; retry if metadata/state race conditions occur.
- Next.js build errors:
  - Module not found `pino-pretty`: fixed via webpack alias in `next.config.ts`.
  - ESLint breaking builds: `eslint.ignoreDuringBuilds = true`.
  - Metaplex types: `useUserNFTs` normalizes types; avoid direct `mintAddress` access without guards.
- Images not rendering: external hosts allowed in `next.config.ts`; modal uses `object-fit: cover` and proper container sizing.

## Deployment

Frontend (Vercel):

- Build command: `npm run build`
- Output: `.next`
- Ensure wallet adapters are client-side only.

Program (Devnet/Mainnet):

```bash
# Set provider cluster
anchor build
anchor deploy --provider.cluster devnet
```

Update frontend `PROGRAM_ID` only if you deploy a different program than the included IDL.

## Security Notes

- Marketplace PDA owns the escrow ATA; seller cannot transfer listed NFT directly.
- All token transfers are executed via CPI using PDA seeds.
- Inputs validated on-chain (owner, mint, decimals, supply, active listing checks).

## Scripts Reference

- `npm run dev` — start Next.js dev
- `npm run build` — production build
- `npm run anchor-build` — build Anchor program
- `npm run anchor-localnet` — start validator and deploy
- `npm run anchor-test` — run Mocha tests

## License

MIT

## Acknowledgements

- Anchor by Coral
- Metaplex Foundation SDKs
- Solana Wallet Adapter
