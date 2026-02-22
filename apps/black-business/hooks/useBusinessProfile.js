"use client";

import { useState, useCallback } from "react";

/**
 * Hook for managing a business owner's profile and registration.
 *
 * Returns: { business, isRegistered, isLoading, error, register }
 */
export function useBusinessProfile() {
  const [business, setBusiness] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const isRegistered = !!business;

  const register = useCallback(async ({ name, category, location, description }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/business/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, location, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }
      setBusiness(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { business, isRegistered, isLoading, error, register };
}
