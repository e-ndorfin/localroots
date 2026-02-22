const { NextResponse } = require("next/server");
const { getDb } = require("../../../../lib/db");

/**
 * GET /api/business/directory?category=&search=
 *
 * Returns all registered businesses, optionally filtered by category and/or
 * search term (matches name or description). Boosted businesses sort first.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const db = await getDb();

    let query = `SELECT id, name, category, location, description, owner_pseudonym,
                        balance_cents, is_boosted, created_at
                 FROM businesses`;
    const conditions = [];
    const params = [];

    if (category) {
      conditions.push("category = ?");
      params.push(category);
    }

    if (search) {
      conditions.push("(name LIKE ? OR description LIKE ?)");
      const pattern = `%${search}%`;
      params.push(pattern, pattern);
    }

    if (conditions.length) {
      query += " WHERE " + conditions.join(" AND ");
    }

    // Boosted businesses first, then by creation date (newest first)
    query += " ORDER BY is_boosted DESC, created_at DESC";

    const stmt = db.prepare(query);
    if (params.length) {
      stmt.bind(params);
    }

    const businesses = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      businesses.push({
        id: row.id,
        name: row.name,
        category: row.category,
        location: row.location,
        description: row.description,
        ownerPseudonym: row.owner_pseudonym,
        balanceCents: row.balance_cents,
        isBoosted: !!row.is_boosted,
        createdAt: row.created_at,
      });
    }
    stmt.free();

    // Get distinct categories for filter UI
    const catResult = db.exec("SELECT DISTINCT category FROM businesses ORDER BY category");
    const categories = catResult.length ? catResult[0].values.map((r) => r[0]) : [];

    return NextResponse.json({ businesses, categories });
  } catch (error) {
    console.error("Directory query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
