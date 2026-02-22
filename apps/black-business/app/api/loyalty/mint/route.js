const { NextResponse } = require("next/server");
const { getDb, persist } = require("../../../../lib/db");

async function POST(request) {
  try {
    const { customerPseudonym, points } = await request.json();

    if (!customerPseudonym || !points || points <= 0) {
      return NextResponse.json(
        { error: "Missing or invalid fields: customerPseudonym, points (must be > 0)" },
        { status: 400 }
      );
    }

    const db = await getDb();

    db.run(
      "INSERT INTO points_ledger (customer_pseudonym, type, points, description) VALUES (?, 'earn', ?, 'Manual mint')",
      [customerPseudonym, points]
    );

    persist(db);

    // Calculate total balance
    const result = db.exec(
      "SELECT COALESCE(SUM(points), 0) AS balance FROM points_ledger WHERE customer_pseudonym = ?",
      [customerPseudonym]
    );
    const balance = result.length ? result[0].values[0][0] : 0;

    return NextResponse.json({ balance });
  } catch (err) {
    console.error("POST /api/loyalty/mint error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

module.exports = { POST };
