-- ============================================================
-- Black Business App — Supabase Postgres schema
-- Run this in the Supabase SQL Editor after creating the project.
-- ============================================================

-- Profiles (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','business','lender')),
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Registered businesses
CREATE TABLE businesses (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT,
  description TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id),
  credential_hash TEXT,
  balance_cents BIGINT NOT NULL DEFAULT 0,
  image_url TEXT,
  products JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_boosted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lending circles
CREATE TABLE circles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  max_members INT NOT NULL DEFAULT 6,
  status TEXT NOT NULL DEFAULT 'forming',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Circle membership
CREATE TABLE circle_members (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  circle_id BIGINT NOT NULL REFERENCES circles(id),
  member_user_id UUID NOT NULL REFERENCES auth.users(id),
  xrpl_address TEXT,
  credential_hash TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(circle_id, member_user_id)
);

-- Microloans
CREATE TABLE loans (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  circle_id BIGINT NOT NULL REFERENCES circles(id),
  borrower_user_id UUID NOT NULL REFERENCES auth.users(id),
  business_id BIGINT REFERENCES businesses(id),
  principal_cents BIGINT NOT NULL,
  interest_rate_bps INT NOT NULL DEFAULT 500,
  total_repayment_cents BIGINT NOT NULL,
  repaid_cents BIGINT NOT NULL DEFAULT 0,
  num_tranches INT NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Milestone-gated tranches
CREATE TABLE tranches (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  loan_id BIGINT NOT NULL REFERENCES loans(id),
  tranche_index INT NOT NULL,
  amount_cents BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  deadline TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  xrpl_tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(loan_id, tranche_index)
);

-- Milestone proofs
CREATE TABLE proofs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tranche_id BIGINT NOT NULL REFERENCES tranches(id),
  borrower_user_id UUID NOT NULL REFERENCES auth.users(id),
  proof_type TEXT NOT NULL,
  description TEXT,
  file_reference TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Proof approvals
CREATE TABLE proof_approvals (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  proof_id BIGINT NOT NULL REFERENCES proofs(id),
  approver_user_id UUID NOT NULL REFERENCES auth.users(id),
  approved BOOLEAN NOT NULL DEFAULT true,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(proof_id, approver_user_id)
);

-- Borrower tiers
CREATE TABLE borrower_tiers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  borrower_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  tier INT NOT NULL DEFAULT 1,
  completed_loans INT NOT NULL DEFAULT 0,
  max_loan_cents BIGINT NOT NULL DEFAULT 300000,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customer loyalty points ledger
CREATE TABLE points_ledger (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_user_id UUID NOT NULL REFERENCES auth.users(id),
  business_id BIGINT REFERENCES businesses(id),
  type TEXT NOT NULL,
  points INT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lender interest tracking
CREATE TABLE lender_interest (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lender_user_id UUID NOT NULL REFERENCES auth.users(id),
  loan_id BIGINT NOT NULL REFERENCES loans(id),
  contribution_cents BIGINT NOT NULL,
  interest_earned_cents BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lender_user_id, loan_id)
);

-- Customer custodial XRPL wallets
CREATE TABLE customer_wallets (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  xrpl_address TEXT NOT NULL,
  seed_encrypted TEXT NOT NULL,
  mpt_authorized BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Business custodial XRPL wallets
CREATE TABLE business_wallets (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id BIGINT NOT NULL UNIQUE REFERENCES businesses(id),
  xrpl_address TEXT NOT NULL,
  seed_encrypted TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vault deposits / withdrawals
CREATE TABLE vault_deposits (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lender_user_id UUID NOT NULL REFERENCES auth.users(id),
  amount_cents BIGINT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('deposit', 'withdrawal')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_businesses_category ON businesses(category);
CREATE INDEX idx_businesses_owner ON businesses(owner_user_id);
CREATE INDEX idx_circle_members_circle ON circle_members(circle_id);
CREATE INDEX idx_circle_members_member ON circle_members(member_user_id);
CREATE INDEX idx_loans_circle ON loans(circle_id);
CREATE INDEX idx_loans_borrower ON loans(borrower_user_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_tranches_loan ON tranches(loan_id);
CREATE INDEX idx_tranches_status ON tranches(status);
CREATE INDEX idx_proofs_tranche ON proofs(tranche_id);
CREATE INDEX idx_proof_approvals_proof ON proof_approvals(proof_id);
CREATE INDEX idx_points_ledger_customer ON points_ledger(customer_user_id);
CREATE INDEX idx_points_ledger_business ON points_ledger(business_id);
CREATE INDEX idx_lender_interest_lender ON lender_interest(lender_user_id);
CREATE INDEX idx_lender_interest_loan ON lender_interest(loan_id);
CREATE INDEX idx_vault_deposits_lender ON vault_deposits(lender_user_id);
CREATE INDEX idx_vault_deposits_type ON vault_deposits(type);
CREATE INDEX idx_customer_wallets_user ON customer_wallets(user_id);
CREATE INDEX idx_business_wallets_business ON business_wallets(business_id);

-- ============================================================
-- RPC functions for vault helpers
-- ============================================================

CREATE OR REPLACE FUNCTION get_vault_total() RETURNS BIGINT AS $$
  SELECT COALESCE(SUM(CASE WHEN type='deposit' THEN amount_cents ELSE -amount_cents END), 0)
  FROM vault_deposits;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_lender_balance(p_user_id UUID) RETURNS BIGINT AS $$
  SELECT COALESCE(SUM(CASE WHEN type='deposit' THEN amount_cents ELSE -amount_cents END), 0)
  FROM vault_deposits WHERE lender_user_id = p_user_id;
$$ LANGUAGE sql STABLE;

DO $$
DECLARE t text;
BEGIN
FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('CREATE POLICY "Allow all for authenticated" ON public.%I FOR ALL TO authenticated
USING (true) WITH CHECK (true)', t);
  EXECUTE format('CREATE POLICY "Allow all for anon" ON public.%I FOR ALL TO anon USING (true) WITH
CHECK (true)', t);
END LOOP;
END $$;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
