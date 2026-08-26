-- Messages collected on a chain page at <slug>.garage.co.nz.
--
-- The body column is the whole point of the lock: while a page is still
-- filling up, the worker never selects it. Nothing hidden is ever put into the
-- HTML and then covered over with CSS, because that is not hidden at all.

CREATE TABLE IF NOT EXISTS chain_notes (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  body TEXT NOT NULL,
  who TEXT NOT NULL,
  url TEXT,                                 -- an optional photo with it
  status TEXT NOT NULL DEFAULT 'live',      -- live | hidden
  sender_ip TEXT,                           -- coarse, for rate limiting only
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chain_slug ON chain_notes(slug, status, created_at);
CREATE INDEX IF NOT EXISTS idx_chain_rate ON chain_notes(sender_ip, created_at);

-- Set when whoever started a page opens it early, so a chain that never
-- reaches its target is not sealed shut forever.
ALTER TABLE site_claims ADD COLUMN unlocked_at TEXT;
