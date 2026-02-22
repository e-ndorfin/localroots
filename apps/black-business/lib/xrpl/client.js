/**
 * Server-side XRPL WebSocket client singleton.
 *
 * Usage (in API routes only — never import client-side):
 *   const { getClient } = require("../../lib/xrpl/client");
 *   const client = await getClient();
 */

const xrpl = require("xrpl");

const DEVNET_WSS = "wss://s.devnet.rippletest.net:51233";

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

  clientInstance = new xrpl.Client(DEVNET_WSS);
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

module.exports = { getClient, disconnectClient, DEVNET_WSS };
