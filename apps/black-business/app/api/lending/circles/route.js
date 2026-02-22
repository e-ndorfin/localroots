import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: circles, error } = await supabase
      .from("circles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get member count for each circle
    for (const circle of circles) {
      const { count } = await supabase
        .from("circle_members")
        .select("*", { count: "exact", head: true })
        .eq("circle_id", circle.id);
      circle.member_count = count || 0;
    }

    return NextResponse.json({ circles });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}

export async function POST(request) {
  try {
    await requireAuth();
    const { name, maxMembers } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: circle, error } = await supabase
      .from("circles")
      .insert({ name, max_members: maxMembers || 6 })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ circle }, { status: 201 });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
