-- Noticeboard items table
CREATE TABLE IF NOT EXISTS noticeboard (
  id TEXT PRIMARY KEY,
  slot_id INTEGER NOT NULL UNIQUE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_noticeboard_slot ON noticeboard(slot_id);
