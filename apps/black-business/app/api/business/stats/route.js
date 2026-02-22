import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";

/**
 * GET /api/business/stats
 *
 * Returns dashboard metrics for the authenticated user's business:
 * balanceCents, totalOrders, uniqueCustomers, pointsRedeemed
 */
export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Use .limit(1).single() to get the user's primary (first-created) business,
    // even if seed data added multiple businesses under the same owner.
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id, balance_cents, is_boosted")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (bizError) throw bizError;
    if (!business) {
      return NextResponse.json({ error: "No business found for this user" }, { status: 404 });
    }

    // Get all points_ledger entries for this business
    const { data: ledger, error: ledgerError } = await supabase
      .from("points_ledger")
      .select("customer_user_id, type, points")
      .eq("business_id", business.id);

    if (ledgerError) throw ledgerError;

    const earnRows = ledger.filter((r) => r.type === "earn");
    const redeemRows = ledger.filter((r) => r.type === "redeem");

    // Get XRPL wallet address if it exists
    const { data: walletRow } = await supabase
      .from("business_wallets")
      .select("xrpl_address")
      .eq("business_id", business.id)
      .maybeSingle();

    const totalOrders = earnRows.length;
    const uniqueCustomers = new Set(earnRows.map((r) => r.customer_user_id)).size;
    const pointsRedeemed = redeemRows.reduce((sum, r) => sum + Math.abs(r.points), 0);

    return NextResponse.json({
      balanceCents: business.balance_cents,
      isBoosted: business.is_boosted,
      totalOrders,
      uniqueCustomers,
      pointsRedeemed,
      xrplAddress: walletRow?.xrpl_address || null,
    });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
