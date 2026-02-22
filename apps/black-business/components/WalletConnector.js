"use client";

import { useState, useEffect } from "react";
import { useWallet } from "./providers/WalletProvider";
import { useWalletConnector } from "../hooks/useWalletConnector";

const THEMES = {
  dark: {
    "--xc-background-color": "#1a202c",
    "--xc-background-secondary": "#2d3748",
    "--xc-background-tertiary": "#4a5568",
    "--xc-text-color": "#F5F4E7",
    "--xc-text-muted-color": "rgba(245, 244, 231, 0.6)",
    "--xc-primary-color": "#3b99fc",
  },
  light: {
    "--xc-background-color": "#ffffff",
    "--xc-background-secondary": "#f5f5f5",
    "--xc-background-tertiary": "#eeeeee",
    "--xc-text-color": "#111111",
    "--xc-text-muted-color": "rgba(17, 17, 17, 0.6)",
    "--xc-primary-color": "#2563eb",
  },
};

export function WalletConnector() {
  const { walletManager } = useWallet();
  const walletConnectorRef = useWalletConnector(walletManager);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const registerWebComponent = async () => {
      try {
        const { WalletConnectorElement } = await import("xrpl-connect");

        if (!customElements.get("xrpl-wallet-connector")) {
          customElements.define("xrpl-wallet-connector", WalletConnectorElement);
        }
      } catch (error) {
        console.error("Failed to register wallet connector:", error);
      }
    };

    registerWebComponent();
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <xrpl-wallet-connector
      ref={walletConnectorRef}
      id="wallet-connector"
      style={{
        ...THEMES.dark,
        "--xc-font-family": "inherit",
        "--xc-border-radius": "12px",
        "--xc-modal-box-shadow": "0 10px 40px rgba(0, 0, 0, 0.3)",
      }}
      primary-wallet="xaman"
    />
  );
}
