/**
 * Initialize platform wallets on XRPL Devnet.
 *
 * Generates and funds three platform accounts:
 *   1. Platform Master — issues credentials, manages MPT, collects fees
 *   2. SAV Vault — holds pooled lender funds (RLUSD)
 *   3. Rewards Pool — holds MPT tokens for distribution
 *
 * After running, copy the output addresses and seeds into lib/constants.js.
 *
 * Usage: node scripts/init-platform.js
 */

const xrpl = require("xrpl");

const DEVNET_WSS = "wss://s.devnet.rippletest.net:51233";

async function fundAccount(client, label) {
  const wallet = xrpl.Wallet.generate();
  const { balance } = await client.fundWallet(wallet);
  console.log(`\n${label}:`);
  console.log(`  Address: ${wallet.address}`);
  console.log(`  Seed:    ${wallet.seed}`);
  console.log(`  Balance: ${balance} XRP`);
  return wallet;
}

async function main() {
  const client = new xrpl.Client(DEVNET_WSS);

  try {
    await client.connect();
    console.log("Connected to XRPL Devnet\n");
    console.log("=".repeat(60));
    console.log("  BLACK BUSINESS SUPPORT — PLATFORM WALLET INITIALIZATION");
    console.log("=".repeat(60));

    const master = await fundAccount(client, "Platform Master Account");
    const vault = await fundAccount(client, "SAV Vault Account");
    const rewards = await fundAccount(client, "Rewards Pool Account");

    console.log("\n" + "=".repeat(60));
    console.log("\nCopy these values into lib/constants.js:\n");
    console.log(`PLATFORM.MASTER_ADDRESS = "${master.address}";`);
    console.log(`PLATFORM.MASTER_SEED    = "${master.seed}";`);
    console.log(`PLATFORM.VAULT_ADDRESS  = "${vault.address}";`);
    console.log(`PLATFORM.VAULT_SEED     = "${vault.seed}";`);
    console.log(`PLATFORM.REWARDS_ADDRESS = "${rewards.address}";`);
    console.log(`PLATFORM.REWARDS_SEED   = "${rewards.seed}";`);
    console.log("\n" + "=".repeat(60));
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
