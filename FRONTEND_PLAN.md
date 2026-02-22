# Frontend Pages — Black Business Support App

All pages live under `apps/black-business/app/`. Built with Next.js 14, Tailwind CSS, React 18.

---

## Pages Overview

| Route | File | Role | Description |
|-|-|-|-|
| `/` | `page.js` | Public | Landing / marketing page |
| `/dashboard` | `dashboard/page.js` | All (role-aware) | Role-based dashboard redirect |
| `/directory` | `directory/page.js` | Public | Browse/search Black-owned businesses |
| `/directory/[businessId]` | `directory/[businessId]/page.js` | Customer | Business detail + card checkout |
| `/rewards` | `rewards/page.js` | Customer | Points balance + earn/redeem history |
| `/rewards/redeem` | `rewards/redeem/page.js` | Customer | Redeem points at a business |
| `/business/register` | `business/register/page.js` | Business Owner | Multi-step registration flow |
| `/business/dashboard` | `business/dashboard/page.js` | Business Owner | Revenue stats + ad boost |
| `/vault` | `vault/page.js` | Lender | SAV deposit/withdraw + vault health |
| `/lending` | `lending/page.js` | Lender/Borrower | Browse/create lending circles |
| `/lending/[circleId]` | `lending/[circleId]/page.js` | Lender/Borrower | Circle detail + loan tracking |

---

## Page Details

### 1. Landing Page — `/`

**Purpose**: Marketing page introducing the platform. First thing any visitor sees.

**Content**:
- Hero section explaining the platform mission
- Three CTA buttons routing to each user flow:
  - "Shop & Earn" → `/directory`
  - "List Your Business" → `/business/register`
  - "Support the Community" → `/vault`
- Brief explainers for each user type (Customer, Business Owner, Lender)

**Components needed**: None beyond standard layout. Keep it simple.

**Crypto exposure**: Zero.

---

### 2. Dashboard — `/dashboard`

**Purpose**: Role-aware landing after login. Redirects or renders based on user role.

**Behavior**:
- Customer → shows points summary + recent activity, links to `/rewards` and `/directory`
- Business Owner → shows revenue summary, links to `/business/dashboard`
- Lender → shows vault contribution summary, links to `/vault` and `/lending`

**Components needed**: Role-specific summary cards.

---

### 3. Business Directory — `/directory`

**Purpose**: Browse and search all registered Black-owned businesses.

**Content**:
- Search bar (by name, category)
- Filter by category and location
- Grid/list of business cards
- Boosted/featured businesses appear first (ad revenue feature)
- Each card links to `/directory/[businessId]`

**Components needed**:
- `BusinessCard.js` — name, category, location, optional "Featured" badge
- `BusinessSearch.js` — search input + filter dropdowns

**Crypto exposure**: Zero. Fully customer-friendly.

---

### 4. Business Detail + Checkout — `/directory/[businessId]`

**Purpose**: View a single business and make a card payment.

**Content**:
- Business name, description, category, location
- "Pay with Card" button (Stripe Elements)
- After payment: "You earned X points!" confirmation modal/banner

**Components needed**:
- `CheckoutButton.js` — triggers Stripe card payment (no crypto UI)
- `PointsEarned.js` — post-purchase confirmation showing points earned

**Crypto exposure**: Zero. Customer sees card payment and points only.

---

### 5. Customer Rewards — `/rewards`

**Purpose**: View points balance and transaction history.

**Content**:
- Current points balance (large, prominent number)
- Earn/redeem history list (date, business name, points +/-)
- "Redeem Points" button → `/rewards/redeem`

**Components needed**:
- `PointsBalance.js` — displays current points total
- `PointsHistory.js` — list of earn/redeem events

**Crypto exposure**: Zero. Shows "points", never "tokens".

---

### 6. Redeem Points — `/rewards/redeem`

**Purpose**: Spend points as a discount at a participating business.

**Content**:
- Select a business (dropdown or search)
- Enter points amount to redeem
- Shows USD equivalent (e.g., "500 points = $5.00 off")
- "Redeem" button to confirm

**Components needed**:
- `RedeemForm.js` — business selector, points input, USD preview, submit

**Crypto exposure**: Zero. Points in, discount out.

---

### 7. Business Registration — `/business/register`

**Purpose**: Multi-step form for business owners to register on the platform.

**Steps**:
1. Business info (name, category, location, description)
2. Ownership attestation (self-declaration checkbox for Black ownership)
3. Confirmation / success screen

**What happens on submit** (backend handles this, not frontend concern):
- Platform issues on-chain credential
- RLUSD trustline set up
- MPT loyalty token authorized
- Business appears in directory

**Components needed**:
- `RegistrationForm.js` — multi-step form with progress indicator

**Crypto exposure**: Minimal. Owner doesn't need a wallet. Backend handles all blockchain setup.

---

### 8. Business Dashboard — `/business/dashboard`

**Purpose**: Business owner sees revenue and customer metrics.

**Content**:
- Total revenue received (displayed in USD)
- Number of customers / transactions
- Points redeemed at this business
- Optional: "Boost Visibility" button to purchase featured placement

**Components needed**:
- `RevenueDashboard.js` — revenue stats, customer counts, charts
- `BoostVisibilityForm.js` — optional ad purchase (pay for featured listing)

**Crypto exposure**: Minimal. Shows USD values. RLUSD settlement is invisible.

---

### 9. SAV Vault — `/vault`

**Purpose**: Lender-facing view of the Shared Asset Vault. This is the only section where users interact with crypto directly.

**Content**:
- Vault health overview (total pooled capital, active loans, repayment rate, available capital)
- Deposit RLUSD form (amount input, wallet signature required)
- Withdraw form (request withdrawal of contribution)
- Personal contribution tracker + impact metrics

**Components needed**:
- `VaultOverview.js` — total pooled, health metrics, maybe a chart
- `VaultDepositForm.js` — amount input, connect wallet, sign transaction
- `VaultWithdrawForm.js` — withdrawal request form
- `LenderDashboard.js` — personal contribution, impact stats

**Crypto exposure**: Full. Requires wallet connection (`WalletConnector` web component). Lenders see RLUSD amounts and sign XRPL transactions.

---

### 10. Lending Circles — `/lending`

**Purpose**: Browse existing lending circles or create a new one.

**Content**:
- List of circles (status: forming / active / closed, member count)
- "Create Circle" button
- Each circle links to `/lending/[circleId]`

**Components needed**:
- `CircleList.js` — list/grid of lending circles with status badges

**Crypto exposure**: Moderate. Lenders and borrowers both use this.

---

### 11. Circle Detail — `/lending/[circleId]`

**Purpose**: View circle members, active loans, and manage loan lifecycle.

**Content**:
- Circle members list
- Active loans with tranche/milestone progress
- Loan request form (for borrowers in this circle)
- "Release Tranche" button (for circle members to approve milestone)
- Repayment form + repayment history
- Borrower tier indicator (Micro → Small → Medium)

**Components needed**:
- `CircleDetail.js` — members list, circle status
- `LoanRequestForm.js` — request amount (bounded by borrower tier)
- `TrancheProgress.js` — visual milestone tracker per loan
- `RepaymentForm.js` — RLUSD repayment to vault
- `TierIndicator.js` — graduated tier visualization

**Crypto exposure**: Full. Involves wallet transactions for loan requests, tranche releases, and repayments.

---

## Shared Layout Components

| Component | File | Description |
|-|-|-|
| Root Layout | `app/layout.js` | Providers (Wallet, Auth, App), global styles |
| Header | `components/layout/Header.js` | Branding, nav links, role switcher, conditional WalletConnector (only for lenders) |
| Sidebar | `components/layout/Sidebar.js` | Role-based navigation links |

---

## Tailwind Theme Colors

```js
colors: {
  primary: "#23292F",
  secondary: "#384552",
  accent: "#4f46e5",
  vault: "#059669",      // emerald — SAV/finance pages
  lending: "#7c3aed",    // violet — lending circle pages
  loyalty: "#d97706",    // amber — rewards/points pages
  community: "#dc2626",  // red — empowerment accents
}
```

---

## Build Priority

Pages are listed in the order they should be built (matches master plan phases):

1. **Phase 1**: Landing (`/`), Layout, Header
2. **Phase 3**: `/business/register`, `/directory`, `/directory/[businessId]`
3. **Phase 4**: `/directory/[businessId]` checkout, `/rewards`, `/rewards/redeem`
4. **Phase 6**: `/vault`
5. **Phase 7**: `/lending`, `/lending/[circleId]`
6. **Phase 8**: `/business/dashboard`
7. **Phase 9**: `/dashboard`, polish, responsive design
