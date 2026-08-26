-- Daily entries on a food diary page at <slug>.garage.co.nz.
-- Its own table rather than a column on tribute_photos: the two look alike
-- today but a memorial and a public diet log have nothing in common, and
-- sharing a table means every future change to one has to be safe for both.
--
-- Posts go straight up. The whole point is an audience seeing it before the
-- poster has time to reconsider.

CREATE TABLE IF NOT EXISTS diary_posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  url TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'photo',       -- photo | video
  verdict TEXT NOT NULL DEFAULT 'good',     -- good | bad, self-declared
  caption TEXT,
  who TEXT,                                 -- free text, never trusted
  status TEXT NOT NULL DEFAULT 'live',      -- live | hidden
  sender_ip TEXT,                           -- coarse, for rate limiting only
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_diary_slug ON diary_posts(slug, status, created_at);
CREATE INDEX IF NOT EXISTS idx_diary_rate ON diary_posts(sender_ip, created_at);
