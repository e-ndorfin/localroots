"use client";

import { useState } from "react";

const CATEGORIES = [
  "Restaurant",
  "Retail",
  "Beauty & Barber",
  "Health & Wellness",
  "Professional Services",
  "Arts & Entertainment",
  "Education & Tutoring",
  "Home Services",
  "Technology",
  "Other",
];

const STEPS = ["Business Info", "Attestation", "Confirmation"];

export function RegistrationForm({ onRegister, isLoading }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    category: "",
    location: "",
    description: "",
    ownerPseudonym: "",
    attestation: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validateStep0() {
    const errors = {};
    if (!form.name.trim()) errors.name = "Business name is required";
    if (!form.category) errors.category = "Select a category";
    if (!form.ownerPseudonym.trim()) errors.ownerPseudonym = "Display name is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function validateStep1() {
    const errors = {};
    if (!form.attestation) errors.attestation = "You must attest to Black ownership";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleNext() {
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !validateStep1()) return;
    setStep((s) => s + 1);
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleSubmit() {
    await onRegister({
      name: form.name.trim(),
      category: form.category,
      location: form.location.trim() || undefined,
      description: form.description.trim() || undefined,
      ownerPseudonym: form.ownerPseudonym.trim(),
    });
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center justify-center mb-8 space-x-4">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i <= step ? "bg-accent text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              {i + 1}
            </div>
            <span className="ml-2 text-sm text-gray-600 hidden sm:inline">{label}</span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-300 ml-4" />}
          </div>
        ))}
      </div>

      {/* Step 0: Business Info */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name *
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Mama's Kitchen"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
            {fieldErrors.name && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              className="input"
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {fieldErrors.category && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.category}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Brooklyn, NY"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="Tell customers what your business is about"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Display Name *
            </label>
            <input
              type="text"
              className="input"
              placeholder="A pseudonym for your account"
              value={form.ownerPseudonym}
              onChange={(e) => update("ownerPseudonym", e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              This is your anonymous identity on the platform. No real-world ID required.
            </p>
            {fieldErrors.ownerPseudonym && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.ownerPseudonym}</p>
            )}
          </div>

          <button onClick={handleNext} className="btn-primary w-full mt-4">
            Continue
          </button>
        </div>
      )}

      {/* Step 1: Attestation */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Black Ownership Attestation</h3>
            <p className="text-sm text-blue-800">
              This platform is dedicated to supporting Black-owned businesses. We use a
              self-declaration model backed by community attestation. No credit checks, no
              government ID required.
            </p>
          </div>

          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 rounded border-gray-300 text-accent focus:ring-accent"
              checked={form.attestation}
              onChange={(e) => update("attestation", e.target.checked)}
            />
            <span className="text-sm text-gray-700">
              I attest that this is a Black-owned business. I understand that the community may
              verify this through attestation, and misrepresentation may result in removal from
              the platform.
            </span>
          </label>
          {fieldErrors.attestation && (
            <p className="text-red-500 text-sm">{fieldErrors.attestation}</p>
          )}

          <div className="flex space-x-3">
            <button onClick={handleBack} className="btn-secondary flex-1">
              Back
            </button>
            <button onClick={handleNext} className="btn-primary flex-1">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Confirmation */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-900">Review Your Registration</h3>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-gray-500">Business:</span> {form.name}
              </p>
              <p>
                <span className="text-gray-500">Category:</span> {form.category}
              </p>
              {form.location && (
                <p>
                  <span className="text-gray-500">Location:</span> {form.location}
                </p>
              )}
              {form.description && (
                <p>
                  <span className="text-gray-500">About:</span> {form.description}
                </p>
              )}
              <p>
                <span className="text-gray-500">Owner:</span> {form.ownerPseudonym}
              </p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
            <p className="font-medium mb-1">What happens next:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Your business will be listed in the platform directory</li>
              <li>A REGISTERED_BUSINESS credential is issued on XRPL</li>
              <li>Customers can discover and pay you via the platform</li>
              <li>You can apply for community-backed microloans</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <button onClick={handleBack} className="btn-secondary flex-1" disabled={isLoading}>
              Back
            </button>
            <button
              onClick={handleSubmit}
              className="btn-primary flex-1"
              disabled={isLoading}
            >
              {isLoading ? "Registering..." : "Register Business"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
