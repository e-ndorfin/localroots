/**
 * verify-rlusd-flow.js
 *
 * Tests the core RLUSD (IOU) mechanics the MASTER_PLAN depends on:
 *   1. Issuer enables DefaultRipple (required to issue IOU)
 *   2. Two users set TrustSet for RLUSD
 *   3. Issuer sends 100 RLUSD to user1
 *   4. User1 sends 50 RLUSD to user2
 *   5. Balances verified: user1=50, user2=50
 *
 * Uses fresh faucet-funded wallets each run — no seeds required.
 * Currency: 524C555344000000000000000000000000000000 ("RLUSD" in 20-byte hex)
 */
const { Client } = require("xrpl");

const TESTNET = "wss://s.altnet.rippletest.net:51233";
const RLUSD_HEX = "524C555344000000000000000000000000000000";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyRlusdFlow() {
  const client = new Client(TESTNET);
  await client.connect();
  console.log("Connected. Funding 3 wallets (issuer, user1, user2)...");

  const { wallet: issuer } = await client.fundWallet();
  const { wallet: user1 } = await client.fundWallet();
  const { wallet: user2 } = await client.fundWallet();

  console.log(`  Issuer : ${issuer.address}`);
  console.log(`  User1  : ${user1.address}`);
  console.log(`  User2  : ${user2.address}`);

  await sleep(3000);

  // Step 1: Issuer enables DefaultRipple so IOU can ripple between holders
  console.log("Enabling DefaultRipple on issuer...");
  await client.submitAndWait(
    { TransactionType: "AccountSet", Account: issuer.address, SetFlag: 8 },
    { autofill: true, wallet: issuer }
  );

  // Step 2: Both users set trustlines to issuer
  console.log("Setting trustlines...");
  const trustTx = (account) => ({
    TransactionType: "TrustSet",
    Account: account,
    LimitAmount: { currency: RLUSD_HEX, issuer: issuer.address, value: "1000000" },
  });
  await client.submitAndWait(trustTx(user1.address), { autofill: true, wallet: user1 });
  await client.submitAndWait(trustTx(user2.address), { autofill: true, wallet: user2 });

  // Step 3: Issuer -> User1: 100 RLUSD
  console.log("Issuer -> User1: 100 RLUSD...");
  await client.submitAndWait(
    {
      TransactionType: "Payment",
      Account: issuer.address,
      Destination: user1.address,
      Amount: { currency: RLUSD_HEX, issuer: issuer.address, value: "100" },
    },
    { autofill: true, wallet: issuer }
  );

  // Step 4: User1 -> User2: 50 RLUSD
  console.log("User1 -> User2: 50 RLUSD...");
  await client.submitAndWait(
    {
      TransactionType: "Payment",
      Account: user1.address,
      Destination: user2.address,
      Amount: { currency: RLUSD_HEX, issuer: issuer.address, value: "50" },
    },
    { autofill: true, wallet: user1 }
  );

  // Step 5: Check balances
  const [u1Lines, u2Lines] = await Promise.all([
    client.request({ command: "account_lines", account: user1.address, ledger_index: "validated" }),
    client.request({ command: "account_lines", account: user2.address, ledger_index: "validated" }),
  ]);

  const user1Balance = u1Lines.result.lines.find((l) => l.currency === RLUSD_HEX)?.balance ?? "0";
  const user2Balance = u2Lines.result.lines.find((l) => l.currency === RLUSD_HEX)?.balance ?? "0";

  console.log(`  User1 RLUSD balance: ${user1Balance}`);
  console.log(`  User2 RLUSD balance: ${user2Balance}`);

  await client.disconnect();

  if (parseFloat(user1Balance) !== 50 || parseFloat(user2Balance) !== 50) {
    throw new Error(`Unexpected balances — user1=${user1Balance}, user2=${user2Balance}`);
  }

  return { user1Balance, user2Balance };
}

if (require.main === module) {
  verifyRlusdFlow()
    .then((r) => console.log("\nPASS: rlusd-flow", r))
    .catch((e) => {
      console.error("FAIL:", e.message);
      process.exit(1);
    });
}

module.exports = { verifyRlusdFlow };
