"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import UserAvatarLink from "@/components/layout/UserAvatarLink";

const NAV_LINKS = {
  business: [
    ["/business/funding", "Funding"],
    ["/lending", "Lending Circles"],
    ["/business/tracking", "Business Metrics"],
    ["/business/storefront", "Edit Storefront"],
  ],
  customer: [
    ["/vault", "Community Fund"],
    ["/rewards", "Rewards"],
  ],
  lender: [
    ["/vault", "Community Fund"],
    ["/rewards", "Rewards"],
  ],
};

export default function Topbar() {
  const [role, setRole] = useState(null);

  // Hydrate role from sessionStorage after mount to avoid SSR mismatch
  useEffect(() => {
    const cached = sessionStorage.getItem("userRole");
    if (cached) setRole(cached);
  }, []);
  const [points, setPoints] = useState(null);
  const [bizBalance, setBizBalance] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        sessionStorage.removeItem("userRole");
        return;
      }
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          const resolvedRole = data?.role || user.user_metadata?.role;
          if (resolvedRole) {
            setRole(resolvedRole);
            sessionStorage.setItem("userRole", resolvedRole);
          }
        });
    });
  }, []);

  // Fetch loyalty balance for customers (on route change + "points-updated" event)
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    const handler = () => setFetchKey((k) => k + 1);
    window.addEventListener("points-updated", handler);
    return () => window.removeEventListener("points-updated", handler);
  }, []);

  useEffect(() => {
    if (role !== "customer") return;
    let cancelled = false;
    fetch("/api/loyalty/balance")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.balance != null) setPoints(data.balance);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [role, pathname, fetchKey]);

  // Fetch business balance (on route change + "balance-updated" event)
  const [bizFetchKey, setBizFetchKey] = useState(0);

  useEffect(() => {
    const handler = () => setBizFetchKey((k) => k + 1);
    window.addEventListener("balance-updated", handler);
    return () => window.removeEventListener("balance-updated", handler);
  }, []);

  useEffect(() => {
    if (role !== "business") return;
    let cancelled = false;
    fetch("/api/business/stats")
      .then((r) => {
        if (!r.ok) {
          console.error("Topbar: /api/business/stats returned", r.status);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!cancelled && data?.balanceCents != null) setBizBalance(data.balanceCents);
      })
      .catch((err) => console.error("Topbar: stats fetch error", err));
    return () => { cancelled = true; };
  }, [role, pathname, bizFetchKey]);

  const roleLinks = NAV_LINKS[role] || NAV_LINKS.customer;

  function navClass(href) {
    if (pathname === href) return "nav-link active";
    if (href !== "/directory" && pathname.startsWith(href + "/")) return "nav-link active";
    return "nav-link";
  }

  const pointsPill = role === "customer" && points != null
    ? <div className="balance-pill"><strong>{points.toLocaleString()} pts</strong></div>
    : null;

  const bizPills = role === "business" && bizBalance != null ? (
    <>
      <div className="balance-pill">
        <strong>${(bizBalance / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
      </div>
      <button
        className="cashout-pill"
        onClick={() => window.dispatchEvent(new Event("open-cashout-modal"))}
      >
        Cash Out
      </button>
    </>
  ) : null;

  return (
    <header className="topbar">
      <Link className="app-name" href="/directory">LocalRoots</Link>
      <nav className="nav-links nav-inline">
        <Link className={navClass("/directory")} href="/directory">Browse</Link>
        {role && roleLinks.map(([href, label]) => (
          <Link key={href} className={navClass(href)} href={href}>{label}</Link>
        ))}
      </nav>
      <div className="topbar-right">
        <div className="site-balances">
          {bizPills || pointsPill}
        </div>
        <UserAvatarLink />
      </div>
    </header>
  );
}
