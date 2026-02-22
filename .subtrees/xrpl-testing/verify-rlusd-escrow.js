/**
 * verify-rlusd-escrow.js
 *
 * Tests XLS-85 token escrow with RLUSD (IOU) — the exact pattern the
 * MASTER_PLAN uses for milestone-gated loan tranches.
 *
 * If XLS-85 is not active on this network, EscrowCreate will fail with
 * temDISABLED or tecNO_PERMISSION and we fall back to the smart contract
 * escrow approach instead.
 */
const { Client, isoTimeToRippleTime } = require("xrpl");
const crypto = require("crypto");
const dayjs = require("dayjs");
const cc = require("five-bells-condition");

const TESTNET = "wss://s.altnet.rippletest.net:51233";
const RLUSD_HEX = "524C555344000000000000000000000000000000";
const WAIT_SECONDS = 12;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateCondition() {
  const preimage = crypto.randomBytes(32);
  const fulfillment = new cc.PreimageSha256();
  fulfillment.setPreimage(preimage);
  return {
    condition: fulfillment.getConditionBinary().toString("hex").toUpperCase(),
    fulfillment: fulfillment.serializeBinary().toString("hex").toUpperCase(),
  };
}

async function verifyRlusdEscrow() {
  const client = new Client(TESTNET);
  await client.connect();
  console.log("Connected. Funding 3 wallets (issuer, creator, recipient)...");

  const { wallet: issuer } = await client.fundWallet();
  const { wallet: creator } = await client.fundWallet();
  const { wallet: recipient } = await client.fundWallet();

  console.log(`  Issuer   : ${issuer.address}`);
  console.log(`  Creator  : ${creator.address}`);
  console.log(`  Recipient: ${recipient.address}`);

  await sleep(3000);

  // Set up RLUSD — same flow as verify-rlusd-flow.js
  console.log("Setting up RLUSD (DefaultRipple + trustlines)...");
  await client.submitAndWait(
    { TransactionType: "AccountSet", Account: issuer.address, SetFlag: 8 },
    { autofill: true, wallet: issuer }
  );

  const trustTx = (account) => ({
    TransactionType: "TrustSet",
    Account: account,
    LimitAmount: { currency: RLUSD_HEX, issuer: issuer.address, value: "1000000" },
  });
  await client.submitAndWait(trustTx(creator.address), { autofill: true, wallet: creator });
  await client.submitAndWait(trustTx(recipient.address), { autofill: true, wallet: recipient });

  // Fund creator with 100 RLUSD
  console.log("Issuer -> Creator: 100 RLUSD...");
  await client.submitAndWait(
    {
      TransactionType: "Payment",
      Account: issuer.address,
      Destination: creator.address,
      Amount: { currency: RLUSD_HEX, issuer: issuer.address, value: "100" },
    },
    { autofill: true, wallet: issuer }
  );

  const { condition, fulfillment } = generateCondition();
  const finishAfter = dayjs().add(WAIT_SECONDS, "second").toISOString();

  // THE KEY TEST: EscrowCreate with RLUSD Amount (requires XLS-85)
  console.log("Creating RLUSD escrow (XLS-85 required)...");
  let createRes;
  try {
    createRes = await client.submitAndWait(
      {
        TransactionType: "EscrowCreate",
        Account: creator.address,
        Destination: recipient.address,
        Amount: { currency: RLUSD_HEX, issuer: issuer.address, value: "50" },
        FinishAfter: isoTimeToRippleTime(finishAfter),
        Condition: condition,
      },
      { autofill: true, wallet: creator }
    );
  } catch (e) {
    await client.disconnect();
    throw new Error(`EscrowCreate with RLUSD failed — XLS-85 likely not active on testnet. Error: ${e.message}`);
  }

  const txResult = createRes.result?.meta?.TransactionResult;
  if (txResult !== "tesSUCCESS") {
    await client.disconnect();
    throw new Error(`EscrowCreate failed: ${txResult} — XLS-85 likely not active on testnet`);
  }

  const sequence = createRes.result.tx_json.Sequence;
  console.log(`  RLUSD escrow created (OfferSequence: ${sequence})`);
  console.log(`  XLS-85 is ACTIVE on testnet!`);

  // Wait and finish
  console.log(`Waiting ${WAIT_SECONDS + 2}s...`);
  await sleep((WAIT_SECONDS + 2) * 1000);

  console.log("Finishing RLUSD escrow...");
  await client.submitAndWait(
    {
      TransactionType: "EscrowFinish",
      Account: recipient.address,
      Owner: creator.address,
      OfferSequence: sequence,
      Condition: condition,
      Fulfillment: fulfillment,
    },
    { autofill: true, wallet: recipient }
  );

  // Check recipient got the RLUSD
  const lines = await client.request({
    command: "account_lines",
    account: recipient.address,
    ledger_index: "validated",
  });
  const balance = lines.result.lines.find((l) => l.currency === RLUSD_HEX)?.balance ?? "0";
  console.log(`  Recipient RLUSD balance: ${balance}`);

  await client.disconnect();

  if (parseFloat(balance) !== 50) {
    throw new Error(`Unexpected recipient balance: ${balance} (expected 50)`);
  }

  return { balance, xls85Active: true };
}

if (require.main === module) {
  verifyRlusdEscrow()
    .then((r) => console.log("\nPASS: rlusd-escrow", r))
    .catch((e) => {
      console.error("\nFAIL:", e.message);
      process.exit(1);
    });
}

module.exports = { verifyRlusdEscrow };
