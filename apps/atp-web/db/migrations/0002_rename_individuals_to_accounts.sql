-- Migration: Create accounts and account_agents tables
-- This migration creates the new tables. If old tables exist, data will be migrated.
-- SQLite doesn't support ALTER TABLE RENAME, so we create new tables

-- Step 1: Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  social_account_id TEXT,
  social_account_type TEXT,
  eoa_address TEXT,
  aa_address TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Step 2: Create account_agents table
CREATE TABLE IF NOT EXISTS account_agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  agent_id INTEGER NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT 0,
  role TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  UNIQUE(account_id, agent_id)
);

-- Step 3: Create indexes for accounts
CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
CREATE INDEX IF NOT EXISTS idx_accounts_eoa ON accounts(eoa_address);
CREATE INDEX IF NOT EXISTS idx_accounts_aa ON accounts(aa_address);

-- Step 4: Create indexes for account_agents
CREATE INDEX IF NOT EXISTS idx_account_agents_account ON account_agents(account_id);
CREATE INDEX IF NOT EXISTS idx_account_agents_agent ON account_agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_account_agents_primary ON account_agents(account_id, is_primary) WHERE is_primary = 1;

-- Step 5: Migrate data from old tables if they exist (run separately if needed)
-- Note: The migration script below should be run only if old tables exist
-- Uncomment and run if you have existing data in individuals/individual_agents:

/*
-- Migrate from individuals to accounts (only if individuals exists and accounts is empty)
INSERT INTO accounts 
SELECT * FROM individuals 
WHERE NOT EXISTS (SELECT 1 FROM accounts LIMIT 1);

-- Migrate from individual_agents to account_agents (only if individual_agents exists and account_agents is empty)
INSERT INTO account_agents (id, account_id, agent_id, is_primary, role, created_at, updated_at)
SELECT id, individual_id, agent_id, is_primary, role, created_at, updated_at
FROM individual_agents 
WHERE NOT EXISTS (SELECT 1 FROM account_agents LIMIT 1);
*/

