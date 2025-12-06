-- Complete Cloudflare D1 Database Schema for ATP
-- This schema includes all tables from both atp-web and atp-agent apps

-- ============================================
-- Accounts table: stores user profile information
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  social_account_id TEXT, -- Web3Auth social account identifier
  social_account_type TEXT, -- e.g., 'google', 'facebook', 'twitter', etc.
  eoa_address TEXT, -- Externally Owned Account address (0x...)
  aa_address TEXT, -- Account Abstraction address (0x...)
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================
-- Agents table: stores smart agent information
-- ============================================
CREATE TABLE IF NOT EXISTS agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ens_name TEXT NOT NULL UNIQUE, -- e.g., 'richcanvas-atp.8004-agent.eth'
  agent_name TEXT NOT NULL, -- e.g., 'richcanvas-atp'
  email_domain TEXT NOT NULL, -- e.g., 'richcanvas.io'
  agent_account TEXT, -- Agent's account address (0x...)
  chain_id INTEGER NOT NULL DEFAULT 11155111, -- Sepolia by default
  session_package TEXT, -- JSON string of sessionPackage for agent configuration
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================
-- Account-Agent associations table
-- ============================================
CREATE TABLE IF NOT EXISTS account_agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  agent_id INTEGER NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT 0, -- The primary agent (based on email domain)
  role TEXT, -- e.g., 'owner', 'member', 'admin', etc.
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  UNIQUE(account_id, agent_id)
);

-- ============================================
-- Agent Feedback Requests table
-- ============================================
CREATE TABLE IF NOT EXISTS agent_feedback_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_address TEXT NOT NULL,
  target_agent_id TEXT NOT NULL,
  comment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  feedback_auth TEXT NULL, -- Signed feedback auth payload (JSON string)
  feedback_tx_hash TEXT NULL, -- Transaction hash of the feedback submitted on-chain
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================
-- Messages table: stores inbox messages
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_client_address TEXT NULL,
  from_agent_did TEXT NULL,
  from_agent_name TEXT NULL,
  to_client_address TEXT NULL,
  to_agent_did TEXT NULL,
  to_agent_name TEXT NULL,
  subject TEXT NULL,
  body TEXT NOT NULL,
  context_type TEXT NULL,
  context_id TEXT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  read_at INTEGER NULL
);

-- ============================================
-- Indexes for performance
-- ============================================
-- Accounts indexes
CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
CREATE INDEX IF NOT EXISTS idx_accounts_eoa ON accounts(eoa_address);
CREATE INDEX IF NOT EXISTS idx_accounts_aa ON accounts(aa_address);

-- Agents indexes
CREATE INDEX IF NOT EXISTS idx_agents_ens_name ON agents(ens_name);
CREATE INDEX IF NOT EXISTS idx_agents_email_domain ON agents(email_domain);

-- Account-Agent indexes
CREATE INDEX IF NOT EXISTS idx_account_agents_account ON account_agents(account_id);
CREATE INDEX IF NOT EXISTS idx_account_agents_agent ON account_agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_account_agents_primary ON account_agents(account_id, is_primary) WHERE is_primary = 1;

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_to_client ON messages (to_client_address);
CREATE INDEX IF NOT EXISTS idx_messages_to_agent ON messages (to_agent_did);
CREATE INDEX IF NOT EXISTS idx_messages_from_client ON messages (from_client_address);
CREATE INDEX IF NOT EXISTS idx_messages_from_agent ON messages (from_agent_did);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at);

