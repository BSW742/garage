-- Photographs sent in by visitors to a tribute page at <slug>.garage.co.nz.
-- They land as 'pending' and only reach the wall once the family says so:
-- a memorial is the last place you want an open, unmoderated upload box.

CREATE TABLE IF NOT EXISTS tribute_photos (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  who TEXT,                        -- who says they sent it, free text, never trusted
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | approved | hidden
  sender_ip TEXT,                  -- coarse, for rate limiting and abuse only
  created_at TEXT NOT NULL,
  reviewed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_tribute_slug ON tribute_photos(slug, status, created_at);
CREATE INDEX IF NOT EXISTS idx_tribute_rate ON tribute_photos(sender_ip, created_at);
