"use client";

import { useWallet } from "./providers/WalletProvider";

export function AccountInfo() {
  const { isConnected, accountInfo } = useWallet();

  if (!isConnected || !accountInfo) {
    return null;
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Account Info</h2>
      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-600">Address:</span>
          <span className="text-sm font-mono text-gray-900">{accountInfo.address}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-600">Network:</span>
          <span className="text-sm text-gray-900">{accountInfo.network}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-600">Wallet:</span>
          <span className="text-sm text-gray-900">{accountInfo.walletName}</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Click the button showing your address to disconnect
      </p>
    </div>
  );
}
