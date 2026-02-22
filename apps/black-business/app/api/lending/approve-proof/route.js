import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { MIN_PROOF_APPROVALS } from "@/lib/constants";

export async function POST(request) {
  try {
    const user = await requireAuth();
    const { proofId } = await request.json();

    if (!proofId) {
      return NextResponse.json({ error: "proofId required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify proof exists
    const { data: proof, error: proofError } = await supabase
      .from("proofs")
      .select("*")
      .eq("id", proofId)
      .single();

    if (proofError) {
      return NextResponse.json({ error: "Proof not found" }, { status: 404 });
    }

    // Insert approval
    const { error: approvalError } = await supabase
      .from("proof_approvals")
      .insert({ proof_id: proofId, approver_user_id: user.id, approved: true });

    if (approvalError) throw approvalError;

    // Count approvals
    const { count: approvalCount, error: countError } = await supabase
      .from("proof_approvals")
      .select("*", { count: "exact", head: true })
      .eq("proof_id", proofId)
      .eq("approved", true);

    if (countError) throw countError;

    // If threshold met, update tranche to released
    const thresholdMet = approvalCount >= MIN_PROOF_APPROVALS;
    if (thresholdMet) {
      const { error: updateError } = await supabase
        .from("tranches")
        .update({ status: "released", released_at: new Date().toISOString() })
        .eq("id", proof.tranche_id);

      if (updateError) throw updateError;
    }

    return NextResponse.json({ approved: true, approvalCount, thresholdMet });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
