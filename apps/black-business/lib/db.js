const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(process.cwd(), "blackbusiness.db");

// Singleton promise — one connection per process
let dbPromise;

function getDb() {
  if (dbPromise) return dbPromise;

  dbPromise = initSqlJs().then((SQL) => {
    let db;

    // Load existing DB file if it exists, otherwise create new
    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }

    // Enable foreign keys
    db.run("PRAGMA foreign_keys = ON;");

    // Auto-run schema on first boot
    initSchema(db);

    // Persist to disk after schema init
    persist(db);

    return db;
  });

  return dbPromise;
}

function persist(db) {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function initSchema(db) {
  db.run(`
    -- Registered businesses (custodial model — no XRPL wallet per business)
    CREATE TABLE IF NOT EXISTS businesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT,
      description TEXT,
      owner_pseudonym TEXT NOT NULL,
      credential_hash TEXT,
      balance_cents INTEGER NOT NULL DEFAULT 0,
      is_boosted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    -- Lending circles (Grameen mutual guarantee model)
    CREATE TABLE IF NOT EXISTS circles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      max_members INTEGER NOT NULL DEFAULT 6,
      status TEXT NOT NULL DEFAULT 'forming',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    -- Circle membership
    CREATE TABLE IF NOT EXISTS circle_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      circle_id INTEGER NOT NULL REFERENCES circles(id),
      member_pseudonym TEXT NOT NULL,
      xrpl_address TEXT,
      credential_hash TEXT,
      joined_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(circle_id, member_pseudonym)
    );
  `);

  db.run(`
    -- Microloans
    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      circle_id INTEGER NOT NULL REFERENCES circles(id),
      borrower_pseudonym TEXT NOT NULL,
      business_id INTEGER REFERENCES businesses(id),
      principal_cents INTEGER NOT NULL,
      interest_rate_bps INTEGER NOT NULL DEFAULT 500,
      total_repayment_cents INTEGER NOT NULL,
      repaid_cents INTEGER NOT NULL DEFAULT 0,
      num_tranches INTEGER NOT NULL DEFAULT 3,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    -- Milestone-gated tranches (custodial pattern — no EscrowCreate)
    CREATE TABLE IF NOT EXISTS tranches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL REFERENCES loans(id),
      tranche_index INTEGER NOT NULL,
      amount_cents INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      deadline TEXT,
      released_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(loan_id, tranche_index)
    );
  `);

  db.run(`
    -- Milestone proofs submitted by borrowers
    CREATE TABLE IF NOT EXISTS proofs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tranche_id INTEGER NOT NULL REFERENCES tranches(id),
      borrower_pseudonym TEXT NOT NULL,
      proof_type TEXT NOT NULL,
      description TEXT,
      file_reference TEXT,
      submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    -- Circle member approvals of proofs
    CREATE TABLE IF NOT EXISTS proof_approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proof_id INTEGER NOT NULL REFERENCES proofs(id),
      approver_pseudonym TEXT NOT NULL,
      approved INTEGER NOT NULL DEFAULT 1,
      comment TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(proof_id, approver_pseudonym)
    );
  `);

  db.run(`
    -- Graduated borrower tiers (Micro -> Small -> Medium)
    CREATE TABLE IF NOT EXISTS borrower_tiers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      borrower_pseudonym TEXT NOT NULL UNIQUE,
      tier INTEGER NOT NULL DEFAULT 1,
      completed_loans INTEGER NOT NULL DEFAULT 0,
      max_loan_cents INTEGER NOT NULL DEFAULT 300000,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    -- Customer loyalty points ledger
    CREATE TABLE IF NOT EXISTS points_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_pseudonym TEXT NOT NULL,
      business_id INTEGER REFERENCES businesses(id),
      type TEXT NOT NULL,
      points INTEGER NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    -- Lender interest tracking (pro-rata distribution)
    CREATE TABLE IF NOT EXISTS lender_interest (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lender_pseudonym TEXT NOT NULL,
      loan_id INTEGER NOT NULL REFERENCES loans(id),
      contribution_cents INTEGER NOT NULL,
      interest_earned_cents INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(lender_pseudonym, loan_id)
    );
  `);

  db.run(`
    -- Vault deposit/withdrawal event log (replaces Rust WASM contract)
    CREATE TABLE IF NOT EXISTS vault_deposits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lender_pseudonym TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('deposit', 'withdrawal')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Indexes for common queries
  const indexes = [
    "CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category);",
    "CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_pseudonym);",
    "CREATE INDEX IF NOT EXISTS idx_circle_members_circle ON circle_members(circle_id);",
    "CREATE INDEX IF NOT EXISTS idx_circle_members_member ON circle_members(member_pseudonym);",
    "CREATE INDEX IF NOT EXISTS idx_loans_circle ON loans(circle_id);",
    "CREATE INDEX IF NOT EXISTS idx_loans_borrower ON loans(borrower_pseudonym);",
    "CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);",
    "CREATE INDEX IF NOT EXISTS idx_tranches_loan ON tranches(loan_id);",
    "CREATE INDEX IF NOT EXISTS idx_tranches_status ON tranches(status);",
    "CREATE INDEX IF NOT EXISTS idx_proofs_tranche ON proofs(tranche_id);",
    "CREATE INDEX IF NOT EXISTS idx_proof_approvals_proof ON proof_approvals(proof_id);",
    "CREATE INDEX IF NOT EXISTS idx_points_ledger_customer ON points_ledger(customer_pseudonym);",
    "CREATE INDEX IF NOT EXISTS idx_points_ledger_business ON points_ledger(business_id);",
    "CREATE INDEX IF NOT EXISTS idx_lender_interest_lender ON lender_interest(lender_pseudonym);",
    "CREATE INDEX IF NOT EXISTS idx_lender_interest_loan ON lender_interest(loan_id);",
    "CREATE INDEX IF NOT EXISTS idx_vault_deposits_lender ON vault_deposits(lender_pseudonym);",
    "CREATE INDEX IF NOT EXISTS idx_vault_deposits_type ON vault_deposits(type);",
  ];
  for (const idx of indexes) {
    db.run(idx);
  }
}

// ---------------------------------------------------------------------------
// Vault helpers (replace the 4 Rust WASM contract functions)
// ---------------------------------------------------------------------------

function getVaultTotal(db) {
  const row = db.exec(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount_cents ELSE 0 END), 0) -
       COALESCE(SUM(CASE WHEN type = 'withdrawal' THEN amount_cents ELSE 0 END), 0)
       AS total
     FROM vault_deposits`
  );
  return row.length ? row[0].values[0][0] : 0;
}

function getLenderBalance(db, pseudonym) {
  const row = db.exec(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount_cents ELSE 0 END), 0) -
       COALESCE(SUM(CASE WHEN type = 'withdrawal' THEN amount_cents ELSE 0 END), 0)
       AS balance
     FROM vault_deposits
     WHERE lender_pseudonym = '${pseudonym.replace(/'/g, "''")}'`
  );
  return row.length ? row[0].values[0][0] : 0;
}

function recordDeposit(db, pseudonym, amountCents) {
  db.run(
    "INSERT INTO vault_deposits (lender_pseudonym, amount_cents, type) VALUES (?, ?, 'deposit')",
    [pseudonym, amountCents]
  );
}

function recordWithdrawal(db, pseudonym, amountCents) {
  const balance = getLenderBalance(db, pseudonym);
  if (amountCents > balance) {
    throw new Error(
      `Insufficient balance: requested ${amountCents} but lender has ${balance}`
    );
  }
  db.run(
    "INSERT INTO vault_deposits (lender_pseudonym, amount_cents, type) VALUES (?, ?, 'withdrawal')",
    [pseudonym, amountCents]
  );
}

module.exports = {
  getDb,
  persist,
  getVaultTotal,
  getLenderBalance,
  recordDeposit,
  recordWithdrawal,
};
