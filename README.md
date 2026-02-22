# For Jamie

You're working on the frontend, which lives in `apps/web/` (Next.js 14 + React 18 + Tailwind CSS). There is no backend server — the frontend talks directly to the XRP Ledger over WebSocket.

## First-time setup (Windows)

### 1. Install Node.js
Download and install from [https://nodejs.org](https://nodejs.org) (pick the LTS version, 18+). This also installs npm.

### 2. Install pnpm and Git
Open PowerShell and run:
```powershell
npm install -g pnpm
```
If you don't have Git, install it from [https://git-scm.com/download/win](https://git-scm.com/download/win).

Verify with `node -v` (should be 18+) and `pnpm -v` (should be 8+).

### 3. Clone the repo
```powershell
git clone https://github.com/e-ndorfin/localroots.git
cd localroots
```

### 4. Install dependencies
```powershell
pnpm install
```

### 5. Set up env files
```powershell
copy apps\web\.env.example apps\web\.env
copy apps\web\.env.local.example apps\web\.env.local
```
You don't need to fill in the API keys to get started — the app runs without them.

### 6. Run the frontend
```powershell
pnpm --filter web dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Where to work

- **Pages** — `apps/web/app/` (Next.js App Router)
- **Components** — `apps/web/components/` (React components like Header, AccountInfo, TransactionForm, etc.)
- **Hooks** — `apps/web/hooks/` (wallet connection logic)
- **Styles** — Tailwind CSS, configured in `apps/web/tailwind.config.js`
- **Network config** — `apps/web/lib/networks.js`

You don't need to touch `packages/` (smart contracts) or `apps/web-nuxt/` (Vue version, we're not using it).

---

## Black Business Support App (`apps/black-business/`)

The main app lives in `apps/black-business/`. It uses **Supabase** for authentication (email/password) and database (Postgres), and **XRPL Devnet** for on-chain credentials and tokens.

### Architecture

- **Auth**: Supabase Auth (email + password). Middleware redirects unauthenticated users to `/login` for protected routes.
- **Database**: Supabase Postgres. All data (businesses, loans, circles, vault deposits, loyalty points, etc.) lives in Supabase — no local SQLite.
- **API routes**: 18 Next.js API routes under `app/api/`. Protected routes use `requireAuth()` to verify the session and get the user ID.
- **XRPL**: On-chain credentials for registered businesses, loyalty MPT issuance, RLUSD trustlines. Configured via platform wallet env vars.

### Setup

#### 1. Install dependencies

```bash
pnpm install
```

#### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, and grab:
- **Project URL** (e.g. `https://xxxx.supabase.co`)
- **Anon/public key** (from Settings > API)

#### 3. Configure environment

```bash
cp apps/black-business/.env.local.example apps/black-business/.env.local
```

Add to `apps/black-business/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

#### 4. Run the database schema

Copy the contents of `supabase/schema.sql` and execute it in the **Supabase SQL Editor** (SQL Editor > New query > paste > Run). This creates all tables, indexes, and RPC functions.

**Tip:** For development, go to **Authentication > Providers > Email** and disable "Confirm email" to skip email verification.

#### 5. Initialize XRPL platform wallets (optional)

Only needed if you want on-chain features (business credentials, loyalty tokens):

```bash
node apps/black-business/scripts/init-platform.js
```

This generates 4 funded Devnet wallets (RLUSD issuer, platform master, vault, rewards pool). Copy the output into `.env.local`.

```bash
node apps/black-business/scripts/setup-trustlines.js
node apps/black-business/scripts/create-loyalty-mpt.js
```

Copy the printed `NEXT_PUBLIC_LOYALTY_MPT_ID` into `.env.local`.

#### 6. Run the app

```bash
pnpm --filter black-business dev
```

Open [http://localhost:3001](http://localhost:3001).

### Database schema

All tables live in Supabase Postgres. Schema is defined in `supabase/schema.sql`.

| Table | Purpose |
|-|-|
| `profiles` | User role (customer/business/lender), linked to `auth.users` |
| `businesses` | Registered businesses with category, location, balance |
| `circles` | Lending circles (Grameen mutual guarantee model) |
| `circle_members` | Circle membership |
| `loans` | Microloans with graduated tiers |
| `tranches` | Milestone-gated loan tranches |
| `proofs` | Milestone proofs submitted by borrowers |
| `proof_approvals` | Circle member approvals of proofs |
| `borrower_tiers` | Graduated borrower tiers (Micro/Small/Medium) |
| `points_ledger` | Customer loyalty points (earn/redeem) |
| `lender_interest` | Lender interest tracking |
| `vault_deposits` | Vault deposit/withdrawal event log |

Two Postgres RPC functions (`get_vault_total`, `get_lender_balance`) handle vault balance calculations.

### Key files

```
apps/black-business/
  lib/supabase/
    server.js          # Server-side Supabase client (cookie-based)
    client.js          # Browser-side Supabase client
    auth.js            # requireAuth() helper for protected API routes
    db.js              # Vault helper functions
  middleware.js        # Session refresh + route protection
  app/api/             # 18 API routes (all use Supabase)
  app/login/           # Supabase Auth sign-in
  app/create-*/        # Supabase Auth sign-up (customer & business)
  app/forgot-password/ # Supabase Auth password reset
supabase/
  schema.sql           # Full Postgres schema (run in SQL Editor)
```

**Note:** Devnet wallets expire after ~90 days. If XRPL addresses stop working, re-run the init scripts and update `.env.local`.

---

# Scaffold-XRP

A Next.js-based development stack for building decentralized applications on XRPL with smart contracts. Built with Turborepo, inspired by Scaffold-ETH-2.

## Features

- **Next.js 14** - Modern React framework with App Router
- **Turborepo** - High-performance build system for monorepos
- **XRPL Integration** - Full XRPL client with WebSocket support
- **Multi-Wallet Support** - Connect with Xaman, Crossmark, GemWallet, or manual address
- **Network Switching** - Easy switching between AlphaNet, Testnet, and Devnet
- **Smart Contract Tools** - Deploy and interact with XRPL smart contracts
- **Faucet Integration** - Request test XRP directly from the UI
- **Transaction History** - View your transaction history with explorer links
- **Debug Panel** - Execute custom XRPL commands and view network info
- **Sample Contract** - Counter contract example in Rust

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm 8+
- Rust (optional, for building contracts)

### Installation

```
# Clone the repository
git clone https://github.com/yourusername/scaffold-xrp.git
cd scaffold-xrp

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
scaffold-xrp/
├── apps/
│   └── web/                 # Next.js application
│       ├── app/             # Next.js App Router
│       ├── components/      # React components
│       └── lib/             # Utilities and configurations
├── packages/
│   └── bedrock/             # Smart contracts (Rust)
│       ├── src/
│       │   └── lib.rs       # Counter contract example
│       └── Cargo.toml
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Usage

### Connecting Your Wallet

1. Click "Connect Wallet" in the header
2. Choose your wallet (Xaman, Crossmark, GemWallet) or enter address manually
3. Approve the connection in your wallet extension

### Getting Test XRP

1. Connect your wallet
2. Go to the "Faucet" section
3. Click "Request Test XRP"
4. Wait for the transaction to complete

### Deploying a Smart Contract

1. Build your contract (see [Building Contracts](#building-contracts))
2. Go to "Deploy Contract"
3. Upload your `.wasm` file
4. Confirm the transaction (requires 100 XRP fee)
5. Copy the contract address from the confirmation

### Interacting with Contracts

1. Go to "Interact with Contract"
2. Enter the contract address
3. Enter the function name (e.g., `increment`)
4. Add arguments if needed
5. Click "Call Contract Function"
6. Confirm the transaction in your wallet

## Building Contracts

### Install Rust

```
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown
```

### Build the Counter Contract

```
cd packages/bedrock
cargo build --target wasm32-unknown-unknown --release
```

The compiled WASM file will be at:
```
target/wasm32-unknown-unknown/release/counter.wasm
```

See [packages/bedrock/README.md](packages/bedrock/README.md) for more details.

## Development

### Available Commands

```
pnpm dev          # Start development server
pnpm build        # Build all packages
pnpm lint         # Lint all packages
pnpm format       # Format code with Prettier
pnpm clean        # Clean build artifacts
```

### Environment Variables

Create a `.env.local` file in `apps/web/`:

```
# Optional: Configure default network
NEXT_PUBLIC_DEFAULT_NETWORK=alphanet
```

## Networks

### AlphaNet (Default)
- **WebSocket:** wss://alphanet.nerdnest.xyz
- **Network ID:** 21465
- **Faucet:** https://alphanet.faucet.nerdnest.xyz/accounts
- **Explorer:** https://alphanet.xrpl.org

### Testnet
- **WebSocket:** wss://s.altnet.rippletest.net:51233
- **Network ID:** 1
- **Faucet:** https://faucet.altnet.rippletest.net/accounts
- **Explorer:** https://testnet.xrpl.org

### Devnet
- **WebSocket:** wss://s.devnet.rippletest.net:51233
- **Network ID:** 2
- **Faucet:** https://faucet.devnet.rippletest.net/accounts
- **Explorer:** https://devnet.xrpl.org

## Components

### Core Components

- **Header** - Navigation with wallet connection and network switching
- **AccountInfo** - Display wallet address and balance
- **FaucetRequest** - Request test XRP from network faucet
- **ContractDeployment** - Upload and deploy WASM contracts
- **ContractInteraction** - Call contract functions
- **TransactionHistory** - View transaction history
- **DebugPanel** - Execute custom XRPL commands

### Providers

- **XRPLProvider** - Global state for XRPL connection, wallet, and network

## Technologies

- [Next.js 14](https://nextjs.org/)
- [React 18](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Turborepo](https://turbo.build/)
- [xrpl.js](https://js.xrpl.org/)
- [Bedrock](https://github.com/XRPL-Commons/Bedrock)

## Resources

- [XRPL Documentation](https://xrpl.org/)
- [XRPL Smart Contracts Guide](https://xrpl.org/docs.html)
- [Bedrock GitHub](https://github.com/XRPL-Commons/Bedrock)
- [Scaffold-ETH-2](https://github.com/scaffold-eth/scaffold-eth-2)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Inspired by [Scaffold-ETH-2](https://github.com/scaffold-eth/scaffold-eth-2)
- Built for the XRPL community
- Uses [Bedrock](https://github.com/XRPL-Commons/Bedrock) for smart contract development
