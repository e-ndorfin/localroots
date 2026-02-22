"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Hook for browsing and searching the business directory.
 *
 * Returns: { businesses, categories, isLoading, error, search, filter, refresh }
 */
export function useDirectory() {
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const fetchDirectory = useCallback(async (search = "", category = "") => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);

      const res = await fetch(`/api/business/directory?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load directory");
      }
      const data = await res.json();
      setBusinesses(data.businesses);
      setCategories(data.categories);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  const search = useCallback(
    (term) => {
      setSearchTerm(term);
      fetchDirectory(term, categoryFilter);
    },
    [fetchDirectory, categoryFilter]
  );

  const filter = useCallback(
    (category) => {
      setCategoryFilter(category);
      fetchDirectory(searchTerm, category);
    },
    [fetchDirectory, searchTerm]
  );

  const refresh = useCallback(() => {
    fetchDirectory(searchTerm, categoryFilter);
  }, [fetchDirectory, searchTerm, categoryFilter]);

  return {
    businesses,
    categories,
    isLoading,
    error,
    searchTerm,
    categoryFilter,
    search,
    filter,
    refresh,
  };
}
