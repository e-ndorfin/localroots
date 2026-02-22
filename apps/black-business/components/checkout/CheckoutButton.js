"use client";

import { useState } from "react";

export default function CheckoutButton() {
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  return (
    <div className="space-y-3">
      <button className="button-primary" onClick={() => { setLoading(true); setTimeout(() => { setLoading(false); setPaid(true); }, 900); }} disabled={loading}>
        {loading ? "Processing..." : "Pay with Card"}
      </button>
      {paid ? <p className="rounded-xl bg-green-50 p-3 text-sm text-green-800">Payment complete. You earned 120 points!</p> : null}
    </div>
  );
}
