-- Chat widget for sites published at <slug>.garage.co.nz.
-- One thread per visitor conversation, many messages within it.

CREATE TABLE IF NOT EXISTS chat_threads (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,              -- which site the visitor was on
  token TEXT NOT NULL,             -- owner's magic link, no login needed
  visitor_name TEXT,
  visitor_contact TEXT,            -- phone or email, asked for after the first message
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL,
  last_message_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id TEXT NOT NULL,
  sender TEXT NOT NULL,            -- 'visitor' or 'owner'
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  seen_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_chat_threads_slug ON chat_threads(slug, last_message_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_threads_token ON chat_threads(token);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON chat_messages(thread_id, id);
