"use client";

import { WalletConnector } from "./WalletConnector";
import { useWalletManager } from "../hooks/useWalletManager";
import { useWallet } from "./providers/WalletProvider";

export function Header() {
  useWalletManager();
  const { statusMessage } = useWallet();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-xrpl rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">X</span>
            </div>
            <span className="text-xl font-bold">Scaffold-XRP</span>
          </div>

          <div className="flex items-center space-x-4">
            {statusMessage && (
              <div
                className={`text-sm px-3 py-1 rounded-lg ${
                  statusMessage.type === "success"
                    ? "bg-green-50 text-green-700"
                    : statusMessage.type === "error"
                    ? "bg-red-50 text-red-700"
                    : statusMessage.type === "warning"
                    ? "bg-yellow-50 text-yellow-700"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                {statusMessage.message}
              </div>
            )}
            <WalletConnector />
          </div>
        </div>
      </div>
    </header>
  );
}
