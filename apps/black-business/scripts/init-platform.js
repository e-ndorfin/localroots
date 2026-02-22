/**
 * Initialize platform wallets on XRPL Devnet.
 *
 * Generates and funds four accounts:
 *   1. RLUSD Issuer — test RLUSD issuer (Devnet doesn't have mainnet's RLUSD issuer)
 *   2. Platform Master — issues credentials, manages MPT, collects fees
 *   3. SAV Vault — holds pooled lender funds (RLUSD)
 *   4. Rewards Pool — holds MPT tokens for distribution
 *
 * After running, copy the output into .env.local (seeds are secret, addresses are public).
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

    const rlusdIssuer = await fundAccount(client, "RLUSD Test Issuer");
    const master = await fundAccount(client, "Platform Master Account");
    const vault = await fundAccount(client, "SAV Vault Account");
    const rewards = await fundAccount(client, "Rewards Pool Account");

    console.log("\n" + "=".repeat(60));
    console.log("\nCopy these values into .env.local:\n");
    console.log(`# RLUSD test issuer (Devnet only — replaces mainnet issuer)`);
    console.log(`NEXT_PUBLIC_RLUSD_ISSUER=${rlusdIssuer.address}`);
    console.log(`RLUSD_ISSUER_SEED=${rlusdIssuer.seed}`);
    console.log();
    console.log(`# Platform account addresses (public)`);
    console.log(`NEXT_PUBLIC_PLATFORM_MASTER_ADDRESS=${master.address}`);
    console.log(`NEXT_PUBLIC_VAULT_ADDRESS=${vault.address}`);
    console.log(`NEXT_PUBLIC_REWARDS_POOL_ADDRESS=${rewards.address}`);
    console.log();
    console.log(`# Platform account seeds (SECRET — never commit)`);
    console.log(`PLATFORM_MASTER_SEED=${master.seed}`);
    console.log(`VAULT_SEED=${vault.seed}`);
    console.log(`REWARDS_POOL_SEED=${rewards.seed}`);
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
