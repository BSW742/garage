-- Hands up on a rally page at <slug>.garage.co.nz/<path>.
--
-- The campaign itself lives in the site config, so the owner writes it the
-- same way they write everything else and it publishes with the page. Only the
-- sign-ups need storage, because they arrive from the public.
--
-- Emails are never rendered into a page. The public side shows first names and
-- a count; the full list comes back from an endpoint that checks the site's
-- edit token.

CREATE TABLE IF NOT EXISTS rally_signups (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  path TEXT NOT NULL,                       -- which campaign on that site
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'live',      -- live | removed
  sender_ip TEXT,                           -- coarse, for rate limiting only
  created_at TEXT NOT NULL
);

-- One hand each. A second attempt with the same address updates nothing and
-- must not inflate the count, which is the only number anybody is trusting.
CREATE UNIQUE INDEX IF NOT EXISTS idx_rally_once ON rally_signups(slug, path, email);
CREATE INDEX IF NOT EXISTS idx_rally_page ON rally_signups(slug, path, status, created_at);
CREATE INDEX IF NOT EXISTS idx_rally_rate ON rally_signups(sender_ip, created_at);
