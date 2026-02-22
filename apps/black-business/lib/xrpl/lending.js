/**
 * On-chain XRPL operations for the lending system.
 *
 * All functions degrade gracefully — XRPL failure is logged but does not
 * propagate. Supabase remains the source of truth; XRPL is the on-chain mirror.
 */

const xrpl = require("xrpl");
const { submitTx, textToHex } = require("./helpers");
const {
  RLUSD_CURRENCY_HEX,
  RLUSD_ISSUER,
  VAULT_ADDRESS,
  PLATFORM_MASTER_ADDRESS,
} = require("../constants");

/**
 * Disburse RLUSD from vault to borrower.
 *
 * @param {import("xrpl").Client} client - Connected XRPL client.
 * @param {string} borrowerAddress - Borrower's XRPL address.
 * @param {number} amountCents - Amount in cents (divided by 100 for RLUSD value).
 * @returns {Promise<string|null>} Transaction hash or null on failure/skip.
 */
async function disburseRLUSD(client, borrowerAddress, amountCents) {
  if (!process.env.VAULT_SEED || !RLUSD_ISSUER) {
    console.warn("disburseRLUSD skipped: missing VAULT_SEED or RLUSD_ISSUER");
    return null;
  }

  try {
    const vaultWallet = xrpl.Wallet.fromSeed(process.env.VAULT_SEED);
    const value = (amountCents / 100).toFixed(2);

    const response = await submitTx(
      {
        TransactionType: "Payment",
        Account: vaultWallet.address,
        Destination: borrowerAddress,
        Amount: {
          currency: RLUSD_CURRENCY_HEX,
          issuer: RLUSD_ISSUER,
          value,
        },
      },
      client,
      vaultWallet,
      `disburseRLUSD(${value} -> ${borrowerAddress})`
    );

    return response.result?.hash || null;
  } catch (err) {
    console.error("disburseRLUSD failed (non-fatal):", err.message);
    return null;
  }
}

/**
 * Return RLUSD to vault (proxy for borrower's card repayment).
 *
 * @param {import("xrpl").Client} client - Connected XRPL client.
 * @param {number} amountCents - Amount in cents.
 * @returns {Promise<string|null>} Transaction hash or null on failure/skip.
 */
async function returnRLUSDToVault(client, amountCents) {
  if (!process.env.PLATFORM_MASTER_SEED || !RLUSD_ISSUER || !VAULT_ADDRESS) {
    console.warn("returnRLUSDToVault skipped: missing PLATFORM_MASTER_SEED, RLUSD_ISSUER, or VAULT_ADDRESS");
    return null;
  }

  try {
    const platformWallet = xrpl.Wallet.fromSeed(process.env.PLATFORM_MASTER_SEED);
    const value = (amountCents / 100).toFixed(2);

    const response = await submitTx(
      {
        TransactionType: "Payment",
        Account: platformWallet.address,
        Destination: VAULT_ADDRESS,
        Amount: {
          currency: RLUSD_CURRENCY_HEX,
          issuer: RLUSD_ISSUER,
          value,
        },
      },
      client,
      platformWallet,
      `returnRLUSDToVault(${value} -> vault)`
    );

    return response.result?.hash || null;
  } catch (err) {
    console.error("returnRLUSDToVault failed (non-fatal):", err.message);
    return null;
  }
}

/**
 * Issue a CIRCLE_MEMBER credential from platform to member, then auto-accept.
 *
 * @param {import("xrpl").Client} client - Connected XRPL client.
 * @param {string} memberAddress - Member's XRPL address.
 * @param {import("xrpl").Wallet} memberWallet - Member's XRPL wallet (for auto-accept).
 * @returns {Promise<string|null>} Credential ledger hash or null on failure/skip.
 */
async function issueCircleCredential(client, memberAddress, memberWallet) {
  if (!process.env.PLATFORM_MASTER_SEED) {
    console.warn("issueCircleCredential skipped: missing PLATFORM_MASTER_SEED");
    return null;
  }

  try {
    const platformWallet = xrpl.Wallet.fromSeed(process.env.PLATFORM_MASTER_SEED);
    const credentialType = textToHex("CIRCLE_MEMBER");

    // 1. Platform issues credential to member
    await submitTx(
      {
        TransactionType: "CredentialCreate",
        Account: platformWallet.address,
        Subject: memberAddress,
        CredentialType: credentialType,
      },
      client,
      platformWallet,
      `CredentialCreate(CIRCLE_MEMBER -> ${memberAddress})`
    );

    // 2. Member auto-accepts (custodial wallet, so we have the key)
    await submitTx(
      {
        TransactionType: "CredentialAccept",
        Account: memberAddress,
        Issuer: platformWallet.address,
        CredentialType: credentialType,
      },
      client,
      memberWallet,
      `CredentialAccept(CIRCLE_MEMBER <- ${memberAddress})`
    );

    // 3. Look up the credential's ledger hash
    const accountObjects = await client.request({
      command: "account_objects",
      account: memberAddress,
      ledger_index: "validated",
      type: "credential",
    });

    const credential = accountObjects.result.account_objects.find(
      (obj) => obj.Issuer === platformWallet.address && obj.CredentialType === credentialType
    );

    return credential?.index || null;
  } catch (err) {
    console.error("issueCircleCredential failed (non-fatal):", err.message);
    return null;
  }
}

module.exports = { disburseRLUSD, returnRLUSDToVault, issueCircleCredential };
