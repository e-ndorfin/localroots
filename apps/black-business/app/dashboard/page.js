"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [role, setRole] = useState(null);
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace("/login"); return; }
      supabase.from("profiles").select("role").eq("id", user.id).single()
        .then(({ data }) => setRole(data?.role || "customer"));
    });
  }, []);
  if (!role) return null;
  if (role === "business") return <div className="card"><h1 className="text-2xl font-bold">Business Dashboard</h1><p className="mt-2">Manage funding requests and track purchases + revenue.</p><div className="mt-4 flex gap-2"><Link href="/business/funding" className="button-primary">Open Funding</Link><Link href="/business/tracking" className="button-outline">Open Tracking</Link></div></div>;
  if (role === "lender") return <div className="card"><h1 className="text-2xl font-bold">Lender Dashboard</h1><p className="mt-2">Vault contribution and lending activity.</p><div className="mt-4 flex gap-2"><Link href="/vault" className="button-primary">Open Vault</Link><Link href="/lending" className="button-outline">View Lending</Link></div></div>;
  return <div className="card"><h1 className="text-2xl font-bold">Customer Dashboard</h1><p className="mt-2">Points summary and recent activity.</p><div className="mt-4 flex gap-2"><Link href="/rewards" className="button-primary">View Rewards</Link><Link href="/directory" className="button-outline">Browse Directory</Link></div></div>;
}
