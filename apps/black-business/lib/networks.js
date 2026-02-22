/**
 * XRPL network configuration.
 * Default: Devnet (required for Batch XLS-56 and Credentials XLS-70 amendments).
 */

const networks = {
  Devnet: {
    name: "Devnet",
    url: "wss://s.devnet.rippletest.net:51233",
    networkId: 2,
    explorer: "https://devnet.xrpl.org",
  },
  Testnet: {
    name: "Testnet",
    url: "wss://s.altnet.rippletest.net:51233",
    networkId: 1,
    explorer: "https://testnet.xrpl.org",
  },
  AlphaNet: {
    name: "AlphaNet",
    url: "wss://alphanet.nerdnest.xyz",
    networkId: 21465,
    explorer: null,
  },
};

const DEFAULT_NETWORK = process.env.NEXT_PUBLIC_DEFAULT_NETWORK || "Devnet";

module.exports = { networks, DEFAULT_NETWORK };
