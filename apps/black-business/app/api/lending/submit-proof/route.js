import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";

export async function POST(request) {
  try {
    const user = await requireAuth();
    const { trancheId, proofType, description } = await request.json();

    if (!trancheId || !proofType || !description) {
      return NextResponse.json(
        { error: "trancheId, proofType, and description required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find tranche and check status
    const { data: tranche, error: findError } = await supabase
      .from("tranches")
      .select("*")
      .eq("id", trancheId)
      .single();

    if (findError) {
      return NextResponse.json({ error: "Tranche not found" }, { status: 404 });
    }

    if (tranche.status !== "locked") {
      return NextResponse.json(
        { error: `Tranche status is '${tranche.status}', expected 'locked'` },
        { status: 400 }
      );
    }

    // Insert proof
    const { data: proof, error: proofError } = await supabase
      .from("proofs")
      .insert({
        tranche_id: trancheId,
        borrower_user_id: user.id,
        proof_type: proofType,
        description,
      })
      .select()
      .single();

    if (proofError) throw proofError;

    // Update tranche status to proof_submitted
    const { error: updateError } = await supabase
      .from("tranches")
      .update({ status: "proof_submitted" })
      .eq("id", trancheId);

    if (updateError) throw updateError;

    return NextResponse.json({ proof });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
