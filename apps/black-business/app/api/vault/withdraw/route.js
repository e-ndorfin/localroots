const { getDb, persist, recordWithdrawal, getVaultTotal, getLenderBalance } = require("../../../../lib/db");
const { NextResponse } = require("next/server");

export async function POST(request) {
  try {
    const { pseudonym, amountCents } = await request.json();

    if (!pseudonym || !amountCents || amountCents <= 0) {
      return NextResponse.json({ error: "pseudonym and positive amountCents required" }, { status: 400 });
    }

    const db = await getDb();
    recordWithdrawal(db, pseudonym, amountCents);
    persist(db);

    return NextResponse.json({
      totalCents: getVaultTotal(db),
      lenderBalanceCents: getLenderBalance(db, pseudonym),
    });
  } catch (err) {
    if (err.message.includes("Insufficient balance")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
