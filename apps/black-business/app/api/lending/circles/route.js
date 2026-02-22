const { getDb, persist } = require("../../../../lib/db");
const { NextResponse } = require("next/server");

export async function GET() {
  try {
    const db = await getDb();

    const rows = db.exec(`
      SELECT circles.*, COUNT(circle_members.id) as member_count
      FROM circles
      LEFT JOIN circle_members ON circle_members.circle_id = circles.id
      GROUP BY circles.id
      ORDER BY circles.created_at DESC
    `);

    if (!rows.length) {
      return NextResponse.json({ circles: [] });
    }

    const columns = rows[0].columns;
    const circles = rows[0].values.map((row) => {
      const circle = {};
      columns.forEach((col, idx) => {
        circle[col] = row[idx];
      });
      return circle;
    });

    return NextResponse.json({ circles });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, maxMembers } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }

    const db = await getDb();

    db.run(
      "INSERT INTO circles (name, max_members) VALUES (?, ?)",
      [name, maxMembers || 6]
    );

    const idRows = db.exec("SELECT last_insert_rowid()");
    const circleId = idRows[0].values[0][0];

    persist(db);

    const circleRows = db.exec("SELECT * FROM circles WHERE id = ?", [circleId]);
    const columns = circleRows[0].columns;
    const values = circleRows[0].values[0];
    const circle = {};
    columns.forEach((col, idx) => {
      circle[col] = values[idx];
    });

    return NextResponse.json({ circle }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
