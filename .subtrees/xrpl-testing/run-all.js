/**
 * run-all.js — XRPL MASTER_PLAN verification suite
 *
 * Runs all four verification scripts sequentially against XRPL Testnet
 * and prints a pass/fail summary.
 *
 * Usage: node run-all.js
 */
const { verifyConnectivity } = require("./verify-connectivity");
const { verifyRlusdFlow } = require("./verify-rlusd-flow");
const { verifyEscrow } = require("./verify-escrow");
const { verifyMpt } = require("./verify-mpt");

const TESTS = [
  { name: "connectivity", fn: verifyConnectivity },
  { name: "rlusd-flow",   fn: verifyRlusdFlow },
  { name: "escrow",       fn: verifyEscrow },
  { name: "mpt",          fn: verifyMpt },
];

async function runAll() {
  console.log("=".repeat(60));
  console.log("XRPL MASTER_PLAN VERIFICATION SUITE");
  console.log("Network : XRPL Testnet (s.altnet.rippletest.net)");
  console.log("=".repeat(60));

  const results = [];

  for (const test of TESTS) {
    console.log(`\n${"─".repeat(40)}`);
    console.log(`TEST: ${test.name}`);
    console.log("─".repeat(40));
    try {
      await test.fn();
      results.push({ name: test.name, status: "PASS" });
    } catch (e) {
      results.push({ name: test.name, status: "FAIL", error: e.message });
      console.error(`Error: ${e.message}`);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("RESULTS");
  console.log("=".repeat(60));
  for (const r of results) {
    const tag = r.status === "PASS" ? "PASS" : "FAIL";
    const detail = r.error ? `  ← ${r.error}` : "";
    console.log(`[${tag}]  ${r.name}${detail}`);
  }

  const passed = results.filter((r) => r.status === "PASS").length;
  console.log(`\n${passed}/${results.length} passed`);

  if (passed < results.length) process.exit(1);
}

runAll().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
