const { getDb, persist, getVaultTotal } = require("../../../../lib/db");
const { LOAN_INTEREST_RATE, LOAN_TIERS } = require("../../../../lib/constants");
const { NextResponse } = require("next/server");

export async function POST(request) {
  try {
    const { borrowerPseudonym, circleId, principalCents } = await request.json();

    if (!borrowerPseudonym || !circleId || !principalCents || principalCents <= 0) {
      return NextResponse.json(
        { error: "borrowerPseudonym, circleId, and positive principalCents required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Look up borrower tier (default to tier 1 if not found)
    const tierRows = db.exec(
      "SELECT tier FROM borrower_tiers WHERE borrower_pseudonym = ?",
      [borrowerPseudonym]
    );
    const tier = tierRows.length && tierRows[0].values.length ? tierRows[0].values[0][0] : 1;

    // Map tier to max principal
    const tierMaxMap = {
      1: LOAN_TIERS.MICRO.maxAmount * 100,
      2: LOAN_TIERS.SMALL.maxAmount * 100,
      3: LOAN_TIERS.MEDIUM.maxAmount * 100,
    };
    const maxForTier = tierMaxMap[tier] || tierMaxMap[1];

    if (principalCents > maxForTier) {
      return NextResponse.json(
        { error: `Principal ${principalCents} exceeds tier ${tier} max of ${maxForTier} cents` },
        { status: 400 }
      );
    }

    // Check vault capital
    const vaultTotal = getVaultTotal(db);
    if (vaultTotal < principalCents) {
      return NextResponse.json(
        { error: `Insufficient vault capital: ${vaultTotal} available, ${principalCents} requested` },
        { status: 400 }
      );
    }

    // Calculate total repayment
    const totalRepaymentCents = Math.ceil(principalCents * (1 + LOAN_INTEREST_RATE));

    // Insert loan
    db.run(
      `INSERT INTO loans (circle_id, borrower_pseudonym, principal_cents, total_repayment_cents, num_tranches, status)
       VALUES (?, ?, ?, ?, 3, 'pending')`,
      [circleId, borrowerPseudonym, principalCents, totalRepaymentCents]
    );

    // Get the inserted loan ID
    const loanIdRows = db.exec("SELECT last_insert_rowid()");
    const loanId = loanIdRows[0].values[0][0];

    // Create 3 tranches
    const trancheAmount = Math.ceil(principalCents / 3);
    for (let i = 0; i < 3; i++) {
      db.run(
        `INSERT INTO tranches (loan_id, tranche_index, amount_cents, status)
         VALUES (?, ?, ?, 'pending')`,
        [loanId, i, trancheAmount]
      );
    }

    persist(db);

    // Fetch and return the loan record
    const loanRows = db.exec("SELECT * FROM loans WHERE id = ?", [loanId]);
    const columns = loanRows[0].columns;
    const values = loanRows[0].values[0];
    const loan = {};
    columns.forEach((col, idx) => {
      loan[col] = values[idx];
    });

    return NextResponse.json({ loan });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
