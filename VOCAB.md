# Key Crypto/XRPL Concepts for the Black Business Support App

## Blockchain Basics (as they apply here)

**XRPL (XRP Ledger)** — Think of it as a distributed database with built-in financial primitives. Unlike Ethereum where you write general-purpose smart contracts for everything, XRPL has native transaction types for payments, escrows, tokens, etc. It's more like a financial API baked into the protocol.

**Wallet / Account** — An XRPL account is a keypair (public address + secret seed). The "wallet" is just a key manager. In this app, the backend holds platform wallets server-side (like service accounts), while lenders connect their own wallets client-side.

**Devnet / Testnet / AlphaNet** — Equivalent to staging environments. Devnet has the newest features enabled (needed for Credentials and Batch transactions). `client.fundWallet()` is like a faucet — it gives you free test XRP so you can transact.

## XRPL-Specific Concepts

**Trustline** — XRPL doesn't let you hold arbitrary tokens by default. A trustline is an explicit opt-in: "I agree to hold up to X amount of token Y issued by account Z." Every business/platform account needs a trustline to RLUSD before it can receive RLUSD. Think of it as a `GRANT` in SQL — you must authorize before you can receive.

**RLUSD** — A stablecoin (1 RLUSD = 1 USD) issued on XRPL. It's just a token on the ledger with a specific issuer. The plan uses it so all money flows are USD-denominated, avoiding XRP price volatility. Businesses never touch volatile crypto.

**MPT (Multi-Purpose Token)** — A newer XRPL token standard. The plan uses it for loyalty points. Key operations:
- **MPTokenIssuanceCreate** — Platform creates the loyalty token type (done once, like creating a table)
- **MPTokenAuthorize** — A user opts in to hold the token (like a trustline, but for MPTs)
- **Payment with `mpt_issuance_id`** — Transfer MPT tokens between accounts (mint points to customer, or customer redeems points back to platform)

**Credentials (XLS-70)** — On-chain attestations. The platform issues a credential like `"REGISTERED_BUSINESS"` to a business account. It's like a signed JWT but stored on-ledger. Used for:
- Proving a business is verified
- Proving someone is a lending circle member
- Gating who can interact with the vault (`DepositPreauth`)

**Escrow** — XRPL's native conditional payment. Funds are locked and only released when conditions are met:
- **Time condition** (`FinishAfter`) — Can't release before a date
- **Crypto condition** (`Condition` / `Fulfillment`) — A SHA-256 hash lock. You publish the hash; someone must provide the preimage to unlock funds. In the plan, circle members provide the fulfillment to approve loan tranches. Think of it as a two-key safe.

**Batch Transactions (XLS-56)** — Atomic multi-operation transactions. Like a database transaction — either all operations succeed or none do. Used when you need to do multiple XRPL operations atomically (e.g., pay business + mint points in one shot).

## Smart Contract Concepts

**WASM Smart Contract** — XRPL supports Rust -> WebAssembly contracts deployed on-ledger. The vault contract tracks state (who deposited what, loan statuses, borrower tiers) using simple key-value storage (`get_data`/`set_data`). It's invoked via `ContractCall` transactions from the frontend or API routes.

**`get_data` / `set_data`** — The contract's persistent storage API. Think of it as a key-value store (like Redis) that lives on-chain. Keys are strings, values are typed (u64, u32, u8).

## Payment Flow Abstraction

The most important architectural concept: **customers and businesses never interact with crypto**. The flow is:

```
Customer pays $20 (Stripe card)
  -> Backend receives USD via Stripe
  -> Backend sends 19.40 RLUSD to business on XRPL
  -> Backend mints 120 MPT loyalty tokens to customer on XRPL
  -> Customer sees "You earned 120 points"
  -> Business sees "$19.40 received"
```

Stripe is the fiat on-ramp. XRPL is the settlement and rewards layer. Only lenders interact with crypto directly (they connect wallets and send RLUSD to the vault).

## Lending Model

**Grameen / Lending Circle** — Not a crypto concept, but a microfinance model. 4-6 borrowers form a group and mutually guarantee each other's loans. Social pressure replaces credit scores. The plan enforces this with on-chain credentials (circle membership) and graduated tiers (repay a small loan -> unlock a bigger one).
