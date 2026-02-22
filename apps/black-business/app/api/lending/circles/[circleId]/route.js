const { getDb } = require("../../../../../lib/db");
const { NextResponse } = require("next/server");

export async function GET(request, { params }) {
  try {
    const { circleId } = await params;
    const db = await getDb();

    // Fetch circle
    const circleRows = db.exec("SELECT * FROM circles WHERE id = ?", [circleId]);
    if (!circleRows.length || !circleRows[0].values.length) {
      return NextResponse.json({ error: "Circle not found" }, { status: 404 });
    }

    const circleCols = circleRows[0].columns;
    const circleVals = circleRows[0].values[0];
    const circle = {};
    circleCols.forEach((col, idx) => {
      circle[col] = circleVals[idx];
    });

    // Fetch members
    const memberRows = db.exec(
      "SELECT * FROM circle_members WHERE circle_id = ? ORDER BY joined_at",
      [circleId]
    );
    const members = [];
    if (memberRows.length && memberRows[0].values.length) {
      const memberCols = memberRows[0].columns;
      memberRows[0].values.forEach((row) => {
        const member = {};
        memberCols.forEach((col, idx) => {
          member[col] = row[idx];
        });
        members.push(member);
      });
    }

    // Fetch loans
    const loanRows = db.exec(
      "SELECT * FROM loans WHERE circle_id = ? ORDER BY created_at DESC",
      [circleId]
    );
    const loans = [];
    if (loanRows.length && loanRows[0].values.length) {
      const loanCols = loanRows[0].columns;
      loanRows[0].values.forEach((row) => {
        const loan = {};
        loanCols.forEach((col, idx) => {
          loan[col] = row[idx];
        });
        loans.push(loan);
      });
    }

    return NextResponse.json({ circle, members, loans });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
