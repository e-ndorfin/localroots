const { Client } = require("xrpl");

const TESTNET = "wss://s.altnet.rippletest.net:51233";

async function verifyConnectivity() {
  const client = new Client(TESTNET);
  console.log("Connecting to XRPL Testnet...");
  await client.connect();

  const res = await client.request({ command: "server_info" });
  const info = res.result.info;

  const result = {
    network: "testnet",
    ledger: info.validated_ledger.seq,
    version: info.build_version,
    load: info.load_factor,
  };

  console.log(`  Ledger index   : ${result.ledger}`);
  console.log(`  rippled version: ${result.version}`);
  console.log(`  Load factor    : ${result.load}`);

  await client.disconnect();
  return result;
}

if (require.main === module) {
  verifyConnectivity()
    .then(() => console.log("\nPASS: connectivity"))
    .catch((e) => {
      console.error("FAIL:", e.message);
      process.exit(1);
    });
}

module.exports = { verifyConnectivity };
