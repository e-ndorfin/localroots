"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState("customer");

  useEffect(() => {
    const saved = window.localStorage.getItem("bb-role");
    if (saved) setRole(saved);
  }, []);

  const links = useMemo(() => {
    if (role === "business") {
      return [
        ["Business Register", "/business/register"],
        ["Funding Requests", "/business/funding"],
        ["Customer Tracking", "/business/tracking"],
        ["Edit Storefront", "/business/storefront"],
        ["Directory", "/directory"],
      ];
    }
    if (role === "lender") {
      return [
        ["Vault", "/vault"],
        ["Lending", "/lending"],
        ["Dashboard", "/dashboard"],
      ];
    }
    return [
      ["Directory", "/directory"],
      ["Rewards", "/rewards"],
      ["Redeem", "/rewards/redeem"],
      ["Dashboard", "/dashboard"],
    ];
  }, [role]);

  return (
    <aside className="card h-fit">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Navigation</p>
      <div className="space-y-2">
        {links.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className={pathname === href ? "button-primary w-full" : "button-outline w-full"}
          >
            {label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
