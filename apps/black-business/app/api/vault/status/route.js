const { getDb, getVaultTotal, getLenderBalance } = require("../../../../lib/db");
const { NextResponse } = require("next/server");

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pseudonym = searchParams.get("pseudonym");
    const db = await getDb();

    const totalCents = getVaultTotal(db);
    const lenderBalanceCents = pseudonym ? getLenderBalance(db, pseudonym) : 0;

    // Count active loans
    const activeLoansResult = db.exec("SELECT COUNT(*) FROM loans WHERE status IN ('active', 'disbursing')");
    const activeLoans = activeLoansResult.length ? activeLoansResult[0].values[0][0] : 0;

    // Locked capital = sum of pending/locked tranches
    const lockedResult = db.exec("SELECT COALESCE(SUM(amount_cents), 0) FROM tranches WHERE status IN ('locked', 'pending')");
    const lockedCents = lockedResult.length ? lockedResult[0].values[0][0] : 0;

    const availableCapitalCents = Math.max(0, totalCents - lockedCents);

    return NextResponse.json({
      totalCents,
      lenderBalanceCents,
      activeLoans,
      availableCapitalCents,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
