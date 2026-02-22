import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";

/**
 * POST /api/loyalty/mint
 *
 * Mints loyalty points for the authenticated user.
 * Body: { points }
 */
export async function POST(request) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { points, businessId, description } = await request.json();

    if (!points || points <= 0) {
      return NextResponse.json(
        { error: "Missing or invalid field: points (must be > 0)" },
        { status: 400 }
      );
    }

    // Insert earn entry
    const entry = {
      customer_user_id: user.id,
      type: "earn",
      points,
      description: description || "Manual mint",
    };
    if (businessId) entry.business_id = businessId;

    const { error: insertError } = await supabase.from("points_ledger").insert(entry);

    if (insertError) throw insertError;

    // Calculate total balance
    const { data: rows, error: balanceError } = await supabase
      .from("points_ledger")
      .select("points")
      .eq("customer_user_id", user.id);

    if (balanceError) throw balanceError;

    const balance = rows.reduce((sum, row) => sum + row.points, 0);

    return NextResponse.json({ balance });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
