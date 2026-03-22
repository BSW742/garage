-- Leads table for AI readiness audit tool
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,

  -- Contact info (gated, filled after email submission)
  name TEXT,
  email TEXT,

  -- Audit target
  domain TEXT NOT NULL,
  url TEXT NOT NULL,

  -- Overall score
  score INTEGER NOT NULL,

  -- Individual check scores (0-100)
  score_meta INTEGER,
  score_robots INTEGER,
  score_llms_txt INTEGER,
  score_llm_ld INTEGER,
  score_schema INTEGER,
  score_structure INTEGER,
  score_https INTEGER,
  score_speed INTEGER,

  -- A/B testing
  ab_variant TEXT DEFAULT 'A',
  converted INTEGER DEFAULT 0,

  -- Outbound tracking (for Clearmark integration later)
  status TEXT DEFAULT 'new',
  notes TEXT
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_domain ON leads(domain);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_converted ON leads(converted);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
