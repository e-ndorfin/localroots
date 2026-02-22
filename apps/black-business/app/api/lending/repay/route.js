const { getDb, persist } = require("../../../../lib/db");
const { LOAN_TIERS } = require("../../../../lib/constants");
const { NextResponse } = require("next/server");

export async function POST(request) {
  try {
    const { loanId, amountCents } = await request.json();

    if (!loanId || !amountCents || amountCents <= 0) {
      return NextResponse.json(
        { error: "loanId and positive amountCents required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Find loan
    const loanRows = db.exec("SELECT * FROM loans WHERE id = ?", [loanId]);
    if (!loanRows.length || !loanRows[0].values.length) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    const loanCols = loanRows[0].columns;
    const loanVals = loanRows[0].values[0];
    const loan = {};
    loanCols.forEach((col, idx) => {
      loan[col] = loanVals[idx];
    });

    if (loan.status !== "active") {
      return NextResponse.json(
        { error: `Loan status is '${loan.status}', expected 'active'` },
        { status: 400 }
      );
    }

    // Update repaid_cents
    const newRepaidCents = loan.repaid_cents + amountCents;
    const fullyRepaid = newRepaidCents >= loan.total_repayment_cents;

    db.run(
      `UPDATE loans SET repaid_cents = ?, status = ?, updated_at = datetime('now') WHERE id = ?`,
      [newRepaidCents, fullyRepaid ? "repaid" : "active", loanId]
    );

    // If fully repaid, upgrade borrower tier
    if (fullyRepaid) {
      // Upsert borrower_tiers
      const existingTier = db.exec(
        "SELECT tier, completed_loans FROM borrower_tiers WHERE borrower_pseudonym = ?",
        [loan.borrower_pseudonym]
      );

      if (existingTier.length && existingTier[0].values.length) {
        const currentTier = existingTier[0].values[0][0];
        const completedLoans = existingTier[0].values[0][1] + 1;

        // Determine new tier based on completed loans
        let newTier = currentTier;
        if (completedLoans >= LOAN_TIERS.MEDIUM.requiredCompletions && currentTier < 3) {
          newTier = 3;
        } else if (completedLoans >= LOAN_TIERS.SMALL.requiredCompletions && currentTier < 2) {
          newTier = 2;
        }

        const tierMaxMap = {
          1: LOAN_TIERS.MICRO.maxAmount * 100,
          2: LOAN_TIERS.SMALL.maxAmount * 100,
          3: LOAN_TIERS.MEDIUM.maxAmount * 100,
        };

        db.run(
          `UPDATE borrower_tiers
           SET completed_loans = ?, tier = ?, max_loan_cents = ?, updated_at = datetime('now')
           WHERE borrower_pseudonym = ?`,
          [completedLoans, newTier, tierMaxMap[newTier], loan.borrower_pseudonym]
        );
      } else {
        // First completed loan — insert tier record at tier 1 with 1 completion
        let newTier = 1;
        if (1 >= LOAN_TIERS.SMALL.requiredCompletions) {
          newTier = 2;
        }

        const tierMaxMap = {
          1: LOAN_TIERS.MICRO.maxAmount * 100,
          2: LOAN_TIERS.SMALL.maxAmount * 100,
          3: LOAN_TIERS.MEDIUM.maxAmount * 100,
        };

        db.run(
          `INSERT INTO borrower_tiers (borrower_pseudonym, tier, completed_loans, max_loan_cents)
           VALUES (?, ?, 1, ?)`,
          [loan.borrower_pseudonym, newTier, tierMaxMap[newTier]]
        );
      }
    }

    persist(db);

    // Fetch updated loan
    const updatedRows = db.exec("SELECT * FROM loans WHERE id = ?", [loanId]);
    const updatedCols = updatedRows[0].columns;
    const updatedVals = updatedRows[0].values[0];
    const updatedLoan = {};
    updatedCols.forEach((col, idx) => {
      updatedLoan[col] = updatedVals[idx];
    });

    return NextResponse.json({ loan: updatedLoan });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
