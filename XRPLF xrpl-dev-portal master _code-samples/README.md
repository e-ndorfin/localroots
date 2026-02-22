# XRPL Code Samples Reference

This folder contains official XRPL code samples from the xrpl-dev-portal. Use this document as a guide for finding the right starting code for any XRPL-based project.

---

## Project Context: Black Business Support App

This codebase is being used as reference material for a community-driven web application that combines **microlending** and **loyalty rewards** to support Black-owned businesses. The two core features are:

1. **Community Microlending Protocol (Shared Asset Vault):** Anonymous community members pool funds into a vault to provide microloans to Black business owners, using a Grameen Bank lending circle model for trust and enforcement. Loans are graduated (small amounts first, larger after repayment) with milestone-based disbursement.
2. **Multi-Purpose Token (MPT) Loyalty Rewards:** Customers earn tokens for purchases at participating Black-owned businesses and redeem them across the network. Funded by transaction fees, creating a self-sustaining flywheel.

Templates are marked with relevance tags:
- `[CORE]` — Directly implements a primary feature of the app
- `[SUPPORTING]` — Provides utilities, patterns, or secondary features needed by the app
- `[REFERENCE]` — Useful background knowledge but not directly used

---

## Template Directory

### `lending-protocol` `[CORE]`

**What it does:** Implements a full on-chain lending protocol using XRPL's native `Loan`, `LoanBroker`, and `Vault` transaction types. Covers the complete loan lifecycle: setup, origination (dual-signature between broker and borrower), repayment, impairment, default, and first-loss capital management.

**Key transaction types:** `LoanBrokerSet`, `LoanSet`, `LoanPay`, `LoanDelete`, `LoanManage`, `LoanBrokerCoverDeposit`, `LoanBrokerCoverWithdraw`, `LoanBrokerCoverClawback`, `VaultCreate`, `VaultDeposit`

**Language:** JavaScript (Node.js, ES modules) + Python. Requires `xrpl ^4.6.0`.

**Network:** Devnet only (`wss://s.devnet.rippletest.net:51233`). Uses transaction types not yet on mainnet.

**Why it matters for this project:** This is the primary template for the Community Microlending Protocol. The `LoanBroker` acts as the lending pool manager. `LoanSet` with dual signatures models formal loan agreements between the community fund and borrowers. `LoanPay` handles repayments. `LoanManage` handles delinquency and default. The first-loss capital (cover) system protects pooled depositors. The setup script bootstraps the entire environment including wallets, MPT stablecoin, KYC credentials, permissioned domain, vault, and pre-created loans.

**Key files to copy from:**
- `js/lendingSetup.js` — Full environment bootstrap (wallets, MPT, credentials, vault, loans)
- `js/createLoan.js` — Dual-signature loan origination flow
- `js/loanPay.js` — Loan repayment and closure
- `js/loanManage.js` — Impairment and default handling
- `js/coverDepositAndWithdraw.js` — First-loss capital management

---

### `vaults` `[CORE]`

**What it does:** Demonstrates XRPL's Single Asset Vault feature. Community members deposit an MPT asset into a shared vault and receive proportional share tokens. Supports deposit, withdrawal, and permissioned access via credentials.

**Key transaction types:** `VaultCreate`, `VaultDeposit`, `VaultWithdraw`, `MPTokenIssuanceCreate`, `CredentialCreate`, `CredentialAccept`, `MPTokenAuthorize`, `PermissionedDomainSet`, `Batch`

**Language:** JavaScript (Node.js, ES modules) + Python. Requires `xrpl ^4.5.0`.

**Network:** Devnet only.

**Why it matters for this project:** This is the direct implementation of the Shared Asset Vault (SAV) where community members pool funds for microloans. The permissioned domain + credential system provides membership gating (useful for lending circle access control). The `lending-protocol` template builds on top of this, so these two are used together.

**Key files to copy from:**
- `js/vaultSetup.js` — Full vault environment bootstrap (wallets, MPT, credentials, vault)
- `js/createVault.js` — Vault creation with MPT metadata and withdrawal policy
- `js/deposit.js` — Depositing into the vault and reading updated state
- `js/withdraw.js` — Withdrawing from the vault

---

### `build-a-browser-wallet` `[CORE]`

**What it does:** A complete, multi-page non-custodial browser wallet application. Includes a dashboard with real-time ledger updates, XRP send flow with validation, and paginated transaction history.

**Language:** JavaScript (ES modules), Vite build tool, vanilla HTML/CSS. Requires `xrpl ^4.0.0`.

**Network:** Testnet.

**Why it matters for this project:** This is the best frontend scaffold for building the customer-facing and business-facing web UI. The transaction history, balance display, WebSocket subscription management, and XRP send functionality are all directly reusable. Extend the `submit-transaction.js` helper and `get-wallet-details.js` to support MPT payments.

**Key files to copy from:**
- `js/index.html` + `js/index.js` — Dashboard with real-time WebSocket ledger subscription
- `js/src/send-xrp/send-xrp.js` — Payment flow with input validation and balance checking
- `js/src/transaction-history/transaction-history.js` — Paginated `account_tx` fetching and rendering
- `js/src/helpers/submit-transaction.js` — Wallet loading + transaction submission utility
- `js/src/helpers/get-wallet-details.js` — Balance and reserve calculation
- `js/vite.config.js` — Vite config with Node.js polyfills for browser compatibility

---

### `issue-mpt-with-metadata` `[SUPPORTING]`

**What it does:** Shows how to issue an MPT with structured metadata encoded per the XLS-89 standard. Demonstrates the full encode-submit-decode round trip.

**Key transaction types:** `MPTokenIssuanceCreate`

**Language:** JavaScript (Node.js, ES modules) + Python. Requires `xrpl ^4.4.3`.

**Network:** Devnet.

**Why it matters for this project:** This is the canonical reference for minting the loyalty reward MPT. Adapt the metadata object to describe your loyalty token (e.g., ticker `"LOYAL"`, asset_class `"rewards"`, issuer_name your platform name). The `encodeMPTokenMetadata` / `decodeMPTokenMetadata` pattern ensures interoperability with XRPL explorers.

**Key files to copy from:**
- `js/issue-mpt-with-metadata.js` — Complete MPT issuance with metadata encode/decode

---

### `mpt-sender` `[SUPPORTING]`

**What it does:** Browser-based GUI for sending MPTs between accounts, checking MPT balances, and authorizing accounts to hold specific MPTs.

**Key transaction types:** `Payment` (with MPT amount), `MPTokenAuthorize`

**Language:** Vanilla HTML/JS, browser-only. Uses xrpl.js via CDN.

**Network:** Testnet and Devnet.

**Why it matters for this project:** Directly models the loyalty token distribution flow. The `sendMPT()` function is the core payment primitive for distributing rewards to customers. `authorizeMPT()` models the opt-in flow for customers joining the rewards program. `getMPTs()` shows how to query MPT balances.

**Key files to copy from:**
- `send-mpt.js` — MPT send, balance query, and authorization functions
- `account-support.js` — Shared wallet utility functions (reused across modular tutorials)

---

### `mpt-generator` `[SUPPORTING]`

**What it does:** Browser-based GUI for creating MPT issuances. Allows configuring flags (clawback, lock, authorization, transfer, trade, escrow), asset scale, max supply, transfer fee, and JSON metadata.

**Language:** Vanilla HTML/JS, browser-only. Uses xrpl.js v4.4.3 via CDN.

**Network:** Testnet and Devnet.

**Why it matters for this project:** Fastest way to mint and configure the loyalty reward MPT during development. Use this UI to experiment with token parameters before hardcoding them in your app.

**Key files to copy from:**
- `mpt-generator.js` — MPT issuance creation with flag configuration and metadata encoding

---

### `quickstart` `[SUPPORTING]`

**What it does:** A comprehensive 13+ lesson interactive tutorial covering the breadth of XRPL features: account creation, XRP transfers, trust lines, issued currencies, NFTs, DEX offers, escrow (time-based and crypto-condition), checks, and AMM.

**Language:** Vanilla HTML/JS (browser, CDN-loaded) + Python (tkinter GUI).

**Network:** Testnet.

**Why it matters for this project:** Lessons 8-9 (escrow) are directly relevant for milestone-based loan disbursement — release funds when a borrower meets a condition. Lessons 1-2 (send XRP, trust lines) are useful for understanding baseline payment flows.

**Key files to copy from:**
- `ripplex8-escrow.js` — Time-based escrow (create, finish, cancel)
- `ripplex9-escrow-condition.js` — Crypto-condition escrow for conditional disbursement
- `ripplex1-send-xrp.js` — Basic XRP send/receive pattern
- `ripplex2-send-currency.js` — Trust line creation and issued currency transfers

---

### `send-xrp` `[REFERENCE]`

**What it does:** The simplest XRPL sample — sends XRP from one account to another. Demonstrates the full prepare-sign-submit-verify cycle.

**Language:** JavaScript + Go + Java + PHP + Python (5 languages).

**Network:** Testnet.

**Why it matters:** The atomic building block for all payment flows. The `autofill` -> `sign` -> `submitAndWait` -> `getBalanceChanges` pattern is reused verbatim across every other template.

---

### `issue-a-token` `[REFERENCE]`

**What it does:** Demonstrates the older trust-line-based fungible token issuance model (pre-MPT). Uses hot wallet / cold wallet architecture with `AccountSet` configuration (DefaultRipple, RequireAuth, TickSize, TransferRate, Domain).

**Language:** JavaScript + Go + Java + Python.

**Network:** Testnet.

**Why it matters:** Background knowledge on the legacy token model. MPTs (see `issue-mpt-with-metadata`, `mpt-sender`, `mpt-generator`) are the preferred modern approach, but this pattern is still relevant if you need DEX trading compatibility or support for wallets that don't yet handle MPTs.

---

### `create-amm` `[REFERENCE]`

**What it does:** Demonstrates XRPL's Automated Market Maker — creating liquidity pools, depositing/withdrawing liquidity, bidding on auction slots, voting on trading fees, and swapping tokens via path-finding.

**Language:** JavaScript (simple version) + TypeScript (comprehensive version with typed library).

**Network:** Devnet.

**Why it matters:** Indirectly relevant. If the platform accumulates a treasury in XRP and loyalty tokens, an AMM could provide liquidity between them. The `swap` function pattern (cross-currency Payment with `path_find`) is useful if customers pay in XRP but the system needs to settle in a stablecoin.

---

### Other Directories (not directly relevant to this project)

| Directory | Purpose |
|---|---|
| `account-configurator` | Account settings management |
| `address_encoding` | Address encoding/decoding utilities |
| `airgapped-wallet` | Offline transaction signing |
| `amm-clob` | AMM + Central Limit Order Book interaction |
| `auction-slot` | AMM auction slot bidding |
| `batch` | Batch transaction submission |
| `checks` | XRPL Checks (deferred payments) |
| `claim-payment-channel` | Payment channel claiming |
| `clawback` | Token clawback operations |
| `credential` | Credential issuance and management |
| `delegate-permissions` | Delegated account permissions |
| `delegate-set` | Delegate account configuration |
| `delete-account` | Account deletion |
| `deposit-preauth` | Deposit pre-authorization |
| `did` | Decentralized Identifiers |
| `escrow` | Standalone escrow examples |
| `freeze` | Token freeze/unfreeze |
| `get-started` | Introductory getting-started scripts |
| `get-tx` | Transaction lookup |
| `key-derivation` | Key derivation from seeds |
| `markers-and-pagination` | Paginated ledger queries |
| `modular-tutorials` | Shared infrastructure for tutorial UI |
| `monitor-payments-websocket` | Real-time payment monitoring |
| `multisigning` | Multi-signature transactions |
| `nft-modular-tutorials` | NFT tutorial modules |
| `non-fungible-token` | NFT minting and trading |
| `normalize-currency-codes` | Currency code normalization |
| `partial-payment` | Partial payment handling |
| `paths` | Cross-currency payment paths |
| `price_oracles` | On-chain price oracle data |
| `reliable-tx-submission` | Reliable transaction submission patterns |
| `require-destination-tags` | Destination tag enforcement |
| `secure-signing` | Secure transaction signing practices |
| `send-a-memo` | Transactions with memo fields |
| `set-regular-key` | Regular key pair management |
| `submit-and-verify` | Submit and verify transaction patterns |
| `trade-in-the-decentralized-exchange` | DEX trading |
| `tx-serialization` | Transaction serialization |
| `use-tickets` | Ticket-based transaction sequencing |
| `verify-credential` | Credential verification |
| `walk-owner-directory` | Owner directory traversal |

---

## Important Notes

- **Devnet vs Testnet:** The `vaults` and `lending-protocol` templates use XRPL amendments that are only available on Devnet as of February 2026. They require `xrpl.js ^4.5.0+`. Plan deployment around when these amendments reach mainnet.
- **MPT vs Trust Lines:** Multi-Purpose Tokens (MPTs) are the modern approach for fungible tokens on XRPL. The `issue-a-token` template uses the older trust-line model. Prefer MPTs unless you need backward compatibility.
- **Recommended build order for the Black Business Support App:**
  1. `issue-mpt-with-metadata` — Mint the loyalty reward MPT
  2. `vaults` — Set up the community lending pool
  3. `lending-protocol` — Layer loan management on top
  4. `mpt-sender` — Wire up loyalty token distribution
  5. `build-a-browser-wallet` — Build the customer-facing web UI tying it all together
