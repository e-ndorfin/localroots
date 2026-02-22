import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";

export async function POST(request, { params }) {
  try {
    const user = await requireAuth();
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

    if (circle.status !== "forming") {
      return NextResponse.json(
        { error: `Circle status is '${circle.status}', expected 'forming'` },
        { status: 400 }
      );
    }

    // Count current members
    const { count: memberCount, error: countError } = await supabase
      .from("circle_members")
      .select("*", { count: "exact", head: true })
      .eq("circle_id", circleId);

    if (countError) throw countError;

    if (memberCount >= circle.max_members) {
      return NextResponse.json({ error: "Circle is full" }, { status: 400 });
    }

    // Insert member
    const { error: insertError } = await supabase
      .from("circle_members")
      .insert({ circle_id: circleId, member_user_id: user.id });

    if (insertError) throw insertError;

    const newMemberCount = memberCount + 1;
    let circleStatus = circle.status;

    // If now full, update circle status to active
    if (newMemberCount >= circle.max_members) {
      const { error: updateError } = await supabase
        .from("circles")
        .update({ status: "active" })
        .eq("id", circleId);

      if (updateError) throw updateError;
      circleStatus = "active";
    }

    return NextResponse.json({ success: true, memberCount: newMemberCount, circleStatus });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
