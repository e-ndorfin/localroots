const { getDb, persist } = require("../../../../../../lib/db");
const { NextResponse } = require("next/server");

export async function POST(request, { params }) {
  try {
    const { circleId } = await params;
    const { memberPseudonym } = await request.json();

    if (!memberPseudonym) {
      return NextResponse.json({ error: "memberPseudonym required" }, { status: 400 });
    }

    const db = await getDb();

    // Check circle exists and status is 'forming'
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

    if (circle.status !== "forming") {
      return NextResponse.json(
        { error: `Circle status is '${circle.status}', must be 'forming' to join` },
        { status: 400 }
      );
    }

    // Check member count < max_members
    const countRows = db.exec(
      "SELECT COUNT(*) as cnt FROM circle_members WHERE circle_id = ?",
      [circleId]
    );
    const currentCount = countRows[0].values[0][0];

    if (currentCount >= circle.max_members) {
      return NextResponse.json({ error: "Circle is full" }, { status: 400 });
    }

    // Insert member
    db.run(
      "INSERT INTO circle_members (circle_id, member_pseudonym) VALUES (?, ?)",
      [circleId, memberPseudonym]
    );

    // If member count now equals max_members, update circle status to 'active'
    const newCount = currentCount + 1;
    if (newCount >= circle.max_members) {
      db.run(
        "UPDATE circles SET status = 'active' WHERE id = ?",
        [circleId]
      );
    }

    persist(db);

    return NextResponse.json({
      success: true,
      memberCount: newCount,
      circleStatus: newCount >= circle.max_members ? "active" : "forming",
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
