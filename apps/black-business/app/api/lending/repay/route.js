import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { LOAN_TIERS } from "@/lib/constants";

export async function POST(request) {
  try {
    await requireAuth();
    const { loanId, amountCents } = await request.json();

    if (!loanId || !amountCents || amountCents <= 0) {
      return NextResponse.json(
        { error: "loanId and positive amountCents required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find loan
    const { data: loan, error: findError } = await supabase
      .from("loans")
      .select("*")
      .eq("id", loanId)
      .single();

    if (findError) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    if (loan.status !== "active") {
      return NextResponse.json(
        { error: `Loan status is '${loan.status}', expected 'active'` },
        { status: 400 }
      );
    }

    // Calculate new repaid amount
    const newRepaidCents = loan.repaid_cents + amountCents;
    const fullyRepaid = newRepaidCents >= loan.total_repayment_cents;

    // Update loan
    const { error: updateError } = await supabase
      .from("loans")
      .update({
        repaid_cents: newRepaidCents,
        status: fullyRepaid ? "repaid" : "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", loanId);

    if (updateError) throw updateError;

    // If fully repaid, handle tier upgrade
    if (fullyRepaid) {
      const tierMaxMap = {
        1: LOAN_TIERS.MICRO.maxAmount * 100,
        2: LOAN_TIERS.SMALL.maxAmount * 100,
        3: LOAN_TIERS.MEDIUM.maxAmount * 100,
      };

      // Look up existing tier
      const { data: existingTier } = await supabase
        .from("borrower_tiers")
        .select("*")
        .eq("borrower_user_id", loan.borrower_user_id)
        .maybeSingle();

      if (existingTier) {
        const completedLoans = existingTier.completed_loans + 1;
        let newTier = existingTier.tier;
        if (completedLoans >= LOAN_TIERS.MEDIUM.requiredCompletions && newTier < 3) {
          newTier = 3;
        } else if (completedLoans >= LOAN_TIERS.SMALL.requiredCompletions && newTier < 2) {
          newTier = 2;
        }

        const { error: tierError } = await supabase
          .from("borrower_tiers")
          .update({
            completed_loans: completedLoans,
            tier: newTier,
            max_loan_cents: tierMaxMap[newTier],
            updated_at: new Date().toISOString(),
          })
          .eq("borrower_user_id", loan.borrower_user_id);

        if (tierError) throw tierError;
      } else {
        // First completed loan
        let newTier = 1;
        if (1 >= LOAN_TIERS.SMALL.requiredCompletions) {
          newTier = 2;
        }

        const { error: tierError } = await supabase.from("borrower_tiers").insert({
          borrower_user_id: loan.borrower_user_id,
          tier: newTier,
          completed_loans: 1,
          max_loan_cents: tierMaxMap[newTier],
        });

        if (tierError) throw tierError;
      }
    }

    // Fetch and return updated loan
    const { data: updatedLoan, error: fetchError } = await supabase
      .from("loans")
      .select("*")
      .eq("id", loanId)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json({ loan: updatedLoan });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
