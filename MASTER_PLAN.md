# Black Business Support App — Implementation Plan

## Context

Black-owned small businesses face disproportionate barriers to capital and customer retention. This app solves both sides: a **Shared Asset Vault (SAV)** for community-funded microloans, and an **MPT loyalty rewards system** that drives repeat revenue — all built on XRPL with a crypto abstraction layer so customers and businesses never touch crypto directly.

**Key architectural decision**: The entire crypto/XRPL layer is invisible to **all** end users. Customers pay by card and see "reward points." Businesses see USD balances in their dashboard. Community lenders deposit and withdraw via Stripe and see USD balances and earned interest in their dashboard. No user ever touches crypto.

**Supabase persistence + auth (no Rust contract)**: All application state — including vault balances — lives in **Supabase Postgres** (migrated from SQLite). Auth uses **Supabase Auth** (email+password) with middleware-based session management — all `*_pseudonym` columns replaced with `*_user_id UUID` foreign keys to `auth.users`. The Rust WASM contract has been dropped; vault deposit/withdrawal tracking uses Postgres RPC functions (`get_vault_total`, `get_lender_balance`) and helper functions in `lib/supabase/db.js`. XRPL handles the on-chain primitives (RLUSD payments, MPT minting, escrows, credentials). Supabase handles application state, auth, and data that doesn't need to be on-chain. Schema lives in `supabase/schema.sql`.

**Business crypto abstraction (Custodial Model — Option B)**: Businesses do **not** have their own XRPL wallets. The platform holds RLUSD on behalf of businesses in a platform-managed custodial account, tracking each business's balance in an internal ledger. Businesses see dollar amounts in their dashboard and can "withdraw" (which triggers a platform → Stripe Connect payout). This means:
- No XRPL wallet creation per business
- No RLUSD trustline per business
- No `MPTokenAuthorize` per business (businesses never touch MPT — redemption flow goes Customer → Platform → RLUSD credited to business's internal balance)
- Loan disbursements: escrow releases RLUSD from vault to a platform-controlled disbursement account; the business sees "$X milestone released" in their dashboard
- The RLUSD stays in platform custody until the business withdraws

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
            disburse/route.js     # Milestone-based tranche release (escrow creation)
            submit-proof/route.js # Borrower uploads milestone proof
            approve-proof/route.js # Circle member approves proof → escrow release
            repay/route.js        # Repayment processing (principal + interest)
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
        db.js                     # Supabase helper functions (vault balance tracking)
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
Receive 1st Tranche (e.g. $1,000 — locked in escrow until milestone met)
  ↓
Complete Milestone + Submit Proof (receipt, invoice, photo of equipment, etc.)
  ↓
Circle Members Verify Proof (peer review — at least 2/4 members approve)
  ↓
Escrow Released → Receive Next Tranche (repeat for each milestone)
  ↓
All Tranches Disbursed → List on Platform + Enable MPT
  ↓
Repay Loan + Interest on Schedule (repayments return to SAV with interest → lenders earn yield)
```

**Milestone Proof Examples**:
- Tranche 1 ($1,000): Upload receipt for equipment purchase or lease signing
- Tranche 2 ($1,000): Show proof of inventory purchase or contractor payment
- Tranche 3 ($1,000): Demonstrate operational milestone (first sale, storefront photo, etc.)

Each tranche is held in an XRPL escrow with a crypto-condition. Circle members provide the fulfillment (proof approval) to release funds. If a milestone is not met within the deadline, funds return to the SAV automatically.

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
MPT Redeemed → Platform Credits USD to Business Dashboard (custodial balance)
  ↓
Optional: Purchase Boosted Visibility / Ads (platform ad revenue)
```

### Flow 2: Community Lender (Anonymous Contributor)

```
Community Member Arrives — wants to support Black economic empowerment
  ↓
Create Anonymous Account (no real-world ID, pseudonym model)
  ↓
Deposit to Shared Asset Vault / SAV via Stripe card payment (funds pooled with other lenders)
  ↓
Smart Contract Records Contribution (tracks exact amount per lender)
  ↓
Automated Lending Logic Routes Capital (matched to vetted lending circles)
  ↓
Loan Disbursed in Milestone-Gated Tranches (escrow per tranche, proof required)
  ↓
Dashboard: Track Contributions (which loans your capital funded, milestone progress)
  ↓
Borrower Repays Loan + Interest → Returns to SAV (e.g. 5% APR)
  ↓
Lender Sees Pro-Rata Interest in Dashboard (proportional to contribution)
  ↓
Re-contribute or Withdraw (platform balance — Stripe Connect payout for real withdrawals)
```

**Lender → Borrower → Lender Full Cycle (Smart Contract Managed)**:
```
Lender deposits $5,000 via Stripe card payment → platform converts to RLUSD → SAV Vault (smart contract records contribution)
  ↓
Borrower approved for $3,000 loan (3 tranches × $1,000)
  ↓
Tranche 1: $1,000 locked in XRPL escrow → borrower submits proof → circle approves → escrow released
  ↓
Tranche 2: $1,000 locked in XRPL escrow → borrower submits proof → circle approves → escrow released
  ↓
Tranche 3: $1,000 locked in XRPL escrow → borrower submits proof → circle approves → escrow released
  ↓
Borrower repays $3,150 ($3,000 principal + $150 interest at 5%)
  ↓
$3,150 returns to SAV vault → smart contract distributes interest pro-rata to lenders
  ↓
Lender can withdraw original $5,000 + earned interest share, or let it recycle into new loans
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
[Backend] Platform Credits Business's Internal Balance (minus transaction fee)
  ↓
Platform Awards Reward Points ("You earned 120 points" — no mention of tokens)
  ↓
Redeem Points as Discount / Perk at any participating business
  ↓
[Backend] Platform converts MPT → credits USD to business's internal balance
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
| Point redemption | MPT → RLUSD swap executed, USD credited to business's internal ledger |
| Lender deposit | Lender pays via Stripe → platform converts to RLUSD → deposited into SAV on-chain |
| Vault operations | RLUSD held in SAV, disbursed as microloans in installments |

### Stripe Test Mode (Demo / Hackathon)

The entire app runs on **Stripe test mode** for demos. No real money is processed. Use the Stripe test card `4242 4242 4242 4242` (any future expiry, any CVC) for all payment flows — customer checkout, lender deposits, and borrower repayments.

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
  2. Credit business's internal ledger balance with $19.40 (custodial — no on-chain RLUSD transfer to business)
  3. Platform converts card revenue to RLUSD and holds in platform custodial account (for on-chain accounting)
  4. Mint MPT loyalty tokens to customer: `{ TransactionType: "Payment", Amount: { mpt_issuance_id: LOYALTY_MPT_ID, value: "120" } }`
  5. Fee portion splits: part to rewards pool, part to SAV, part to platform revenue

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
2. Platform credits equivalent USD to business's internal ledger balance (custodial — no on-chain transfer to business)
3. Conversion rate: configurable (e.g., 100 points = $1)

Query customer point balance: `account_objects` with `type: "mptoken"` — pattern from `mpt.js` lines 257-281.

### B4. Shared Asset Vault / SAV (`api/vault/`)

The SAV is an XRPL account that holds RLUSD pooled from community lenders. The vault-contract smart contract tracks per-lender contributions and vault health.

**`api/vault/deposit/route.js`**:
1. Stripe PaymentIntent created for lender's card deposit
2. On Stripe webhook confirmation, platform converts USD to RLUSD and deposits into vault on-chain
3. API calls `ContractCall` to `vault-contract.deposit()` to record contribution
4. Pattern: `apps/web/components/ContractInteraction.js` lines 42-56 for ContractCall

**`api/vault/withdraw/route.js`**:
1. API calls `ContractCall` to check lender's withdrawable share
2. Platform credits lender's withdrawal balance (Stripe Connect payout or platform balance for demo)
3. Contract state updated via `vault-contract.withdraw()`

**`api/vault/status/route.js`**:
- Returns: total pooled, active loans, repayment rate, available capital
- Reads from vault-contract via `ContractCall` to `get_vault_total()`, `get_active_loans()`

### B5. Lending Circle + Microloan System (`api/lending/`)

**`api/lending/apply/route.js`** — Borrower requests a loan:
1. Verify borrower is in an active circle (check on-chain credential via XRPL)
2. Check graduated tier via SQLite query on `borrower_tiers` table
3. Verify vault has sufficient capital via `ContractCall` to `get_vault_total()`
4. Insert loan record into SQLite `loans` table; insert tranche rows into `tranches` table
5. Calculate interest (e.g. 5% APR → total repayment = principal × 1.05) in JS
6. Split loan into milestone tranches (e.g. $3,000 loan = 3 × $1,000)
7. Create XRPL escrow for first tranche only (next escrow created after previous milestone met)

**Milestone-Gated Proof-Based Disbursement** (Custodial pattern):

Each tranche requires the borrower to submit proof of a business-related milestone before funds are released. This ensures capital is used productively and gives the lending circle oversight.

> **⚠️ XLS-85 NOT ACTIVE ON TESTNET (verified Feb 22 2026)**
> Native XRPL token escrow (XLS-85) went live on mainnet Feb 12 2026 but is not yet active on
> testnet — `EscrowCreate` with an RLUSD `Amount` returns `tecNO_PERMISSION`. Do NOT use
> `EscrowCreate` for RLUSD tranches. Use the custodial pattern below instead.
> XRP escrow (crypto-conditions, `FinishAfter`, `CancelAfter`) works fine on testnet and can be
> used as a reference for the mechanics, but the actual disbursement must use direct Payments.

**Proof flow per tranche (custodial)**:
1. On loan approval, platform marks tranche as `locked` in SQLite — RLUSD stays in vault account
2. Borrower completes milestone (e.g. buys equipment, signs lease, purchases inventory)
3. Borrower uploads proof via `api/lending/submit-proof/route.js` (receipt, invoice, photo)
4. Circle members review proof (at least 2 of 4+ members must approve)
5. On approval threshold met, platform sends direct RLUSD `Payment` from vault to borrower
6. Smart contract records disbursement via `record_disbursement()`
7. Next tranche unlocked, cycle repeats
8. **Missed deadline**: handled by backend — cron job or check on next action sets tranche to `expired` in SQLite and returns the reserved RLUSD to the vault pool (no on-chain auto-return)

**Milestone proof types**: receipt/invoice upload, photo of purchased equipment/inventory, signed lease or contract, bank statement showing business expense, screenshot of completed task.

```javascript
// disburse/route.js — mark tranche locked in SQLite, no EscrowCreate
db.run("UPDATE tranches SET status = 'locked' WHERE id = ?", [trancheId]);

// approve-proof/route.js — direct Payment when threshold met (replaces EscrowFinish)
const releaseTx = {
  TransactionType: "Payment",
  Account: vaultAccount.address,
  Destination: borrowerAddress,
  Amount: { currency: RLUSD_HEX, issuer: RLUSD_ISSUER, value: String(trancheAmount) },
};
await client.submitAndWait(releaseTx, { autofill: true, wallet: vaultWallet });
db.run("UPDATE tranches SET status = 'released' WHERE id = ?", [trancheId]);
```

The on-chain enforcement of missed deadlines (previously `CancelAfter`) is replaced by backend logic. UX is identical for borrowers and circle members.

**`api/lending/submit-proof/route.js`** — Borrower submits milestone proof:
1. Validate borrower has an active loan with pending milestone (SQLite query on `tranches`)
2. Insert proof metadata (type, description, file reference) into SQLite `proofs` table
3. Update `tranches` row status to `proof_submitted`

**`api/lending/approve-proof/route.js`** — Circle member approves milestone proof:
1. Verify caller is a circle member (check on-chain credential via XRPL)
2. Insert approval into SQLite `proof_approvals` table
3. If approval count threshold met (e.g. 2/4 members, checked in JS), provide escrow fulfillment
4. `EscrowFinish` with fulfillment releases tranche to borrower
5. Update SQLite `tranches` row status to `released`; create next tranche escrow if more milestones remain

**`api/lending/repay/route.js`**:
1. Borrower pays via Stripe card (principal + interest portion) → platform converts to RLUSD → repayment recorded on-chain via XRPL Payment to vault
2. Update SQLite `loans` row (`repaid_amount`, `status`) in JS
3. Calculate pro-rata interest share per lender in JS; update `lender_interest` rows in SQLite
4. On full repayment, update `borrower_tiers` row in SQLite (`tier`, `completed_count`)
5. Update vault contract via `ContractCall` to `deposit()` to reflect repaid capital returning to vault

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
4. Create internal ledger entry for business (balance starts at $0)
5. Business appears in platform directory
- ~~No XRPL wallet, RLUSD trustline, or MPTokenAuthorize needed — custodial model (see Option B above)~~

**`api/business/directory/route.js`**:
- Query all accounts with `"REGISTERED_BUSINESS"` credential
- Return list with metadata (name, category, location, visibility boost status)

### B7. Vault Balance Tracking (Supabase Postgres — no Rust contract)

**Vault balances tracked entirely in Supabase Postgres.** The Rust WASM contract has been dropped. The `vault_deposits` table logs every deposit/withdrawal event. Two Postgres RPC functions and 4 helper functions in `lib/supabase/db.js` replace the contract 1:1:

- `getVaultTotal()` — net vault balance via `supabase.rpc('get_vault_total')`
- `getLenderBalance(userId)` — per-lender net balance via `supabase.rpc('get_lender_balance', { p_user_id })`
- `recordDeposit(userId, amountCents)` — insert deposit row
- `recordWithdrawal(userId, amountCents)` — insert withdrawal row (with balance check)

The XRPL vault account still holds pooled RLUSD on-chain — only the balance *tracking* moved to Supabase.

**Supabase Postgres tables handle everything** (see `supabase/schema.sql`).

---

## Frontend — Next.js App

### F1. Three User Roles, One App

The app renders different views based on user role (stored in local state + on-chain credential):

| Role | Primary Pages | Crypto Exposure |
|------|--------------|-----------------|
| **Customer** | `/directory`, `/rewards`, `/rewards/redeem` | Zero — sees "points" and "card payment" only |
| **Business Owner** | `/business/register`, `/business/dashboard`, `/directory` | Zero — sees USD balances in dashboard (custodial), no wallet needed |
| **Community Lender** | `/vault`, `/lending`, `/lending/[circleId]` | Zero — pays by card, sees USD balances and earned interest in dashboard |

### F2. Page Structure

**Landing (`/page.js`)** — Marketing page. Three CTAs: "Shop & Earn", "List Your Business", "Support the Community"

**Business Directory (`/directory`)** — Browse/search Black-owned businesses. Filter by category, location. Boosted businesses appear first (ad revenue). Each listing links to `/directory/[businessId]`.

**Business Detail + Checkout (`/directory/[businessId]`)** — Business info, reviews. "Pay with Card" button triggers Stripe checkout. After payment: "You earned X points!" confirmation. No crypto terminology anywhere.

**Customer Rewards (`/rewards`)** — Points balance (queries MPT via API, displays as integer "points"). Transaction history. "Redeem Points" button.

**Redeem (`/rewards/redeem`)** — Select business, enter points amount, see dollar equivalent. "Redeem" triggers `api/loyalty/redeem` → MPT→RLUSD conversion.

**Business Registration (`/business/register`)** — Multi-step form: business name, category, location, ownership attestation (self-declaration checkbox). On submit → API issues credential, sets up trustlines.

**Business Dashboard (`/business/dashboard`)** — Revenue stats (total USD earned, custodial balance), customer count, points redeemed at your business, "Withdraw" button (→ Stripe Connect payout), optional "Boost Visibility" purchase.

**SAV Vault (`/vault`)** — Lender-only view. Shows total pooled capital, active loans, repayment health, earned interest. Deposit via Stripe card form. Dashboard shows contribution, earned interest, withdrawal balance.

**Lending Circles (`/lending`)** — Browse/create circles. Join a forming circle. View active loans per circle.

**Circle Detail (`/lending/[circleId]`)** — Members list, active loans, tranche progress visualization (per-milestone proof status), repayment status. Borrowers upload proof here. Circle members review and approve proof to release tranches. Shows interest owed and repayment schedule.

### F3. Key Components

**Copied from `apps/web/` (reused as-is):**
- `next.config.js` — from `apps/web/next.config.js` (same polyfills)

**New components:**

Layout:
- `Header.js` — "Black Business Support" branding, nav links, role switcher
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
- `RevenueDashboard.js` — USD revenue stats (from custodial ledger), customer metrics, withdraw button
- `BoostVisibilityForm.js` — Optional ad purchase

Vault (lender-facing):
- `VaultOverview.js` — Total pooled, health metrics, charts
- `VaultDepositForm.js` — Dollar amount input + Stripe card form
- `VaultWithdrawForm.js` — Withdrawal request (platform balance / Stripe Connect payout)
- `LenderDashboard.js` — Personal contribution, earned interest, funded loans, impact tracking

Lending (lender/borrower-facing):
- `CircleList.js` — Browse/create circles
- `CircleDetail.js` — Members, loans, guarantor relationships
- `LoanRequestForm.js` — Amount input bounded by graduated tier, shows interest rate and repayment schedule
- `TrancheProgress.js` — Visual milestone tracker per loan (pending → proof submitted → approved → released)
- `ProofUpload.js` — Borrower uploads milestone proof (receipt, invoice, photo, etc.)
- `ProofReview.js` — Circle member reviews submitted proof and approves/rejects
- `RepaymentForm.js` — Stripe card repayment form (principal + interest)
- `TierIndicator.js` — Graduated access tier visualization (Micro → Small → Medium)

### F4. State Management

Same React Context pattern as existing app:

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

The central pooling and routing mechanism. Community contributions flow in, vetted microloans flow out. Repayments (with interest) refill the vault, enabling perpetual and growing capital access for the community. Lenders earn yield on their contributions.

| | Detail |
|-|-|
| **Inflows** | Anonymous lender contributions aggregated into pool. Loan repayments (principal + interest) from borrowers return to vault. Transaction fee share reinvested. |
| **Routing Logic** | Lending circle requests evaluated. Vault health threshold checked. Capital allocated in milestone-gated escrow tranches (proof required per tranche). |
| **Outflows** | Milestone-gated tranche disbursements to approved borrowers (escrow per tranche). Reward points pool funding. Platform operating revenue (fee share). |
| **Interest** | Borrowers repay principal + interest (configurable, e.g. 5% APR). Interest distributed pro-rata to lenders based on contribution size. Smart contract tracks each lender's share. |
| **Milestone Gating** | Each loan tranche locked in XRPL escrow. Borrower submits proof (receipt/invoice/photo). Circle members verify and approve (provide escrow fulfillment). Unmet milestones → funds auto-return to vault after deadline. |

---

## Implementation Phases

### Phase 1: Project Scaffolding
1. Create `apps/black-business/` with `package.json`, `next.config.js` (copy polyfills from `apps/web/next.config.js`), `tailwind.config.js`
2. Dependencies: next, react, xrpl, tailwindcss, stripe, @stripe/stripe-js, @stripe/react-stripe-js
3. Create `app/layout.js` with providers, `app/page.js` landing page, `Header.js` with navigation
4. Create `lib/networks.js` (copy from `apps/web/lib/networks.js`, set default to Devnet)
5. Create `lib/constants.js` (placeholder contract addresses, MPT IDs)
6. Create platform wallet initialization script using `client.fundWallet()` pattern from `xrpl-js-python-simple-scripts/js/generate.js`
7. Verify: `pnpm --filter black-business dev` runs, landing page loads

### Phase 2: RLUSD + MPT Platform Setup
1. Create init script: generate platform wallets (master, vault, rewards pool) using Devnet faucet
2. Set up RLUSD trustlines on all platform accounts — pattern from `trustline.js`
3. Create loyalty MPT issuance — pattern from `mpt.js` lines 143-151
4. Store **public** values only in `lib/constants.js` (wallet addresses, MPT issuance ID, RLUSD issuer address, RLUSD currency hex). Store wallet seeds in `.env.local` — never in constants.js, never committed to git.
5. Create `lib/xrpl/client.js` — server-side XRPL client for API routes
6. Create `lib/xrpl/helpers.js` — `textToHex()`, `hexToText()`, submit helpers
7. Verify: use `account_lines` to confirm trustlines exist on each platform account; use `account_objects` with `type: "mpt_issuance"` to confirm the BBS MPT issuance is visible on Devnet

### Phase 3: Business Registration + Directory
1. Build `api/business/register/route.js` — issue `CredentialCreate` for "REGISTERED_BUSINESS", create internal ledger entry (custodial model — no XRPL wallet, trustline, or MPT auth per business)
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

### Phase 5: Vault Smart Contract + SQLite Setup
1. Create `packages/bedrock/vault-contract/` with `Cargo.toml` (mirror existing contract's dependencies)
2. Implement **4 functions only**: `deposit()`, `withdraw()`, `get_vault_total()`, `get_lender_balance()` — same read-modify-write pattern as counter contract
3. Build: `cargo build --release --target wasm32-unknown-unknown`
4. Deploy to Devnet (or AlphaNet if smart contracts not on Devnet)
5. Create `lib/db.js` — `better-sqlite3` connection singleton, runs schema on first boot
6. SQLite schema — tables: `businesses`, `circles`, `circle_members`, `loans`, `tranches`, `proofs`, `proof_approvals`, `borrower_tiers`, `points_ledger`, `lender_interest`
7. Add `blackbusiness.db` to `.gitignore`

### Phase 6: SAV Vault Frontend (Lender Flow) ✅
1. ~~Build `api/vault/deposit/route.js`, `api/vault/withdraw/route.js`, `api/vault/status/route.js`~~ ✅
2. ~~Build `useVault()` hook~~ (inlined in `/vault` page)
3. ~~Build `/vault` page with deposit + withdraw UI, metrics, progress bar~~ ✅
4. ~~Build `LenderDashboard.js`~~ (metrics inlined in `/vault` page)
5. ~~Verify: lender deposits → vault total increases → lender can withdraw (balance updated in dashboard)~~ ✅

### Phase 7: Lending Circles + Microloans (Borrower Flow)
1. Build `api/lending/apply/route.js` — check tier from SQLite `borrower_tiers`, check vault capital via `ContractCall` to `get_vault_total()`, insert into SQLite `loans` + `tranches`, calculate interest in JS
2. Build `api/lending/disburse/route.js` — mark tranche `locked` in SQLite `tranches`; RLUSD stays in vault (no `EscrowCreate` — XLS-85 not active on testnet, see escrow note above)
3. Build `api/lending/submit-proof/route.js` — insert into SQLite `proofs`, update `tranches` status to `proof_submitted`
4. Build `api/lending/approve-proof/route.js` — insert into SQLite `proof_approvals`; if threshold met in JS, send direct RLUSD `Payment` from vault to borrower (replaces `EscrowFinish`), update SQLite `tranches` to `released`
5. Build `api/lending/repay/route.js` — Stripe card payment → platform converts to RLUSD → Payment to vault on XRPL; update SQLite `loans`, `lender_interest`; upgrade `borrower_tiers` in SQLite; call `ContractCall` `deposit()`
6. Build credential issuance for circle membership — pattern from `credentials.js` lines 174-249 (on-chain, XRPL)
7. Build `useLendingCircle()` hook
8. Build `/lending` page with `CircleList.js`
9. Build `/lending/[circleId]` with `CircleDetail.js`, `LoanRequestForm.js`, `TrancheProgress.js`, `RepaymentForm.js`, `ProofUpload.js`, `ProofReview.js`
10. Build `TierIndicator.js` — graduated access visualization
11. Verify: create circle → join → request loan → submit proof → circle approves → tranche released → repay with interest → lenders earn yield → tier upgrades

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
1. Go to `/vault` as lender
2. Deposit $500 via Stripe test card
3. Verify vault total updated
4. Withdraw contribution
5. Verify withdrawal balance updated in dashboard

### Test Flow 3: Full Lending Cycle (Proof-Gated Milestones + Interest)
1. Create lending circle with 4 test wallets
2. All members accept circle membership credentials
3. Deposit $5,000 into vault via Stripe test card as lenders
4. Borrower requests microloan of $3,000 (Tier 1: micro, 3 tranches × $1,000, 5% interest)
5. Verify first tranche escrow created (with CancelAfter deadline)
6. Borrower submits proof for tranche 1 (e.g. equipment receipt)
7. 2 of 4 circle members approve proof
8. Verify escrow released → borrower receives $1,000
9. Repeat proof→approve→release for tranche 2 and 3
10. Borrower repays $3,150 via Stripe card ($3,000 principal + $150 interest)
11. Verify interest distributed pro-rata to lenders
12. Verify lender can withdraw principal + earned interest share
13. Verify borrower tier upgraded to Tier 2
14. Verify repayment returned to vault (capital recycled for next loan)

---

## Production Phases — What Exists vs. What to Build

### PHASE 0: What Already Exists in the Repo (No Work Needed)

These are ready to use as-is or as reference patterns:

| Asset | Location | Status |
|-------|----------|--------|
| **Next.js 14 scaffold app** | `apps/web/` | Working — copy structure for new app |
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
- [x] `apps/black-business/` — Next.js app with Jamie's frontend design system
- [x] `apps/black-business/package.json` — Dependencies: next, react, xrpl, tailwindcss, stripe, @stripe/stripe-js, @stripe/react-stripe-js, sql.js
- [x] `next.config.js` (Node.js polyfills), `tailwind.config.js`, `jsconfig.json`, `postcss.config.mjs`
- [x] `lib/networks.js` — Devnet as default
- [x] `lib/constants.js` — Platform config (addresses, MPT ID, fee rates)
- [x] `scripts/init-platform.js` — Generate + fund platform wallets on Devnet
- [x] `app/layout.js` — Root layout with metadata
- [x] `app/page.js` — Landing page with Jamie's design
- [x] `components/layout/Header.js`, `Sidebar.js`, `AppFrame.js`, `UserAvatarLink.js`

**Verify**: `pnpm --filter black-business dev` runs, landing page loads, build succeeds.

### PHASE 2: RLUSD + MPT Token Infrastructure
**Goal**: Platform accounts have RLUSD trustlines and a loyalty MPT token exists on Devnet. After this phase, the platform can send/receive RLUSD (the stablecoin used for all money flows) and mint/transfer BBS loyalty points (the MPT token customers earn).

**Build**:
- [x] `scripts/setup-trustlines.js` — RLUSD trustlines for all platform accounts
- [x] `scripts/create-loyalty-mpt.js` — Create BBS loyalty token issuance
- [x] `lib/xrpl/client.js` — Server-side XRPL WebSocket client singleton
- [x] `lib/xrpl/helpers.js` — `textToHex()`, `hexToText()`, `submitAndWait()` wrappers
- [x] Update `lib/constants.js` with **public** values only: wallet addresses, MPT issuance ID, RLUSD issuer address, RLUSD currency hex. Wallet seeds go in `.env.local` — never in constants.js, never committed to git.

**Verify**: Use `account_lines` to confirm trustlines exist on each platform account; use `account_objects` with `type: "mpt_issuance"` to confirm BBS MPT issuance is visible on Devnet.

### PHASE 3: Business Registration + Directory
**Goal**: Businesses can register and appear in a browsable directory.

**Build**:
- [x] `app/api/business/register/route.js` — Issue REGISTERED_BUSINESS credential (XRPL CredentialCreate), create internal ledger entry
- [x] `app/api/business/directory/route.js` — Query registered businesses from SQLite
- [x] `app/business/register/page.js` + `components/business/RegistrationForm.js`
- [x] `app/directory/page.js` + `components/directory/BusinessCard.js`, `BusinessSearch.js`
- [x] `app/directory/[businessId]/page.js` — Business detail page (uses mockData for products)
- [x] `hooks/useDirectory.js`, `hooks/useBusinessProfile.js`

**Verify**: Register a test business → it appears in the directory listing.

### PHASE 4: Customer Payment + Loyalty Rewards
**Goal**: Customers pay by card, businesses receive RLUSD, customers earn and redeem points. MPT loyalty tokens minted/transferred on-chain as an on-chain mirror of the Supabase points ledger.

**Build**:
- [x] `app/api/payments/checkout/route.js` — Create Stripe PaymentIntent (Supabase + Stripe, mock fallback). Dev mode now does full post-payment inline: credits business, awards points, mints MPT on-chain, returns `earnedPoints`.
- [x] `app/api/payments/webhook/route.js` — Handle payment success → credits business balance + awards points + mints MPT on-chain (with graceful degradation)
- [x] `app/api/loyalty/mint/route.js` — Award points (Supabase only)
- [x] `app/api/loyalty/redeem/route.js` — Redeem points, credit business, transfer MPT back to platform on-chain (with graceful degradation)
- [x] `app/api/loyalty/balance/route.js` — Query customer points balance + history
- [x] `components/checkout/CheckoutButton.js` — Checkout button (UI stub, no real Stripe Elements)
- [x] `components/checkout/PointsEarned.js` — Post-purchase confirmation
- [x] `app/rewards/page.js` + `components/rewards/PointsBalance.js`, `PointsHistory.js` — fetches real data from API (removed hardcoded 1840 fallback + mock history)
- [x] `app/rewards/redeem/page.js` + `components/rewards/RedeemForm.js`
- [x] `lib/xrpl/wallets.js` — **NEW** — `getOrCreateCustomerWallet(supabase, userId)`: generates Devnet wallet, funds via faucet, authorizes for loyalty MPT, persists to `customer_wallets` table
- [x] `lib/xrpl/loyalty.js` — **NEW** — `mintMPT(client, address, points)` and `redeemMPT(client, wallet, points)`: on-chain MPT Payment transactions with graceful degradation (XRPL failures logged, not thrown — Supabase is source of truth)
- [x] `supabase/schema.sql` — Added `customer_wallets` table (`user_id`, `xrpl_address`, `seed_encrypted`, `mpt_authorized`) + index
- [x] Wire XRPL into webhook: MPT minting to customer after Stripe payment confirmation
- [x] Wire XRPL into checkout (dev mode): MPT minting inline when no Stripe key configured
- [x] Wire XRPL into redeem: MPT transferred back to platform on-chain
- [x] `app/checkout/page.js` — Fixed: `POINTS_PER_DOLLAR` corrected from 100→10, removed dead `bb-pseudonym` localStorage usage, cart items grouped by `businessId`, fetches loyalty balance on mount to validate "Use points" toggles, uses `earnedPoints` from API response, dispatches `points-updated` event for Header pill
- [x] `app/directory/[businessId]/page.js` — Cart items now include `businessId` from URL param
- [x] `components/layout/Header.js` — Points pill now fetches real balance from `/api/loyalty/balance`, only shows for customer role, re-fetches on route change + `points-updated` custom event. Role resolved from Supabase `profiles` table (replaced dead `bb-role` localStorage read).
- [x] Wire XRPL into webhook: RLUSD Payment to business after Stripe payment — N/A under custodial model (business has no XRPL wallet, Supabase ledger is source of truth)
- [x] `CheckoutButton` — fake Stripe-style card UI sufficient for hackathon demo

**Verify**: Full customer loop — pay by card → check points in Supabase `points_ledger` → check MPT balance on-chain via Devnet explorer → check Header pill updates → redeem points → MPT balance decreases. Dev mode (no Stripe key) works end-to-end inline.

### PHASE 5: Vault Balance Tracking + Supabase Setup *(Supabase Postgres — no Rust contract)*
**Goal**: Vault balances tracked in Supabase Postgres alongside all other app state. No Rust WASM contract needed.

**Build**:
- [x] ~~`lib/db.js` — `sql.js` singleton~~ → Migrated to Supabase. `lib/supabase/server.js`, `client.js`, `auth.js`, `db.js` replace the old SQLite layer.
- [x] ~~SQLite schema~~ → `supabase/schema.sql`: `profiles`, `businesses`, `circles`, `circle_members`, `loans`, `tranches`, `proofs`, `proof_approvals`, `borrower_tiers`, `points_ledger`, `lender_interest`, `vault_deposits` (12 tables). All `*_pseudonym` columns replaced with `*_user_id UUID` foreign keys.
- [x] Vault helper functions in `lib/supabase/db.js`: `getVaultTotal()`, `getLenderBalance()`, `recordDeposit()`, `recordWithdrawal()` — backed by Postgres RPC functions
- [x] ~~Add `blackbusiness.db` to `.gitignore`~~ — no local DB file needed with Supabase
- [x] `middleware.js` — Supabase Auth session refresh + route protection
- [x] Auth pages wired to Supabase Auth: login, create-customer-account, create-business-account, forgot-password
- [x] All 18 API routes migrated from SQLite to Supabase query builder

**Verify**: Run `supabase/schema.sql` in SQL Editor. Create account → sign in → vault deposit works → data visible in Supabase dashboard.

### PHASE 6: SAV Vault Frontend (Lender Flow)
**Goal**: Community lenders can deposit via Stripe, track vault health, see earned interest, and withdraw.

**Build**:
- [x] `app/api/vault/deposit/route.js`, `withdraw/route.js`, `status/route.js` — all implemented (SQLite only)
- [x] `app/vault/page.js` — wired to /api/vault/status and /api/vault/deposit
- [x] `components/vault/VaultOverview.js`, `VaultDepositForm.js`, `VaultWithdrawForm.js`, `LenderDashboard.js` — UI present
- [ ] Wire XRPL into deposit: RLUSD Payment from platform → vault account
- [ ] Wire XRPL into withdraw: RLUSD Payment from vault → platform account
- [ ] `VaultDepositForm` / `VaultWithdrawForm` — wire to real API calls (currently UI stubs)

**Verify**: Deposit via Stripe test card → vault total increases → withdraw → balance updated in dashboard (principal + earned interest).

### PHASE 7: Lending Circles + Microloans
**Goal**: Borrowers join circles, request loans disbursed in proof-gated milestone tranches, repay with interest that flows back to lenders. Circle/loan/proof/tier state in SQLite; XRPL handles credentials and RLUSD payments.

**Build**:
- [x] `app/api/lending/apply/route.js` — tier check, vault capital check, inserts loans + tranches (SQLite only)
- [x] `app/api/lending/disburse/route.js` — marks tranche `locked` in SQLite (custodial, no EscrowCreate)
- [x] `app/api/lending/submit-proof/route.js` — inserts proofs, updates tranche status (SQLite only)
- [x] `app/api/lending/approve-proof/route.js` — inserts approvals, checks threshold, updates tranche to `released` (SQLite only)
- [x] `app/api/lending/repay/route.js` — updates repaid_cents, upgrades borrower tier (SQLite only)
- [x] `app/api/lending/circles/route.js` — GET list / POST create circles
- [x] `app/api/lending/circles/[circleId]/route.js` — GET circle detail + members + loans
- [x] `app/api/lending/circles/[circleId]/join/route.js` — POST join circle
- [x] `app/lending/page.js` + `components/lending/CircleList.js`
- [x] `app/lending/[circleId]/page.js` + `CircleDetail.js`, `LoanRequestForm.js`, `TrancheProgress.js`, `RepaymentForm.js`, `TierIndicator.js`
- [ ] Wire XRPL into approve-proof: RLUSD Payment from vault → borrower on tranche release
- [ ] Wire XRPL into repay: RLUSD Payment back to vault on repayment
- [ ] Circle credential issuance (CredentialCreate + CredentialAccept) — XRPL

**Verify**: Full lending cycle — create circle → join → request loan → submit proof for tranche 1 → circle approves → RLUSD released → repeat → repay with interest → lenders earn yield → tier upgrade.

### PHASE 8: Business Dashboard + Ad Revenue
**Goal**: Business owners see revenue stats and can optionally boost visibility.

**Build**:
- [x] `app/business/tracking/page.js` — business metrics dashboard (Jamie's frontend)
- [x] `app/business/storefront/page.js` — product CRUD + live preview (Jamie's frontend)
- [x] `app/business/funding/page.js` + `app/business/funding/status/page.js` — loan request + timeline
- [ ] Wire business dashboard to real SQLite revenue data (currently hardcoded metrics)
- [ ] `components/business/BoostVisibilityForm.js` — optional ad purchase (stub exists)
- [ ] Wire boosted businesses to sort first in `/directory`

**Verify**: Business dashboard shows real revenue from SQLite, boost appears in directory.

### PHASE 9: Polish + Production Readiness
**Goal**: Complete, tested, responsive application.

**Build**:
- [x] Auth — Replaced pseudonym system with Supabase Auth (email+password). Login, signup, forgot-password pages wired to `supabase.auth`. `middleware.js` refreshes session + redirects unauthenticated users. `requireAuth()` helper protects all API routes.
- [x] Role-based routing guards — `middleware.js` redirects unauthenticated users to `/login` for protected paths (`/dashboard`, `/vault`, `/lending`, `/rewards`, `/business`, `/checkout`)
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
- `apps/web/components/ContractInteraction.js` — Backend ContractCall pattern (server-side only)
- `apps/web/next.config.js` — Required Node.js polyfills for browser
