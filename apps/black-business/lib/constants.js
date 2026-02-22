/**
 * Platform configuration constants.
 *
 * PUBLIC values only — wallet addresses, token IDs, RLUSD config.
 * Wallet seeds are in .env.local (never committed to git).
 *
 * After running `scripts/init-platform.js`, `scripts/setup-trustlines.js`,
 * and `scripts/create-loyalty-mpt.js`, update the placeholder values below
 * and copy the seeds into .env.local.
 */

// ---------------------------------------------------------------------------
// RLUSD stablecoin config
// On Devnet we use our own test issuer (mainnet issuer doesn't exist there).
// Set NEXT_PUBLIC_RLUSD_ISSUER in .env.local after running init-platform.js.
// ---------------------------------------------------------------------------
const RLUSD_CURRENCY_HEX = "524C555344000000000000000000000000000000"; // "RLUSD" padded to 40 hex chars
const RLUSD_ISSUER = process.env.NEXT_PUBLIC_RLUSD_ISSUER || "";

// ---------------------------------------------------------------------------
// Platform account addresses (public — safe to commit)
// Populated after running: node scripts/init-platform.js
// NOTE: Vault balances are tracked in Supabase (vault_deposits table), not a Rust contract.
// The VAULT_ADDRESS is still the XRPL account that holds pooled RLUSD on-chain.
// ---------------------------------------------------------------------------
const PLATFORM_MASTER_ADDRESS = process.env.NEXT_PUBLIC_PLATFORM_MASTER_ADDRESS || "";
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS || "";
const REWARDS_POOL_ADDRESS = process.env.NEXT_PUBLIC_REWARDS_POOL_ADDRESS || "";

// ---------------------------------------------------------------------------
// BBS Loyalty MPT (Multi-Purpose Token)
// Populated after running: node scripts/create-loyalty-mpt.js
// ---------------------------------------------------------------------------
const LOYALTY_MPT_ID = process.env.NEXT_PUBLIC_LOYALTY_MPT_ID || "";

// ---------------------------------------------------------------------------
// Fee configuration
// ---------------------------------------------------------------------------
const TRANSACTION_FEE_PERCENT = 3; // 3% platform fee on customer purchases
const POINTS_PER_DOLLAR = 10; // Customer earns 10 points per $1 spent
const POINTS_REDEMPTION_RATE = 100; // 100 points = $1 discount

// ---------------------------------------------------------------------------
// Loan configuration
// ---------------------------------------------------------------------------
const LOAN_INTEREST_RATE = 0.05; // 5% APR
const LOAN_TIERS = {
  MICRO: { label: "Micro", maxAmount: 1000, requiredCompletions: 0 },
  SMALL: { label: "Small", maxAmount: 3000, requiredCompletions: 1 },
  MEDIUM: { label: "Medium", maxAmount: 10000, requiredCompletions: 3 },
};
const MIN_PROOF_APPROVALS = 2; // Circle members needed to approve a milestone proof

module.exports = {
  RLUSD_CURRENCY_HEX,
  RLUSD_ISSUER,
  PLATFORM_MASTER_ADDRESS,
  VAULT_ADDRESS,
  REWARDS_POOL_ADDRESS,
  LOYALTY_MPT_ID,
  TRANSACTION_FEE_PERCENT,
  POINTS_PER_DOLLAR,
  POINTS_REDEMPTION_RATE,
  LOAN_INTEREST_RATE,
  LOAN_TIERS,
  MIN_PROOF_APPROVALS,
};
