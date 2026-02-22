/**
 * verify-escrow.js
 *
 * Tests the crypto-condition escrow pattern the MASTER_PLAN uses for
 * milestone-gated loan tranches:
 *   1. Creator funds an XRP escrow with a SHA256 condition + FinishAfter deadline
 *   2. After the deadline passes, recipient finishes with the fulfillment
 *   3. Recipient balance verified to have increased
 *
 * This mirrors MASTER_PLAN lines 376-382: EscrowCreate + Condition + CancelAfter.
 * Uses XRP (not RLUSD) because XLS-85 token escrow availability on testnet is
 * unconfirmed — the locking mechanics are identical regardless of asset.
 */
const { Client, isoTimeToRippleTime, xrpToDrops, dropsToXrp } = require("xrpl");
const crypto = require("crypto");
const dayjs = require("dayjs");
const cc = require("five-bells-condition");

const TESTNET = "wss://s.altnet.rippletest.net:51233";
const ESCROW_XRP = "1";
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

async function verifyEscrow() {
  const client = new Client(TESTNET);
  await client.connect();
  console.log("Connected. Funding 2 wallets (creator, recipient)...");

  const { wallet: creator } = await client.fundWallet();
  const { wallet: recipient } = await client.fundWallet();

  console.log(`  Creator  : ${creator.address}`);
  console.log(`  Recipient: ${recipient.address}`);

  await sleep(3000);

  const beforeInfo = await client.request({
    command: "account_info",
    account: recipient.address,
    ledger_index: "validated",
  });
  const balanceBefore = dropsToXrp(beforeInfo.result.account_data.Balance);
  console.log(`  Recipient balance before: ${balanceBefore} XRP`);

  const { condition, fulfillment } = generateCondition();
  const finishAfter = dayjs().add(WAIT_SECONDS, "second").toISOString();

  // Create escrow (matches MASTER_PLAN EscrowCreate pattern)
  console.log(`Creating escrow of ${ESCROW_XRP} XRP (unlocks in ${WAIT_SECONDS}s)...`);
  const createRes = await client.submitAndWait(
    {
      TransactionType: "EscrowCreate",
      Account: creator.address,
      Destination: recipient.address,
      Amount: xrpToDrops(ESCROW_XRP),
      FinishAfter: isoTimeToRippleTime(finishAfter),
      Condition: condition,
    },
    { autofill: true, wallet: creator }
  );

  const sequence = createRes.result.tx_json.Sequence;
  console.log(`  Escrow created (OfferSequence: ${sequence})`);

  // Wait for FinishAfter to pass
  console.log(`Waiting ${WAIT_SECONDS + 2}s...`);
  await sleep((WAIT_SECONDS + 2) * 1000);

  // Finish escrow with fulfillment (mirrors circle-approves-proof flow)
  console.log("Finishing escrow with fulfillment...");
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

  const afterInfo = await client.request({
    command: "account_info",
    account: recipient.address,
    ledger_index: "validated",
  });
  const balanceAfter = dropsToXrp(afterInfo.result.account_data.Balance);
  console.log(`  Recipient balance after : ${balanceAfter} XRP`);

  await client.disconnect();

  if (parseFloat(balanceAfter) <= parseFloat(balanceBefore)) {
    throw new Error(
      `Recipient balance did not increase — before=${balanceBefore}, after=${balanceAfter}`
    );
  }

  return { balanceBefore, balanceAfter };
}

if (require.main === module) {
  verifyEscrow()
    .then((r) => console.log("\nPASS: escrow", r))
    .catch((e) => {
      console.error("FAIL:", e.message);
      process.exit(1);
    });
}

module.exports = { verifyEscrow };
