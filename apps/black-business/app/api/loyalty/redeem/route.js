const { NextResponse } = require("next/server");
const { getDb, persist } = require("../../../../lib/db");
const { POINTS_REDEMPTION_RATE } = require("../../../../lib/constants");

async function POST(request) {
  try {
    const { customerPseudonym, businessId, points } = await request.json();

    if (!customerPseudonym || !businessId || !points || points <= 0) {
      return NextResponse.json(
        { error: "Missing or invalid fields: customerPseudonym, businessId, points (must be > 0)" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Calculate current balance
    const balanceResult = db.exec(
      "SELECT COALESCE(SUM(points), 0) AS balance FROM points_ledger WHERE customer_pseudonym = ?",
      [customerPseudonym]
    );
    const balance = balanceResult.length ? balanceResult[0].values[0][0] : 0;

    if (balance < points) {
      return NextResponse.json(
        { error: `Insufficient points: have ${balance}, need ${points}` },
        { status: 400 }
      );
    }

    // Insert redemption (negative points)
    db.run(
      "INSERT INTO points_ledger (customer_pseudonym, business_id, type, points, description) VALUES (?, ?, 'redeem', ?, ?)",
      [
        customerPseudonym,
        businessId,
        -points,
        `Redeemed ${points} points at business ${businessId}`,
      ]
    );

    // Calculate discount in cents: (points / redemption_rate) * 100
    const discountCents = Math.floor(points / POINTS_REDEMPTION_RATE) * 100;

    // Credit the discount to the business balance
    db.run(
      "UPDATE businesses SET balance_cents = balance_cents + ?, updated_at = datetime('now') WHERE id = ?",
      [discountCents, businessId]
    );

    persist(db);

    const remainingBalance = balance - points;

    return NextResponse.json({ remainingBalance, discountCents });
  } catch (err) {
    console.error("POST /api/loyalty/redeem error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

module.exports = { POST };
