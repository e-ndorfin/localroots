import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";

export async function GET(request, { params }) {
  try {
    const user = await requireAuth();
    const { loanId } = await params;
    const supabase = await createClient();

    // Fetch the loan to get its circle
    const { data: loan, error: loanError } = await supabase
      .from("loans")
      .select("id, borrower_user_id, circle_id")
      .eq("id", loanId)
      .single();

    if (loanError || !loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    // Allow access if borrower OR a circle member
    if (loan.borrower_user_id !== user.id) {
      const { count, error: memberError } = await supabase
        .from("circle_members")
        .select("*", { count: "exact", head: true })
        .eq("circle_id", loan.circle_id)
        .eq("member_user_id", user.id);

      if (memberError || !count) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { data: tranches, error } = await supabase
      .from("tranches")
      .select("*")
      .eq("loan_id", loanId)
      .order("tranche_index");

    if (error) throw error;

    return NextResponse.json({ tranches });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
