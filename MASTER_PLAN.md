# Black Business Support App — Implementation Plan

## Context

Black-owned small businesses face disproportionate barriers to capital and customer retention. This app solves both sides: a **Shared Asset Vault (SAV)** for community-funded microloans, and an **MPT loyalty rewards system** that drives repeat revenue — all built on XRPL with a crypto abstraction layer so customers and businesses never touch crypto directly.

**Key architectural decision**: The entire crypto/XRPL layer is invisible to end users. Customers pay by card and see "reward points." Businesses receive RLUSD (1:1 USD stablecoin). Only community lenders interact with the blockchain directly.

---

## Architecture Overview

### Monorepo Placement

```
nsbehacks/
  apps/
    web/                          # Existing scaffold demo (unchanged)
    black-business/               # NEW — Black Business Support App
      app/
        layout.js                 # Root layout + providers
        page.js                   # Landing page / marketing
        api/                      # Next.js API routes (backend)
          auth/route.js           # Pseudonym auth (no real identity)
          payments/
            checkout/route.js     # Card → RLUSD conversion (Stripe)
            webhook/route.js      # Stripe webhook for payment confirmation
          loyalty/
            mint/route.js         # Platform mints MPT to customer after purchase
            redeem/route.js       # MPT → RLUSD swap + payout to business
          vault/
            deposit/route.js      # Record SAV contribution
            withdraw/route.js     # Process SAV withdrawal
            status/route.js       # Vault health metrics
          lending/
            apply/route.js        # Loan application processing
            disburse/route.js     # Milestone-based tranche release
            repay/route.js        # Repayment processing
          business/
            register/route.js     # Business registration + credential issuance
            directory/route.js    # Business directory listing
            verify/route.js       # Black ownership attestation
        dashboard/
          page.js                 # Role-aware dashboard
        directory/
          page.js                 # Business directory (browse/search)
          [businessId]/
            page.js               # Individual business page + checkout
        vault/
          page.js                 # SAV overview (lender view)
        lending/
          page.js                 # Lending circles overview
          [circleId]/
            page.js               # Circle detail + loan tracking
        business/
          register/
            page.js               # Business registration flow
          dashboard/
            page.js               # Business owner dashboard
        rewards/
          page.js                 # Customer points balance + history
          redeem/
            page.js               # Redeem points at businesses
      components/                 # (detailed below)
      hooks/                      # (detailed below)
      lib/
        xrpl/                     # XRPL transaction builders
        stripe/                   # Stripe payment integration
        networks.js               # Copied from apps/web/lib/networks.js
        constants.js              # Contract addresses, MPT IDs, fee rates
      next.config.js              # Copied from apps/web (same polyfills)
      tailwind.config.js
      package.json

  packages/
    bedrock/
      contract/                   # Existing counter contract (unchanged)
      vault-contract/             # NEW — SAV state tracking
        src/lib.rs
        Cargo.toml
```

### Network: **Devnet** (`wss://s.devnet.rippletest.net:51233`, Network ID 2)

Required for Batch (XLS-56) and Credentials (XLS-70) amendments. Auto-funded wallets use the pattern from `xrpl-js-python-simple-scripts/js/generate.js` (`client.fundWallet()`).

### Platform Accounts (auto-funded on Devnet)

The backend manages these server-side wallet keys:
- **Platform Master Account** — issues credentials, manages MPT, collects fees
- **SAV Vault Account** — holds pooled lender funds (RLUSD)
- **Rewards Pool Account** — holds MPT tokens for distribution

---

## User Flows

### Flow 1A: Business Owner (Seeking Funding / Borrower)

```
Owner Arrives — Needs Capital
  ↓
Register Business Profile (name, category, location — no credit check)
  ↓
Platform Verifies Black Ownership (self-declaration / community attestation)
  ↓
Join a Lending Circle (4–6 borrowers, Grameen mutual guarantee model)
  ↓
Apply for Microloan via SAV (group provides social guarantee)
  ↓
SAV Reviews & Approves (vault checks available capital)
  ↓
Receive Funds in Installments (milestone-based, not all at once)
  ↓
List on Platform + Enable MPT (participate in loyalty program)
  ↓
Repay Loan on Schedule (repayments refill SAV, unlock bigger loans)
```

### Flow 1B: Business Owner (Established / Loyalty Program Only)

```
Owner Arrives — Already Running, wants more customers
  ↓
Register Business Profile (free to list, zero upfront cost)
  ↓
Platform Verifies Black Ownership
  ↓
Opt Into MPT Loyalty Program (free to join, no subscription ever)
  ↓
Listed in Platform Directory (visible to all customers)
  ↓
Customers Earn Points on Purchases (incentivising return visits)
  ↓
MPT Redeemed → Platform Converts to RLUSD (business gets USD value)
  ↓
Optional: Purchase Boosted Visibility / Ads (platform ad revenue)
```

### Flow 2: Community Lender (Anonymous Contributor)

```
Community Member Arrives — wants to support Black economic empowerment
  ↓
Create Anonymous Account (no real-world ID, pseudonym model)
  ↓
Contribute to Shared Asset Vault / SAV (funds pooled with other lenders)
  ↓
Automated Lending Logic Routes Capital (matched to vetted lending circles)
  ↓
Dashboard: Track Contributions (repayment health, vault activity, impact)
  ↓
Repayments Return to Vault (capital recycles)
  ↓
Re-contribute or Withdraw
```

### Flow 3: Customer / Shopper (Points Earner)

```
Customer Arrives — wants to shop intentionally at Black-owned businesses
  ↓
Register / Browse Directory (discover nearby Black-owned businesses)
  ↓
Checkout — Pay by Card (standard credit/debit, NO crypto knowledge needed)
  ↓
[Backend] Platform Converts Card Payment → RLUSD (hidden from customer)
  ↓
[Backend] RLUSD Paid Out to Business (minus transaction fee)
  ↓
Platform Awards Reward Points ("You earned 120 points" — no mention of tokens)
  ↓
Redeem Points as Discount / Perk at any participating business
  ↓
[Backend] Platform converts MPT → RLUSD to settle with business
```

---

## Payment Infrastructure & Crypto Abstraction Layer

The entire crypto layer is invisible to customers and businesses. They interact with a familiar points-and-discounts system.

### What the Customer Sees

| Customer Action | What They Experience |
|---|---|
| Checkout | "Pay with card" button — standard card payment |
| After purchase | "You earned 120 reward points" |
| Redeeming | "Use 500 points for $5 off" |
| Browsing | Black-owned business directory |

### What's Actually Happening (Backend)

| Step | Backend Reality |
|---|---|
| Card payment | Stripe charge → converted to RLUSD stablecoin |
| Post-purchase | Platform mints MPT tokens to customer's internal account |
| Point redemption | MPT → RLUSD swap executed, paid out to business |
| Vault operations | RLUSD held in SAV, disbursed as microloans in installments |

---

## Monetization & Revenue Streams

### Stream 1: Transaction Fee Loop

Every customer card payment triggers a small platform fee, deducted before business payout.

1. Customer pays by card at checkout
2. Platform converts card charge → RLUSD, routes to business
3. Small transaction fee deducted automatically before payout
4. Fee splits: portion funds reward points pool, portion is platform revenue
5. Platform revenue supplements SAV capital or operating costs

### Stream 2: Business Advertising Revenue

Businesses list and participate **for free — forever.** No subscription, no threshold. Revenue from businesses comes entirely from optional visibility upgrades.

1. Business lists on platform — zero cost, zero friction, no subscription
2. Business optionally pays for featured placement, top-of-search, or promoted categories
3. Ad spend is flexible — pay for a day, a week, or a campaign

### The Self-Reinforcing Growth Flywheel

```
More Businesses → More Customers → More Transactions → More Fees Collected → More Capital + Rewards
(join network)    (attracted by     (volume grows)     (funds SAV + MPT)     (empowers community)
                   reward points)
```

---

## Backend — Next.js API Routes + XRPL

### B1. RLUSD Integration (Stablecoin Settlement)

All money flows use RLUSD (not raw XRP) for USD-pegged stability. Reference patterns:
- **Trustline setup**: `xrpl-js-python-simple-scripts/js/trustline.js` — `TrustSet` with `toHexCurrency("RLUSD")` and LimitAmount
- **RLUSD payments**: `xrpl-js-python-simple-scripts/js/rlusd_transaction.js` — `Payment` with `Amount: { currency: hexCurrency, value, issuer }`
- **Wallet generation**: `xrpl-js-python-simple-scripts/js/generate.js` — `client.fundWallet()` for auto-funded Devnet accounts

Every platform account and business account needs an RLUSD trustline established on registration.

### B2. Card Payment → RLUSD Pipeline (`api/payments/`)

```
Customer clicks "Pay $20" → Stripe charges card → Stripe webhook confirms
→ API route: platform sends RLUSD to business (minus fee)
→ API route: platform mints MPT reward points to customer's internal account
```

**`api/payments/checkout/route.js`** — Creates Stripe PaymentIntent for the card charge
**`api/payments/webhook/route.js`** — On Stripe `payment_intent.succeeded`:
  1. Calculate fee (e.g., 3% of $20 = $0.60 platform, $19.40 to business)
  2. Send RLUSD Payment to business: `{ TransactionType: "Payment", Amount: { currency: RLUSD_HEX, value: "19.40", issuer: RLUSD_ISSUER } }`
  3. Mint MPT loyalty tokens to customer: `{ TransactionType: "Payment", Amount: { mpt_issuance_id: LOYALTY_MPT_ID, value: "120" } }`
  4. Fee portion splits: part to rewards pool, part to SAV, part to platform revenue

Pattern reference: `xrpl-js-python-simple-scripts/js/rlusd_transaction.js` for RLUSD payments, `xrpl-js-python-simple-scripts/js/mpt.js` lines 235-243 for MPT transfers.

### B3. MPT Loyalty Token System (`api/loyalty/`)

**One-time platform setup** (init script, not API route):
```javascript
// Create loyalty MPT — pattern from mpt.js lines 143-151
const mptCreateTx = {
  TransactionType: "MPTokenIssuanceCreate",
  Account: platformWallet.address,
  AssetScale: 0,            // Whole points only (no decimals)
  MaximumAmount: "10000000000",
  TransferFee: 0,           // No fee on point transfers
  MPTokenMetadata: textToHex(JSON.stringify({
    ticker: "BBS",
    name: "Black Business Support Points",
    desc: "Loyalty rewards for shopping Black-owned",
    asset_class: "loyalty"
  })),
  Flags: 0x0010 + 0x0020    // Transfer + Trade (no clawback needed)
};
```

**`api/loyalty/mint/route.js`** — Called after successful payment. Platform sends MPT to customer.
- Customer account must have `MPTokenAuthorize` first (done on registration)
- Pattern: `mpt.js` lines 208-213 for authorization, lines 235-243 for transfer

**`api/loyalty/redeem/route.js`** — Customer spends points at a business:
1. Customer's MPT transferred back to platform: `Payment` with `mpt_issuance_id`
2. Platform sends equivalent RLUSD to business: RLUSD `Payment`
3. Conversion rate: configurable (e.g., 100 points = $1 RLUSD)

Query customer point balance: `account_objects` with `type: "mptoken"` — pattern from `mpt.js` lines 257-281.

### B4. Shared Asset Vault / SAV (`api/vault/`)

The SAV is an XRPL account that holds RLUSD pooled from community lenders. The vault-contract smart contract tracks per-lender contributions and vault health.

**`api/vault/deposit/route.js`**:
1. Lender sends RLUSD `Payment` to vault account (lender signs via wallet)
2. API calls `ContractCall` to `vault-contract.deposit()` to record contribution
3. Pattern: `apps/web/components/ContractInteraction.js` lines 42-56 for ContractCall

**`api/vault/withdraw/route.js`**:
1. API calls `ContractCall` to check lender's withdrawable share
2. Vault account sends RLUSD back to lender
3. Contract state updated via `vault-contract.withdraw()`

**`api/vault/status/route.js`**:
- Returns: total pooled, active loans, repayment rate, available capital
- Reads from vault-contract via `ContractCall` to `get_vault_total()`, `get_active_loans()`

### B5. Lending Circle + Microloan System (`api/lending/`)

**`api/lending/apply/route.js`** — Borrower requests a loan:
1. Verify borrower is in an active circle (check on-chain credential)
2. Check graduated tier via `ContractCall` to `get_borrower_tier()`
3. Verify vault has sufficient capital
4. Create loan record via `ContractCall` to `request_loan()`
5. Set up milestone escrows for installment disbursement

**Milestone-Based Disbursement** (Escrow pattern):
Each loan tranche is an XRPL escrow with time + crypto condition:
```javascript
// Pattern from escrow.js lines 150-161
const escrowTx = {
  TransactionType: "EscrowCreate",
  Account: vaultAccount.address,
  Destination: borrowerAddress,
  Amount: xrpToDrops(trancheAmount),  // or RLUSD amount
  FinishAfter: isoTimeToRippleTime(milestoneDate),
  Condition: condition,  // SHA256 condition from five-bells-condition
};
```
Tranche release requires circle member approval (providing fulfillment) — pattern from `escrow.js` lines 176-187.

**`api/lending/repay/route.js`**:
1. Borrower sends RLUSD to vault account
2. `ContractCall` to `record_repayment()` updates loan state
3. On full repayment, borrower tier upgraded via `upgrade_tier()`

**Credential-Based Circle Membership**:
- Platform issues `CredentialCreate` with type `"CIRCLE_MEMBER"` to each circle member
- Members accept via `CredentialAccept`
- Vault uses `DepositPreauth` with `AuthorizeCredentials` to gate deposits
- Pattern: `xrpl-js-python-simple-scripts/devnet/credentials.js` lines 174-249

### B6. Business Registration (`api/business/`)

**`api/business/register/route.js`**:
1. Save business profile (name, category, location, ownership attestation)
2. Platform issues `CredentialCreate` with type `"REGISTERED_BUSINESS"` — pattern from `credentials.js` lines 174-181
3. Business accepts credential
4. Set up RLUSD trustline for business account — pattern from `trustline.js`
5. Business's account executes `MPTokenAuthorize` for the loyalty MPT — pattern from `mpt.js` lines 208-213
6. Business appears in platform directory

**`api/business/directory/route.js`**:
- Query all accounts with `"REGISTERED_BUSINESS"` credential
- Return list with metadata (name, category, location, visibility boost status)

### B7. Vault Smart Contract (`packages/bedrock/vault-contract/src/lib.rs`)

Follows exact pattern from `packages/bedrock/contract/src/lib.rs`:

```rust
// Same imports and pattern as existing counter contract
use xrpl_wasm_std::core::current_tx::contract_call::get_current_contract_call;
use xrpl_wasm_std::core::current_tx::traits::ContractCallFields;
use xrpl_wasm_std::core::data::codec::{get_data, set_data};

// Storage keys:
// "vault_total"                    -> u64 (total RLUSD in vault, base units)
// "vault_members"                  -> u32 (lender count)
// "vault_member_{hash}"            -> u64 (individual contribution)
// "circle_count"                   -> u32 (total circles)
// "circle_{id}_size"               -> u32 (member count)
// "circle_{id}_status"             -> u8  (0=forming, 1=active, 2=closed)
// "loan_count"                     -> u32 (total loans)
// "loan_{id}_amount"               -> u64
// "loan_{id}_disbursed"            -> u64
// "loan_{id}_repaid"               -> u64
// "loan_{id}_status"               -> u8  (0=pending, 1=active, 2=repaid, 3=defaulted)
// "borrower_{hash}_tier"           -> u8  (1=micro, 2=small, 3=medium)
// "borrower_{hash}_completed"      -> u32 (successful repayments count)

// Exported functions (all #[unsafe(no_mangle)] pub extern "C" fn -> i32):
// deposit(amount: u64)
// withdraw(amount: u64)
// get_vault_total()
// create_circle()
// join_circle(circle_id: u32)
// get_circle_status(circle_id: u32)
// request_loan(circle_id: u32, amount: u64)
// record_disbursement(loan_id: u32, amount: u64)
// record_repayment(loan_id: u32, amount: u64)
// get_borrower_tier(addr_hash: u32)
// get_loan_status(loan_id: u32)
// upgrade_tier(addr_hash: u32)
// get_active_loans()
```

Cargo.toml mirrors `packages/bedrock/contract/Cargo.toml` exactly (same dependencies, same release profile).

---

## Frontend — Next.js App

### F1. Three User Roles, One App

The app renders different views based on user role (stored in local state + on-chain credential):

| Role | Primary Pages | Crypto Exposure |
|------|--------------|-----------------|
| **Customer** | `/directory`, `/rewards`, `/rewards/redeem` | Zero — sees "points" and "card payment" only |
| **Business Owner** | `/business/register`, `/business/dashboard`, `/directory` | Minimal — sees RLUSD payouts, no wallet needed |
| **Community Lender** | `/vault`, `/lending`, `/lending/[circleId]` | Full — connects wallet, interacts with XRPL directly |

### F2. Page Structure

**Landing (`/page.js`)** — Marketing page. Three CTAs: "Shop & Earn", "List Your Business", "Support the Community"

**Business Directory (`/directory`)** — Browse/search Black-owned businesses. Filter by category, location. Boosted businesses appear first (ad revenue). Each listing links to `/directory/[businessId]`.

**Business Detail + Checkout (`/directory/[businessId]`)** — Business info, reviews. "Pay with Card" button triggers Stripe checkout. After payment: "You earned X points!" confirmation. No crypto terminology anywhere.

**Customer Rewards (`/rewards`)** — Points balance (queries MPT via API, displays as integer "points"). Transaction history. "Redeem Points" button.

**Redeem (`/rewards/redeem`)** — Select business, enter points amount, see dollar equivalent. "Redeem" triggers `api/loyalty/redeem` → MPT→RLUSD conversion.

**Business Registration (`/business/register`)** — Multi-step form: business name, category, location, ownership attestation (self-declaration checkbox). On submit → API issues credential, sets up trustlines.

**Business Dashboard (`/business/dashboard`)** — Revenue stats (total RLUSD received), customer count, points redeemed at your business, optional "Boost Visibility" purchase.

**SAV Vault (`/vault`)** — Lender-only view. Shows total pooled capital, active loans, repayment health. Deposit/withdraw RLUSD forms. Requires wallet connection. Uses `WalletConnector` web component from existing app.

**Lending Circles (`/lending`)** — Browse/create circles. Join a forming circle. View active loans per circle.

**Circle Detail (`/lending/[circleId]`)** — Members list, active loans, tranche progress visualization, repayment status. "Release Tranche" button for circle members (provides escrow fulfillment).

### F3. Key Components

**Copied from `apps/web/` (reused as-is):**
- `WalletProvider.js` — from `apps/web/components/providers/WalletProvider.js`
- `useWalletManager.js` — from `apps/web/hooks/useWalletManager.js` (change network to "devnet")
- `useWalletConnector.js` — from `apps/web/hooks/useWalletConnector.js`
- `WalletConnector.js` — from `apps/web/components/WalletConnector.js`
- `next.config.js` — from `apps/web/next.config.js` (same polyfills)

**New components:**

Layout:
- `Header.js` — "Black Business Support" branding, nav links, role switcher, conditional WalletConnector (only for lenders)
- `Sidebar.js` — Role-based navigation

Directory:
- `BusinessCard.js` — Business listing card (name, category, location, "boosted" badge)
- `BusinessSearch.js` — Search/filter bar
- `CheckoutButton.js` — Stripe card payment trigger (no crypto UI)
- `PointsEarned.js` — Post-purchase confirmation ("You earned 120 points!")

Rewards:
- `PointsBalance.js` — Display customer points (queries API, not blockchain directly)
- `RedeemForm.js` — Select business, enter points, see USD equivalent
- `PointsHistory.js` — List of earn/redeem events

Business:
- `RegistrationForm.js` — Multi-step: info → attestation → confirmation
- `RevenueDashboard.js` — RLUSD revenue stats, customer metrics
- `BoostVisibilityForm.js` — Optional ad purchase

Vault (lender-facing, crypto-aware):
- `VaultOverview.js` — Total pooled, health metrics, charts
- `VaultDepositForm.js` — RLUSD deposit amount input, wallet sign
- `VaultWithdrawForm.js` — Withdrawal request
- `LenderDashboard.js` — Personal contribution, impact tracking

Lending (lender/borrower-facing):
- `CircleList.js` — Browse/create circles
- `CircleDetail.js` — Members, loans, guarantor relationships
- `LoanRequestForm.js` — Amount input bounded by graduated tier
- `TrancheProgress.js` — Visual milestone tracker per loan
- `RepaymentForm.js` — RLUSD repayment to vault
- `TierIndicator.js` — Graduated access tier visualization (Micro → Small → Medium)

### F4. State Management

Same React Context pattern as existing app:

- `WalletProvider` (copied) — wallet connection state for lenders
- `AuthProvider` (new) — pseudonymous auth, user role, session
- `AppProvider` (new) — platform config (MPT IDs, contract addresses), XRPL client

Custom hooks:
- `useRewards()` — `{ points, earnHistory, redeemPoints(), isLoading }`
- `useVault()` — `{ vaultHealth, myContribution, deposit(), withdraw() }`
- `useLendingCircle(id)` — `{ circle, loans, joinCircle(), releaseTranche() }`
- `useBusinessProfile()` — `{ isRegistered, register(), revenue, customers }`
- `useDirectory()` — `{ businesses, search(), filter() }`

### F5. Tailwind Theme

Extend `apps/web/tailwind.config.js`:
```javascript
colors: {
  primary: "#23292F",    // existing
  secondary: "#384552",  // existing
  accent: "#4f46e5",     // existing
  // App-specific:
  vault: "#059669",      // emerald — SAV/finance
  lending: "#7c3aed",    // violet — lending circles
  loyalty: "#d97706",    // amber — rewards/points
  community: "#dc2626",  // red — empowerment
}
```

---

## Shared Asset Vault (SAV) — Capital Engine

The central pooling and routing mechanism. Community contributions flow in, vetted microloans flow out. Repayments refill the vault, enabling perpetual capital access for the community.

| | Detail |
|---|---|
| **Inflows** | Anonymous lender contributions aggregated into pool. Loan repayments from borrowers return to vault. Transaction fee share reinvested. |
| **Routing Logic** | Lending circle requests evaluated. Vault health threshold checked. Capital allocated in installments tied to business milestones. |
| **Outflows** | Installment disbursements to approved borrowers. Reward points pool funding. Platform operating revenue (fee share). |

---

## Implementation Phases

### Phase 1: Project Scaffolding
1. Create `apps/black-business/` with `package.json`, `next.config.js` (copy polyfills from `apps/web/next.config.js`), `tailwind.config.js`
2. Copy wallet infra: `WalletProvider.js`, `useWalletManager.js`, `useWalletConnector.js`, `WalletConnector.js` from `apps/web/`
3. Create `app/layout.js` with providers, `app/page.js` landing page, `Header.js` with navigation
4. Create `lib/networks.js` (copy from `apps/web/lib/networks.js`, set default to Devnet)
5. Create `lib/constants.js` (placeholder contract addresses, MPT IDs)
6. Create platform wallet initialization script using `client.fundWallet()` pattern from `xrpl-js-python-simple-scripts/js/generate.js`
7. Verify: `pnpm --filter black-business dev` runs, wallet connects on Devnet

### Phase 2: RLUSD + MPT Platform Setup
1. Create init script: generate platform wallets (master, vault, rewards pool) using Devnet faucet
2. Set up RLUSD trustlines on all platform accounts — pattern from `trustline.js`
3. Create loyalty MPT issuance — pattern from `mpt.js` lines 143-151
4. Store generated MPT issuance ID and wallet addresses in `lib/constants.js`
5. Create `lib/xrpl/client.js` — server-side XRPL client for API routes
6. Create `lib/xrpl/helpers.js` — `textToHex()`, `hexToText()`, submit helpers
7. Verify: MPT created on Devnet, trustlines established

### Phase 3: Business Registration + Directory
1. Build `api/business/register/route.js` — issue `CredentialCreate` for "REGISTERED_BUSINESS", set up RLUSD trustline for business, `MPTokenAuthorize` for loyalty MPT
2. Build `api/business/directory/route.js` — query accounts with business credential
3. Build `/business/register` page with `RegistrationForm.js`
4. Build `/directory` page with `BusinessCard.js`, `BusinessSearch.js`
5. Build `/directory/[businessId]` page
6. Verify: register a business → appears in directory

### Phase 4: Card Payment + Loyalty Points (Customer Flow)
1. Integrate Stripe: `lib/stripe/` client + server config
2. Build `api/payments/checkout/route.js` — create Stripe PaymentIntent
3. Build `api/payments/webhook/route.js` — on payment success: RLUSD to business, MPT to customer
4. Build `CheckoutButton.js` — Stripe Elements card form
5. Build `PointsEarned.js` — post-purchase confirmation
6. Build `/rewards` page with `PointsBalance.js`, `PointsHistory.js`
7. Build `/rewards/redeem` with `RedeemForm.js`
8. Build `api/loyalty/redeem/route.js` — MPT→RLUSD swap
9. Verify: customer pays by card → business receives RLUSD → customer sees points → redeems points

### Phase 5: Vault Smart Contract
1. Create `packages/bedrock/vault-contract/` with `Cargo.toml` (mirror existing contract's dependencies)
2. Implement vault state functions: `deposit()`, `withdraw()`, `get_vault_total()`
3. Implement circle functions: `create_circle()`, `join_circle()`, `get_circle_status()`
4. Implement loan tracking: `request_loan()`, `record_disbursement()`, `record_repayment()`, `get_borrower_tier()`, `upgrade_tier()`
5. Build: `cargo build --release --target wasm32-unknown-unknown`
6. Deploy to Devnet (or AlphaNet if smart contracts not on Devnet)

### Phase 6: SAV Vault Frontend (Lender Flow)
1. Build `api/vault/deposit/route.js`, `api/vault/withdraw/route.js`, `api/vault/status/route.js`
2. Build `useVault()` hook
3. Build `/vault` page with `VaultOverview.js`, `VaultDepositForm.js`, `VaultWithdrawForm.js`
4. Build `LenderDashboard.js` — contribution tracking, impact metrics
5. Verify: lender deposits RLUSD → vault total increases → lender can withdraw

### Phase 7: Lending Circles + Microloans (Borrower Flow)
1. Build `api/lending/apply/route.js` — loan application with graduated tier check
2. Build `api/lending/disburse/route.js` — create milestone escrows using `EscrowCreate` + conditions from `escrow.js`
3. Build `api/lending/repay/route.js` — process repayment, update tier
4. Build credential issuance for circle membership — pattern from `credentials.js` lines 174-249
5. Build `useLendingCircle()` hook
6. Build `/lending` page with `CircleList.js`
7. Build `/lending/[circleId]` with `CircleDetail.js`, `LoanRequestForm.js`, `TrancheProgress.js`, `RepaymentForm.js`
8. Build `TierIndicator.js` — graduated access visualization
9. Verify: create circle → join → request loan → release tranches → repay → tier upgrades

### Phase 8: Business Dashboard + Ads
1. Build `/business/dashboard` with `RevenueDashboard.js` — RLUSD revenue stats
2. Build `BoostVisibilityForm.js` — optional ad purchase
3. Wire boosted businesses to appear first in `/directory`
4. Verify: business sees revenue, can boost visibility

### Phase 9: Polish + Testing
1. Role-based routing guards (redirect if wrong role)
2. Loading states, error handling, responsive design
3. End-to-end test all three user flows against Devnet
4. Edge cases: insufficient vault capital, expired escrows, failed payments

---

## Verification Plan

### Test Flow 1: Customer Purchases & Earns Points
1. Register a test business via `/business/register`
2. Navigate to `/directory/[businessId]` as customer
3. Click "Pay with Card" → use Stripe test card
4. Verify business received RLUSD payment (minus fee)
5. Verify customer sees points in `/rewards`
6. Redeem points at `/rewards/redeem` → verify business receives RLUSD

### Test Flow 2: Lender Deposits & Withdraws
1. Connect wallet on `/vault`
2. Deposit RLUSD to SAV
3. Verify vault total updated
4. Withdraw contribution
5. Verify RLUSD returned to lender wallet

### Test Flow 3: Full Lending Cycle
1. Create lending circle with 4 test wallets
2. All members accept circle membership credentials
3. Deposit RLUSD into vault as lenders
4. Borrower requests microloan (Tier 1: micro)
5. Verify milestone escrows created
6. Release first tranche (time condition met)
7. Release second tranche (circle member provides fulfillment)
8. Borrower repays full loan
9. Verify tier upgraded to Tier 2
10. Verify repayment returned to vault

---

## Production Phases — What Exists vs. What to Build

### PHASE 0: What Already Exists in the Repo (No Work Needed)

These are ready to use as-is or as reference patterns:

| Asset | Location | Status |
|-------|----------|--------|
| **Next.js 14 scaffold app** | `apps/web/` | Working — copy structure for new app |
| **Wallet connection (xrpl-connect)** | `apps/web/components/providers/WalletProvider.js`, `apps/web/hooks/useWalletManager.js`, `apps/web/hooks/useWalletConnector.js` | Working — copy directly |
| **WalletConnector web component** | `apps/web/components/WalletConnector.js` | Working — copy directly |
| **Tailwind CSS config** | `apps/web/tailwind.config.js`, `apps/web/globals.css` | Working — extend with new colors |
| **Node.js polyfills (webpack)** | `apps/web/next.config.js` | Working — copy directly |
| **Network config** | `apps/web/lib/networks.js` | Working — copy, change default to Devnet |
| **ContractCall pattern** | `apps/web/components/ContractInteraction.js` | Working — reuse pattern for vault contract calls |
| **Counter smart contract** | `packages/bedrock/contract/src/lib.rs` | Working — use as template for vault contract |
| **MPT reference script** | `xrpl-js-python-simple-scripts/js/mpt.js` | Reference — copy patterns for loyalty token |
| **Escrow reference script** | `xrpl-js-python-simple-scripts/js/escrow.js` | Reference — copy patterns for loan tranches |
| **RLUSD trustline script** | `xrpl-js-python-simple-scripts/js/trustline.js` | Reference — copy for business/platform setup |
| **RLUSD payment script** | `xrpl-js-python-simple-scripts/js/rlusd_transaction.js` | Reference — copy for settlement payments |
| **Wallet generation script** | `xrpl-js-python-simple-scripts/js/generate.js` | Reference — copy for auto-funded Devnet wallets |
| **Credentials script** | `xrpl-js-python-simple-scripts/devnet/credentials.js` | Reference — copy for circle membership + business registration |
| **Batch transactions script** | `xrpl-js-python-simple-scripts/devnet/batch.js` | Reference — copy for atomic operations |
| **Token escrow script** | `xrpl-js-python-simple-scripts/devnet/tokenEscrow.js` | Reference — copy for MPT + escrow combo |
| **Turborepo config** | `turbo.json`, `pnpm-workspace.yaml` | Working — already supports `apps/*` and `packages/*` |
| **Prettier config** | `.prettierrc` | Working — semicolons, double quotes, trailing comma ES5 |

### PHASE 1: Foundation — Project Setup + Platform Wallets
**Goal**: Get a running Next.js app with XRPL connectivity and platform accounts on Devnet.

**Build**:
- [ ] `apps/black-business/` — New Next.js app (scaffold from `apps/web/`)
- [ ] `apps/black-business/package.json` — Dependencies: next, react, xrpl, xrpl-connect, tailwindcss, stripe
- [ ] Copy + adapt: `next.config.js`, `tailwind.config.js`, `WalletProvider.js`, wallet hooks
- [ ] `lib/networks.js` — Devnet as default
- [ ] `lib/constants.js` — Platform config placeholders
- [ ] `scripts/init-platform.js` — Generate + fund platform wallets on Devnet (uses `client.fundWallet()`)
- [ ] `app/layout.js` — Root layout with providers
- [ ] `app/page.js` — Landing page with three CTA buttons
- [ ] `components/layout/Header.js` — Navigation + conditional wallet connector

**Verify**: `pnpm --filter black-business dev` runs, landing page loads, wallet connects on Devnet.

### PHASE 2: RLUSD + MPT Token Infrastructure
**Goal**: Platform accounts have RLUSD trustlines and a loyalty MPT token exists on Devnet.

**Build**:
- [ ] `scripts/setup-trustlines.js` — RLUSD trustlines for all platform accounts
- [ ] `scripts/create-loyalty-mpt.js` — Create BBS loyalty token issuance
- [ ] `lib/xrpl/client.js` — Server-side XRPL WebSocket client singleton
- [ ] `lib/xrpl/helpers.js` — `textToHex()`, `hexToText()`, `submitAndWait()` wrappers
- [ ] Update `lib/constants.js` with generated MPT issuance ID and wallet seeds

**Verify**: Run scripts against Devnet → MPT issuance visible on explorer, trustlines confirmed.

### PHASE 3: Business Registration + Directory
**Goal**: Businesses can register and appear in a browsable directory.

**Build**:
- [ ] `app/api/business/register/route.js` — Issue REGISTERED_BUSINESS credential, set up trustline, authorize MPT
- [ ] `app/api/business/directory/route.js` — Query registered businesses
- [ ] `app/business/register/page.js` + `components/business/RegistrationForm.js`
- [ ] `app/directory/page.js` + `components/directory/BusinessCard.js`, `BusinessSearch.js`
- [ ] `app/directory/[businessId]/page.js` — Business detail page
- [ ] `hooks/useDirectory.js`, `hooks/useBusinessProfile.js`

**Verify**: Register a test business → it appears in the directory listing.

### PHASE 4: Customer Payment + Loyalty Rewards
**Goal**: Customers pay by card, businesses receive RLUSD, customers earn and redeem points.

**Build**:
- [ ] `lib/stripe/config.js` — Stripe client + server setup
- [ ] `app/api/payments/checkout/route.js` — Create Stripe PaymentIntent
- [ ] `app/api/payments/webhook/route.js` — Handle payment success → RLUSD to business + MPT to customer
- [ ] `app/api/loyalty/mint/route.js` — Mint MPT points after purchase
- [ ] `app/api/loyalty/redeem/route.js` — MPT → RLUSD swap + payout
- [ ] `components/directory/CheckoutButton.js` — Stripe Elements card form
- [ ] `components/directory/PointsEarned.js` — Post-purchase confirmation
- [ ] `app/rewards/page.js` + `components/rewards/PointsBalance.js`, `PointsHistory.js`
- [ ] `app/rewards/redeem/page.js` + `components/rewards/RedeemForm.js`
- [ ] `hooks/useRewards.js`

**Verify**: Full customer loop — pay by card → check RLUSD arrived to business → check points balance → redeem points.

### PHASE 5: Vault Smart Contract
**Goal**: On-chain state tracking for the SAV, lending circles, and loan history.

**Build**:
- [ ] `packages/bedrock/vault-contract/Cargo.toml`
- [ ] `packages/bedrock/vault-contract/src/lib.rs` — All vault/circle/loan functions
- [ ] `packages/bedrock/vault-contract/abi.json`
- [ ] Build + deploy to Devnet/AlphaNet

**Verify**: Call each contract function via `ContractCall` and check state persistence.

### PHASE 6: SAV Vault Frontend (Lender Flow)
**Goal**: Community lenders can deposit RLUSD, track vault health, and withdraw.

**Build**:
- [ ] `app/api/vault/deposit/route.js`, `withdraw/route.js`, `status/route.js`
- [ ] `app/vault/page.js` + `components/vault/VaultOverview.js`, `VaultDepositForm.js`, `VaultWithdrawForm.js`
- [ ] `components/vault/LenderDashboard.js`
- [ ] `hooks/useVault.js`

**Verify**: Deposit RLUSD → vault total increases → withdraw → RLUSD returned.

### PHASE 7: Lending Circles + Microloans
**Goal**: Borrowers can join circles, request loans, receive installments, repay, and graduate to larger loans.

**Build**:
- [ ] `app/api/lending/apply/route.js`, `disburse/route.js`, `repay/route.js`
- [ ] Circle credential issuance (CredentialCreate + CredentialAccept + DepositPreauth)
- [ ] Milestone escrow creation (EscrowCreate with conditions) + release (EscrowFinish with fulfillment)
- [ ] `app/lending/page.js` + `components/lending/CircleList.js`
- [ ] `app/lending/[circleId]/page.js` + `CircleDetail.js`, `LoanRequestForm.js`, `TrancheProgress.js`, `RepaymentForm.js`
- [ ] `components/lending/TierIndicator.js`
- [ ] `hooks/useLendingCircle.js`

**Verify**: Full lending cycle — create circle → join → request loan → release tranches → repay → tier upgrade.

### PHASE 8: Business Dashboard + Ad Revenue
**Goal**: Business owners see revenue stats and can optionally boost visibility.

**Build**:
- [ ] `app/business/dashboard/page.js` + `components/business/RevenueDashboard.js`
- [ ] `components/business/BoostVisibilityForm.js`
- [ ] Wire boosted businesses to sort first in `/directory`

**Verify**: Business dashboard shows RLUSD revenue, boost appears in directory.

### PHASE 9: Polish + Production Readiness
**Goal**: Complete, tested, responsive application.

**Build**:
- [ ] `app/api/auth/route.js` — Pseudonymous auth (email optional)
- [ ] `components/providers/AuthProvider.js` — Role-based routing guards
- [ ] Loading states, error handling on all forms
- [ ] Responsive design (mobile-first for customer-facing pages)
- [ ] Edge case handling: insufficient vault capital, expired escrows, failed Stripe payments
- [ ] End-to-end testing of all three user flows against Devnet

---

## Key Reference Files

- `xrpl-js-python-simple-scripts/js/mpt.js` — MPT issuance, authorization, transfer, balance queries
- `xrpl-js-python-simple-scripts/js/escrow.js` — Escrow create/finish with crypto conditions
- `xrpl-js-python-simple-scripts/js/trustline.js` — RLUSD trustline setup
- `xrpl-js-python-simple-scripts/js/rlusd_transaction.js` — RLUSD payment pattern
- `xrpl-js-python-simple-scripts/js/generate.js` — Auto-funded Devnet wallet creation
- `xrpl-js-python-simple-scripts/devnet/credentials.js` — On-chain credentials + deposit preauth
- `xrpl-js-python-simple-scripts/devnet/batch.js` — Atomic batch transactions
- `packages/bedrock/contract/src/lib.rs` — Smart contract pattern (get_data/set_data, no_mangle extern C)
- `apps/web/components/ContractInteraction.js` — Frontend ContractCall pattern
- `apps/web/components/providers/WalletProvider.js` — React Context wallet state
- `apps/web/hooks/useWalletManager.js` — Wallet adapter initialization
- `apps/web/next.config.js` — Required Node.js polyfills for browser
