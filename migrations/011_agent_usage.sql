-- What each turn of the builder agent actually costs.
-- Written after noticing we had been guessing: the API returns usage on every
-- response and it was being thrown away.
CREATE TABLE IF NOT EXISTS agent_usage (
  id            TEXT PRIMARY KEY,
  slug          TEXT,
  model         TEXT NOT NULL,
  steps         INTEGER NOT NULL,      -- tool loops inside one message
  input_tokens  INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cache_read    INTEGER NOT NULL DEFAULT 0,
  cache_write   INTEGER NOT NULL DEFAULT 0,
  message_chars INTEGER,               -- how much they typed
  created_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_usage_created ON agent_usage(created_at);
