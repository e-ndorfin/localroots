"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import UserAvatarLink from "@/components/layout/UserAvatarLink";

export default function Topbar({ balanceContent }) {
  const [role, setRole] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    const saved = window.localStorage.getItem("bb-role");
    setRole(saved || "");
  }, []);

  const isBusiness = role === "business";

  function navClass(href) {
    if (pathname === href) return "nav-link active";
    if (href !== "/directory" && pathname.startsWith(href + "/")) return "nav-link active";
    return "nav-link";
  }

  return (
    <header className="topbar">
      <Link className="app-name" href="/directory">LocalRoots</Link>
      <nav className="nav-links nav-inline">
        <Link className={navClass("/directory")} href="/directory">Browse</Link>
        {isBusiness ? (
          <>
            <Link className={navClass("/business/funding")} href="/business/funding">Funding Requests</Link>
            <Link className={navClass("/business/tracking")} href="/business/tracking">Business Metrics</Link>
            <Link className={navClass("/business/storefront")} href="/business/storefront">Edit Storefront</Link>
          </>
        ) : (
          <>
            <Link className={navClass("/vault")} href="/vault">Community Fund</Link>
            <Link className={navClass("/rewards")} href="/rewards">Rewards</Link>
            <Link className={navClass("/lending")} href="/lending">Lending</Link>
          </>
        )}
      </nav>
      <div className="topbar-right">
        <div className="site-balances">
          {balanceContent || <div className="balance-pill"><strong>1,840 pts</strong></div>}
        </div>
        <UserAvatarLink />
      </div>
    </header>
  );
}
