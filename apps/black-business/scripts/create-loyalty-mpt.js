/**
 * Create the BBS (Black Business Support) loyalty MPT issuance on Devnet.
 *
 * Prerequisites:
 *   1. Run `node scripts/init-platform.js` first to generate wallets
 *   2. Copy wallet seeds into .env.local
 *   3. Run `node scripts/setup-trustlines.js` to establish RLUSD trustlines
 *
 * Usage: node scripts/create-loyalty-mpt.js
 *
 * After running, copy the MPT Issuance ID into .env.local as:
 *   NEXT_PUBLIC_LOYALTY_MPT_ID=<the id printed below>
 */

require("dotenv").config({ path: ".env.local" });
const xrpl = require("xrpl");

const DEVNET_WSS = "wss://s.devnet.rippletest.net:51233";

function textToHex(text) {
  return Buffer.from(text, "utf8").toString("hex").toUpperCase();
}

function hexToText(hex) {
  return Buffer.from(hex, "hex").toString("utf8");
}

async function main() {
  const masterSeed = process.env.PLATFORM_MASTER_SEED;
  if (!masterSeed) {
    console.error("Missing env var: PLATFORM_MASTER_SEED");
    console.error("Run 'node scripts/init-platform.js' first and copy seeds to .env.local");
    process.exit(1);
  }

  const client = new xrpl.Client(DEVNET_WSS);

  try {
    await client.connect();
    console.log("Connected to XRPL Devnet\n");

    const masterWallet = xrpl.Wallet.fromSeed(masterSeed);
    console.log(`Platform Master: ${masterWallet.address}\n`);

    // -----------------------------------------------------------------------
    // Step 1: Create BBS Loyalty MPT Issuance
    // -----------------------------------------------------------------------
    console.log("Creating BBS loyalty token issuance...\n");

    const metadata = {
      ticker: "BBS",
      name: "Black Business Support Points",
      desc: "Loyalty rewards for shopping Black-owned",
      asset_class: "loyalty",
    };

    const mptCreateTx = {
      TransactionType: "MPTokenIssuanceCreate",
      Account: masterWallet.address,
      AssetScale: 0, // Whole points only (no decimals)
      MaximumAmount: "10000000000", // 10 billion max supply
      TransferFee: 0, // No fee on point transfers
      MPTokenMetadata: textToHex(JSON.stringify(metadata)),
      Flags: 0x0010 + 0x0020, // lsfMPTCanTransfer + lsfMPTCanTrade
    };

    const createResponse = await client.submitAndWait(mptCreateTx, {
      autofill: true,
      wallet: masterWallet,
    });

    const createResult = createResponse.result?.meta?.TransactionResult || "Unknown";
    if (createResult !== "tesSUCCESS") {
      throw new Error(`MPTokenIssuanceCreate failed: ${createResult}`);
    }

    console.log(`  MPTokenIssuanceCreate -> ${createResult}`);
    const txHash = createResponse.result?.hash;
    console.log(`  Transaction hash: ${txHash}\n`);

    // -----------------------------------------------------------------------
    // Step 2: Extract MPT Issuance ID
    // -----------------------------------------------------------------------
    const txInfo = await client.request({ command: "tx", transaction: txHash });
    const mptIssuanceId = txInfo.result.meta?.mpt_issuance_id;

    if (!mptIssuanceId) {
      throw new Error("Could not extract mpt_issuance_id from transaction");
    }

    console.log(`  MPT Issuance ID: ${mptIssuanceId}\n`);

    // -----------------------------------------------------------------------
    // Step 3: Verify issuance on-chain
    // -----------------------------------------------------------------------
    console.log("Verifying issuance on-chain...\n");

    const issuanceInfo = await client.request({
      command: "ledger_entry",
      mpt_issuance: mptIssuanceId,
      ledger_index: "validated",
    });

    const node = issuanceInfo.result.node;
    console.log(`  Issuer:           ${node.Issuer}`);
    console.log(`  AssetScale:       ${node.AssetScale}`);
    console.log(`  MaximumAmount:    ${node.MaximumAmount}`);
    console.log(`  TransferFee:      ${node.TransferFee}`);
    console.log(`  OutstandingAmount: ${node.OutstandingAmount}`);

    if (node.MPTokenMetadata) {
      try {
        const parsed = JSON.parse(hexToText(node.MPTokenMetadata));
        console.log(`  Metadata ticker:  ${parsed.ticker}`);
        console.log(`  Metadata name:    ${parsed.name}`);
      } catch {
        console.log(`  Metadata (raw hex): ${node.MPTokenMetadata}`);
      }
    }

    // -----------------------------------------------------------------------
    // Step 4: Also verify via account_objects
    // -----------------------------------------------------------------------
    console.log("\nVerifying via account_objects...\n");

    const accountObjects = await client.request({
      command: "account_objects",
      account: masterWallet.address,
      ledger_index: "validated",
      type: "mpt_issuance",
    });

    const found = accountObjects.result.account_objects.find(
      (obj) => obj.mpt_issuance_id === mptIssuanceId
    );

    if (found) {
      console.log("  BBS MPT issuance confirmed in account_objects.");
    } else {
      console.warn("  WARNING: MPT issuance not found in account_objects");
    }

    // -----------------------------------------------------------------------
    // Output
    // -----------------------------------------------------------------------
    console.log("\n" + "=".repeat(60));
    console.log("\nAdd this to your .env.local:\n");
    console.log(`NEXT_PUBLIC_LOYALTY_MPT_ID=${mptIssuanceId}`);
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
