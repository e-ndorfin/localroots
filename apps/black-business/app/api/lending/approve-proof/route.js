const { getDb, persist } = require("../../../../lib/db");
const { MIN_PROOF_APPROVALS } = require("../../../../lib/constants");
const { NextResponse } = require("next/server");

export async function POST(request) {
  try {
    const { proofId, approverPseudonym } = await request.json();

    if (!proofId || !approverPseudonym) {
      return NextResponse.json(
        { error: "proofId and approverPseudonym required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Verify proof exists
    const proofRows = db.exec("SELECT * FROM proofs WHERE id = ?", [proofId]);
    if (!proofRows.length || !proofRows[0].values.length) {
      return NextResponse.json({ error: "Proof not found" }, { status: 404 });
    }

    const proofCols = proofRows[0].columns;
    const proofVals = proofRows[0].values[0];
    const proof = {};
    proofCols.forEach((col, idx) => {
      proof[col] = proofVals[idx];
    });

    // Insert approval
    db.run(
      `INSERT INTO proof_approvals (proof_id, approver_pseudonym, approved)
       VALUES (?, ?, 1)`,
      [proofId, approverPseudonym]
    );

    // Count approvals for this proof
    const countRows = db.exec(
      "SELECT COUNT(*) as cnt FROM proof_approvals WHERE proof_id = ? AND approved = 1",
      [proofId]
    );
    const approvalCount = countRows[0].values[0][0];
    const thresholdMet = approvalCount >= MIN_PROOF_APPROVALS;

    // If threshold met, update tranche status to 'released'
    if (thresholdMet) {
      db.run(
        "UPDATE tranches SET status = 'released', released_at = datetime('now') WHERE id = ?",
        [proof.tranche_id]
      );
    }

    persist(db);

    return NextResponse.json({
      approved: true,
      approvalCount,
      thresholdMet,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
