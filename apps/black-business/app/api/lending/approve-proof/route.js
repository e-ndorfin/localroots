import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { MIN_PROOF_APPROVALS } from "@/lib/constants";
import { getClient } from "@/lib/xrpl/client";
import { getOrCreateCustomerWallet } from "@/lib/xrpl/wallets";
import { disburseRLUSD } from "@/lib/xrpl/lending";

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

    // Determine dynamic threshold: all non-borrower circle members, min 1
    const { data: trancheForThreshold } = await supabase
      .from("tranches")
      .select("loan_id")
      .eq("id", proof.tranche_id)
      .single();

    let requiredApprovals = MIN_PROOF_APPROVALS;
    if (trancheForThreshold) {
      const { data: loanForThreshold } = await supabase
        .from("loans")
        .select("circle_id, borrower_user_id")
        .eq("id", trancheForThreshold.loan_id)
        .single();

      if (loanForThreshold) {
        const { count: memberCount } = await supabase
          .from("circle_members")
          .select("*", { count: "exact", head: true })
          .eq("circle_id", loanForThreshold.circle_id)
          .neq("member_user_id", loanForThreshold.borrower_user_id);

        // Non-borrower members, but at least 1
        requiredApprovals = Math.max(1, memberCount || 0);
      }
    }

    // If threshold met, update tranche to released
    const thresholdMet = approvalCount >= requiredApprovals;
    if (thresholdMet) {
      const { error: updateError } = await supabase
        .from("tranches")
        .update({ status: "released", released_at: new Date().toISOString() })
        .eq("id", proof.tranche_id);

      if (updateError) throw updateError;

      // --- XRPL: disburse RLUSD to borrower (graceful degradation) ---
      try {
        const { data: tranche } = await supabase
          .from("tranches")
          .select("amount_cents, loan_id")
          .eq("id", proof.tranche_id)
          .single();

        if (tranche) {
          const { data: loan } = await supabase
            .from("loans")
            .select("borrower_user_id")
            .eq("id", tranche.loan_id)
            .single();

          if (loan) {
            const client = await getClient();
            const { address: borrowerAddress } = await getOrCreateCustomerWallet(
              supabase,
              loan.borrower_user_id
            );

            const txHash = await disburseRLUSD(client, borrowerAddress, tranche.amount_cents);

            if (txHash) {
              await supabase
                .from("tranches")
                .update({ xrpl_tx_hash: txHash })
                .eq("id", proof.tranche_id);
            }
          }
        }
      } catch (xrplErr) {
        console.error("XRPL disbursement failed (non-fatal):", xrplErr.message);
      }
    }

    return NextResponse.json({ approved: true, approvalCount, thresholdMet });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
