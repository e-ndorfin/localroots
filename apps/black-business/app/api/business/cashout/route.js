import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { getClient } from "@/lib/xrpl/client";
import { getOrCreateBusinessWallet, cashoutRLUSD } from "@/lib/xrpl/wallets";

/**
 * POST /api/business/cashout
 *
 * Cashes out RLUSD from the business wallet back to the platform master,
 * simulating a fiat payout. Deducts balance_cents in Supabase.
 *
 * Body: { amountCents }
 */
export async function POST(request) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { amountCents } = await request.json();

    if (!amountCents || amountCents <= 0) {
      return NextResponse.json({ error: "amountCents must be > 0" }, { status: 400 });
    }

    // Look up business for this user
    const { data: business, error: bizErr } = await supabase
      .from("businesses")
      .select("id, balance_cents")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (bizErr) throw bizErr;
    if (!business) {
      return NextResponse.json({ error: "No business found" }, { status: 404 });
    }

    if (amountCents > business.balance_cents) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // Send RLUSD from business wallet back to platform master
    let txHash = null;
    try {
      const client = await getClient();
      const { wallet } = await getOrCreateBusinessWallet(supabase, business.id);
      txHash = await cashoutRLUSD(client, wallet, amountCents);
    } catch (xrplErr) {
      console.error("Cashout XRPL transfer failed (non-fatal):", xrplErr.message);
    }

    // Deduct from balance_cents regardless (Supabase is source of truth)
    const newBalanceCents = business.balance_cents - amountCents;
    await supabase
      .from("businesses")
      .update({ balance_cents: newBalanceCents, updated_at: new Date().toISOString() })
      .eq("id", business.id);

    return NextResponse.json({
      success: true,
      txHash,
      newBalanceCents,
    });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
