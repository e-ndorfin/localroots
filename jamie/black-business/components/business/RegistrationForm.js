"use client";

import { useState } from "react";

export default function RegistrationForm() {
  const [step, setStep] = useState(1);
  const [attested, setAttested] = useState(false);

  if (step === 3) return <div className="card border-community/30 bg-red-50">Registration complete. Your business profile is pending verification.</div>;

  return (
    <div className="card">
      <p className="mb-4 text-sm text-slate-500">Step {step} of 3</p>
      {step === 1 ? (
        <div className="space-y-3"><input className="input" placeholder="Business name" /><input className="input" placeholder="Category" /><input className="input" placeholder="Location" /><textarea className="input" placeholder="Description" /></div>
      ) : (
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={attested} onChange={(e) => setAttested(e.target.checked)} /><span>I attest this business is Black-owned and the information provided is accurate.</span></label>
      )}
      <div className="mt-4 flex gap-2">{step > 1 ? <button className="button-outline" onClick={() => setStep(step - 1)}>Back</button> : null}<button className="button-primary" onClick={() => setStep(step + 1)} disabled={step === 2 && !attested}>{step === 2 ? "Submit" : "Continue"}</button></div>
    </div>
  );
}
