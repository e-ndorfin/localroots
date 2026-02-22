import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";

export async function POST(request) {
  try {
    const user = await requireAuth();
    const { trancheId } = await request.json();

    if (!trancheId) {
      return NextResponse.json({ error: "trancheId required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch tranche + loan to verify ownership
    const { data: tranche, error: findError } = await supabase
      .from("tranches")
      .select("*, loans!inner(borrower_user_id)")
      .eq("id", trancheId)
      .single();

    if (findError || !tranche) {
      return NextResponse.json({ error: "Tranche not found" }, { status: 404 });
    }

    if (tranche.loans.borrower_user_id !== user.id) {
      return NextResponse.json({ error: "Only the borrower can claim a tranche" }, { status: 403 });
    }

    if (tranche.status !== "released") {
      return NextResponse.json(
        { error: `Tranche status is '${tranche.status}', expected 'released'` },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("tranches")
      .update({ status: "claimed" })
      .eq("id", trancheId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, trancheId });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
