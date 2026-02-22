import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";

export async function GET(request, { params }) {
  try {
    await requireAuth();
    const { circleId } = await params;
    const supabase = await createClient();

    // Fetch circle
    const { data: circle, error: circleError } = await supabase
      .from("circles")
      .select("*")
      .eq("id", circleId)
      .single();

    if (circleError) {
      return NextResponse.json({ error: "Circle not found" }, { status: 404 });
    }

    // Fetch members
    const { data: membersData, error: membersError } = await supabase
      .from("circle_members")
      .select("*")
      .eq("circle_id", circleId)
      .order("joined_at");

    if (membersError) throw membersError;

    // Fetch loans
    const { data: loansData, error: loansError } = await supabase
      .from("loans")
      .select("*")
      .eq("circle_id", circleId)
      .order("created_at", { ascending: false });

    if (loansError) throw loansError;

    return NextResponse.json({ circle, members: membersData, loans: loansData });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
