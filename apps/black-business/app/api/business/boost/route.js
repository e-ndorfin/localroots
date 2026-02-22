import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";

const BOOST_FEE_CENTS = 2500; // $25 flat fee

/**
 * POST /api/business/boost
 *
 * Deducts $25 from the business's balance and sets is_boosted = true.
 * Boosted businesses appear first in the directory with a "Featured" badge.
 */
export async function POST() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { data: business, error: findError } = await supabase
      .from("businesses")
      .select("id, is_boosted, balance_cents")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (findError) throw findError;
    if (!business) {
      return NextResponse.json({ error: "No business found for this user" }, { status: 404 });
    }

    if (business.is_boosted) {
      return NextResponse.json({ message: "Already boosted", isBoosted: true });
    }

    if (business.balance_cents < BOOST_FEE_CENTS) {
      return NextResponse.json(
        { error: `Insufficient balance. You need at least $${(BOOST_FEE_CENTS / 100).toFixed(2)} to boost.` },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("businesses")
      .update({
        is_boosted: true,
        balance_cents: business.balance_cents - BOOST_FEE_CENTS,
        updated_at: new Date().toISOString(),
      })
      .eq("id", business.id);

    if (error) throw error;

    return NextResponse.json({
      message: "Business boosted successfully",
      isBoosted: true,
      feeCents: BOOST_FEE_CENTS,
    });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
