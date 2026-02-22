# LocalRoots — Hackathon Demo Video Plan

## Context

4-minute voiceover screen recording for a hackathon submission. The app will be fully built before recording. Balanced judging criteria (tech, impact, business viability). Key emphasis: **crypto abstraction** — customers never know it's blockchain. This aligns with Ripple's mission.

---

## Timing Breakdown

| Section | Time | Duration |
|-|-|-|
| 1. Hook + Problem | 0:00–0:30 | 30s |
| 2. Solution + Architecture | 0:30–1:10 | 40s |
| 3. Customer Demo (live app) | 1:10–2:00 | 50s |
| 4. Business Owner Demo (live app) | 2:00–2:30 | 30s |
| 5. Lender Demo — Vault + Circles (live app) | 2:30–3:10 | 40s |
| 6. XRPL Tech Stack | 3:10–3:35 | 25s |
| 7. Business Model + Flywheel | 3:35–3:50 | 15s |
| 8. Closing | 3:50–4:00 | 10s |

---

## Diagrams to Create (5 total)

Make these in Figma, Canva, or styled HTML pages. Export as high-res PNGs.

### Diagram 1: "What You See vs What Actually Happens" (Side-by-Side)

This is the money shot — shows the crypto abstraction in one glance.

| Customer Sees | What XRPL Does |
|-|-|
| Pay $20 with card | Stripe charge → RLUSD stablecoin |
| "You earned 120 points!" | Platform mints 120 MPT tokens on-chain |
| Use 500 points for $5 off | MPT transferred back → RLUSD paid to business |

### Diagram 2: Architecture Overview

Three horizontal layers:
- **Top**: Users (Customer / Business Owner / Lender) with icons
- **Middle**: Next.js backend (API routes, Stripe, XRPL client)
- **Bottom**: XRPL Devnet (RLUSD, MPT, Escrows, Credentials, Smart Contracts, Batch)

Arrows: Customer → Stripe → Backend → XRPL. Lender → Wallet → XRPL directly. Business receives RLUSD (shown as USD).

### Diagram 3: Payment Flow

Linear left-to-right flow:
```
Card Payment → Stripe → Platform Backend → ┬→ RLUSD to Business (minus 3% fee)
                                            └→ MPT to Customer (reward points)
Fee splits: rewards pool + SAV capital + platform revenue
```

### Diagram 4: Lending Circle / SAV Flow

Circular flow:
```
Lenders deposit RLUSD → SAV Vault → Lending Circle approves →
Milestone Escrows → Borrower receives tranches → Repays → Back to SAV
```
Include: Grameen model (4-6 borrowers, mutual guarantee). Graduated tiers: Micro ($500) → Small ($2,000) → Medium ($5,000).

### Diagram 5: The Flywheel

Four-node circular diagram:
```
More Businesses → More Customers → More Transactions → More Capital → (loop)
(free directory)   (reward points)   (fee revenue)       (SAV + rewards)
```
Label the arrows: "transaction fees" and "optional ad boosts"

---

## Script + Screen Sequence

### SECTION 1: Hook + Problem (0:00–0:30)

**Screen**: Title slide "LocalRoots" with tagline. Fade to **Diagram 1** (What You See vs What Actually Happens).

**Script**:

> What if you could harness the power of blockchain — stablecoins, smart contracts, tokenized rewards — without a single user ever knowing it was there?
>
> LocalRoots is a platform connecting Black-owned businesses with customers and community lenders. Customers pay by card and earn reward points. Businesses receive dollars. And underneath, every transaction settles on XRPL using RLUSD, MPT tokens, escrows, and smart contracts.
>
> The crypto layer is completely invisible. This is Ripple's vision realized: crypto that's useful precisely because you don't know it's crypto.

---

### SECTION 2: Solution + Architecture (0:30–1:10)

**Screen**: **Diagram 2** (Architecture Overview). Briefly flash **Diagram 3** (Payment Flow).

**Script**:

> LocalRoots serves three user types, each with a different level of crypto exposure.
>
> Customers have zero crypto exposure. They browse a directory of Black-owned businesses, pay with a credit card through Stripe, and earn reward points. They never see a wallet, a token, or a blockchain address.
>
> Business owners have minimal exposure. They register for free, get listed in the directory, and receive payments in RLUSD — which they see as dollar amounts. No wallet required. No subscriptions, ever.
>
> Community lenders have full crypto exposure. They connect an XRPL wallet, deposit RLUSD into our Shared Asset Vault, and fund microloans through lending circles — a Grameen-style model where four to six borrowers mutually guarantee each other.
>
> Under the hood, our Next.js backend converts card payments to RLUSD, mints MPT loyalty tokens, manages escrow-based loan disbursements, and tracks everything through a Rust WASM smart contract on XRPL Devnet.

---

### SECTION 3: Customer Demo — Live App (1:10–2:00)

**Screen**: Live app walkthrough.

**Demo sequence**:
1. Landing page (`/`) — show 3 CTAs (2 sec)
2. Click "Shop & Earn" → `/directory`
3. Business Directory — scroll grid, show search/filter, point out "Featured" badge
4. Click a business card → `/directory/[businessId]`
5. Business Detail — click "Pay with Card"
6. Stripe checkout modal — enter test card `4242 4242 4242 4242`, submit
7. Success: "You earned 120 points!" banner
8. Navigate to `/rewards` — show points balance (620 pts), earn history
9. Click "Redeem Points" → `/rewards/redeem` — select business, enter 500 pts, see "$5.00 off"
10. Click Redeem → confirmation

**Script**:

> Let me show you the customer experience. From the landing page, I click Shop and Earn and land in the business directory. I can search by category, filter by location, and featured businesses appear at the top — that's our ad revenue channel.
>
> I'll click on this coffee shop. Here's their page. I click Pay with Card — standard Stripe checkout, nothing unusual. I enter my card, pay twenty dollars, and immediately see: You earned 120 points.
>
> No mention of tokens. No wallet. No seed phrases. Just points.
>
> On my rewards page, I see my balance — 620 points. I can redeem these as a discount at any participating business. I select a business, enter 500 points, see that's five dollars off, and click redeem.
>
> What the customer never sees: behind that redeem button, the platform converted MPT tokens back to RLUSD and settled with the business on XRPL.

---

### SECTION 4: Business Owner Demo — Live App (2:00–2:30)

**Screen**: Live app walkthrough.

**Demo sequence**:
1. `/business/register` — fill form (name, category, location), check ownership attestation, submit
2. Success: "Your business is now listed!"
3. Navigate to `/directory` — show new listing
4. Navigate to `/business/dashboard` — revenue ($487.20), transactions (34), points redeemed (2,400), "Boost Visibility" option

**Script**:

> For business owners, registration is free and takes thirty seconds. Name, category, location, and a self-declaration of Black ownership. That's it.
>
> Behind the scenes, the platform issues an on-chain credential, sets up an RLUSD trustline, and authorizes the business for our loyalty token — but the owner sees none of that. They just see their business appear in the directory.
>
> On the dashboard, they see revenue in dollars, customer counts, and how many points have been redeemed at their store. They can optionally boost their visibility. Free to list, free to participate — always.

---

### SECTION 5: Lender Demo — Vault + Lending Circles (2:30–3:10)

**Screen**: Live app walkthrough.

**Demo sequence**:
1. `/vault` — connect wallet (Xaman or Crossmark)
2. Vault Overview — total pooled ($12,400), active loans (3), repayment rate (94%), available ($4,200)
3. Deposit 500 RLUSD — sign with wallet, transaction confirms
4. Navigate to `/lending` — circles list with status badges (forming/active)
5. Click into circle → `/lending/[circleId]` — 5 members, active loan, tranche progress (2/3 milestones), borrower tier (Micro → arrow → Small)
6. Show "Release Tranche" button

**Script**:

> This is where the crypto becomes visible — by design. Community lenders connect their XRPL wallet and deposit RLUSD into the Shared Asset Vault.
>
> The vault dashboard shows total pooled capital, active loans, and repayment health. I'll deposit 500 RLUSD — I sign with my wallet, and the vault total updates.
>
> These funds flow into lending circles. This is the Grameen microfinance model: four to six borrowers form a group and mutually guarantee each other. No credit checks. Social accountability replaces credit scores.
>
> Here's an active circle. This borrower has received two of three loan tranches — each released only after the group approves a business milestone. XRPL escrows enforce this: funds are locked until circle members provide cryptographic fulfillment.
>
> As borrowers repay, their tier graduates. Start with a five-hundred-dollar microloan. Repay successfully, unlock two thousand, then five thousand. Capital recycles back into the vault.

---

### SECTION 6: XRPL Tech Stack (3:10–3:35)

**Screen**: **Diagram 2** (Architecture) again, with a bulleted overlay listing the 6 XRPL primitives. Optionally flash a Devnet explorer showing a real transaction hash.

**Script**:

> Here's the XRPL technology powering this.
>
> RLUSD stablecoin for all settlement — no price volatility. MPT tokens for the loyalty system. Escrows with cryptographic conditions for milestone loan disbursements. Credentials for verifiable business registration and circle membership. A Rust WASM smart contract tracking vault state, loans, and borrower tiers on-ledger. And Batch transactions for atomic operations.
>
> Six XRPL primitives, working together, completely invisible to two out of three user types.

---

### SECTION 7: Business Model + Flywheel (3:35–3:50)

**Screen**: **Diagram 5** (Flywheel).

**Script**:

> Revenue comes from two streams: a small transaction fee on every card payment, and optional visibility boosts businesses can purchase.
>
> This creates a flywheel. More businesses join the free directory. More customers come for reward points. More transactions generate fees. Those fees fund the reward pool and lending vault. More capital means more businesses get funded. The cycle reinforces itself.

---

### SECTION 8: Closing (3:50–4:00)

**Screen**: Title slide "LocalRoots" with tagline. Flash **Diagram 1** one more time.

**Script**:

> LocalRoots addresses the capital access gap for Black-owned businesses while making blockchain genuinely useful — by making it invisible. Customers see points. Businesses see dollars. And the community benefits from a decentralized, self-sustaining financial engine on XRPL.
>
> Thank you.

---

## Pre-Recording Checklist

Before recording:

- [ ] App running at localhost:3000 with all 3 flows working
- [ ] 3-4 businesses pre-registered in directory (food, retail, services, etc.)
- [ ] Customer account with ~500+ points balance so rewards page looks populated
- [ ] Vault pre-seeded: several thousand RLUSD pooled, 2-3 active loans, a lending circle with members
- [ ] Wallet configured and ready to connect (Crossmark or Xaman, loaded with RLUSD)
- [ ] Stripe in test mode, test card `4242 4242 4242 4242` ready
- [ ] All 5 diagrams exported as high-res PNGs
- [ ] Browser clean: no bookmarks bar, no extensions visible, zoom 100%
- [ ] Screen resolution 1920x1080

## Recording Tips

- Record live demo sections separately from diagram sections — splice in post
- Do a full dry run first so every click lands with no loading delays
- Pre-seed all data so the app looks populated (empty states kill demos)
- Keep mouse movements deliberate and slow
- Record voiceover separately from screen capture for clean audio, sync in editing
- Pace: ~150 words/minute. Script above is ~850 words = ~4 minutes
