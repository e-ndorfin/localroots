# LocalRoots

A community-powered platform connecting customers with Black-owned businesses through loyalty rewards, microloans, and a shared asset vault — all built on the XRP Ledger with a complete crypto abstraction layer (no user ever touches crypto).

**Customers** discover Black-owned businesses, pay by card, and earn reward points. **Business owners** register for free, receive payments, and grow their customer base. **Community lenders** deposit into a shared vault that funds milestone-gated microloans for new businesses, earning interest on their contributions.

Built with Next.js 14, Supabase, Stripe, and XRPL (Devnet).

## Prerequisites

- **Node.js 18+** — [https://nodejs.org](https://nodejs.org)
- **pnpm 8+** — install with `npm install -g pnpm`
- **Git** — [https://git-scm.com](https://git-scm.com)

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/e-ndorfin/localroots.git
cd localroots
pnpm install
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, and grab:
- **Project URL** (e.g. `https://xxxx.supabase.co`)
- **Anon/public key** (Settings > API > Project API keys)

### 3. Set up environment variables

```bash
cp apps/black-business/.env.local.example apps/black-business/.env.local
```

Open `apps/black-business/.env.local` and add your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. Run the database schema

Copy the contents of `supabase/schema.sql` and run it in the **Supabase SQL Editor** (SQL Editor > New query > paste > Run). This creates all 14 tables, indexes, and RPC functions.

**Tip:** Go to Authentication > Providers > Email and disable "Confirm email" to skip email verification during development.

### 5. Initialize XRPL platform wallets (optional)

Only needed for on-chain features (business credentials, loyalty token minting, RLUSD settlement):

All scripts must be run from `apps/black-business/` so they can read `.env.local`:

```bash
cd apps/black-business
```

**5a.** Generate 4 funded Devnet wallets:

```bash
node scripts/init-platform.js
```

**5b.** Copy **all** the printed values into `.env.local` before continuing. The next scripts read these env vars at startup and will fail without them.

**5c.** Set up trustlines, mint initial RLUSD supply, and create the loyalty token (run these in order):

```bash
node scripts/setup-trustlines.js
node scripts/mint-rlusd.js
node scripts/create-loyalty-mpt.js
```

**5d.** Copy the printed `NEXT_PUBLIC_LOYALTY_MPT_ID` into `.env.local`.

### 6. Run the app

```bash
pnpm --filter black-business dev
```

Open [http://localhost:3001](http://localhost:3001).

## Stripe (optional)

For card payment flows (customer checkout, lender deposits, loan repayments), add Stripe test keys to `.env.local`:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Without Stripe keys, the app runs in dev mode with simulated payments. Use Stripe test card `4242 4242 4242 4242` (any future expiry, any CVC) for all payment flows.

## OpenAI (optional)

For AI-generated storefront images when businesses register, add an OpenAI API key to `.env.local`:

```
OPENAI_API_KEY=sk-...
```

Without this key, businesses still register normally — they just won't get an auto-generated storefront image.

## How It Works

### Three user roles, one app

| Role | What they do | Crypto exposure |
|-|-|-|
| **Customer** | Browse directory, pay by card, earn/redeem reward points | None — sees "points" and "card payment" |
| **Business Owner** | Register business, receive payments, track revenue | None — sees USD balances |
| **Community Lender** | Deposit into vault, fund microloans, earn interest | None — pays by card, sees USD balances |

### Core features

- **Business Directory** — Browse and search Black-owned businesses by category and location
- **Card Payments + Loyalty Points** — Customers pay by card, automatically earn reward points (backed by MPT tokens on XRPL)
- **Point Redemption** — Spend points as discounts at any participating business
- **Shared Asset Vault (SAV)** — Community members deposit funds that get pooled for microloans
- **Lending Circles** — Grameen-model mutual guarantee groups (4-6 members) that vouch for borrowers
- **Milestone-Gated Microloans** — Loans disbursed in tranches; each tranche requires proof of a business milestone (receipt, invoice, photo) approved by circle members before funds release
- **Interest + Tier Upgrades** — Borrowers repay with interest (flows back to lenders); successful repayment unlocks higher loan tiers

### What happens behind the scenes

All crypto is invisible to users. The XRPL Devnet handles:
- **RLUSD** (stablecoin) for settlement between platform accounts
- **MPT tokens** for loyalty point minting/redemption on-chain
- **Credentials** for verified business registration and lending circle membership
- **Custodial wallets** — each business gets a custodial XRPL wallet on registration; the platform manages keys and tracks balances in both Supabase and on-chain

## Project Structure

```
localroots/
  apps/
    black-business/           # Main app (Next.js 14)
      app/
        api/                  # 31 API routes (auth, payments, lending, vault, etc.)
        dashboard/            # Role-aware dashboard
        directory/            # Business directory + detail pages
        vault/                # Lender deposit/withdraw
        lending/              # Lending circles + loan management
        rewards/              # Customer points + redemption
        business/             # Business registration + dashboard
        login/                # Supabase Auth sign-in
        create-customer-account/
        create-business-account/
      components/             # React components (checkout, lending, rewards, vault, etc.)
      lib/
        supabase/             # Supabase clients, auth helpers, vault DB functions
        xrpl/                 # XRPL transaction builders (loyalty, lending, wallets)
        stripe/               # Stripe client + server config
      scripts/                # Platform wallet init, trustline setup, MPT creation
      middleware.js           # Session refresh + route protection
    web/                      # Scaffold-XRP demo app (unchanged)
  supabase/
    schema.sql                # Full Postgres schema (14 tables + RPC functions)
  packages/
    bedrock/                  # Rust WASM smart contracts
```

## Database

All tables live in Supabase Postgres. Schema defined in `supabase/schema.sql`.

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
| `customer_wallets` | Custodial XRPL wallets for customers |
| `business_wallets` | Custodial XRPL wallets for businesses |
| `vault_deposits` | Vault deposit/withdrawal event log |

## Environment Variables Reference

All variables go in `apps/black-business/.env.local`. See `.env.local.example` for the full template.

| Variable | Required | Source |
|-|-|-|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase dashboard |
| `NEXT_PUBLIC_RLUSD_ISSUER` | For XRPL | `scripts/init-platform.js` |
| `RLUSD_ISSUER_SEED` | For XRPL | `scripts/init-platform.js` |
| `NEXT_PUBLIC_PLATFORM_MASTER_ADDRESS` | For XRPL | `scripts/init-platform.js` |
| `PLATFORM_MASTER_SEED` | For XRPL | `scripts/init-platform.js` |
| `NEXT_PUBLIC_VAULT_ADDRESS` | For XRPL | `scripts/init-platform.js` |
| `VAULT_SEED` | For XRPL | `scripts/init-platform.js` |
| `NEXT_PUBLIC_REWARDS_POOL_ADDRESS` | For XRPL | `scripts/init-platform.js` |
| `REWARDS_POOL_SEED` | For XRPL | `scripts/init-platform.js` |
| `NEXT_PUBLIC_LOYALTY_MPT_ID` | For XRPL | `scripts/create-loyalty-mpt.js` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For payments | Stripe dashboard |
| `STRIPE_SECRET_KEY` | For payments | Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | For payments | Stripe dashboard |
| `OPENAI_API_KEY` | Optional | [OpenAI dashboard](https://platform.openai.com/api-keys) |

## Tech Stack

- [Next.js 14](https://nextjs.org/) — React framework with App Router
- [Supabase](https://supabase.com/) — Auth (email/password) + Postgres database
- [XRPL](https://xrpl.org/) — On-chain settlement, credentials, and loyalty tokens (Devnet)
- [Stripe](https://stripe.com/) — Card payments (test mode)
- Custom CSS — Hand-crafted styling with CSS variables and responsive design
- [Turborepo](https://turbo.build/) — Monorepo build system

## Notes

- Devnet wallets expire after ~90 days. Re-run the init scripts and update `.env.local` if XRPL features stop working.
- The app gracefully degrades if XRPL env vars are missing — Supabase is the source of truth for all balances and state.
- Without Stripe keys, payment flows run in simulated dev mode.

## License

MIT
