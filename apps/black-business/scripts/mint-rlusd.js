/**
 * Mint test RLUSD from the issuer to all platform accounts.
 *
 * This is needed because trustlines alone don't give accounts a balance —
 * the issuer must actually send RLUSD to each account.
 *
 * Prerequisites:
 *   1. Run `node scripts/init-platform.js` (generate wallets)
 *   2. Run `node scripts/setup-trustlines.js` (set up RLUSD trustlines)
 *   3. Copy all seeds + addresses into .env.local
 *
 * Usage: node scripts/mint-rlusd.js
 */

require("dotenv").config({ path: ".env.local" });
const xrpl = require("xrpl");

const DEVNET_WSS = "wss://s.devnet.rippletest.net:51233";
const RLUSD_CURRENCY_HEX = "524C555344000000000000000000000000000000";

const RLUSD_ISSUER_SEED = process.env.RLUSD_ISSUER_SEED;
if (!RLUSD_ISSUER_SEED) {
  console.error("Missing env var: RLUSD_ISSUER_SEED");
  process.exit(1);
}

const RECIPIENTS = [
  { label: "Platform Master", seedEnv: "PLATFORM_MASTER_SEED", amount: "100000" },
  { label: "SAV Vault", seedEnv: "VAULT_SEED", amount: "100000" },
  { label: "Rewards Pool", seedEnv: "REWARDS_POOL_SEED", amount: "50000" },
];

async function main() {
  for (const r of RECIPIENTS) {
    if (!process.env[r.seedEnv]) {
      console.error(`Missing env var: ${r.seedEnv}`);
      process.exit(1);
    }
  }

  const client = new xrpl.Client(DEVNET_WSS);

  try {
    await client.connect();
    console.log("Connected to XRPL Devnet\n");

    const issuerWallet = xrpl.Wallet.fromSeed(RLUSD_ISSUER_SEED);
    console.log(`RLUSD Issuer: ${issuerWallet.address}\n`);

    for (const r of RECIPIENTS) {
      const recipientWallet = xrpl.Wallet.fromSeed(process.env[r.seedEnv]);

      console.log(`Minting ${r.amount} RLUSD -> ${r.label} (${recipientWallet.address}) ...`);

      const response = await client.submitAndWait(
        {
          TransactionType: "Payment",
          Account: issuerWallet.address,
          Destination: recipientWallet.address,
          Amount: {
            currency: RLUSD_CURRENCY_HEX,
            issuer: issuerWallet.address,
            value: r.amount,
          },
        },
        { autofill: true, wallet: issuerWallet }
      );

      const result = response.result?.meta?.TransactionResult || "Unknown";
      if (result !== "tesSUCCESS") {
        console.error(`  FAILED: ${result}`);
      } else {
        console.log(`  OK: ${result} (${response.result?.hash})`);
      }
    }

    // Verify balances
    console.log("\nVerifying RLUSD balances...\n");

    for (const r of RECIPIENTS) {
      const recipientWallet = xrpl.Wallet.fromSeed(process.env[r.seedEnv]);
      const lines = await client.request({
        command: "account_lines",
        account: recipientWallet.address,
        ledger_index: "validated",
      });

      const rlusdLine = lines.result.lines.find(
        (l) => l.currency === RLUSD_CURRENCY_HEX && l.account === issuerWallet.address
      );

      console.log(`  ${r.label}: ${rlusdLine ? rlusdLine.balance : "0"} RLUSD`);
    }

    console.log("\nDone. Platform accounts are funded with test RLUSD.");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  } finally {
    if (client.isConnected()) {
      await client.disconnect();
      console.log("Disconnected from XRPL Devnet");
    }
  }
}

main();
