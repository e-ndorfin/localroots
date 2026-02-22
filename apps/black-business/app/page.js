"use client";

import { Header } from "../components/layout/Header";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 text-primary">
            Black Business Support
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Shop intentionally. Earn rewards. Fund community growth.
            A platform connecting customers, Black-owned businesses,
            and community lenders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Customer CTA */}
          <div className="card text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-loyalty/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">&#x1F6CD;</span>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-loyalty">Shop & Earn</h2>
            <p className="text-gray-600 mb-6">
              Discover Black-owned businesses near you. Pay by card, earn reward
              points, and redeem them for discounts.
            </p>
            <Link
              href="/directory"
              className="inline-block btn-loyalty w-full text-center"
            >
              Browse Directory
            </Link>
          </div>

          {/* Business Owner CTA */}
          <div className="card text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">&#x1F3EA;</span>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-accent">List Your Business</h2>
            <p className="text-gray-600 mb-6">
              Register for free. Get discovered by customers. Access microloans
              backed by community capital.
            </p>
            <Link
              href="/business/register"
              className="inline-block btn-primary w-full text-center"
            >
              Register Now
            </Link>
          </div>

          {/* Lender CTA */}
          <div className="card text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-vault/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">&#x1F91D;</span>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-vault">Support the Community</h2>
            <p className="text-gray-600 mb-6">
              Contribute to the Shared Asset Vault. Fund microloans for
              Black-owned businesses and earn interest.
            </p>
            <Link
              href="/vault"
              className="inline-block btn-vault w-full text-center"
            >
              Open Vault
            </Link>
          </div>
        </div>

        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 text-primary">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-2">For Customers</h3>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                <li>Browse the directory of Black-owned businesses</li>
                <li>Pay with your regular card — no crypto needed</li>
                <li>Earn reward points on every purchase</li>
                <li>Redeem points for discounts at any business</li>
              </ol>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-2">For Business Owners</h3>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                <li>Register your business for free — no subscription</li>
                <li>Get listed in the platform directory</li>
                <li>Receive payments directly to your dashboard</li>
                <li>Apply for community-backed microloans</li>
              </ol>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-2">For Community Lenders</h3>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                <li>Connect your wallet to the Shared Asset Vault</li>
                <li>Contribute funds to a community lending pool</li>
                <li>Capital funds microloans for vetted businesses</li>
                <li>Earn interest as borrowers repay their loans</li>
              </ol>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-2">Lending Circles</h3>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                <li>Borrowers join circles of 4-6 members</li>
                <li>Loans disbursed in milestone-gated tranches</li>
                <li>Circle members verify proof before each release</li>
                <li>Graduated tiers unlock larger loan amounts</li>
              </ol>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600">
          <p>Black Business Support — Powered by XRPL</p>
        </div>
      </footer>
    </div>
  );
}
