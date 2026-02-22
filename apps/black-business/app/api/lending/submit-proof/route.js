const { getDb, persist } = require("../../../../lib/db");
const { NextResponse } = require("next/server");

export async function POST(request) {
  try {
    const { trancheId, borrowerPseudonym, proofType, description } = await request.json();

    if (!trancheId || !borrowerPseudonym || !proofType) {
      return NextResponse.json(
        { error: "trancheId, borrowerPseudonym, and proofType required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Verify tranche exists and status is 'locked'
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

    if (tranche.status !== "locked") {
      return NextResponse.json(
        { error: `Tranche status is '${tranche.status}', expected 'locked'` },
        { status: 400 }
      );
    }

    // Insert proof
    db.run(
      `INSERT INTO proofs (tranche_id, borrower_pseudonym, proof_type, description)
       VALUES (?, ?, ?, ?)`,
      [trancheId, borrowerPseudonym, proofType, description || null]
    );

    const proofIdRows = db.exec("SELECT last_insert_rowid()");
    const proofId = proofIdRows[0].values[0][0];

    // Update tranche status to 'proof_submitted'
    db.run("UPDATE tranches SET status = 'proof_submitted' WHERE id = ?", [trancheId]);

    persist(db);

    // Fetch and return the proof record
    const proofRows = db.exec("SELECT * FROM proofs WHERE id = ?", [proofId]);
    const proofCols = proofRows[0].columns;
    const proofVals = proofRows[0].values[0];
    const proof = {};
    proofCols.forEach((col, idx) => {
      proof[col] = proofVals[idx];
    });

    return NextResponse.json({ proof });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
