-- Every logo generation. Image models cost money per call and /ai is a public
-- page, so this is the rate limit as much as the audit trail.
CREATE TABLE IF NOT EXISTS logo_jobs (
  id         TEXT PRIMARY KEY,
  slug       TEXT,
  ip         TEXT,
  prompt     TEXT,
  url        TEXT,
  error      TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_logo_jobs_ip ON logo_jobs(ip, created_at);
CREATE INDEX IF NOT EXISTS idx_logo_jobs_created ON logo_jobs(created_at);
