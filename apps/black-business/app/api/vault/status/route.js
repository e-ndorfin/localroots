import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { getVaultTotal, getLenderBalance } from "@/lib/supabase/db";

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const totalCents = await getVaultTotal();
    const lenderBalanceCents = await getLenderBalance(user.id);

    const { count: activeLoans } = await supabase
      .from("loans")
      .select("*", { count: "exact", head: true })
      .in("status", ["active", "disbursing"]);

    const { data: lockedData } = await supabase
      .from("tranches")
      .select("amount_cents")
      .in("status", ["locked", "pending"]);

    const lockedCents = (lockedData || []).reduce((sum, r) => sum + r.amount_cents, 0);
    const availableCapitalCents = Math.max(0, totalCents - lockedCents);

    return NextResponse.json({
      totalCents,
      lenderBalanceCents,
      activeLoans,
      availableCapitalCents,
    });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
