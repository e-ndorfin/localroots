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

module.exports = { getOrCreateCustomerWallet };
