"use client";

import { useState } from "react";
import { useWallet } from "./providers/WalletProvider";

export function TransactionForm() {
  const { walletManager, isConnected, addEvent, showStatus } = useWallet();
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!walletManager || !walletManager.account) {
      showStatus("Please connect a wallet first", "error");
      return;
    }

    try {
      setIsLoading(true);
      setResult(null);

      const transaction = {
        TransactionType: "Payment",
        Account: walletManager.account.address,
        Destination: destination,
        Amount: amount,
      };

      const txResult = await walletManager.signAndSubmit(transaction);

      setResult({
        success: true,
        hash: txResult.hash || "Pending",
        id: txResult.id,
      });

      showStatus("Transaction submitted successfully!", "success");
      addEvent("Transaction Submitted", txResult);

      // Clear form
      setDestination("");
      setAmount("");
    } catch (error) {
      setResult({
        success: false,
        error: error.message,
      });
      showStatus(`Transaction failed: ${error.message}`, "error");
      addEvent("Transaction Failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Send Transaction</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Destination Address
          </label>
          <input
            type="text"
            placeholder="rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoQT"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (drops)
          </label>
          <input
            type="number"
            placeholder="1000000"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            required
          />
          <small className="text-xs text-gray-500 mt-1 block">
            1 XRP = 1,000,000 drops
          </small>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-accent text-white py-2 px-4 rounded-lg font-semibold hover:bg-accent/90 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? "Signing & Submitting..." : "Sign & Submit Transaction"}
        </button>
      </form>

      {result && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            result.success
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {result.success ? (
            <>
              <h3 className="font-bold text-green-800 mb-2">Transaction Submitted!</h3>
              <p className="text-sm text-green-700">
                <strong>Hash:</strong> {result.hash}
              </p>
              {result.id && (
                <p className="text-sm text-green-700">
                  <strong>ID:</strong> {result.id}
                </p>
              )}
              <p className="text-xs text-green-600 mt-2">
                ✅ Transaction has been signed and submitted to the ledger
              </p>
            </>
          ) : (
            <>
              <h3 className="font-bold text-red-800 mb-2">Transaction Failed</h3>
              <p className="text-sm text-red-700">{result.error}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
