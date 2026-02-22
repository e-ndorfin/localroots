import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";

export async function POST(request) {
  try {
    await requireAuth();
    const { trancheId } = await request.json();

    if (!trancheId) {
      return NextResponse.json({ error: "trancheId required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Find tranche
    const { data: tranche, error: findError } = await supabase
      .from("tranches")
      .select("*")
      .eq("id", trancheId)
      .single();

    if (findError) {
      return NextResponse.json({ error: "Tranche not found" }, { status: 404 });
    }

    if (tranche.status !== "pending") {
      return NextResponse.json(
        { error: `Tranche status is '${tranche.status}', expected 'pending'` },
        { status: 400 }
      );
    }

    // Update tranche to locked
    const { error: updateError } = await supabase
      .from("tranches")
      .update({ status: "locked" })
      .eq("id", trancheId);

    if (updateError) throw updateError;

    // Update parent loan to active (only if not already active)
    const { error: loanError } = await supabase
      .from("loans")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", tranche.loan_id)
      .neq("status", "active");

    if (loanError) throw loanError;

    // Fetch and return updated tranche
    const { data: updatedTranche, error: fetchError } = await supabase
      .from("tranches")
      .select("*")
      .eq("id", trancheId)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json({ tranche: updatedTranche });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
