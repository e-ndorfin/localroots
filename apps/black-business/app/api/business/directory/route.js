import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/business/directory?category=&search=
 *
 * Public route — no auth required.
 * Returns all registered businesses, optionally filtered by category and/or
 * search term (matches name or description). Boosted businesses sort first.
 */
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let query = supabase
      .from("businesses")
      .select(
        "id, name, category, location, description, owner_user_id, balance_cents, is_boosted, lat, lng, image_url, created_at"
      );

    if (category) {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    query = query
      .order("is_boosted", { ascending: false })
      .order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    const businesses = data.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      location: row.location,
      description: row.description,
      ownerUserId: row.owner_user_id,
      balanceCents: row.balance_cents,
      isBoosted: row.is_boosted,
      lat: row.lat,
      lng: row.lng,
      imageUrl: row.image_url,
      createdAt: row.created_at,
    }));

    // Get distinct categories for filter UI
    const { data: catData } = await supabase.from("businesses").select("category");
    const categories = [...new Set(catData.map((r) => r.category))].sort();

    return NextResponse.json({ businesses, categories });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
