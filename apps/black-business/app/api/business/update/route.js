import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";

/**
 * PATCH /api/business/update
 *
 * Updates the authenticated user's business profile.
 * Body: { name?, category?, location?, description?, lat?, lng? }
 */
export async function PATCH(request) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { name, category, location, description, lat, lng, products } = await request.json();

    const { data: existing } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "No business found for this user" }, { status: 404 });
    }

    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (location !== undefined) updates.location = location;
    if (description !== undefined) updates.description = description;
    if (lat !== undefined) updates.lat = lat;
    if (lng !== undefined) updates.lng = lng;
    if (products !== undefined) updates.products = products;

    const { data, error } = await supabase
      .from("businesses")
      .update(updates)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ business: data });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
