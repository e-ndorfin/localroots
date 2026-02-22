"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "../providers/WalletProvider";
import { WalletConnector } from "../WalletConnector";
import { useWalletManager } from "../../hooks/useWalletManager";

const NAV_LINKS = [
  { href: "/directory", label: "Directory" },
  { href: "/rewards", label: "Rewards" },
  { href: "/business/register", label: "List Business" },
  { href: "/vault", label: "Vault" },
  { href: "/lending", label: "Lending" },
];

export function Header() {
  const { isConnected, accountInfo, statusMessage } = useWallet();
  useWalletManager();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-primary text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold tracking-tight">
            BBS
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            {isConnected && accountInfo && (
              <span className="hidden md:inline text-xs text-gray-400 font-mono">
                {accountInfo.address.slice(0, 8)}...{accountInfo.address.slice(-4)}
              </span>
            )}
            <WalletConnector />

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="md:hidden pb-4 space-y-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-sm text-gray-300 hover:text-white py-1"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {/* Status bar */}
      {statusMessage && (
        <div
          className={`px-4 py-2 text-sm text-center ${
            statusMessage.type === "error"
              ? "bg-red-600"
              : statusMessage.type === "success"
              ? "bg-green-600"
              : "bg-blue-600"
          }`}
        >
          {statusMessage.message}
        </div>
      )}
    </header>
  );
}
