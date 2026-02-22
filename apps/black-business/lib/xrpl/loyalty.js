/**
 * On-chain MPT loyalty token operations.
 *
 * Both functions degrade gracefully — XRPL failure is logged but does not
 * propagate. Supabase remains the source of truth; XRPL is the on-chain mirror.
 */

const xrpl = require("xrpl");
const { submitTx } = require("./helpers");
const { LOYALTY_MPT_ID, PLATFORM_MASTER_ADDRESS } = require("../constants");

/**
 * Mint (send) loyalty MPT from the platform to a customer.
 *
 * @param {import("xrpl").Client} client - Connected XRPL client.
 * @param {string} customerAddress - Customer's XRPL address.
 * @param {number} points - Number of loyalty points to mint.
 */
async function mintMPT(client, customerAddress, points) {
  if (!LOYALTY_MPT_ID || !process.env.PLATFORM_MASTER_SEED) {
    console.warn("mintMPT skipped: missing LOYALTY_MPT_ID or PLATFORM_MASTER_SEED");
    return;
  }

  try {
    const platformWallet = xrpl.Wallet.fromSeed(process.env.PLATFORM_MASTER_SEED);

    await submitTx(
      {
        TransactionType: "Payment",
        Account: platformWallet.address,
        Destination: customerAddress,
        Amount: {
          mpt_issuance_id: LOYALTY_MPT_ID,
          value: String(points),
        },
      },
      client,
      platformWallet,
      `mintMPT(${points} pts -> ${customerAddress})`
    );
  } catch (err) {
    console.error("mintMPT failed (non-fatal):", err.message);
  }
}

/**
 * Redeem (send back) loyalty MPT from a customer to the platform.
 *
 * @param {import("xrpl").Client} client - Connected XRPL client.
 * @param {import("xrpl").Wallet} customerWallet - Customer's XRPL wallet.
 * @param {number} points - Number of loyalty points to redeem.
 */
async function redeemMPT(client, customerWallet, points) {
  if (!LOYALTY_MPT_ID || !PLATFORM_MASTER_ADDRESS) {
    console.warn("redeemMPT skipped: missing LOYALTY_MPT_ID or PLATFORM_MASTER_ADDRESS");
    return;
  }

  try {
    await submitTx(
      {
        TransactionType: "Payment",
        Account: customerWallet.address,
        Destination: PLATFORM_MASTER_ADDRESS,
        Amount: {
          mpt_issuance_id: LOYALTY_MPT_ID,
          value: String(points),
        },
      },
      client,
      customerWallet,
      `redeemMPT(${points} pts <- ${customerWallet.address})`
    );
  } catch (err) {
    console.error("redeemMPT failed (non-fatal):", err.message);
  }
}

module.exports = { mintMPT, redeemMPT };
