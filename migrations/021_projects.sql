-- The public work page: which sites appear on it, and what has shipped.

-- Off by default on purpose. This is a public page carrying garage's name, so
-- a site has to be chosen rather than merely exist — there are throwaways and
-- half-tests in here that should never be shown to anybody.
ALTER TABLE site_claims ADD COLUMN in_projects INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS changelog (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  body       TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_changelog_created ON changelog(created_at);
