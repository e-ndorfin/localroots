"use client";

import { useState } from "react";
import Header from "../../../components/layout/Header";
import { RegistrationForm } from "../../../components/business/RegistrationForm";
import { useBusinessProfile } from "../../../hooks/useBusinessProfile";
import Link from "next/link";

export default function RegisterPage() {
  const { business, isRegistered, isLoading, error, register } = useBusinessProfile();
  const [success, setSuccess] = useState(false);

  async function handleRegister(formData) {
    try {
      await register(formData);
      setSuccess(true);
    } catch {
      // error is set in the hook
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2 text-primary">Register Your Business</h1>
        <p className="text-gray-600 mb-8">
          List your Black-owned business for free. No subscription, no credit check.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && isRegistered ? (
          <div className="card text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {business.name} is Registered!
            </h2>
            <p className="text-gray-600 mb-6">
              Your business is now listed in the platform directory. Customers can discover
              and support your business.
            </p>
            {business.credentialHash && (
              <p className="text-xs text-gray-400 mb-4 font-mono">
                XRPL Credential: {business.credentialHash}
              </p>
            )}
            <div className="flex space-x-3 justify-center">
              <Link href={`/directory/${business.id}`} className="btn-primary">
                View Your Listing
              </Link>
              <Link href="/directory" className="btn-secondary">
                Browse Directory
              </Link>
            </div>
          </div>
        ) : (
          <div className="card">
            <RegistrationForm onRegister={handleRegister} isLoading={isLoading} />
          </div>
        )}
      </main>
    </div>
  );
}
