/**
 * Customer custodial XRPL wallet management.
 *
 * Each customer gets a Devnet wallet stored in the `customer_wallets` table.
 * The wallet is automatically authorized for the loyalty MPT on creation.
 */

const xrpl = require("xrpl");
const { getClient } = require("./client");
const { submitTx } = require("./helpers");
const { LOYALTY_MPT_ID, RLUSD_CURRENCY_HEX, RLUSD_ISSUER } = require("../constants");

/**
 * Return (or create) a custodial XRPL wallet for the given customer.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} userId - auth.users UUID
 * @returns {Promise<{ address: string, wallet: import("xrpl").Wallet }>}
 */
async function getOrCreateCustomerWallet(supabase, userId) {
  // 1. Check for existing wallet
  const { data: existing, error: selErr } = await supabase
    .from("customer_wallets")
    .select("xrpl_address, seed_encrypted, mpt_authorized")
    .eq("user_id", userId)
    .single();

  if (selErr && selErr.code !== "PGRST116") {
    // PGRST116 = no rows — anything else is a real error
    throw selErr;
  }

  if (existing) {
    const wallet = xrpl.Wallet.fromSeed(existing.seed_encrypted);
    return { address: existing.xrpl_address, wallet };
  }

  // 2. Generate + fund a new Devnet wallet
  const client = await getClient();
  const newWallet = xrpl.Wallet.generate();
  await client.fundWallet(newWallet);

  // 3. Authorize the wallet for the loyalty MPT
  let authorized = false;
  if (LOYALTY_MPT_ID) {
    try {
      await submitTx(
        {
          TransactionType: "MPTokenAuthorize",
          Account: newWallet.address,
          MPTokenIssuanceID: LOYALTY_MPT_ID,
        },
        client,
        newWallet,
        "MPTokenAuthorize (customer)"
      );
      authorized = true;
    } catch (err) {
      console.error("MPTokenAuthorize failed for new customer wallet:", err.message);
    }
  }

  // 3b. Set up RLUSD trustline so wallet can receive RLUSD disbursements
  if (RLUSD_ISSUER) {
    try {
      await submitTx(
        {
          TransactionType: "TrustSet",
          Account: newWallet.address,
          LimitAmount: {
            currency: RLUSD_CURRENCY_HEX,
            issuer: RLUSD_ISSUER,
            value: "1000000",
          },
        },
        client,
        newWallet,
        "TrustSet RLUSD (customer)"
      );
    } catch (err) {
      console.error("RLUSD TrustSet failed for new customer wallet:", err.message);
    }
  }

  // 4. Persist to Supabase
  const { error: insErr } = await supabase.from("customer_wallets").insert({
    user_id: userId,
    xrpl_address: newWallet.address,
    seed_encrypted: newWallet.seed,
    mpt_authorized: authorized,
  });

  if (insErr) throw insErr;

  return { address: newWallet.address, wallet: newWallet };
}

/**
 * Return (or create) a custodial XRPL wallet for the given business.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {number} businessId
 * @returns {Promise<{ address: string, wallet: import("xrpl").Wallet }>}
 */
async function getOrCreateBusinessWallet(supabase, businessId) {
  // 1. Check for existing wallet
  const { data: existing, error: selErr } = await supabase
    .from("business_wallets")
    .select("xrpl_address, seed_encrypted")
    .eq("business_id", businessId)
    .single();

  if (selErr && selErr.code !== "PGRST116") {
    throw selErr;
  }

  if (existing) {
    const wallet = xrpl.Wallet.fromSeed(existing.seed_encrypted);
    return { address: existing.xrpl_address, wallet };
  }

  // 2. Generate + fund a new Devnet wallet
  const client = await getClient();
  const newWallet = xrpl.Wallet.generate();
  await client.fundWallet(newWallet);

  // 3. Set up RLUSD trustline so wallet can receive RLUSD
  if (RLUSD_ISSUER) {
    try {
      await submitTx(
        {
          TransactionType: "TrustSet",
          Account: newWallet.address,
          LimitAmount: {
            currency: RLUSD_CURRENCY_HEX,
            issuer: RLUSD_ISSUER,
            value: "1000000",
          },
        },
        client,
        newWallet,
        "TrustSet RLUSD (business)"
      );
    } catch (err) {
      console.error("RLUSD TrustSet failed for new business wallet:", err.message);
    }
  }

  // 4. Persist to Supabase
  const { error: insErr } = await supabase.from("business_wallets").insert({
    business_id: businessId,
    xrpl_address: newWallet.address,
    seed_encrypted: newWallet.seed,
  });

  if (insErr) throw insErr;

  return { address: newWallet.address, wallet: newWallet };
}

/**
 * Send RLUSD to a business wallet with 97/3 split (business / platform vault).
 *
 * @param {import("xrpl").Client} client
 * @param {string} businessAddress
 * @param {number} amountCents - Total payment amount in cents
 * @returns {Promise<{ businessTxHash: string|null, feeTxHash: string|null }>}
 */
async function sendRLUSDToBusiness(client, businessAddress, amountCents) {
  const { TRANSACTION_FEE_PERCENT, VAULT_ADDRESS } = require("../constants");

  if (!process.env.PLATFORM_MASTER_SEED || !RLUSD_ISSUER) {
    console.warn("sendRLUSDToBusiness skipped: missing PLATFORM_MASTER_SEED or RLUSD_ISSUER");
    return { businessTxHash: null, feeTxHash: null };
  }

  const platformWallet = xrpl.Wallet.fromSeed(process.env.PLATFORM_MASTER_SEED);
  const feeCents = Math.round(amountCents * (TRANSACTION_FEE_PERCENT / 100));
  const businessCents = amountCents - feeCents;

  let businessTxHash = null;
  let feeTxHash = null;

  // 97% to business
  try {
    const bizValue = (businessCents / 100).toFixed(2);
    const res = await submitTx(
      {
        TransactionType: "Payment",
        Account: platformWallet.address,
        Destination: businessAddress,
        Amount: {
          currency: RLUSD_CURRENCY_HEX,
          issuer: RLUSD_ISSUER,
          value: bizValue,
        },
      },
      client,
      platformWallet,
      `sendRLUSD(${bizValue} -> business ${businessAddress})`
    );
    businessTxHash = res.result?.hash || null;
  } catch (err) {
    console.error("sendRLUSDToBusiness (business share) failed:", err.message);
  }

  // 3% to vault
  if (VAULT_ADDRESS && feeCents > 0) {
    try {
      const feeValue = (feeCents / 100).toFixed(2);
      const res = await submitTx(
        {
          TransactionType: "Payment",
          Account: platformWallet.address,
          Destination: VAULT_ADDRESS,
          Amount: {
            currency: RLUSD_CURRENCY_HEX,
            issuer: RLUSD_ISSUER,
            value: feeValue,
          },
        },
        client,
        platformWallet,
        `sendRLUSD(${feeValue} -> vault fee)`
      );
      feeTxHash = res.result?.hash || null;
    } catch (err) {
      console.error("sendRLUSDToBusiness (vault fee) failed:", err.message);
    }
  }

  return { businessTxHash, feeTxHash };
}

/**
 * Cash out RLUSD from business wallet back to platform master (simulates fiat payout).
 *
 * @param {import("xrpl").Client} client
 * @param {import("xrpl").Wallet} businessWallet
 * @param {number} amountCents
 * @returns {Promise<string|null>} Transaction hash or null on failure.
 */
async function cashoutRLUSD(client, businessWallet, amountCents) {
  const { PLATFORM_MASTER_ADDRESS } = require("../constants");

  if (!RLUSD_ISSUER || !PLATFORM_MASTER_ADDRESS) {
    console.warn("cashoutRLUSD skipped: missing RLUSD_ISSUER or PLATFORM_MASTER_ADDRESS");
    return null;
  }

  try {
    const value = (amountCents / 100).toFixed(2);
    const res = await submitTx(
      {
        TransactionType: "Payment",
        Account: businessWallet.address,
        Destination: PLATFORM_MASTER_ADDRESS,
        Amount: {
          currency: RLUSD_CURRENCY_HEX,
          issuer: RLUSD_ISSUER,
          value,
        },
      },
      client,
      businessWallet,
      `cashoutRLUSD(${value} -> platform master)`
    );
    return res.result?.hash || null;
  } catch (err) {
    console.error("cashoutRLUSD failed (non-fatal):", err.message);
    return null;
  }
}

module.exports = {
  getOrCreateCustomerWallet,
  getOrCreateBusinessWallet,
  sendRLUSDToBusiness,
  cashoutRLUSD,
};
