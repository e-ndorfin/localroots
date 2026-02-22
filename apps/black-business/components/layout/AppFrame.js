"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

export default function AppFrame({ children }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container-page py-6">
        <div className={isLanding ? "" : "grid gap-6 lg:grid-cols-[240px_1fr]"}>
          {!isLanding ? <Sidebar /> : null}
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
