import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";

export async function GET(request, { params }) {
  try {
    await requireAuth();
    const { trancheId } = await params;
    const supabase = await createClient();

    // Fetch proofs for this tranche
    const { data: proofs, error: proofError } = await supabase
      .from("proofs")
      .select("*")
      .eq("tranche_id", trancheId)
      .order("submitted_at", { ascending: false });

    if (proofError) throw proofError;

    // For each proof, count approvals
    const proofsWithCounts = await Promise.all(
      (proofs || []).map(async (proof) => {
        const { count, error: countError } = await supabase
          .from("proof_approvals")
          .select("*", { count: "exact", head: true })
          .eq("proof_id", proof.id)
          .eq("approved", true);

        return {
          ...proof,
          approval_count: countError ? 0 : count,
        };
      })
    );

    return NextResponse.json({ proofs: proofsWithCounts });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
