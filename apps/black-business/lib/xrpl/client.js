/**
 * Server-side XRPL WebSocket client singleton.
 *
 * Usage (in API routes only — never import client-side):
 *   const { getClient } = require("../../lib/xrpl/client");
 *   const client = await getClient();
 */

const xrpl = require("xrpl");

const NETWORK_WSS = {
  mainnet: "wss://xrplcluster.com",
  testnet: "wss://s.altnet.rippletest.net:51233",
  devnet: "wss://s.devnet.rippletest.net:51233",
};

const network = process.env.NEXT_PUBLIC_DEFAULT_NETWORK || "devnet";
const WSS_URL = NETWORK_WSS[network] || NETWORK_WSS.devnet;

let clientInstance = null;

/**
 * Returns a connected XRPL client. Reuses the same instance across
 * API route invocations within one server process to avoid opening
 * multiple WebSocket connections.
 */
async function getClient() {
  if (clientInstance && clientInstance.isConnected()) {
    return clientInstance;
  }

  clientInstance = new xrpl.Client(WSS_URL);
  await clientInstance.connect();
  return clientInstance;
}

/**
 * Explicitly disconnect the client (useful for scripts/cleanup).
 */
async function disconnectClient() {
  if (clientInstance && clientInstance.isConnected()) {
    await clientInstance.disconnect();
    clientInstance = null;
  }
}

module.exports = { getClient, disconnectClient, WSS_URL };
