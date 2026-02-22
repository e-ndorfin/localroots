# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT: Master Plan

**Always read `MASTER_PLAN.md` at the root of this repository before starting any implementation work.** It contains the comprehensive implementation plan for the Black Business Support App, including architecture, user flows, backend API routes, frontend components, XRPL transaction patterns, smart contract design, and phased build order. All implementation decisions should align with that plan.

## Project Overview

Scaffold-XRP monorepo for building dApps on the XRP Ledger with smart contract support. Inspired by Scaffold-ETH-2. Uses Turborepo with pnpm workspaces.

## Build & Development Commands

```bash
# Install dependencies (requires pnpm 8+, Node.js 18+)
pnpm install

# Run all apps in dev mode
pnpm dev

# Build all apps
pnpm build

# Lint
pnpm lint

# Format with Prettier
pnpm format

# Run a single workspace
pnpm --filter web dev        # Next.js app only
pnpm --filter web-nuxt dev   # Nuxt app only

# Build smart contracts (requires Rust + wasm32-unknown-unknown target)
cd packages/bedrock/contract && cargo build --release --target wasm32-unknown-unknown
```

## Architecture

**Monorepo structure with two frontends and a smart contract package:**

- `apps/web/` — Next.js 14 (React 18) frontend, client-side rendered
- `apps/web-nuxt/` — Nuxt 3 (Vue 3) frontend, SSR disabled
- `packages/bedrock/` — Rust WASM smart contracts (counter example), built with xrpl-wasm-std/macros from Transia-RnD/craft
- `packages/create-xrp/` — CLI scaffolding tool (`create-xrp` npm package)
- `xrpl-js-python-simple-scripts/` — Reference scripts for XRPL transactions (JS & Python). Look here for MPT scripts, escrow scripts, and trustline scripts.

**Wallet integration** uses `xrpl-connect` with multiple adapters (Xaman, WalletConnect, Crossmark, GemWallet). The wallet UI is a web component (`<xrpl-wallet-connector>`) with theme support. State is managed via React Context (`WalletProvider` in `apps/web/components/providers/`).

**Smart contract interaction** uses a `ContractCall` transaction type with hex-encoded function names/args. The counter contract in `packages/bedrock/contract/src/lib.rs` uses persistent on-ledger storage via `get_data`/`set_data`.

## Networks

- **AlphaNet** (default): `wss://alphanet.nerdnest.xyz`, Network ID 21465
- **Testnet**: `wss://s.altnet.rippletest.net:51233`, Network ID 1
- **Devnet**: `wss://s.devnet.rippletest.net:51233`, Network ID 2

Network config is in `apps/web/lib/networks.js`. Default network controlled by `NEXT_PUBLIC_DEFAULT_NETWORK` env var.

## Environment Variables

Copy `.env.example` and `.env.local.example` in each app directory. Key variables:
- `NEXT_PUBLIC_XAMAN_API_KEY` — Xaman wallet API key
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — WalletConnect project ID
- `NEXT_PUBLIC_DEFAULT_NETWORK` — Network selection

## Key Patterns

- Both frontends require extensive Node.js polyfills (crypto, buffer, stream, events) configured in `next.config.js` (webpack) and `nuxt.config.ts` (vite aliases)
- Wallet hooks (`useWalletConnector`, `useWalletManager`) dynamically import adapters to avoid SSR issues
- Contract functions are `#[unsafe(no_mangle)]` extern "C" functions returning i32 (0 = success, -1 = error)
- Prettier config: semicolons on, double quotes, trailing comma ES5, print width 100, tab width 2
