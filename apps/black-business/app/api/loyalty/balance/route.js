import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";

/**
 * GET /api/loyalty/balance
 *
 * Returns the authenticated user's loyalty point balance and recent history.
 */
export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Calculate total balance
    const { data: rows, error: balanceError } = await supabase
      .from("points_ledger")
      .select("points")
      .eq("customer_user_id", user.id);

    if (balanceError) throw balanceError;

    const balance = rows.reduce((sum, row) => sum + row.points, 0);

    // Last 20 history entries
    const { data: history, error: historyError } = await supabase
      .from("points_ledger")
      .select("id, business_id, type, points, description, created_at")
      .eq("customer_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (historyError) throw historyError;

    return NextResponse.json({ userId: user.id, balance, history });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
