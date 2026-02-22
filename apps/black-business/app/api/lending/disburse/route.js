const { getDb, persist } = require("../../../../lib/db");
const { NextResponse } = require("next/server");

export async function POST(request) {
  try {
    const { trancheId } = await request.json();

    if (!trancheId) {
      return NextResponse.json({ error: "trancheId required" }, { status: 400 });
    }

    const db = await getDb();

    // Find tranche
    const trancheRows = db.exec("SELECT * FROM tranches WHERE id = ?", [trancheId]);
    if (!trancheRows.length || !trancheRows[0].values.length) {
      return NextResponse.json({ error: "Tranche not found" }, { status: 404 });
    }

    const trancheCols = trancheRows[0].columns;
    const trancheVals = trancheRows[0].values[0];
    const tranche = {};
    trancheCols.forEach((col, idx) => {
      tranche[col] = trancheVals[idx];
    });

    if (tranche.status !== "pending") {
      return NextResponse.json(
        { error: `Tranche status is '${tranche.status}', expected 'pending'` },
        { status: 400 }
      );
    }

    // Update tranche status to 'locked'
    db.run("UPDATE tranches SET status = 'locked' WHERE id = ?", [trancheId]);

    // Update parent loan status to 'active' if not already
    db.run(
      "UPDATE loans SET status = 'active', updated_at = datetime('now') WHERE id = ? AND status != 'active'",
      [tranche.loan_id]
    );

    persist(db);

    // Fetch updated tranche
    const updatedRows = db.exec("SELECT * FROM tranches WHERE id = ?", [trancheId]);
    const updatedCols = updatedRows[0].columns;
    const updatedVals = updatedRows[0].values[0];
    const updatedTranche = {};
    updatedCols.forEach((col, idx) => {
      updatedTranche[col] = updatedVals[idx];
    });

    return NextResponse.json({ tranche: updatedTranche });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
