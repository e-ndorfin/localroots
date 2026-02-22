import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { LOAN_INTEREST_RATE, LOAN_TIERS } from "@/lib/constants";
import { getVaultTotal } from "@/lib/supabase/db";

export async function POST(request) {
  try {
    const user = await requireAuth();
    const { circleId, principalCents } = await request.json();

    if (!circleId || !principalCents || principalCents <= 0) {
      return NextResponse.json(
        { error: "circleId and positive principalCents required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Look up borrower tier (default to tier 1 if not found)
    const { data: tierRow } = await supabase
      .from("borrower_tiers")
      .select("tier")
      .eq("borrower_user_id", user.id)
      .maybeSingle();

    const tier = tierRow?.tier ?? 1;

    // Map tier to max principal
    const tierMaxMap = {
      1: LOAN_TIERS.MICRO.maxAmount * 100,
      2: LOAN_TIERS.SMALL.maxAmount * 100,
      3: LOAN_TIERS.MEDIUM.maxAmount * 100,
    };
    const maxForTier = tierMaxMap[tier] || tierMaxMap[1];

    if (principalCents > maxForTier) {
      return NextResponse.json(
        { error: `Principal ${principalCents} exceeds tier ${tier} max of ${maxForTier} cents` },
        { status: 400 }
      );
    }

    // Check vault capital
    const vaultTotal = await getVaultTotal();
    if (vaultTotal < principalCents) {
      return NextResponse.json(
        { error: `Insufficient vault capital: ${vaultTotal} available, ${principalCents} requested` },
        { status: 400 }
      );
    }

    // Calculate total repayment
    const totalRepaymentCents = Math.ceil(principalCents * (1 + LOAN_INTEREST_RATE));

    // Insert loan
    const { data: loan, error: loanError } = await supabase
      .from("loans")
      .insert({
        circle_id: circleId,
        borrower_user_id: user.id,
        principal_cents: principalCents,
        total_repayment_cents: totalRepaymentCents,
        num_tranches: 3,
        status: "pending",
      })
      .select()
      .single();

    if (loanError) throw loanError;

    // Create 3 tranches
    const trancheAmount = Math.ceil(principalCents / 3);
    const tranches = Array.from({ length: 3 }, (_, i) => ({
      loan_id: loan.id,
      tranche_index: i,
      amount_cents: trancheAmount,
      status: "pending",
    }));

    const { error: trancheError } = await supabase.from("tranches").insert(tranches);
    if (trancheError) throw trancheError;

    return NextResponse.json({ loan });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
