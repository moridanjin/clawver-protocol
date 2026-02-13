-- ClawVer Protocol — Supabase Schema
-- Run this in Supabase SQL Editor

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  wallet_address TEXT NOT NULL,
  reputation REAL NOT NULL DEFAULT 0,
  skills_executed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  owner_id UUID NOT NULL REFERENCES agents(id),
  version TEXT NOT NULL DEFAULT '1.0.0',
  input_schema JSONB NOT NULL DEFAULT '{}',
  output_schema JSONB NOT NULL DEFAULT '{}',
  code TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  execution_count INTEGER NOT NULL DEFAULT 0,
  avg_rating REAL NOT NULL DEFAULT 0,
  timeout_ms INTEGER NOT NULL DEFAULT 5000,
  max_memory_mb INTEGER NOT NULL DEFAULT 64,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES skills(id),
  caller_id UUID NOT NULL REFERENCES agents(id),
  input JSONB NOT NULL DEFAULT '{}',
  output JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  validated BOOLEAN NOT NULL DEFAULT false,
  execution_time_ms INTEGER,
  error TEXT,
  tx_signature TEXT,
  execution_hash TEXT,
  proof_signature TEXT,
  proof_tx TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES agents(id),
  provider_id UUID NOT NULL REFERENCES agents(id),
  skill_id UUID NOT NULL REFERENCES skills(id),
  input JSONB NOT NULL DEFAULT '{}',
  output JSONB,
  price INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'created',
  escrow_tx TEXT,
  settle_tx TEXT,
  execution_hash TEXT,
  proof_signature TEXT,
  validation_result JSONB,
  escrowed_at TIMESTAMPTZ,
  dispute_reason TEXT,
  disputed_at TIMESTAMPTZ,
  resolution TEXT,
  resolution_reason TEXT,
  resolved_at TIMESTAMPTZ,
  refund_tx TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- UNIQUE constraint on wallet_address (prevents duplicate agent registrations)
CREATE UNIQUE INDEX idx_agents_wallet_address ON agents(wallet_address);

-- Performance indexes
CREATE INDEX idx_executions_skill_id ON executions(skill_id);
CREATE INDEX idx_executions_caller_id ON executions(caller_id);
CREATE INDEX idx_skills_owner_id ON skills(owner_id);
CREATE INDEX idx_contracts_client_id ON contracts(client_id);
CREATE INDEX idx_contracts_provider_id ON contracts(provider_id);
CREATE INDEX idx_contracts_status ON contracts(status);

-- Disable RLS for hackathon demo (allow anon key full access)
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on agents" ON agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on skills" ON skills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on executions" ON executions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on contracts" ON contracts FOR ALL USING (true) WITH CHECK (true);

-- Atomic counter RPC functions (avoid read-then-write race conditions)

CREATE OR REPLACE FUNCTION increment_execution_count(p_skill_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE skills SET execution_count = execution_count + 1 WHERE id = p_skill_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_skills_executed(p_agent_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE agents SET skills_executed = skills_executed + 1 WHERE id = p_agent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_reputation(agent_id UUID, amount REAL)
RETURNS void AS $$
BEGIN
  UPDATE agents SET reputation = reputation + amount WHERE id = agent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migration script (run on existing databases — all additive, safe to re-run)
-- ALTER TABLE executions ADD COLUMN IF NOT EXISTS proof_signature TEXT;
-- ALTER TABLE executions ADD COLUMN IF NOT EXISTS proof_tx TEXT;
-- ALTER TABLE contracts ADD COLUMN IF NOT EXISTS execution_hash TEXT;
-- ALTER TABLE contracts ADD COLUMN IF NOT EXISTS proof_signature TEXT;
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_wallet_address ON agents(wallet_address);
-- CREATE INDEX IF NOT EXISTS idx_executions_skill_id ON executions(skill_id);
-- CREATE INDEX IF NOT EXISTS idx_executions_caller_id ON executions(caller_id);
-- CREATE INDEX IF NOT EXISTS idx_skills_owner_id ON skills(owner_id);
-- CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
-- CREATE INDEX IF NOT EXISTS idx_contracts_provider_id ON contracts(provider_id);
-- CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
