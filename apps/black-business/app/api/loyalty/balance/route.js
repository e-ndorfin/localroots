const { NextResponse } = require("next/server");
const { getDb } = require("../../../../lib/db");

async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pseudonym = searchParams.get("pseudonym");

    if (!pseudonym) {
      return NextResponse.json(
        { error: "Missing required query parameter: pseudonym" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Total balance
    const balanceResult = db.exec(
      "SELECT COALESCE(SUM(points), 0) AS balance FROM points_ledger WHERE customer_pseudonym = ?",
      [pseudonym]
    );
    const balance = balanceResult.length ? balanceResult[0].values[0][0] : 0;

    // Last 20 history entries
    const historyResult = db.exec(
      "SELECT id, business_id, type, points, description, created_at FROM points_ledger WHERE customer_pseudonym = ? ORDER BY created_at DESC LIMIT 20",
      [pseudonym]
    );

    let history = [];
    if (historyResult.length && historyResult[0].values.length) {
      const columns = historyResult[0].columns;
      history = historyResult[0].values.map((row) => {
        const obj = {};
        columns.forEach((col, i) => {
          obj[col] = row[i];
        });
        return obj;
      });
    }

    return NextResponse.json({ pseudonym, balance, history });
  } catch (err) {
    console.error("GET /api/loyalty/balance error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

module.exports = { GET };
