"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import UserAvatarLink from "@/components/layout/UserAvatarLink";

export default function Header() {
  const [role, setRole] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    const saved = window.localStorage.getItem("bb-role");
    setRole(saved || "");
  }, []);

  function onRoleChange(nextRole) {
    setRole(nextRole);
    if (nextRole) {
      window.localStorage.setItem("bb-role", nextRole);
    } else {
      window.localStorage.removeItem("bb-role");
    }
  }

  const showWallet = role === "lender";
  const isBusiness = role === "business";

  function navClass(href) {
    return pathname === href ? "nav-link active" : "nav-link";
  }

  return (
    <header>
      <div className="topbar container-page flex flex-wrap items-center gap-3">
        <Link href="/" className="app-name">LocalRoots</Link>

        <nav className="nav-links nav-inline">
          <Link href="/directory" className={navClass("/directory")}>Browse</Link>
          {isBusiness ? (
            <>
              <Link href="/business/funding" className={navClass("/business/funding")}>Funding Requests</Link>
              <Link href="/business/tracking" className={navClass("/business/tracking")}>Business Metrics</Link>
              <Link href="/business/storefront" className={navClass("/business/storefront")}>Edit Storefront</Link>
            </>
          ) : (
            <>
              <Link href="/vault" className={navClass("/vault")}>Community Fund</Link>
              <Link href="/rewards" className={navClass("/rewards")}>Rewards</Link>
              <Link href="/lending" className={navClass("/lending")}>Lending</Link>
              <Link href="/dashboard" className={navClass("/dashboard")}>Dashboard</Link>
            </>
          )}
        </nav>

        <div className="topbar-right">
          <div className="site-balances">
            <div className="balance-pill">
              <strong>$245.0</strong>
            </div>
            <div className="balance-pill">
              <strong>1,840 pts</strong>
            </div>
          </div>

          <label className="sr-only" htmlFor="role">Role</label>
          <select
            id="role"
            value={role}
            onChange={(e) => onRoleChange(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
          >
            <option value="">Not Logged In</option>
            <option value="customer">Customer</option>
            <option value="business">Business Owner</option>
            <option value="lender">Lender</option>
          </select>

          <UserAvatarLink role={role} />
          {showWallet ? <wallet-connector /> : null}
        </div>
      </div>
    </header>
  );
}
