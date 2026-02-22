/**
 * XRPL transaction helper utilities.
 *
 * Provides hex conversion helpers and a thin submit wrapper used by
 * API routes and setup scripts.
 */

const xrpl = require("xrpl");

// ---------------------------------------------------------------------------
// Hex conversion
// ---------------------------------------------------------------------------

/** Convert a UTF-8 string to uppercase hex (used for MPT metadata). */
function textToHex(text) {
  return Buffer.from(text, "utf8").toString("hex").toUpperCase();
}

/** Convert an uppercase hex string back to UTF-8. */
function hexToText(hex) {
  return Buffer.from(hex, "hex").toString("utf8");
}

/**
 * Convert a human-readable currency code (e.g. "RLUSD") to the 40-char
 * hex representation required by XRPL for non-XRP currencies.
 * If the input is already a 40-char hex string it is returned as-is.
 */
function toHexCurrency(currency) {
  if (/^[A-F0-9]{40}$/.test(currency)) {
    return currency;
  }
  if (currency.length < 3 || currency.length > 6) {
    throw new Error("Currency code must be 3 to 6 characters long.");
  }
  return Buffer.from(currency, "ascii").toString("hex").toUpperCase().padEnd(40, "0");
}

// ---------------------------------------------------------------------------
// Transaction helpers
// ---------------------------------------------------------------------------

/**
 * Submit a transaction and wait for validation.
 * Thin wrapper around `client.submitAndWait` that logs the result and
 * throws on non-tesSUCCESS outcomes.
 *
 * @param {object} tx - Unsigned transaction object.
 * @param {import("xrpl").Client} client - Connected XRPL client.
 * @param {import("xrpl").Wallet} wallet - Signing wallet.
 * @param {string} [label] - Optional label for console output.
 * @returns {Promise<object>} The full response from submitAndWait.
 */
async function submitTx(tx, client, wallet, label = "") {
  if (label) {
    console.log(`  ${label} ...`);
  }

  const response = await client.submitAndWait(tx, { autofill: true, wallet });
  const result = response.result?.meta?.TransactionResult || "Unknown";

  if (result !== "tesSUCCESS") {
    throw new Error(`${tx.TransactionType} failed: ${result}`);
  }

  if (label) {
    console.log(`  ${label} -> ${result} (${response.result?.hash})`);
  }

  return response;
}

/**
 * Fetch the MPT Issuance ID from a confirmed MPTokenIssuanceCreate tx hash.
 */
async function getMPTIssuanceId(client, txHash) {
  const response = await client.request({ command: "tx", transaction: txHash });
  const id = response.result.meta?.mpt_issuance_id;
  if (!id) {
    throw new Error(`Could not extract mpt_issuance_id from tx ${txHash}`);
  }
  return id;
}

/**
 * Fetch on-chain MPT issuance details via ledger_entry.
 */
async function getMPTIssuanceInfo(client, mptIssuanceId) {
  const response = await client.request({
    command: "ledger_entry",
    mpt_issuance: mptIssuanceId,
    ledger_index: "validated",
  });
  return response.result.node;
}

module.exports = {
  textToHex,
  hexToText,
  toHexCurrency,
  submitTx,
  getMPTIssuanceId,
  getMPTIssuanceInfo,
};
