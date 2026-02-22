/**
 * verify-mpt.js
 *
 * Tests the MPT (Multi-Purpose Token) mechanics the MASTER_PLAN uses for
 * the loyalty points system (XLS-33):
 *   1. Issuer creates MPT issuance with transfer enabled
 *   2. Holder opts in via MPTokenAuthorize
 *   3. Issuer mints 500 tokens to holder
 *   4. Holder balance verified on-chain
 *
 * Mirrors the customer loyalty token flow: platform mints points per purchase.
 */
const { Client } = require("xrpl");

const TESTNET = "wss://s.altnet.rippletest.net:51233";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function submitTx(client, txn, wallet, label) {
  if (label) console.log(`  ${label}...`);
  const res = await client.submitAndWait(txn, { autofill: true, wallet });
  const result = res.result?.meta?.TransactionResult;
  if (result !== "tesSUCCESS") throw new Error(`${txn.TransactionType} failed: ${result}`);
  return res;
}

async function verifyMpt() {
  const client = new Client(TESTNET);
  await client.connect();
  console.log("Connected. Funding 2 wallets (issuer, holder)...");

  const { wallet: issuer } = await client.fundWallet();
  const { wallet: holder } = await client.fundWallet();

  console.log(`  Issuer: ${issuer.address}`);
  console.log(`  Holder: ${holder.address}`);

  await sleep(3000);

  // Step 1: Create MPT issuance (loyalty token)
  const createRes = await submitTx(
    client,
    {
      TransactionType: "MPTokenIssuanceCreate",
      Account: issuer.address,
      AssetScale: 0,
      MaximumAmount: "10000000",
      Flags: 0x0008 + 0x0010 + 0x0020 + 0x0040, // canEscrow + canTrade + canTransfer + canClawback
    },
    issuer,
    "Creating MPT issuance"
  );

  await sleep(2000);

  const mptIssuanceId = createRes.result?.meta?.mpt_issuance_id;
  if (!mptIssuanceId) throw new Error("Could not extract mpt_issuance_id from tx metadata");
  console.log(`  MPT Issuance ID: ${mptIssuanceId}`);

  // Step 2: Holder opts in
  await submitTx(
    client,
    { TransactionType: "MPTokenAuthorize", Account: holder.address, MPTokenIssuanceID: mptIssuanceId },
    holder,
    "Holder authorizing MPT"
  );

  // Step 3: Issuer mints 500 tokens to holder
  await submitTx(
    client,
    {
      TransactionType: "Payment",
      Account: issuer.address,
      Destination: holder.address,
      Amount: { mpt_issuance_id: mptIssuanceId, value: "500" },
    },
    issuer,
    "Minting 500 tokens to holder"
  );

  // Step 4: Verify balance
  const objects = await client.request({
    command: "account_objects",
    account: holder.address,
    ledger_index: "validated",
    type: "mptoken",
  });

  const mptObj = objects.result.account_objects.find(
    (o) => o.MPTokenIssuanceID === mptIssuanceId
  );
  const balance = mptObj?.MPTAmount ?? "0";
  console.log(`  Holder MPT balance: ${balance}`);

  await client.disconnect();

  if (balance !== "500") throw new Error(`Unexpected MPT balance: ${balance} (expected 500)`);

  return { mptIssuanceId, holderBalance: balance };
}

if (require.main === module) {
  verifyMpt()
    .then((r) => console.log("\nPASS: mpt", r))
    .catch((e) => {
      console.error("FAIL:", e.message);
      process.exit(1);
    });
}

module.exports = { verifyMpt };
