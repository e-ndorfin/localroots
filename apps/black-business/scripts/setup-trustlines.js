/**
 * Set up RLUSD trustlines on all platform accounts.
 *
 * Prerequisites:
 *   1. Run `node scripts/init-platform.js` first to generate wallets
 *   2. Copy wallet seeds into .env.local
 *
 * Usage: node scripts/setup-trustlines.js
 *
 * After running, verify with:
 *   - Check account_lines for each platform account on Devnet explorer
 */

require("dotenv").config({ path: ".env.local" });
const xrpl = require("xrpl");

const DEVNET_WSS = "wss://s.devnet.rippletest.net:51233";
const RLUSD_CURRENCY_HEX = "524C555344000000000000000000000000000000";
const RLUSD_LIMIT = "1000000";

// On Devnet we use our own test issuer (mainnet issuer doesn't exist there)
const RLUSD_ISSUER = process.env.NEXT_PUBLIC_RLUSD_ISSUER;
if (!RLUSD_ISSUER) {
  console.error("Missing env var: NEXT_PUBLIC_RLUSD_ISSUER");
  console.error("Run 'node scripts/init-platform.js' first and copy the RLUSD issuer address to .env.local");
  process.exit(1);
}

const ACCOUNTS = [
  { label: "Platform Master", seedEnv: "PLATFORM_MASTER_SEED" },
  { label: "SAV Vault", seedEnv: "VAULT_SEED" },
  { label: "Rewards Pool", seedEnv: "REWARDS_POOL_SEED" },
];

async function setupTrustline(client, wallet, label) {
  const tx = {
    TransactionType: "TrustSet",
    Account: wallet.address,
    LimitAmount: {
      currency: RLUSD_CURRENCY_HEX,
      issuer: RLUSD_ISSUER,
      value: RLUSD_LIMIT,
    },
  };

  const response = await client.submitAndWait(tx, { autofill: true, wallet });
  const result = response.result?.meta?.TransactionResult || "Unknown";

  if (result !== "tesSUCCESS") {
    throw new Error(`TrustSet for ${label} failed: ${result}`);
  }

  console.log(`  ${label} (${wallet.address}) -> ${result}`);
  return response;
}

async function verifyTrustline(client, address, label) {
  const response = await client.request({
    command: "account_lines",
    account: address,
    ledger_index: "validated",
  });

  const rlusdLine = response.result.lines.find(
    (line) => line.currency === RLUSD_CURRENCY_HEX && line.account === RLUSD_ISSUER
  );

  if (rlusdLine) {
    console.log(`  ${label}: RLUSD trustline confirmed (limit: ${rlusdLine.limit})`);
  } else {
    console.warn(`  ${label}: RLUSD trustline NOT found!`);
  }
}

async function enableDefaultRipple(client, issuerWallet) {
  console.log("Enabling DefaultRipple on RLUSD issuer...");
  const resp = await client.submitAndWait(
    {
      TransactionType: "AccountSet",
      Account: issuerWallet.address,
      SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple,
    },
    { autofill: true, wallet: issuerWallet }
  );
  const result = resp.result?.meta?.TransactionResult || "Unknown";
  if (result !== "tesSUCCESS") {
    throw new Error(`AccountSet DefaultRipple failed: ${result}`);
  }
  console.log(`  DefaultRipple enabled -> ${result}\n`);
}

async function issuerClearNoRipple(client, issuerWallet, counterpartyAddress, label) {
  const resp = await client.submitAndWait(
    {
      TransactionType: "TrustSet",
      Account: issuerWallet.address,
      LimitAmount: {
        currency: RLUSD_CURRENCY_HEX,
        issuer: counterpartyAddress,
        value: "0",
      },
      Flags: xrpl.TrustSetFlags.tfClearNoRipple,
    },
    { autofill: true, wallet: issuerWallet }
  );
  const result = resp.result?.meta?.TransactionResult || "Unknown";
  if (result !== "tesSUCCESS") {
    throw new Error(`Issuer ClearNoRipple for ${label} failed: ${result}`);
  }
  console.log(`  Issuer cleared NoRipple toward ${label} -> ${result}`);
}

async function main() {
  // Validate env vars
  if (!process.env.RLUSD_ISSUER_SEED) {
    console.error("Missing env var: RLUSD_ISSUER_SEED");
    console.error("Run 'node scripts/init-platform.js' first and copy seeds to .env.local");
    process.exit(1);
  }
  for (const acct of ACCOUNTS) {
    if (!process.env[acct.seedEnv]) {
      console.error(`Missing env var: ${acct.seedEnv}`);
      console.error("Run 'node scripts/init-platform.js' first and copy seeds to .env.local");
      process.exit(1);
    }
  }

  const client = new xrpl.Client(DEVNET_WSS);

  try {
    await client.connect();
    console.log("Connected to XRPL Devnet\n");

    // Step 1: Enable DefaultRipple on issuer so new trustlines allow rippling
    const issuerWallet = xrpl.Wallet.fromSeed(process.env.RLUSD_ISSUER_SEED);
    await enableDefaultRipple(client, issuerWallet);

    // Step 2: Set up trustlines from each platform account to the issuer
    console.log("Setting up RLUSD trustlines...\n");

    const wallets = [];
    for (const acct of ACCOUNTS) {
      const wallet = xrpl.Wallet.fromSeed(process.env[acct.seedEnv]);
      await setupTrustline(client, wallet, acct.label);
      wallets.push({ wallet, label: acct.label });
    }

    // Step 3: Issuer clears NoRipple on its side of each trustline
    // (needed if trustlines were created before DefaultRipple was enabled)
    console.log("\nClearing NoRipple on issuer side of trustlines...\n");

    for (const { wallet, label } of wallets) {
      await issuerClearNoRipple(client, issuerWallet, wallet.address, label);
    }

    console.log("\nVerifying trustlines...\n");

    for (const { wallet, label } of wallets) {
      await verifyTrustline(client, wallet.address, label);
    }

    console.log("\nAll RLUSD trustlines established (rippling enabled).");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  } finally {
    if (client.isConnected()) {
      await client.disconnect();
      console.log("\nDisconnected from XRPL Devnet");
    }
  }
}

main();
