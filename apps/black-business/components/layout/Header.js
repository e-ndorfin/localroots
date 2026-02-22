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

export default function Topbar({ balanceContent }) {
  const [role, setRole] = useState(() => {
    if (typeof window !== "undefined") return sessionStorage.getItem("userRole") || null;
    return null;
  });
  const [points, setPoints] = useState(null);
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

  // Fetch loyalty balance only for customers (on route change + "points-updated" event)
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

  const roleLinks = NAV_LINKS[role] || NAV_LINKS.customer;

  function navClass(href) {
    if (pathname === href) return "nav-link active";
    if (href !== "/directory" && pathname.startsWith(href + "/")) return "nav-link active";
    return "nav-link";
  }

  const pointsPill = role === "customer" && points != null
    ? <div className="balance-pill"><strong>{points.toLocaleString()} pts</strong></div>
    : null;

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
          {balanceContent || pointsPill}
        </div>
        <UserAvatarLink />
      </div>
    </header>
  );
}
