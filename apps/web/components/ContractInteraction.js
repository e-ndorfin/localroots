"use client";

import { useState } from "react";
import { useWallet } from "./providers/WalletProvider";

export function ContractInteraction() {
  const { walletManager, isConnected, addEvent, showStatus } = useWallet();
  const [contractAddress, setContractAddress] = useState("");
  const [functionName, setFunctionName] = useState("");
  const [functionArgs, setFunctionArgs] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [callResult, setCallResult] = useState(null);

  const stringToHex = (str) => {
    return Array.from(str)
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  };

  const loadCounterExample = () => {
    setFunctionName("increment");
    setFunctionArgs("");
    setCallResult(null);
  };

  const handleCallContract = async () => {
    if (!walletManager || !walletManager.account) {
      showStatus("Please connect a wallet first", "error");
      return;
    }

    if (!contractAddress || !functionName) {
      showStatus("Please provide contract address and function name", "error");
      return;
    }

    try {
      setIsCalling(true);
      setCallResult(null);

      const transaction = {
        TransactionType: "ContractCall",
        Account: walletManager.account.address,
        ContractAccount: contractAddress,
        Fee: "1000000", // 1 XRP in drops
        FunctionName: stringToHex(functionName),
        ComputationAllowance: "1000000",
      };

      // Add function arguments if provided
      if (functionArgs) {
        transaction.FunctionArguments = stringToHex(functionArgs);
      }

      const txResult = await walletManager.signAndSubmit(transaction);

      setCallResult({
        success: true,
        hash: txResult.hash || "Pending",
        id: txResult.id,
      });

      showStatus("Contract called successfully!", "success");
      addEvent("Contract Called", txResult);
    } catch (error) {
      setCallResult({
        success: false,
        error: error.message,
      });
      showStatus(`Contract call failed: ${error.message}`, "error");
      addEvent("Contract Call Failed", error);
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Interact with Contract</h2>
        <button onClick={loadCounterExample} className="text-sm text-accent hover:underline">
          Load Counter Example
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contract Address
          </label>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="rAddress..."
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Function Name</label>
          <input
            type="text"
            value={functionName}
            onChange={(e) => setFunctionName(e.target.value)}
            placeholder="e.g., increment, get_value"
            className="input"
          />
          {functionName && (
            <div className="mt-1 text-xs text-gray-500">
              Hex: {stringToHex(functionName)}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Function Arguments (optional)
          </label>
          <input
            type="text"
            value={functionArgs}
            onChange={(e) => setFunctionArgs(e.target.value)}
            placeholder="e.g., 5, hello"
            className="input"
          />
          {functionArgs && (
            <div className="mt-1 text-xs text-gray-500">
              Hex: {stringToHex(functionArgs)}
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <strong>Example Counter Contract Functions:</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>increment - Increase counter by 1</li>
            <li>decrement - Decrease counter by 1</li>
            <li>get_value - Get current counter value</li>
            <li>reset - Reset counter to 0</li>
          </ul>
        </div>

        {isConnected && contractAddress && functionName && (
          <button
            onClick={handleCallContract}
            disabled={isCalling}
            className="w-full bg-accent text-white py-2 px-4 rounded-lg font-semibold hover:bg-accent/90 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isCalling ? "Calling Contract..." : "Call Contract"}
          </button>
        )}

        {!isConnected && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <strong>Connect your wallet</strong> to interact with contracts
          </div>
        )}

        {callResult && (
          <div
            className={`p-4 rounded-lg ${
              callResult.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {callResult.success ? (
              <>
                <h3 className="font-bold text-green-800 mb-2">Contract Called!</h3>
                <p className="text-sm text-green-700">
                  <strong>Hash:</strong> {callResult.hash}
                </p>
                {callResult.id && (
                  <p className="text-sm text-green-700">
                    <strong>ID:</strong> {callResult.id}
                  </p>
                )}
                <p className="text-xs text-green-600 mt-2">
                  ✅ Contract function has been called successfully
                </p>
              </>
            ) : (
              <>
                <h3 className="font-bold text-red-800 mb-2">Call Failed</h3>
                <p className="text-sm text-red-700">{callResult.error}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
